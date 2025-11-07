/**
 * Hook Enterprise: useOperationalActivities
 * Pattern: Stripe/Linear/Monday.com
 * 
 * Gestion des activités opérationnelles (récurrentes + ponctuelles)
 * avec cache intelligent, filtres avancés et métriques temps réel
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSessionManager } from '@/hooks/useSessionManager';
import { applyRoleFilters, UserContext } from '@/lib/roleBasedFiltering';

// =====================================================
// Types
// =====================================================

export interface OperationalActivity {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  kind: 'recurring' | 'one_off';
  scope: 'org' | 'department' | 'team' | 'person';
  department_id: string | null;
  owner_id: string | null;
  owner_employee_id: string | null; // ✅ Assigné (employee)
  owner_name: string | null; // ✅ Cache du nom
  project_id: string | null;
  task_title_template: string | null;
  one_off_date: string | null; // ✅ Date pour activités ponctuelles
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface OperationalSchedule {
  id: string;
  tenant_id: string;
  activity_id: string;
  timezone: string;
  rrule: string | null;
  start_date: string;
  until: string | null;
  generate_window_days: number;
  created_at: string;
  updated_at: string;
}

export interface OperationalActionTemplate {
  id: string;
  tenant_id: string;
  activity_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
}

interface UseOperationalActivitiesOptions {
  autoFetch?: boolean;
  filters?: {
    kind?: 'recurring' | 'one_off';
    scope?: string;
    isActive?: boolean;
    ownerId?: string;
    search?: string;
  };
}

interface ActivityMetrics {
  fetchTime: number;
  dataSize: number;
  cacheHit: boolean;
  totalCount: number;
  activeCount: number;
  recurringCount: number;
  oneOffCount: number;
}

// =====================================================
// Cache intelligent (TTL 3 minutes)
// =====================================================

interface CacheEntry {
  data: OperationalActivity[];
  timestamp: number;
  filters: string;
}

const CACHE: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function getCacheKey(filters?: any): string {
  return JSON.stringify(filters || {});
}

function getCachedData(filters?: any): OperationalActivity[] | null {
  const key = getCacheKey(filters);
  const entry = CACHE.get(key);
  
  if (!entry) return null;
  
  const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
  if (isExpired) {
    CACHE.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCachedData(data: OperationalActivity[], filters?: any): void {
  const key = getCacheKey(filters);
  CACHE.set(key, {
    data,
    timestamp: Date.now(),
    filters: key,
  });
}

// =====================================================
// Hook Principal
// =====================================================

export function useOperationalActivities(options: UseOperationalActivitiesOptions = {}) {
  const { autoFetch = true, filters } = options;
  const { currentTenant } = useTenant();
  const { session } = useSessionManager();
  const { getRoleNames, isSuperAdmin } = useUserRoles();
  
  const userId = session?.user?.id || '';
  const tenantId = currentTenant?.id || '';
  const roleNames = getRoleNames();
  const userRole = (isSuperAdmin() ? 'super_admin' : roleNames[0] || 'employee') as any;

  // États
  const [activities, setActivities] = useState<OperationalActivity[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ActivityMetrics>({
    fetchTime: 0,
    dataSize: 0,
    cacheHit: false,
    totalCount: 0,
    activeCount: 0,
    recurringCount: 0,
    oneOffCount: 0,
  });

  // =====================================================
  // Fetch Activities
  // =====================================================

  const fetchActivities = useCallback(async (forceRefresh = false) => {
    const startTime = Date.now();
    setLoading(true);
    setError(null);

    try {
      // Vérifier le cache
      if (!forceRefresh) {
        const cached = getCachedData(filters);
        if (cached) {
          setActivities(cached);
          setMetrics({
            fetchTime: Date.now() - startTime,
            dataSize: JSON.stringify(cached).length,
            cacheHit: true,
            totalCount: cached.length,
            activeCount: cached.filter(a => a.is_active).length,
            recurringCount: cached.filter(a => a.kind === 'recurring').length,
            oneOffCount: cached.filter(a => a.kind === 'one_off').length,
          });
          setLoading(false);
          return;
        }
      }

      // Query builder
      let query = supabase
        .from('operational_activities')
        .select('*')
        .order('created_at', { ascending: false });

      // 🔒 Appliquer le filtrage par rôle (SÉCURITÉ)
      const userContext: UserContext = {
        userId,
        role: userRole,
        tenantId,
      };
      query = applyRoleFilters(query, userContext, 'operational_activities');

      // Appliquer les filtres additionnels
      if (filters?.kind) {
        query = query.eq('kind', filters.kind);
      }
      if (filters?.scope) {
        query = query.eq('scope', filters.scope);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.ownerId) {
        query = query.eq('owner_id', filters.ownerId);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const activitiesData = (data || []) as OperationalActivity[];
      setActivities(activitiesData);

      // Mettre en cache
      setCachedData(activitiesData, filters);

      // Métriques
      setMetrics({
        fetchTime: Date.now() - startTime,
        dataSize: JSON.stringify(activitiesData).length,
        cacheHit: false,
        totalCount: activitiesData.length,
        activeCount: activitiesData.filter(a => a.is_active).length,
        recurringCount: activitiesData.filter(a => a.kind === 'recurring').length,
        oneOffCount: activitiesData.filter(a => a.kind === 'one_off').length,
      });

    } catch (err: any) {
      console.error('❌ Erreur fetchActivities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // =====================================================
  // CRUD Operations
  // =====================================================

  const createActivity = useCallback(async (activity: Partial<OperationalActivity>) => {
    try {
      if (!currentTenant?.id) {
        throw new Error('Aucun tenant actif. Veuillez vous connecter.');
      }

      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non authentifié. Veuillez vous reconnecter.');
      }

      // Injecter automatiquement tenant_id et created_by (requis par RLS)
      const activityWithTenant = {
        ...activity,
        tenant_id: currentTenant.id,
        created_by: user.id,
      };

      console.log('📤 Insertion activité avec tenant et user:', activityWithTenant);

      const { data, error: createError } = await supabase
        .from('operational_activities')
        .insert(activityWithTenant as any)
        .select()
        .single();

      if (createError) throw createError;

      console.log('✅ Activité insérée:', data);

      // Invalider le cache
      CACHE.clear();
      await fetchActivities(true);

      return data;
    } catch (err: any) {
      console.error('❌ Erreur createActivity:', err);
      setError(err.message);
      throw err;
    }
  }, [fetchActivities, currentTenant]);

  const updateActivity = useCallback(async (id: string, updates: Partial<OperationalActivity>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('operational_activities')
        .update({ ...updates, updated_at: new Date().toISOString() } as OperationalActivity)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      CACHE.clear();
      await fetchActivities(true);

      return data;
    } catch (err: any) {
      console.error('❌ Erreur updateActivity:', err);
      setError(err.message);
      throw err;
    }
  }, [fetchActivities]);

  const deleteActivity = useCallback(async (id: string, keepCompletedTasks = true) => {
    try {
      // Utiliser la fonction RPC pour supprimer proprement
      const { data, error: deleteError } = await supabase
        .rpc('delete_activity_with_future_occurrences', {
          p_activity_id: id,
          p_keep_completed: keepCompletedTasks
        });

      if (deleteError) throw deleteError;

      // Invalider le cache
      CACHE.clear();
      await fetchActivities(true);

      return data;
    } catch (err: any) {
      console.error('❌ Erreur deleteActivity:', err);
      setError(err.message);
      throw err;
    }
  }, [fetchActivities]);

  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    try {
      const { error: toggleError } = await supabase
        .rpc('pause_activity', {
          p_activity_id: id,
          p_is_active: isActive
        });

      if (toggleError) throw toggleError;

      // Invalider le cache
      CACHE.clear();
      await fetchActivities(true);

    } catch (err: any) {
      console.error('❌ Erreur toggleActive:', err);
      setError(err.message);
      throw err;
    }
  }, [fetchActivities]);

  const getStatistics = useCallback(async (activityId: string) => {
    try {
      const { data, error: statsError } = await supabase
        .rpc('get_activity_statistics', {
          p_activity_id: activityId
        });

      if (statsError) throw statsError;

      return data;
    } catch (err: any) {
      console.error('❌ Erreur getStatistics:', err);
      throw err;
    }
  }, []);

  // =====================================================
  // Auto-fetch on mount
  // =====================================================

  useEffect(() => {
    if (autoFetch) {
      fetchActivities();
    }
  }, [autoFetch, fetchActivities]);

  // =====================================================
  // Return API
  // =====================================================

  return {
    // Data
    activities,
    loading,
    error,
    metrics,

    // Actions
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    toggleActive,
    getStatistics,

    // Utilities
    refresh: () => fetchActivities(true),
    clearCache: () => CACHE.clear(),
  };
}
