import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

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
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Fetch tasks with their actions and profiles
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_actions (*),
          profiles!tasks_assignee_id_fkey (
            id,
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      // Transform the data to match our interface
      const transformedTasks: Task[] = (tasksData || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        assignee: task.profiles?.full_name || task.assignee, // Use profile name if available
        start_date: task.start_date,
        due_date: task.due_date,
        priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: task.status as 'todo' | 'doing' | 'blocked' | 'done',
        effort_estimate_h: task.effort_estimate_h,
        progress: task.progress,
        task_actions: task.task_actions || [],
      }));

      setTasks(transformedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'progress' | 'task_actions'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      await fetchTasks();
      return data;
    } catch (err) {
      console.error('Error adding task:', err);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
      throw err;
    }
  };

  const duplicateTask = async (taskId: string) => {
    try {
      // Get the original task with its actions
      const { data: originalTask, error: fetchError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_actions (*)
        `)
        .eq('id', taskId)
        .single();

      if (fetchError) throw fetchError;

      // Create duplicate task
      const { task_actions, id, created_at, updated_at, ...taskData } = originalTask;
      const duplicateTaskData = {
        ...taskData,
        title: `${taskData.title} (Copie)`,
        status: 'todo' as const,
        progress: 0,
      };

      const { data: newTask, error: insertTaskError } = await supabase
        .from('tasks')
        .insert([duplicateTaskData])
        .select()
        .single();

      if (insertTaskError) throw insertTaskError;

      // Duplicate actions if they exist
      if (task_actions && task_actions.length > 0) {
        const duplicateActions = task_actions.map((action: any) => ({
          task_id: newTask.id,
          title: action.title,
          is_done: false,
          owner_id: action.owner_id,
          due_date: action.due_date,
          notes: action.notes,
          position: action.position,
        }));

        const { error: insertActionsError } = await supabase
          .from('task_actions')
          .insert(duplicateActions);

        if (insertActionsError) throw insertActionsError;
      }

      toast({
        title: "Success",
        description: "Task duplicated successfully",
      });

      await fetchTasks();
    } catch (err) {
      console.error('Error duplicating task:', err);
      toast({
        title: "Error",
        description: "Failed to duplicate task",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });

      await fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const toggleAction = async (taskId: string, actionId: string) => {
    console.log('🔄 Toggling action:', { taskId, actionId });
    
    try {
      // Get current state
      const { data: currentAction, error: fetchError } = await supabase
        .from('task_actions')
        .select('is_done')
        .eq('id', actionId)
        .single();

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
      }

      const newIsDone = !currentAction.is_done;
      console.log('📝 Updating action from', currentAction.is_done, 'to', newIsDone);

      // Optimistic update for immediate UI feedback
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? {
                ...task,
                task_actions: task.task_actions?.map(action => 
                  action.id === actionId 
                    ? { ...action, is_done: newIsDone }
                    : action
                ) || []
              }
            : task
        )
      );

      // Update in database - the trigger will handle progress/status update automatically
      const { error: updateError } = await supabase
        .from('task_actions')
        .update({ is_done: newIsDone })
        .eq('id', actionId);

      if (updateError) {
        console.error('❌ Update error:', updateError);
        // Revert optimistic update on error
        await fetchTasks();
        throw updateError;
      }

      console.log('✅ Action updated successfully');

    } catch (err) {
      console.error('💥 Error toggling action:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'action",
        variant: "destructive",
      });
    }
  };

  const addActionColumn = async (actionTitle: string) => {
    try {
      // Add this action to all existing tasks
      const actionInserts = tasks.map((task) => ({
        task_id: task.id,
        title: actionTitle,
        is_done: false,
        position: (task.task_actions?.length || 0) + 1,
      }));

      const { error } = await supabase
        .from('task_actions')
        .insert(actionInserts);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Action column added successfully",
      });

      await fetchTasks();
    } catch (err) {
      console.error('Error adding action column:', err);
      toast({
        title: "Error",
        description: "Failed to add action column",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTasks();

    // Set up real-time subscription
    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' }, 
        () => fetchTasks()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'task_actions' }, 
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      tasksSubscription.unsubscribe();
    };
  }, []);

  const updateTaskDates = async (taskId: string, startDate: string, dueDate: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          start_date: startDate, 
          due_date: dueDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
    } catch (err) {
      console.error('Error updating task dates:', err);
      toast({
        title: "Error",
        description: "Failed to update task dates",
        variant: "destructive",
      });
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));

      toast({
        title: "Statut mis à jour",
        description: `Tâche déplacée vers ${status}`,
      });
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la tâche",
      });
    }
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    duplicateTask,
    deleteTask,
    toggleAction,
    addActionColumn,
    updateTaskDates,
    updateTaskStatus,
    refetch: fetchTasks,
  };
};