/**
 * Hook Tasks - Composition Simple
 * Combine useTasksOptimized + useTaskActions + useTaskActionsExtended
 * API 100% compatible avec l'ancien hook pour les vues
 * Max 60 lignes - Pure composition
 */

import { useTasksOptimized, Task, TaskStats } from './useTasksOptimized';
import { useTaskActions } from './useTaskActions';
import { useTaskActionsExtended } from './useTaskActionsExtended';
import { QueryFilters } from '@/hooks/utils/useQueryBuilder';

export type { Task, TaskStats, QueryFilters };

/**
 * Hook principal pour la gestion des tâches
 * Combine lecture (optimisée avec cache) + actions (CRUD + Extended)
 */
export const useTasks = (filters?: QueryFilters) => {
  // Lecture des données (avec cache, métriques, etc.)
  const {
    tasks,
    stats,
    loading,
    error,
    metrics,
    refresh,
    clearCache,
    isStale
  } = useTasksOptimized(filters);

  // Actions CRUD de base
  const actions = useTaskActions();
  
  // Actions étendues pour les vues (toggleAction, createSubTask, etc.)
  const extendedActions = useTaskActionsExtended();

  // API unifiée 100% compatible avec l'ancien hook
  return {
    // Données
    tasks,
    stats,
    
    // États
    loading,
    error,
    
    // Métriques (nouveau)
    metrics,
    
    // Actions de lecture
    refresh,
    refetch: refresh, // Alias pour compatibilité
    clearCache,
    isStale,
    
    // Actions CRUD de base
    ...actions,
    
    // Actions étendues pour les vues
    ...extendedActions
  };
};
