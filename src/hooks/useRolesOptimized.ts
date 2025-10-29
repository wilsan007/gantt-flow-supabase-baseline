/**
 * Hook Optimisé pour les Rôles avec Cache Sécurisé
 * 
 * OBJECTIFS:
 * - Réduire temps de connexion (< 500ms)
 * - Minimiser appels DB (1 seul fetch initial)  
 * - Cache sécurisé avec expiration 10min
 * - Logs désactivés en production
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { secureCache, CACHE_TTL, generateCacheKey } from '@/lib/secureCache';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/lib/permissionsSystem';

interface UseRolesResult {
  roles: UserRole[];
  permissions: string[];
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  tenantId: string | null;
  refresh: () => Promise<void>;
}

const pendingRequests = new Map<string, Promise<UserRole[]>>();

async function fetchRolesWithDeduplication(userId: string): Promise<UserRole[]> {
  const pending = pendingRequests.get(userId);
  if (pending) {
    logger.debug(`Attente requête pour: ${userId}`);
    return pending;
  }

  const promise = (async () => {
    logger.time(`fetch_roles_${userId}`);

    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        id, user_id, role_id, tenant_id, assigned_by, assigned_at, is_active,
        roles (id, name, description, permissions, is_system_role)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    logger.timeEnd(`fetch_roles_${userId}`);

    if (error) throw error;
    return (data || []) as unknown as UserRole[];
  })();

  pendingRequests.set(userId, promise);

  try {
    return await promise;
  } finally {
    setTimeout(() => pendingRequests.delete(userId), 100);
  }
}

function extractPermissions(roles: UserRole[]): string[] {
  const perms = new Set<string>();
  roles.forEach((role) => {
    if (role.roles?.permissions) {
      Object.entries(role.roles.permissions).forEach(([key, value]) => {
        if (value === true) perms.add(key);
      });
    }
  });
  return Array.from(perms);
}

export function useRolesOptimized(): UseRolesResult {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const userIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const initialFetchDone = useRef(false);

  const loadRoles = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRoles([]);
        setPermissions([]);
        setLoading(false);
        return;
      }

      if (userIdRef.current && userIdRef.current !== user.id) {
        secureCache.invalidateByUser(userIdRef.current);
      }
      
      userIdRef.current = user.id;
      const cacheKey = generateCacheKey('roles', user.id);
      const cached = secureCache.get<UserRole[]>(cacheKey);

      if (cached) {
        if (mountedRef.current) {
          setRoles(cached);
          setPermissions(extractPermissions(cached));
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const fetchedRoles = await fetchRolesWithDeduplication(user.id);

      secureCache.set(cacheKey, fetchedRoles, CACHE_TTL.ROLES, {
        userId: user.id,
        persist: true
      });

      if (mountedRef.current) {
        setRoles(fetchedRoles);
        setPermissions(extractPermissions(fetchedRoles));
        setError(null);
      }

    } catch (err) {
      logger.error('Erreur chargement rôles', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setRoles([]);
        setPermissions([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        initialFetchDone.current = true;
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    if (userIdRef.current) {
      secureCache.delete(generateCacheKey('roles', userIdRef.current));
    }
    await loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    mountedRef.current = true;
    if (!initialFetchDone.current) loadRoles();
    return () => { mountedRef.current = false; };
  }, [loadRoles]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadRoles();
        } else if (event === 'SIGNED_OUT') {
          if (userIdRef.current) secureCache.invalidateByUser(userIdRef.current);
          setRoles([]);
          setPermissions([]);
          setError(null);
          userIdRef.current = null;
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:logout'));
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [loadRoles]);

  const isAdmin = roles.some(r => r.roles?.name === 'tenant_admin' || r.roles?.name === 'super_admin');
  const isSuperAdmin = roles.some(r => r.roles?.name === 'super_admin');
  const tenantId = roles.length > 0 ? roles[0].tenant_id : null;

  return { roles, permissions, loading, error, isAdmin, isSuperAdmin, tenantId, refresh };
}

export function invalidateRolesCache(userId?: string) {
  if (userId) {
    secureCache.delete(generateCacheKey('roles', userId));
  } else {
    secureCache.invalidateByPattern(/^roles:/);
  }
}

export async function prefetchRoles(userId: string): Promise<void> {
  const cacheKey = generateCacheKey('roles', userId);
  if (secureCache.has(cacheKey)) return;
  const roles = await fetchRolesWithDeduplication(userId);
  secureCache.set(cacheKey, roles, CACHE_TTL.ROLES, { userId, persist: true });
}
