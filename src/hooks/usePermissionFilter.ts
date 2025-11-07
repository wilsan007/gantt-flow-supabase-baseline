/**
 * Hook de Filtrage par Permissions - Pattern Enterprise
 * Applique automatiquement les filtres selon le rôle de l'utilisateur
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getUserContext, 
  getResourceFilter, 
  hasPermission,
  type UserContext, 
  type ResourceType,
  type FilterResult 
} from '@/lib/permissions';

interface UsePermissionFilterResult {
  userContext: UserContext | null;
  loading: boolean;
  filter: FilterResult | null;
  hasPermission: (permission: string) => boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook principal de filtrage par permissions
 * 
 * Usage:
 * const { userContext, filter, hasPermission } = usePermissionFilter('tasks');
 * 
 * Puis dans votre requête:
 * if (filter.mustFilterByUser) {
 *   query = query.eq('assignee_id', userContext.userId);
 * }
 */
export function usePermissionFilter(resource: ResourceType): UsePermissionFilterResult {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [filter, setFilter] = useState<FilterResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserContext = useCallback(async () => {
    setLoading(true);
    try {
      const context = await getUserContext();
      setUserContext(context);
      
      if (context) {
        const resourceFilter = getResourceFilter(resource, context);
        setFilter(resourceFilter);
      }
    } catch (error) {
      console.error('Erreur fetchUserContext:', error);
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    fetchUserContext();
  }, [fetchUserContext]);

  const checkPermission = useCallback((permission: string): boolean => {
    if (!userContext) return false;
    return hasPermission(userContext, permission);
  }, [userContext]);

  return {
    userContext,
    loading,
    filter,
    hasPermission: checkPermission,
    refetch: fetchUserContext,
  };
}

/**
 * Hook simplifié pour vérifier les permissions
 */
export function useHasPermission(permission: string): boolean {
  const [has, setHas] = useState(false);

  useEffect(() => {
    const check = async () => {
      const context = await getUserContext();
      if (context) {
        setHas(hasPermission(context, permission));
      }
    };
    check();
  }, [permission]);

  return has;
}

/**
 * Hook pour obtenir le contexte utilisateur uniquement
 */
export function useUserContext() {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const context = await getUserContext();
      setUserContext(context);
      setLoading(false);
    };
    fetch();
  }, []);

  return { userContext, loading };
}
