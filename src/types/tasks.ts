/**
 * Types Tasks Unifiés - Compatible avec Schema Supabase
 * Aligne les types Enterprise avec la structure DB réelle
 */

import { Database } from '@/integrations/supabase/types';

// Type de base depuis Supabase
export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// Type unifié pour l'application (compatible avec les deux schemas)
export interface Task {
  // Champs de base (DB)
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  
  // Dates
  start_date: string;
  due_date: string;
  created_at?: string;
  updated_at?: string;
  
  // Relations (DB utilise ces noms)
  assignee_id?: string | null;
  project_id?: string | null;
  parent_id?: string | null;  // DB utilise parent_id
  department_id?: string | null;
  tenant_id?: string | null;
  linked_action_id?: string | null;
  
  // Noms affichés (requis par DB)
  assigned_name: string;
  project_name: string;
  department_name: string;
  
  // Métriques
  effort_estimate_h?: number | null;  // DB utilise effort_estimate_h
  effort_spent_h?: number | null;
  progress?: number | null;
  budget?: number | null;
  
  // Hiérarchie
  task_level?: number | null;
  display_order?: string | null;
  
  // Autres
  acceptance_criteria?: string | null;
  
  // Relations chargées (optionnelles, pour affichage)
  projects?: { name: string; tenant_id?: string };
  profiles?: { full_name: string };
  assignee?: { full_name: string };
  parent_task?: { title: string };
  subtasks?: Task[];
  actions?: TaskAction[];
  task_actions?: TaskAction[];  // Alias pour compatibilité DynamicTable
  
  // Champs calculés (optionnels)
  subtask_count?: number;
  completion_percentage?: number;
  is_overdue?: boolean;
  days_remaining?: number;
  
  // Alias pour compatibilité Enterprise (optionnels)
  parent_task_id?: string | null;  // Alias de parent_id
  estimated_hours?: number | null;  // Alias de effort_estimate_h
  actual_hours?: number | null;     // Alias de effort_spent_h
  assigned_to?: string | null;      // Alias de assignee_id
  created_by?: string | null;
}

export interface TaskAction {
  id: string;
  task_id: string;
  action_type: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: string;
  due_date?: string;
  notes?: string;
  position?: number;
  weight_percentage?: number;
  created_at?: string;
  updated_at?: string;
  is_done: boolean;  // Statut de complétion (DB)
}

// Type pour création de tâche (compatible DB)
export interface CreateTaskData {
  // Champs requis par DB
  title: string;
  assigned_name: string;
  department_name: string;
  project_name: string;
  due_date: string;
  priority: string;
  start_date: string;
  
  // Champs optionnels
  description?: string | null;
  status?: string;
  assignee_id?: string | null;
  project_id?: string | null;
  parent_id?: string | null;
  department_id?: string | null;
  tenant_id?: string | null;
  effort_estimate_h?: number | null;
  effort_spent_h?: number | null;
  progress?: number | null;
  budget?: number | null;
  task_level?: number | null;
  display_order?: string | null;
  acceptance_criteria?: string | null;
  linked_action_id?: string | null;
}

// Type pour mise à jour de tâche
export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  start_date?: string;
  due_date?: string;
  assignee_id?: string | null;
  assigned_name?: string;
  project_id?: string | null;
  project_name?: string;
  parent_id?: string | null;
  department_id?: string | null;
  department_name?: string;
  effort_estimate_h?: number | null;
  effort_spent_h?: number | null;
  progress?: number | null;
  budget?: number | null;
  task_level?: number | null;
  display_order?: string | null;
  acceptance_criteria?: string | null;
}

// Filtres pour les tâches
export interface TaskFilters {
  status?: string[];
  priority?: string[];
  assignee_id?: string;
  project_id?: string;
  parent_id?: string;
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  
  // Alias pour compatibilité
  projectId?: string;
  assignedTo?: string;
  createdBy?: string;
  parentTaskId?: string;
  includeSubtasks?: boolean;
}

// Métriques de performance
export interface TaskMetrics {
  fetchTime: number;
  cacheHit: boolean;
  dataSize: number;
  lastUpdate: Date;
  queryComplexity: 'simple' | 'medium' | 'complex';
  hierarchyDepth: number;
}

// Statistiques des tâches
export interface TaskStats {
  total: number;
  totalCount: number;  // Alias pour compatibilité
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  unassignedTasks: number;
  hierarchyStats: {
    parentTasks: number;
    subtasks: number;
    maxDepth: number;
  };
}
