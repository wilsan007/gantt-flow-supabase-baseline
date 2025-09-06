import type { Database } from '@/integrations/supabase/types';
import { useTaskDatabase } from './useTaskDatabase';
import { useTaskActions } from './useTaskActions';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskActionRow = Database['public']['Tables']['task_actions']['Row'];

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
  assignee: string;
  start_date: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'doing' | 'blocked' | 'done';
  effort_estimate_h: number;
  progress: number;
  task_actions?: TaskAction[];
  parent_id?: string;
  task_level: number;
  display_order: string;
  linked_action_id?: string;
}

export const useTasks = () => {
  const { tasks, loading, error, refetch } = useTaskDatabase();
  const taskActions = useTaskActions();

  return {
    tasks,
    loading,
    error,
    refetch,
    ...taskActions
  };
};