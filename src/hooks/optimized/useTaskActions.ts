/**
 * Hook Task Actions - Actions CRUD sur les tâches
 * Single Responsibility : Mutations uniquement
 * Max 200 lignes
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Task } from './useTasksOptimized';

export interface CreateTaskData {
  title: string;
  description?: string;
  status: Task['status'];
  priority: Task['priority'];
  start_date: string;
  due_date: string;
  assignee_id?: string;
  project_id?: string;
  parent_task_id?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  progress?: number;
}

export const useTaskActions = () => {
  const { toast } = useToast();

  const createTask = useCallback(async (data: CreateTaskData) => {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Tâche créée avec succès"
      });

      return task as Task;
    } catch (err: any) {
      console.error('Error creating task:', err);
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  const updateTask = useCallback(async (id: string, updates: UpdateTaskData) => {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Tâche mise à jour"
      });

      return task as Task;
    } catch (err: any) {
      console.error('Error updating task:', err);
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Tâche supprimée"
      });
    } catch (err: any) {
      console.error('Error deleting task:', err);
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  const duplicateTask = useCallback(async (id: string) => {
    try {
      // Récupérer la tâche originale
      const { data: original, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Créer une copie
      const { id: _, created_at, updated_at, ...taskData } = original;
      const duplicate = {
        ...taskData,
        title: `${taskData.title} (Copie)`
      };

      const { data: newTask, error: createError } = await supabase
        .from('tasks')
        .insert([duplicate])
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: "Succès",
        description: "Tâche dupliquée"
      });

      return newTask as Task;
    } catch (err: any) {
      console.error('Error duplicating task:', err);
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  const updateTaskStatus = useCallback(async (id: string, status: Task['status']) => {
    return updateTask(id, { status });
  }, [updateTask]);

  const updateTaskProgress = useCallback(async (id: string, progress: number) => {
    return updateTask(id, { progress });
  }, [updateTask]);

  return {
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    updateTaskStatus,
    updateTaskProgress
  };
};
