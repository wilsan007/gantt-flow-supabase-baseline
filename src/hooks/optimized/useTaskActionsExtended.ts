/**
 * Hook Task Actions Extended - Fonctions spécifiques aux vues
 * Extension du hook de base avec fonctions métier complexes
 * Compatible avec l'ancienne structure des vues
 * Max 200 lignes
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTaskActionsExtended = () => {
  const { toast } = useToast();

  const toggleAction = useCallback(async (taskId: string, actionId: string) => {
    try {
      const { data: currentAction, error: fetchError } = await supabase
        .from('task_actions')
        .select('is_done, tenant_id')
        .eq('id', actionId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('task_actions')
        .update({ 
          is_done: !currentAction.is_done,
          updated_at: new Date().toISOString()
        })
        .eq('id', actionId)
        .eq('tenant_id', currentAction.tenant_id);

      if (updateError) throw updateError;
    } catch (error: any) {
      console.error('Error toggling action:', error);
      throw error;
    }
  }, []);

  const addActionColumn = useCallback(async (actionTitle: string, selectedTaskId?: string) => {
    try {
      if (!actionTitle.trim()) return;
      
      const tasksQuery = supabase.from('tasks').select('id');
      if (selectedTaskId) {
        tasksQuery.eq('id', selectedTaskId);
      }
      
      const { data: allTasks, error: tasksError } = await tasksQuery;
      if (tasksError) throw tasksError;

      if (allTasks && allTasks.length > 0) {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tasks')
          .select('tenant_id')
          .eq('id', allTasks[0].id)
          .single();

        if (tenantError) throw tenantError;

        const newActions = allTasks.map(task => ({
          task_id: task.id,
          title: actionTitle,
          weight_percentage: 0,
          is_done: false,
          tenant_id: tenantData.tenant_id
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
  }, []);

  const addDetailedAction = useCallback(async (
    taskId: string, 
    actionData: {
      title: string;
      weight_percentage: number;
      due_date?: string;
      notes?: string;
    }
  ) => {
    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from('tasks')
        .select('tenant_id')
        .eq('id', taskId)
        .single();

      if (tenantError) throw tenantError;

      const { error: actionError } = await supabase
        .from('task_actions')
        .insert([{
          task_id: taskId,
          title: actionData.title,
          weight_percentage: actionData.weight_percentage,
          due_date: actionData.due_date,
          notes: actionData.notes,
          is_done: false,
          tenant_id: tenantData.tenant_id
        }]);

      if (actionError) throw actionError;

      await supabase.rpc('distribute_equal_weights', { p_task_id: taskId });
    } catch (error: any) {
      console.error('Error adding detailed action:', error);
      throw error;
    }
  }, []);

  const createSubTask = useCallback(async (parentTaskId: string, linkedActionId?: string, customData?: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
    assignee?: string;
  }) => {
    try {
      const { data: parentTask, error: parentError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', parentTaskId)
        .maybeSingle();

      if (parentError) throw parentError;
      if (!parentTask) throw new Error('Parent task not found');

      const newLevel = (parentTask.task_level || 0) + 1;
      
      const { data: displayOrderResult, error: displayOrderError } = await supabase.rpc('generate_display_order', {
        p_parent_id: parentTaskId,
        p_task_level: newLevel
      });

      if (displayOrderError) throw displayOrderError;

      const assignedName = customData?.assignee || parentTask.assigned_name;
      if (!assignedName || assignedName === 'Non assigné') {
        throw new Error('Un responsable doit être assigné à la sous-tâche');
      }

      const newTaskData = {
        title: customData?.title || `Sous-tâche de ${parentTask.title}`,
        start_date: customData?.start_date || parentTask.start_date,
        due_date: customData?.due_date || parentTask.due_date,
        priority: parentTask.priority,
        status: 'todo' as const,
        effort_estimate_h: customData?.effort_estimate_h || 1,
        progress: 0,
        assigned_name: assignedName,
        department_name: parentTask.department_name,
        project_name: parentTask.project_name,
        parent_id: parentTaskId,
        task_level: newLevel,
        display_order: displayOrderResult,
        tenant_id: parentTask.tenant_id
      };

      const { data: newSubtask, error: subtaskError } = await supabase
        .from('tasks')
        .insert([newTaskData])
        .select()
        .single();

      if (subtaskError) throw subtaskError;

      return newSubtask;
    } catch (error: any) {
      console.error('Error creating subtask:', error);
      throw error;
    }
  }, []);

  const createSubTaskWithActions = useCallback(async (
    parentTaskId: string, 
    customData: any,
    actions: Array<any>
  ) => {
    try {
      const newSubtask = await createSubTask(parentTaskId, undefined, customData);
      if (!newSubtask) throw new Error('Failed to create subtask');

      if (actions.length > 0) {
        const { data: tenantData } = await supabase
          .from('tasks')
          .select('tenant_id')
          .eq('id', newSubtask.id)
          .single();

        const actionInserts = actions.map(action => ({
          task_id: newSubtask.id,
          title: action.title,
          weight_percentage: action.weight_percentage,
          due_date: action.due_date,
          notes: action.notes,
          is_done: false,
          tenant_id: tenantData?.tenant_id
        }));

        await supabase.from('task_actions').insert(actionInserts);
        await supabase.rpc('distribute_equal_weights', { p_task_id: newSubtask.id });
      }

      return newSubtask;
    } catch (error: any) {
      console.error('Error creating subtask with actions:', error);
      throw error;
    }
  }, [createSubTask]);

  const updateTaskAssignee = useCallback(async (taskId: string, assignee: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ assigned_name: assignee })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating task assignee:', error);
      throw error;
    }
  }, []);

  const updateTaskDates = useCallback(async (taskId: string, startDate: string, dueDate: string) => {
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
  }, []);

  return {
    toggleAction,
    addActionColumn,
    addDetailedAction,
    createSubTask,
    createSubTaskWithActions,
    updateTaskAssignee,
    updateTaskDates
  };
};
