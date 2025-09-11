import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskAction } from '@/hooks/useTasks';

export const useTaskDatabase = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('display_order', { ascending: true });

      if (tasksError) throw tasksError;

      if (tasksData) {
        const { data: actionsData, error: actionsError } = await supabase
          .from('task_actions')
          .select('*')
          .order('created_at', { ascending: true });

        if (actionsError) throw actionsError;

        const tasksWithActions: Task[] = tasksData.map(task => ({
          id: task.id,
          title: task.title,
          assignee: task.assigned_name,
          start_date: task.start_date,
          due_date: task.due_date,
          priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
          status: task.status as 'todo' | 'doing' | 'blocked' | 'done',
          effort_estimate_h: task.effort_estimate_h || 0,
          progress: task.progress || 0,
          parent_id: task.parent_id,
          task_level: task.task_level || 0,
          display_order: task.display_order || '1',
          task_actions: actionsData ? actionsData
            .filter(action => action.task_id === task.id)
            .map(action => ({
              id: action.id,
              title: action.title,
              is_done: action.is_done || false,
              owner_id: action.owner_id || undefined,
              due_date: action.due_date || undefined,
              notes: action.notes || undefined,
              position: action.position || 0,
              weight_percentage: action.weight_percentage
            })) : []
        }));

        setTasks(tasksWithActions);
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const tasksSubscription = supabase
      .channel('tasks_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_actions' }, () => {
        fetchTasks();
      })
      .subscribe();

    return tasksSubscription;
  };

  useEffect(() => {
    fetchTasks();
    const subscription = setupRealtimeSubscription();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks
  };
};