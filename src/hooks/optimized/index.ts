/**
 * Exports centralisés des hooks optimisés
 * Architecture modulaire avec Single Responsibility
 */

// Hooks utilitaires réutilisables
export { useCache } from '../utils/useCache';
export { useAbortController } from '../utils/useAbortController';
export { useMetrics } from '../utils/useMetrics';
export { useFetchProtection } from '../utils/useFetchProtection';
export { useQueryBuilder } from '../utils/useQueryBuilder';

// Hooks principaux optimisés
export { useTasks } from './useTasks';
export { useProjects } from './useProjects';
export { useTaskActions } from './useTaskActions';
export { useTaskActionsExtended } from './useTaskActionsExtended';
export { useTasksOptimized } from './useTasksOptimized';
export { useProjectsOptimized } from './useProjectsOptimized';

// Types
export type { Task, TaskStats, QueryFilters } from './useTasks';
export type { TaskAction } from './useTasksOptimized';
export type { Project, ProjectStats } from './useProjects';
export type { CreateTaskData, UpdateTaskData } from './useTaskActions';
export type { Metrics } from '../utils/useMetrics';
export type { CacheEntry, CacheConfig } from '../utils/useCache';
