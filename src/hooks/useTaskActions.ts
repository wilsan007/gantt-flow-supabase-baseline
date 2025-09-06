import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/hooks/useTasks';

export const useTaskActions = () => {
  const addTask = async (task: Omit<Task, 'id' | 'progress' | 'task_actions'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: task.title,
          assignee: task.assignee,
          start_date: task.start_date,
          due_date: task.due_date,
          priority: task.priority,
          status: task.status,
          effort_estimate_h: task.effort_estimate_h
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const duplicateTask = async (taskId: string) => {
    try {
      const { data: originalTask, error: taskError } = await supabase
        .from('tasks')
        .select('*, task_actions(*)')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      const { data: newTask, error: newTaskError } = await supabase
        .from('tasks')
        .insert([{
          title: `${originalTask.title} (copie)`,
          assignee: originalTask.assignee,
          start_date: originalTask.start_date,
          due_date: originalTask.due_date,
          priority: originalTask.priority,
          status: 'todo',
          effort_estimate_h: originalTask.effort_estimate_h
        }])
        .select()
        .single();

      if (newTaskError) throw newTaskError;

      if (originalTask.task_actions && originalTask.task_actions.length > 0) {
        const newActions = originalTask.task_actions.map((action: any) => ({
          task_id: newTask.id,
          title: action.title,
          weight_percentage: action.weight_percentage,
          is_done: false,
          due_date: action.due_date,
          position: action.position,
          owner_id: action.owner_id,
          notes: action.notes
        }));

        const { error: actionsError } = await supabase
          .from('task_actions')
          .insert(newActions);

        if (actionsError) throw actionsError;
      }

      return newTask;
    } catch (error: any) {
      console.error('Error duplicating task:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error: actionsError } = await supabase
        .from('task_actions')
        .delete()
        .eq('task_id', taskId);

      if (actionsError) throw actionsError;

      const { error: taskError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (taskError) throw taskError;
    } catch (error: any) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const toggleAction = async (taskId: string, actionId: string) => {
    try {
      const { data: currentAction, error: fetchError } = await supabase
        .from('task_actions')
        .select('is_done')
        .eq('id', actionId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('task_actions')
        .update({ is_done: !currentAction.is_done })
        .eq('id', actionId);

      if (updateError) throw updateError;
    } catch (error: any) {
      console.error('Error toggling action:', error);
      throw error;
    }
  };

  const addActionColumn = async (actionTitle: string) => {
    try {
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id');

      if (tasksError) throw tasksError;

      if (allTasks && allTasks.length > 0) {
        const newActions = allTasks.map(task => ({
          task_id: task.id,
          title: actionTitle,
          weight_percentage: 0,
          is_done: false
        }));

        const { error: actionsError } = await supabase
          .from('task_actions')
          .insert(newActions);

        if (actionsError) throw actionsError;

        for (const task of allTasks) {
          await supabase.rpc('distribute_equal_weights', { p_task_id: task.id });
        }
      }
    } catch (error: any) {
      console.error('Error adding action column:', error);
      throw error;
    }
  };

  const createSubtask = async (parentTaskId: string, title: string) => {
    try {
      const { data: parentTask, error: parentError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', parentTaskId)
        .single();

      if (parentError) throw parentError;

      const newLevel = parentTask.task_level + 1;
      const displayOrder = await supabase.rpc('generate_display_order', {
        p_parent_id: parentTaskId,
        p_task_level: newLevel
      });

      const { data: newSubtask, error: subtaskError } = await supabase
        .from('tasks')
        .insert([{
          title,
          assignee: parentTask.assignee,
          start_date: parentTask.start_date,
          due_date: parentTask.due_date,
          priority: parentTask.priority,
          status: 'todo',
          effort_estimate_h: 0,
          parent_id: parentTaskId,
          task_level: newLevel,
          display_order: displayOrder.data
        }])
        .select()
        .single();

      if (subtaskError) throw subtaskError;
      return newSubtask;
    } catch (error: any) {
      console.error('Error creating subtask:', error);
      throw error;
    }
  };

  const updateTaskAssignee = async (taskId: string, assignee: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ assignee })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating task assignee:', error);
      throw error;
    }
  };

  const updateTaskDates = async (taskId: string, startDate: string, dueDate: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ start_date: startDate, due_date: dueDate })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating task dates:', error);
      throw error;
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };

  return {
    addTask,
    duplicateTask,
    deleteTask,
    toggleAction,
    addActionColumn,
    createSubtask,
    updateTaskAssignee,
    updateTaskDates,
    updateTaskStatus
  };
};