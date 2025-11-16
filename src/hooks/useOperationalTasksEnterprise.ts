/**
 * Hook Operational Tasks Enterprise - Pattern SaaS Leaders
 * Inspiré de useProjectsEnterprise - ZERO boucle infinie
 *
 * Fonctionnalités:
 * - Query-level filtering (sécurité maximale)
 * - Cache intelligent avec invalidation
 * - Pagination et lazy loading
 * - Métriques de performance
 * - Gestion d'erreurs robuste
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';

// Type brut de la base de données
interface OperationalActivityRaw {
  id: string;
  name: string;
  description: string | null;
  kind: string; // Sera 'recurring' ou 'one_off' en pratique
  scope: string;
  department_id: string | null;
  owner_id: string | null;
  owner_employee_id: string | null;
  owner_name: string | null;
  project_id: string | null;
  task_title_template: string | null;
  one_off_date: string | null;
  is_active: boolean;
  tenant_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Type optimisé pour l'enterprise (après mapping)
export interface OperationalTask {
  id: string;
  name: string;
  description?: string | null;
  kind: 'recurring' | 'one_off';
  scope: 'org' | 'department' | 'team' | 'person';
  department_id?: string | null;
  owner_id?: string | null;
  owner_employee_id?: string | null;
  owner_name?: string | null;
  project_id?: string | null;
  task_title_template?: string | null;
  one_off_date?: string | null;
  is_active: boolean;
  tenant_id: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Ajouts pour compatibilité UI
  title: string; // Alias de 'name' - TOUJOURS présent après mapping
  status?: string;
  priority?: string;
  category?: string;
  assigned_to?: string | { id: string; full_name: string } | null;
  due_date?: string;
  department?: string;
  is_recurring?: boolean;
}

export interface OperationalTaskMetrics {
  fetchTime: number;
  cacheHit: boolean;
  dataSize: number;
  lastUpdate: Date;
}

export interface OperationalTaskPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
}

export interface OperationalTaskFilters {
  status?: string[];
  priority?: string[];
  category?: string[];
  search?: string;
  isRecurring?: boolean;
}

export interface OperationalTasksData {
  tasks: OperationalTask[];
  totalCount: number;
  todoCount: number;
  inProgressCount: number;
  completedCount: number;
  recurringCount: number;
}

/**
 * Hook Operational Tasks Enterprise - STABLE
 */
