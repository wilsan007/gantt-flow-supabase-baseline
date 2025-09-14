import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Task } from './useTasks';

export interface CreateTaskData {
  title: string;
  assignee_id?: string;
  start_date: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'doing' | 'blocked' | 'done';
  effort_estimate_h: number;
  parent_id?: string;
  project_id?: string;
  department_id?: string;
  description?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  id: string;
  progress?: number;
}

export const useTaskCRUD = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createTask = async (taskData: CreateTaskData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          task_level: taskData.parent_id ? 1 : 0,
          progress: 0,
          assigned_name: 'Non Assigné',
          department_name: 'Aucun Département',
          project_name: 'Aucun Projet'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Tâche créée avec succès'
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la création: ${error.message}`,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskData: UpdateTaskData) => {
    setLoading(true);
    try {
      const { id, ...updateData } = taskData;
      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Tâche mise à jour avec succès'
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la mise à jour: ${error.message}`,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Tâche supprimée avec succès'
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const duplicateTask = async (task: Task) => {
    const duplicateData: CreateTaskData = {
      title: `${task.title} (Copie)`,
      assignee_id: undefined,
      start_date: task.start_date,
      due_date: task.due_date,
      priority: task.priority,
      status: 'todo',
      effort_estimate_h: task.effort_estimate_h,
      parent_id: task.parent_id,
      project_id: task.project_id
    };

    return createTask(duplicateData);
  };

  const assignTask = async (taskId: string, assigneeId: string) => {
    return updateTask({ id: taskId, assignee_id: assigneeId });
  };

  const changeTaskStatus = async (taskId: string, status: 'todo' | 'doing' | 'blocked' | 'done') => {
    return updateTask({ id: taskId, status });
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    return updateTask({ id: taskId, progress });
  };

  return {
    loading,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    assignTask,
    changeTaskStatus,
    updateTaskProgress
  };
};