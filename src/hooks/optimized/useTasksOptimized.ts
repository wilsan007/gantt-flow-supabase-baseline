/**
 * Hook Tasks Optimisé - Version Moderne
 * Combine simplicité des anciens hooks + optimisations Enterprise
 * Max 200 lignes - Single Responsibility
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useCache } from '@/hooks/utils/useCache';
import { useAbortController } from '@/hooks/utils/useAbortController';
import { useMetrics } from '@/hooks/utils/useMetrics';
import { useFetchProtection } from '@/hooks/utils/useFetchProtection';
import { useQueryBuilder, QueryFilters } from '@/hooks/utils/useQueryBuilder';

export interface TaskAction {
  id: string;
  title: string;
  is_done: boolean;
  owner_id?: string;
  due_date?: string;
  notes?: string;
  position: number;
  weight_percentage: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'blocked' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: string;
  due_date: string;
  progress: number;
  assignee_id?: string;
  assigned_name?: string;
  assignee?: string; // Alias pour compatibilité
  project_id?: string;
  project_name?: string;
  parent_task_id?: string;
  parent_id?: string; // Colonne principale pour hiérarchie
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  effort_estimate_h?: number;
  task_level?: number;
  display_order?: string;
  task_actions?: TaskAction[];
  department_name?: string;
  department_id?: string;
  linked_action_id?: string;
  subtasks?: Task[]; // Sous-tâches associées
  isSubtask?: boolean; // Indicateur pour l'affichage
}

export interface TaskStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
}

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export const useTasksOptimized = (filters?: QueryFilters) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, active: 0, completed: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { tenantId } = useTenant();
  const { isSuperAdmin, isLoading: rolesLoading } = useUserRoles();
  const cache = useCache<{ tasks: Task[]; stats: TaskStats }>({ ttl: CACHE_TTL });
  const { getSignal } = useAbortController();
  const { metrics, startTimer, recordMetrics } = useMetrics();
  const { shouldFetch, markAsFetched, reset } = useFetchProtection();
  const { buildTasksQuery, getComplexity } = useQueryBuilder();

  const getCacheKey = useCallback(() => {
    const base = isSuperAdmin() ? 'tasks_super_admin' : `tasks_${tenantId}`;
    return filters ? `${base}_${JSON.stringify(filters)}` : base;
  }, [tenantId, isSuperAdmin, filters]);

  const calculateStats = useCallback((taskList: Task[]): TaskStats => {
    const now = new Date();
    return {
      total: taskList.length,
      active: taskList.filter(t => t.status !== 'done').length,
      completed: taskList.filter(t => t.status === 'done').length,
      overdue: taskList.filter(t => 
        t.due_date && new Date(t.due_date) < now && t.status !== 'done'
      ).length
    };
  }, []);

  /**
   * Organise les tâches en hiérarchie : tâche principale suivie de ses sous-tâches
   * @param taskList Liste brute des tâches
   * @returns Liste organisée avec tâches principales et sous-tâches imbriquées
   */
  const organizeTasksHierarchy = useCallback((taskList: Task[]): Task[] => {
    // Séparer tâches principales et sous-tâches
    const mainTasks = taskList.filter(t => !t.parent_id);
    const subtasks = taskList.filter(t => t.parent_id);
    
    // Créer un map des sous-tâches par parent_id
    const subtasksByParent = new Map<string, Task[]>();
    subtasks.forEach(subtask => {
      const parentId = subtask.parent_id!;
      if (!subtasksByParent.has(parentId)) {
        subtasksByParent.set(parentId, []);
      }
      subtasksByParent.get(parentId)!.push({
        ...subtask,
        isSubtask: true
      });
    });
    
    // Trier les sous-tâches par display_order
    subtasksByParent.forEach(subs => {
      subs.sort((a, b) => {
        const orderA = parseFloat(a.display_order || '999');
        const orderB = parseFloat(b.display_order || '999');
        return orderA - orderB;
      });
    });
    
    // Construire la liste finale : tâche principale + ses sous-tâches
    const organizedTasks: Task[] = [];
    
    // Trier les tâches principales par display_order
    const sortedMainTasks = [...mainTasks].sort((a, b) => {
      const orderA = parseFloat(a.display_order || '999');
      const orderB = parseFloat(b.display_order || '999');
      return orderA - orderB;
    });
    
    sortedMainTasks.forEach(mainTask => {
      // Ajouter la tâche principale
      const taskWithSubtasks = {
        ...mainTask,
        subtasks: subtasksByParent.get(mainTask.id) || [],
        isSubtask: false
      };
      organizedTasks.push(taskWithSubtasks);
      
      // Ajouter ses sous-tâches juste après
      const taskSubtasks = subtasksByParent.get(mainTask.id) || [];
      organizedTasks.push(...taskSubtasks);
    });
    
    return organizedTasks;
  }, []);

  const fetchTasks = useCallback(async (forceRefresh = false) => {
    if (rolesLoading) return;
    if (!tenantId && !isSuperAdmin()) {
      setLoading(false);
      return;
    }

    const params = { tenantId, filters, isSuperAdmin: isSuperAdmin() };
    if (!forceRefresh && !shouldFetch(params)) return;

    const cacheKey = getCacheKey();
    
    // Vérifier cache
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        setTasks(cached.tasks);
        setStats(cached.stats);
        setLoading(false);
        return;
      }
    }

    try {
      const timer = startTimer();
      setLoading(true);
      setError(null);

      const query = buildTasksQuery(tenantId, isSuperAdmin(), filters);
      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Cast explicite pour gérer le type Supabase avec task_actions
      const rawTasks = (data || []) as unknown as Task[];
      
      // Organiser les tâches en hiérarchie (tâche principale + sous-tâches)
      const organizedTasks = organizeTasksHierarchy(rawTasks);
      
      // Calculer les stats sur toutes les tâches (principales + sous-tâches)
      const taskStats = calculateStats(rawTasks);

      // Mettre en cache
      cache.set(cacheKey, { tasks: organizedTasks, stats: taskStats });
      
      setTasks(organizedTasks);
      setStats(taskStats);
      markAsFetched(params);

      recordMetrics(timer, { tasks: organizedTasks, stats: taskStats }, false, 
        getComplexity(filters, isSuperAdmin()));

    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, rolesLoading, filters, isSuperAdmin, shouldFetch, getCacheKey, 
      cache, startTimer, buildTasksQuery, calculateStats, organizeTasksHierarchy, 
      markAsFetched, recordMetrics, getComplexity]);

  const refresh = useCallback(() => {
    cache.invalidate(getCacheKey());
    reset();
    fetchTasks(true);
  }, [cache, getCacheKey, reset, fetchTasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    stats,
    loading,
    error,
    metrics,
    refresh,
    clearCache: cache.clear,
    isStale: () => cache.isStale(getCacheKey())
  };
};
