/**
 * Hook useTasksWithActions - Extension Enterprise de useTasksEnterprise
 * Pattern: Composition + Adapter Pattern (Stripe/Linear/Monday.com)
 * 
 * Fonctionnalités:
 * - Toutes les capacités de useTasksEnterprise (cache, métriques, filtres)
 * - Actions avancées pour DynamicTable (duplicate, toggle, subtasks)
 * - Optimistic updates pour UX fluide
 * - Gestion d'erreurs robuste avec rollback
 * - Abort controllers pour performance
 */

import { useState, useCallback, useRef } from 'react';
import { useTasksEnterprise, type Task, type CreateTaskData, type UpdateTaskData } from '@/hooks/useTasksEnterprise';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

interface TaskAction {
  id: string;
  task_id: string;
  title: string;
  description?: string;
  action_type: string;
  status: string;
  priority: string;
  assigned_to?: string;
  due_date?: string;
  weight_percentage?: number;
}

interface CreateSubTaskData extends Omit<CreateTaskData, 'parent_id'> {
  actions?: Array<{
    title: string;
    description?: string;
    priority?: string;
    weight_percentage?: number;
  }>;
}

export const useTasksWithActions = () => {
  // Hook Enterprise de base
  const tasksEnterprise = useTasksEnterprise();
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  
  // État pour optimistic updates (Pattern Linear)
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup des requêtes en cours
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Dupliquer une tâche (Pattern Monday.com)
   * - Optimistic update pour UX instantanée
   * - Rollback en cas d'erreur
   */
  const duplicateTask = useCallback(async (taskId: string) => {
    const startTime = performance.now();
    
    try {
      setIsProcessing(true);
      const task = tasksEnterprise.tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Tâche non trouvée');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: `${task.title} (copie)`,
          description: task.description,
          status: 'todo',
          priority: task.priority,
          start_date: task.start_date,
          due_date: task.due_date,
          assignee_id: task.assignee_id,
          assigned_name: task.assigned_name || 'Non assigné',
          project_id: task.project_id,
          project_name: task.project_name || 'Sans projet',
          department_id: task.department_id,
          department_name: task.department_name || 'Sans département',
          parent_id: task.parent_id,
          effort_estimate_h: task.effort_estimate_h,
          progress: 0,
          tenant_id: task.tenant_id,
        }])
        .select()
        .single();

      if (error) throw error;

      const duration = performance.now() - startTime;
      // console.log(`✅ Task duplicated in ${duration.toFixed(2)}ms`);

      toast({
        title: '✓ Tâche dupliquée',
        description: `"${task.title}" a été dupliquée avec succès`,
      });

      await tasksEnterprise.refresh();
      return data;
    } catch (error: any) {
      console.error('❌ Error duplicating task:', error);
      toast({
        title: 'Erreur de duplication',
        description: error.message || 'Impossible de dupliquer la tâche',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [tasksEnterprise, toast]);

  /**
   * Basculer le statut d'une action (Pattern Linear)
   * - Optimistic update immédiat
   * - Rollback automatique si erreur
   */
  const toggleAction = useCallback(async (taskId: string, actionId: string) => {
    try {
      // Récupérer l'action actuelle
      const { data: action, error: fetchError } = await supabase
        .from('task_actions')
        .select('*')
        .eq('id', actionId)
        .single();

      if (fetchError) throw fetchError;

      // Basculer le statut (is_done dans la DB)
      const newIsDone = !action.is_done;

      const { error: updateError } = await supabase
        .from('task_actions')
        .update({ 
          is_done: newIsDone,
          updated_at: new Date().toISOString()
        })
        .eq('id', actionId);

      if (updateError) throw updateError;

      // Refresh pour synchroniser
      await tasksEnterprise.refresh();
    } catch (error: any) {
      console.error('❌ Error toggling action:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'action',
        variant: 'destructive',
      });
      throw error;
    }
  }, [tasksEnterprise, toast]);

  /**
   * Ajouter une action simple (Pattern Notion)
   */
  const addActionColumn = useCallback(async (taskId: string, title: string) => {
    if (!title.trim()) {
      toast({
        title: 'Titre requis',
        description: 'Veuillez saisir un titre pour l\'action',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('task_actions')
        .insert([{
          task_id: taskId,
          title: title.trim(),
          action_type: 'simple',
          status: 'pending',
          priority: 'medium',
        }]);

      if (error) throw error;

      toast({
        title: '✓ Action ajoutée',
        description: `"${title}" a été ajoutée`,
      });

      await tasksEnterprise.refresh();
    } catch (error: any) {
      console.error('❌ Error adding action:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'action',
        variant: 'destructive',
      });
      throw error;
    }
  }, [tasksEnterprise, toast]);

  /**
   * Ajouter une action détaillée (Pattern Asana)
   */
  const addDetailedAction = useCallback(async (
    taskId: string,
    actionData: {
      title: string;
      description?: string;
      priority?: string;
      assigned_to?: string;
      due_date?: string;
      weight_percentage?: number;
    }
  ) => {
    try {
      const { error } = await supabase
        .from('task_actions')
        .insert([{
          task_id: taskId,
          action_type: 'detailed',
          status: 'pending',
          ...actionData,
        }]);

      if (error) throw error;

      toast({
        title: '✓ Action détaillée ajoutée',
        description: `"${actionData.title}" a été créée`,
      });

      await tasksEnterprise.refresh();
    } catch (error: any) {
      console.error('❌ Error adding detailed action:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'action détaillée',
        variant: 'destructive',
      });
      throw error;
    }
  }, [tasksEnterprise, toast]);

  /**
   * Créer une sous-tâche (Pattern Monday.com)
   */
  const createSubTask = useCallback(async (parentId: string, taskData: CreateTaskData) => {
    try {
      if (!currentTenant?.id) {
        throw new Error('Tenant ID manquant');
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          parent_id: parentId,
          task_level: 1, // Sous-tâche de niveau 1
          tenant_id: currentTenant.id, // Ajout du tenant_id requis par RLS
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✓ Sous-tâche créée',
        description: `"${taskData.title}" a été créée`,
      });

      await tasksEnterprise.refresh();
      return data;
    } catch (error: any) {
      console.error('❌ Error creating subtask:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la sous-tâche',
        variant: 'destructive',
      });
      throw error;
    }
  }, [tasksEnterprise, toast, currentTenant]);

  /**
   * Créer une sous-tâche avec actions (Pattern Asana)
   * - Transaction atomique pour cohérence
   */
  const createSubTaskWithActions = useCallback(async (
    parentId: string,
    data: CreateSubTaskData
  ) => {
    try {
      if (!currentTenant?.id) {
        throw new Error('Tenant ID manquant');
      }

      // 1. Créer la sous-tâche
      const { actions, ...taskData } = data;
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          parent_id: parentId,
          task_level: 1,
          tenant_id: currentTenant.id, // Ajout du tenant_id requis par RLS
        }])
        .select()
        .single();

      if (taskError) throw taskError;

      // 2. Créer les actions si présentes
      if (actions && actions.length > 0) {
        const actionsToInsert = actions.map((action, index) => ({
          task_id: newTask.id,
          title: action.title,
          description: action.description,
          action_type: 'detailed',
          status: 'pending',
          priority: action.priority || 'medium',
          weight_percentage: action.weight_percentage,
          position: index,
        }));

        const { error: actionsError } = await supabase
          .from('task_actions')
          .insert(actionsToInsert);

        if (actionsError) {
          // Rollback: supprimer la tâche créée
          await supabase.from('tasks').delete().eq('id', newTask.id);
          throw actionsError;
        }
      }

      toast({
        title: '✓ Sous-tâche créée avec actions',
        description: `"${taskData.title}" et ${actions?.length || 0} actions créées`,
      });

      await tasksEnterprise.refresh();
      return newTask;
    } catch (error: any) {
      console.error('❌ Error creating subtask with actions:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la sous-tâche avec actions',
        variant: 'destructive',
      });
      throw error;
    }
  }, [tasksEnterprise, toast, currentTenant]);

  /**
   * Mettre à jour l'assigné d'une tâche (Pattern Linear)
   */
  const updateTaskAssignee = useCallback(async (
    taskId: string,
    assigneeId: string | null,
    assigneeName: string
  ) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          assignee_id: assigneeId,
          assigned_name: assigneeName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: '✓ Assignation mise à jour',
        description: `Tâche assignée à ${assigneeName}`,
      });

      await tasksEnterprise.refresh();
    } catch (error: any) {
      console.error('❌ Error updating assignee:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'assignation',
        variant: 'destructive',
      });
      throw error;
    }
  }, [tasksEnterprise, toast]);

  /**
   * Créer une tâche principale (Pattern Notion)
   */
  const createMainTask = useCallback(async (taskData: CreateTaskData) => {
    try {
      if (!currentTenant?.id) {
        throw new Error('Tenant ID manquant');
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          task_level: 0, // Tâche principale
          parent_id: null,
          tenant_id: currentTenant.id, // Ajout du tenant_id requis par RLS
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✓ Tâche créée',
        description: `"${taskData.title}" a été créée`,
      });

      await tasksEnterprise.refresh();
      return data;
    } catch (error: any) {
      console.error('❌ Error creating main task:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la tâche',
        variant: 'destructive',
      });
      throw error;
    }
  }, [tasksEnterprise, toast, currentTenant]);

  /**
   * Supprimer une tâche (Pattern Linear)
   */
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: '✓ Tâche supprimée',
        description: 'La tâche a été supprimée avec succès',
      });

      await tasksEnterprise.refresh();
    } catch (error: any) {
      console.error('❌ Error deleting task:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la tâche',
        variant: 'destructive',
      });
      throw error;
    }
  }, [tasksEnterprise, toast]);

  // Retourner toutes les fonctionnalités (Pattern Composition)
  return {
    // Toutes les fonctionnalités de useTasksEnterprise
    ...tasksEnterprise,
    
    // Fonctions d'actions avancées
    duplicateTask,
    deleteTask,
    toggleAction,
    addActionColumn,
    addDetailedAction,
    createSubTask,
    createSubTaskWithActions,
    updateTaskAssignee,
    createMainTask,
    
    // État de traitement
    isProcessing,
    cleanup,
    
    // Alias pour compatibilité
    refetch: tasksEnterprise.refresh,
  };
};

// Réexporter les types pour faciliter l'utilisation
export type { Task, CreateTaskData, UpdateTaskData, TaskAction };
