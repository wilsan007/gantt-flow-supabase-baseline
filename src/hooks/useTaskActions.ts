import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/hooks/useTasks';

export const useTaskActions = () => {
  const addTask = async (task: Omit<Task, 'id' | 'progress' | 'task_actions'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: task.title,
          assigned_name: task.assignee,
          department_name: 'Aucun Département',
          project_name: 'Aucun Projet',
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

  const createMainTask = async (taskData: {
    title: string;
    assignee: string;
    department: string;
    project: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'doing' | 'blocked' | 'done';
    effort_estimate_h: number;
  }) => {
    try {
      // Validation des champs obligatoires
      if (!taskData.title.trim()) {
        throw new Error('Le titre est obligatoire');
      }
      if (!taskData.assignee) {
        throw new Error('Un responsable doit être assigné');
      }
      if (!taskData.department) {
        throw new Error('Un département doit être sélectionné');
      }
      if (!taskData.project) {
        throw new Error('Un projet doit être sélectionné');
      }

      // Dates par défaut
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: taskData.title.trim(),
          assigned_name: taskData.assignee,
          department_name: taskData.department,
          project_name: taskData.project,
          priority: taskData.priority,
          status: taskData.status,
          effort_estimate_h: taskData.effort_estimate_h,
          start_date: today.toISOString().split('T')[0],
          due_date: nextWeek.toISOString().split('T')[0],
          progress: 0,
          task_level: 0, // Tâche principale
          parent_id: null,
          display_order: '0' // Sera calculé par un trigger
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('Tâche principale créée:', data);
      return data;
    } catch (error: any) {
      console.error('Error creating main task:', error);
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
          assigned_name: originalTask.assigned_name,
          department_name: originalTask.department_name,
          project_name: originalTask.project_name,
          start_date: originalTask.start_date,
          due_date: originalTask.due_date,
          priority: originalTask.priority,
          status: 'todo',
          effort_estimate_h: originalTask.effort_estimate_h
        }])
        .select()
        .single();

      if (newTaskError) throw newTaskError;

      if (originalTask.task_actions && Array.isArray(originalTask.task_actions) && originalTask.task_actions.length > 0) {
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
      console.log('toggleAction called with:', { taskId, actionId });
      
      const { data: currentAction, error: fetchError } = await supabase
        .from('task_actions')
        .select('is_done, tenant_id')
        .eq('id', actionId)
        .single();

      console.log('Current action data:', currentAction);
      if (fetchError) {
        console.error('Error fetching action:', fetchError);
        throw fetchError;
      }

      const { error: updateError } = await supabase
        .from('task_actions')
        .update({ 
          is_done: !currentAction.is_done,
          updated_at: new Date().toISOString()
        })
        .eq('id', actionId)
        .eq('tenant_id', currentAction.tenant_id);

      console.log('Update result - error:', updateError);
      if (updateError) throw updateError;
      
      console.log('Action toggled successfully');
    } catch (error: any) {
      console.error('Error toggling action:', error);
      throw error;
    }
  };

  const addActionColumn = async (actionTitle: string, selectedTaskId?: string) => {
    try {
      if (!actionTitle.trim()) return;
      
      const tasksQuery = supabase.from('tasks').select('id');
      
      if (selectedTaskId) {
        tasksQuery.eq('id', selectedTaskId);
      }
      
      const { data: allTasks, error: tasksError } = await tasksQuery;

      if (tasksError) throw tasksError;

      if (allTasks && allTasks.length > 0) {
        // Récupérer le tenant_id depuis la première tâche
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
  };

  const addDetailedAction = async (
    taskId: string, 
    actionData: {
      title: string;
      weight_percentage: number;
      due_date?: string;
      notes?: string;
    }
  ) => {
    try {
      // Récupérer le tenant_id de la tâche
      const { data: tenantData, error: tenantError } = await supabase
        .from('tasks')
        .select('tenant_id')
        .eq('id', taskId)
        .single();

      if (tenantError) throw tenantError;

      // Créer l'action avec les détails
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

      // Redistribuer les poids si nécessaire
      await supabase.rpc('distribute_equal_weights', { p_task_id: taskId });
    } catch (error: any) {
      console.error('Error adding detailed action:', error);
      throw error;
    }
  };

  const createSubTaskWithActions = async (
    parentTaskId: string, 
    customData: {
      title: string;
      start_date: string;
      due_date: string;
      effort_estimate_h: number;
      assignee?: string;
    },
    actions: Array<{
      title: string;
      weight_percentage: number;
      due_date?: string;
      notes?: string;
    }>
  ) => {
    try {
      console.log('Creating subtask with actions...');
      
      // D'abord créer la sous-tâche
      const newSubtask = await createSubTask(parentTaskId, undefined, customData);
      
      if (!newSubtask) {
        throw new Error('Failed to create subtask');
      }

      // Ensuite créer les actions pour cette sous-tâche
      if (actions.length > 0) {
        console.log('Creating actions for subtask:', newSubtask.id);
        
        const { data: tenantData, error: tenantError } = await supabase
          .from('tasks')
          .select('tenant_id')
          .eq('id', newSubtask.id)
          .single();

        if (tenantError) throw tenantError;

        const actionInserts = actions.map(action => ({
          task_id: newSubtask.id,
          title: action.title,
          weight_percentage: action.weight_percentage,
          due_date: action.due_date,
          notes: action.notes,
          is_done: false,
          tenant_id: tenantData.tenant_id
        }));

        const { error: actionsError } = await supabase
          .from('task_actions')
          .insert(actionInserts);

        if (actionsError) {
          console.error('Error creating actions:', actionsError);
          throw actionsError;
        }

        console.log('Actions created successfully');
        
        // Redistribuer les poids pour s'assurer qu'ils totalisent 100%
        console.log('Redistributing weights for subtask actions...');
        await supabase.rpc('distribute_equal_weights', { p_task_id: newSubtask.id });
      }

      return newSubtask;
    } catch (error: any) {
      console.error('Error creating subtask with actions:', error);
      throw error;
    }
  };

  const createSubTask = async (parentTaskId: string, linkedActionId?: string, customData?: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
    assignee?: string;
  }) => {
    try {
      console.log('Getting parent task data...');
      const { data: parentTask, error: parentError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', parentTaskId)
        .maybeSingle();

      if (parentError) {
        console.error('Error fetching parent task:', parentError);
        throw parentError;
      }
      
      if (!parentTask) {
        throw new Error('Parent task not found');
      }

      console.log('Parent task found:', parentTask);

      const newLevel = (parentTask.task_level || 0) + 1;
      
      console.log('Calling generate_display_order...');
      const { data: displayOrderResult, error: displayOrderError } = await supabase.rpc('generate_display_order', {
        p_parent_id: parentTaskId,
        p_task_level: newLevel
      });

      if (displayOrderError) {
        console.error('Error generating display order:', displayOrderError);
        throw displayOrderError;
      }

      console.log('Display order result:', displayOrderResult);

      // Validation des champs obligatoires (clés étrangères ne peuvent pas être null)
      const assignedName = customData?.assignee || parentTask.assigned_name;
      if (!assignedName || assignedName === 'Non assigné') {
        throw new Error('Un responsable doit être assigné à la sous-tâche');
      }

      if (!parentTask.department_name) {
        throw new Error('La tâche parent doit avoir un département assigné');
      }

      if (!parentTask.project_name) {
        throw new Error('La tâche parent doit avoir un projet assigné');
      }

      if (!parentTask.tenant_id) {
        throw new Error('La tâche parent doit avoir un tenant_id');
      }

      const newTaskData = {
        title: customData?.title || `Sous-tâche de ${parentTask.title}`,
        start_date: customData?.start_date || parentTask.start_date,
        due_date: customData?.due_date || parentTask.due_date,
        priority: parentTask.priority,
        status: 'todo' as const,
        effort_estimate_h: customData?.effort_estimate_h || 1,
        progress: 0,
        assigned_name: assignedName, // Garanti non-null
        department_name: parentTask.department_name, // Hérité du parent
        project_name: parentTask.project_name, // Hérité du parent
        parent_id: parentTaskId,
        task_level: newLevel,
        display_order: displayOrderResult,
        tenant_id: parentTask.tenant_id // Hérité du parent
      };

      console.log('Inserting subtask with data:', newTaskData);

      const { data: newSubtask, error: subtaskError } = await supabase
        .from('tasks')
        .insert([newTaskData])
        .select()
        .single();

      if (subtaskError) {
        console.error('Error inserting subtask:', subtaskError);
        throw subtaskError;
      }

      console.log('Subtask created successfully:', newSubtask);
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
        .update({ assigned_name: assignee })
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
    createMainTask,
    duplicateTask,
    deleteTask,
    toggleAction,
    addActionColumn,
    addDetailedAction,
    createSubTask,
    createSubTaskWithActions,
    updateTaskAssignee,
    updateTaskDates,
    updateTaskStatus
  };
};