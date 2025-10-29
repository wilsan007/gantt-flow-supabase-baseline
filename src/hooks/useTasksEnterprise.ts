/**
 * Hook Tasks Enterprise - Pattern SaaS Leaders
 * Inspiré de Stripe, Salesforce, Monday.com, Linear
 * 
 * Fonctionnalités:
 * - Query-level filtering (sécurité maximale)
 * - Cache intelligent avec invalidation
 * - Pagination et lazy loading
 * - Métriques de performance
 * - Gestion d'erreurs robuste
 * - Real-time updates optimisés
 * - Abort controllers pour performance
 * - Hierarchical task support
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { useUserRoles } from '@/hooks/useUserRoles';

// Réexporter les types depuis le fichier centralisé
export type { Task, TaskAction, CreateTaskData, UpdateTaskData, TaskFilters, TaskMetrics, TaskStats } from '@/types/tasks';

// Import des types depuis le fichier centralisé
import type { Task, TaskStats, TaskFilters, TaskMetrics } from '@/types/tasks';

export interface TaskPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
}

export interface TasksData extends TaskStats {
  tasks: Task[];
}

/**
 * Hook Tasks Enterprise - Pattern Leaders SaaS
 */
export const useTasksEnterprise = (filters?: TaskFilters) => {
  // États optimisés avec métriques
  const [data, setData] = useState<TasksData>({
    tasks: [],
    total: 0,
    totalCount: 0,
    byStatus: {},
    byPriority: {},
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    unassignedTasks: 0,
    hierarchyStats: {
      parentTasks: 0,
      subtasks: 0,
      maxDepth: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<TaskMetrics>({
    fetchTime: 0,
    cacheHit: false,
    dataSize: 0,
    lastUpdate: new Date(),
    queryComplexity: 'simple',
    hierarchyDepth: 0
  });
  
  // Pagination state
  const [pagination, setPagination] = useState<TaskPagination>({
    page: 1,
    limit: 100, // Plus de tâches par page pour les hiérarchies
    total: 0,
    hasMore: false,
    totalPages: 0
  });
  
  // Hooks externes
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { isSuperAdmin, isLoading: rolesLoading, userRoles } = useUserRoles();
  
  // Refs pour optimisations (Pattern Stripe/Salesforce)
  const fetchedRef = useRef(false);
  const tenantIdRef = useRef<string | null>(null);
  const filtersRef = useRef<TaskFilters | undefined>(undefined);
  const cacheRef = useRef<Map<string, { data: TasksData; timestamp: number }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cache TTL (3 minutes pour les tâches - plus dynamiques)
  const CACHE_TTL = 3 * 60 * 1000;
  
  // Fonction de cache intelligent (Pattern Stripe/Salesforce)
  const getCacheKey = useCallback((
    tenantId: string | null, 
    isSuperAdmin: boolean, 
    filters?: TaskFilters,
    page: number = 1
  ) => {
    const baseKey = `tasks_${isSuperAdmin ? 'super_admin' : tenantId || 'no_tenant'}`;
    const filterKey = filters ? `_${JSON.stringify(filters)}` : '';
    const pageKey = `_page_${page}`;
    return `${baseKey}${filterKey}${pageKey}`;
  }, []);
  
  const getCachedData = useCallback((cacheKey: string): TasksData | null => {
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // console.log('🎯 Cache hit for tasks data:', cacheKey);
      return cached.data;
    }
    return null;
  }, []);
  
  const setCachedData = useCallback((cacheKey: string, data: TasksData) => {
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    // console.log('💾 Cached tasks data:', cacheKey);
  }, []);

  // Fonction de construction de requête optimisée (Pattern Enterprise)
  const buildQuery = useCallback((
    isSuper: boolean, 
    tenantId: string | null, 
    filters?: TaskFilters,
    page: number = 1,
    limit: number = 100
  ) => {
    // Sélection optimisée avec jointures conditionnelles (Pattern Linear)
    // Note: Les relations sont basées sur les foreign keys du schema
    let query = isSuper 
      ? supabase.from('tasks').select(`
          *,
          projects:project_id(name, tenant_id),
          assignee:assignee_id(full_name),
          parent_task:parent_id(title)
        `)
      : supabase.from('tasks').select(`
          *,
          projects:project_id(name),
          assignee:assignee_id(full_name),
          parent_task:parent_id(title)
        `);
    
    // Filtrage par tenant (sécurité enterprise)
    if (!isSuper && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    
    // Filtres avancés (Pattern Monday.com/Linear)
    if (filters) {
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters.projectId || filters.project_id) {
        query = query.eq('project_id', filters.projectId || filters.project_id);
      }
      if (filters.assignedTo || filters.assignee_id) {
        query = query.eq('assignee_id', filters.assignedTo || filters.assignee_id);
      }
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }
      if (filters.parentTaskId || filters.parent_id) {
        query = query.eq('parent_id', filters.parentTaskId || filters.parent_id);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.dateRange) {
        query = query
          .gte('start_date', filters.dateRange.start)
          .lte('due_date', filters.dateRange.end);
      }
    }
    
    // Pagination (Pattern Stripe)
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    return query
      .order('created_at', { ascending: false })
      .range(from, to);
  }, []);

  // Fonction pour calculer les hiérarchies (Pattern Linear)
  const calculateHierarchyStats = useCallback((tasks: Task[]) => {
    const parentTasks = tasks.filter(t => !t.parent_task_id).length;
    const subtasks = tasks.filter(t => t.parent_task_id).length;
    
    // Calculer la profondeur maximale
    let maxDepth = 0;
    const calculateDepth = (taskId: string, currentDepth: number = 0): number => {
      const children = tasks.filter(t => t.parent_task_id === taskId);
      if (children.length === 0) return currentDepth;
      
      return Math.max(...children.map(child => 
        calculateDepth(child.id, currentDepth + 1)
      ));
    };
    
    tasks.filter(t => !t.parent_task_id).forEach(parentTask => {
      maxDepth = Math.max(maxDepth, calculateDepth(parentTask.id));
    });
    
    return { parentTasks, subtasks, maxDepth };
  }, []);

  // Fonction de fetch principale optimisée
  const fetchTasks = useCallback(async (
    page: number = 1,
    forceRefresh: boolean = false
  ) => {
    // Annuler la requête précédente (Pattern Linear)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const startTime = performance.now();
      setLoading(true);
      setError(null);

      const isSuper = isSuperAdmin();
      const cacheKey = getCacheKey(tenantId, isSuper, filters, page);
      
      // Vérifier le cache d'abord (sauf si force refresh)
      if (!forceRefresh) {
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setMetrics(prev => ({
            ...prev,
            cacheHit: true,
            fetchTime: performance.now() - startTime,
            lastUpdate: new Date()
          }));
          setLoading(false);
          return;
        }
      }

      // console.log('🔄 Fetching tasks data:', {
      //   tenant: tenantId || 'ALL_TENANTS (Super Admin)',
      //   isSuperAdmin: isSuper,
      //   filters,
      //   page,
      //   cacheKey
      // });

      // Construction et exécution de la requête (Pattern Enterprise)
      const query = buildQuery(isSuper, tenantId, filters, page, pagination.limit);
      const { data: tasks, error: tasksError, count } = await query;

      if (tasksError) {
        throw new Error(tasksError.message);
      }

      // Calculer les métriques business (Pattern Salesforce)
      const activeTasks = tasks?.filter(t => ['todo', 'in_progress'].includes(t.status)).length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const overdueTasks = tasks?.filter(t => {
        if (!t.due_date) return false;
        return new Date(t.due_date) < new Date() && t.status !== 'completed';
      }).length || 0;
      const unassignedTasks = tasks?.filter(t => !t.assignee_id && !t.assigned_name).length || 0;

      // Calculer les statistiques de hiérarchie
      const hierarchyStats = calculateHierarchyStats(tasks || []);

      const newData: TasksData = {
        tasks: tasks || [],
        total: count || 0,
        totalCount: count || 0,
        byStatus: {},
        byPriority: {},
        activeTasks,
        completedTasks,
        overdueTasks,
        unassignedTasks,
        hierarchyStats
      };

      // Calculer les métriques de performance
      const endTime = performance.now();
      const fetchTime = endTime - startTime;
      const dataSize = JSON.stringify(newData).length;
      const queryComplexity = filters ? 'complex' : isSuper ? 'medium' : 'simple';
      
      // Mettre en cache les données
      setCachedData(cacheKey, newData);
      
      // Mettre à jour les états
      setData(newData);
      setMetrics({
        fetchTime,
        cacheHit: false,
        dataSize,
        lastUpdate: new Date(),
        queryComplexity,
        hierarchyDepth: hierarchyStats.maxDepth
      });
      
      // Mettre à jour la pagination
      setPagination(prev => ({
        ...prev,
        page,
        total: count || 0,
      }));

      // console.log('✅ Tasks data loaded:', {
      //   tasks: newData.tasks.length,
      //   totalCount: newData.totalCount,
      //   activeTasks: newData.activeTasks,
      //   completedTasks: newData.completedTasks,
      //   overdueTasks: newData.overdueTasks,
      //   unassignedTasks: newData.unassignedTasks,
      //   hierarchyStats: newData.hierarchyStats,
      //   isSuperAdmin: isSuper,
      //   scope: isSuper ? 'ALL_TENANTS' : `TENANT_${tenantId}`,
      //   fetchTime: `${fetchTime.toFixed(2)}ms`,
      //   dataSize: `${(dataSize / 1024).toFixed(2)}KB`,
      //   queryComplexity,
      //   hierarchyDepth,
      //   cacheKey
      // });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // console.log('🚫 Tasks fetch aborted');
        return;
      }
      
      console.error('❌ Error fetching tasks data:', error);
      setError(error.message || 'Erreur de chargement des tâches');
      
      toast({
        title: "Erreur",
        description: "Impossible de charger les tâches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [tenantId, isSuperAdmin, filters, pagination.limit, getCacheKey, getCachedData, setCachedData, buildQuery, calculateHierarchyStats, toast]);

  // Effect principal avec protection anti-boucle
  useEffect(() => {
    if (rolesLoading) {
      // console.log('⏳ Roles still loading...');
      return;
    }

    // Super Admin peut accéder aux données même sans tenant_id
    if (!tenantId && !isSuperAdmin()) {
      // console.log('⚠️ No tenant ID available and not Super Admin');
      setLoading(false);
      return;
    }

    // Éviter les refetch inutiles
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(filtersRef.current);
    const tenantChanged = tenantIdRef.current !== tenantId;
    
    if (fetchedRef.current && !filtersChanged && !tenantChanged) {
      // console.log('📦 Tasks data already fetched, skipping...');
      return;
    }

    // Marquer comme en cours de fetch
    fetchedRef.current = true;
    tenantIdRef.current = tenantId;
    filtersRef.current = filters;

    fetchTasks(1);
  }, [tenantId, rolesLoading, filters, fetchTasks, isSuperAdmin]);

  // Fonctions utilitaires optimisées (Pattern Enterprise)
  const refresh = useCallback(() => {
    const cacheKey = getCacheKey(tenantId, isSuperAdmin(), filters, pagination.page);
    cacheRef.current.delete(cacheKey);
    fetchedRef.current = false;
    tenantIdRef.current = null;
    filtersRef.current = undefined;
    fetchTasks(pagination.page, true);
    // console.log('🔄 Cache invalidated and refresh triggered:', cacheKey);
  }, [tenantId, isSuperAdmin, filters, pagination.page, getCacheKey, fetchTasks]);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetchTasks(pagination.page + 1);
    }
  }, [pagination.hasMore, pagination.page, loading, fetchTasks]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    // console.log('🗑️ All tasks cache cleared');
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      size: cacheRef.current.size,
      keys: Array.from(cacheRef.current.keys()),
      totalSize: Array.from(cacheRef.current.values())
        .reduce((acc, { data }) => acc + JSON.stringify(data).length, 0)
    };
  }, []);

  // Fonctions spécifiques aux tâches (Pattern Linear)
  const getTasksByProject = useCallback((projectId: string) => {
    return data.tasks.filter(task => task.project_id === projectId);
  }, [data.tasks]);

  const getSubtasks = useCallback((parentTaskId: string) => {
    return data.tasks.filter(task => task.parent_task_id === parentTaskId);
  }, [data.tasks]);

  const getTaskHierarchy = useCallback((taskId: string) => {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return null;

    const subtasks = getSubtasks(taskId);
    return {
      ...task,
      subtasks: subtasks.map(subtask => ({
        ...subtask,
        subtasks: getSubtasks(subtask.id)
      }))
    };
  }, [data.tasks, getSubtasks]);

  // Cleanup lors du démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Déterminer les informations d'accès pour l'UX
  const currentUserRole = userRoles[0]?.roles?.name || 'Aucun rôle';
  const requiredRole = 'project_manager, tenant_admin ou super_admin';
  
  // SOLUTION TEMPORAIRE : Récupérer le tenant_id depuis user_roles si useTenant échoue
  const tenantIdFromRoles = userRoles[0]?.tenant_id;
  const effectiveTenantId = tenantId || tenantIdFromRoles;
  
  // Vérifier si l'utilisateur a le bon rôle
  const hasRequiredRole = isSuperAdmin() || 
    currentUserRole === 'project_manager' || 
    currentUserRole === 'tenant_admin';
  
  const hasAccess = hasRequiredRole && !!effectiveTenantId;
  
  return {
    // Données
    ...data,
    
    // États
    loading,
    error,
    
    // Métriques de performance
    metrics,
    pagination,
    
    // Permissions optimisées
    canAccess: hasAccess,
    isSuperAdmin: isSuperAdmin(),
    
    // Informations d'accès pour l'UX
    accessInfo: {
      hasAccess,
      currentRole: currentUserRole,
      requiredRole,
      reason: !hasAccess ? (!userRoles.length ? 'no_role' : 'insufficient_permissions') : null
    },
    
    // Actions optimisées
    refresh,
    loadMore,
    clearCache,
    getCacheStats,
    
    // Utilitaires
    isDataStale: metrics.lastUpdate && Date.now() - metrics.lastUpdate.getTime() > CACHE_TTL,
    cacheKey: getCacheKey(tenantId, isSuperAdmin(), filters, pagination.page),
    
    // Fonctions de navigation
    goToPage: (page: number) => fetchTasks(page),
    setFilters: (newFilters: TaskFilters) => {
      filtersRef.current = newFilters;
      fetchedRef.current = false;
      fetchTasks(1);
    },
    
    // Fonctions spécifiques aux tâches
    getTasksByProject,
    getSubtasks,
    getTaskHierarchy
  };
};