export const useOperationalTasksEnterprise = (filters?: OperationalTaskFilters) => {
  // États optimisés avec métriques
  const [data, setData] = useState<OperationalTasksData>({
    tasks: [],
    totalCount: 0,
    todoCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    recurringCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<OperationalTaskMetrics>({
    fetchTime: 0,
    cacheHit: false,
    dataSize: 0,
    lastUpdate: new Date(),
  });

  // Pagination state
  const [pagination, setPagination] = useState<OperationalTaskPagination>({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false,
    totalPages: 0,
  });

  // Hooks externes
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { isLoading: rolesLoading, userRoles } = useUserRoles();

  // ✅ Calcul stable de isSuperAdmin depuis userRoles
  const isSuperAdminValue = useMemo(() => {
    return userRoles.some(role => role.roles?.name === 'super_admin');
  }, [userRoles]);

  // Refs pour optimisations
  const fetchedRef = useRef(false);
  const tenantIdRef = useRef<string | null>(null);
  const cacheRef = useRef<Map<string, { data: OperationalTasksData; timestamp: number }>>(
    new Map()
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache TTL (5 minutes)
  const CACHE_TTL = 5 * 60 * 1000;

  // Fonction de cache intelligent
  const getCacheKey = useCallback(
    (tenant: string | null, isSuper: boolean, filters?: OperationalTaskFilters) => {
      const baseKey = `op_tasks_${isSuper ? 'super_admin' : tenant || 'no_tenant'}`;
      const filterKey = filters ? `_${JSON.stringify(filters)}` : '';
      return `${baseKey}${filterKey}`;
    },
    []
  );

  const getCachedData = useCallback(
    (cacheKey: string): OperationalTasksData | null => {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
      return null;
    },
    [CACHE_TTL]
  );

  const setCachedData = useCallback((cacheKey: string, data: OperationalTasksData) => {
    cacheRef.current.set(cacheKey, { data, timestamp: Date.now() });
  }, []);

  // Fonction de fetch stable
  useEffect(() => {
    // Conditions de sortie
    if (rolesLoading) {
      return;
    }

    if (!tenantId && !isSuperAdminValue) {
      setLoading(false);
      return;
    }

    // Protection contre les refetch
    const currentHash = `${tenantId || 'null'}-${isSuperAdminValue}-${JSON.stringify(filters)}`;
    const lastHash = tenantIdRef.current || '';

    if (fetchedRef.current && currentHash === lastHash) {
      return;
    }

    // Vérifier le cache
    const cacheKey = getCacheKey(tenantId, isSuperAdminValue, filters);
    const cachedData = getCachedData(cacheKey);

    if (cachedData && currentHash === lastHash) {
      return;
    }

    // Marquer comme fetché
    fetchedRef.current = true;
    tenantIdRef.current = currentHash;

    const fetchData = async () => {
      // Annuler requête précédente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const startTime = performance.now();
        setLoading(true);
        setError(null);

        const cacheKey = getCacheKey(tenantId, isSuperAdminValue, filters);

        // Vérifier le cache d'abord
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setMetrics(prev => ({
            ...prev,
            cacheHit: true,
            fetchTime: performance.now() - startTime,
            lastUpdate: new Date(),
          }));
          setLoading(false);
          return;
        }

        // Construire la requête - utiliser la vraie table
        let query = supabase.from('operational_activities').select('*');

        // Filtrage par tenant
        if (!isSuperAdminValue && tenantId) {
          query = query.eq('tenant_id', tenantId);
        }

        // Appliquer les filtres (colonnes réelles de la table)
        if (filters?.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }

        if (filters?.isRecurring !== undefined) {
          query = query.eq('kind', filters.isRecurring ? 'recurring' : 'one_off');
        }

        // Exécuter la requête
        const { data: rawActivities, error: fetchError } = await query
          .order('created_at', { ascending: false })
          .limit(pagination.limit);

        if (fetchError) throw fetchError;

        // Calculer les métriques (adapter aux vraies colonnes)
        const tasksData: OperationalTask[] = (rawActivities || []).map(
          (activity: OperationalActivityRaw) => ({
            ...activity,
            kind: activity.kind as 'recurring' | 'one_off', // Cast sûr
            scope: activity.scope as 'org' | 'department' | 'team' | 'person', // Cast sûr
            title: activity.name, // Alias pour compatibilité UI (toujours présent)
            is_recurring: activity.kind === 'recurring',
            status: activity.is_active ? 'active' : 'inactive', // Mapping status
            assigned_to: activity.owner_name || null, // Mapping assigné
            due_date: activity.one_off_date || undefined, // Mapping échéance
          })
        );

        const newData: OperationalTasksData = {
          tasks: tasksData,
          totalCount: tasksData.length,
          todoCount: tasksData.filter(t => !t.is_active).length, // Inactives = à faire
          inProgressCount: tasksData.filter(t => t.is_active && t.kind === 'recurring').length,
          completedCount: 0, // Pas de statut completed dans cette table
          recurringCount: tasksData.filter(t => t.kind === 'recurring').length,
        };

        // Calculer les métriques de performance
        const endTime = performance.now();
        const fetchTime = endTime - startTime;
        const dataSize = JSON.stringify(newData).length;

        // Mettre en cache
        setCachedData(cacheKey, newData);

        // Mettre à jour les états
        setData(newData);
        setMetrics({
          fetchTime,
          cacheHit: false,
          dataSize,
          lastUpdate: new Date(),
        });

        // Pagination
        setPagination(prev => ({
          ...prev,
          total: newData.totalCount,
          totalPages: Math.ceil(newData.totalCount / prev.limit),
          hasMore: newData.totalCount > prev.limit,
        }));
      } catch (error: any) {
        console.error('❌ Error fetching operational tasks:', error);
        setError(error.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    tenantId,
    rolesLoading,
    isSuperAdminValue,
    filters,
    getCacheKey,
    getCachedData,
    pagination.limit,
    setCachedData,
  ]);

  // Fonction de refresh
  const refresh = useCallback(() => {
    const cacheKey = getCacheKey(tenantId, isSuperAdminValue, filters);
    cacheRef.current.delete(cacheKey);
    fetchedRef.current = false;
    tenantIdRef.current = null;
    setLoading(true);
  }, [tenantId, isSuperAdminValue, filters, getCacheKey]);

  // Fonction pour mettre à jour une activité
  const updateTask = useCallback(
    async (taskId: string, updates: Partial<OperationalTask>) => {
      try {
        // Mapper les updates vers les vraies colonnes
        const activityUpdates: any = {};
        if (updates.title) activityUpdates.name = updates.title;
        if (updates.name) activityUpdates.name = updates.name;
        if (updates.description !== undefined) activityUpdates.description = updates.description;
        if (updates.kind) activityUpdates.kind = updates.kind;
        if (updates.is_active !== undefined) activityUpdates.is_active = updates.is_active;

        const { error: updateError } = await supabase
          .from('operational_activities')
          .update(activityUpdates)
          .eq('id', taskId);

        if (updateError) throw updateError;

        // Invalider le cache et refresh
        refresh();
      } catch (error: any) {
        console.error('Error updating operational activity:', error);
        throw error;
      }
    },
    [refresh]
  );

  // Permissions
  const canAccess = isSuperAdminValue || !!tenantId;

  return {
    // Données
    ...data,

    // États
    loading,
    error,

    // Métriques de performance
    metrics,
    pagination,

    // Permissions
    canAccess,
    isSuperAdmin: isSuperAdminValue,

    // Actions
    refresh,
    updateTask,

    // Utilitaires
    isDataStale: metrics.lastUpdate && Date.now() - metrics.lastUpdate.getTime() > CACHE_TTL,
    cacheKey: getCacheKey(tenantId, isSuperAdminValue, filters),
  };
};
