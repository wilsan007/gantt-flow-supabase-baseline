import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TaskDependency, DependencyType } from '@/types/taskDependencies';
import { useToast } from '@/hooks/use-toast';

export function useTaskDependencies() {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Charger les dépendances
  const loadDependencies = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('task_dependencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setDependencies(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors du chargement des dépendances:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Créer une dépendance
  const createDependency = async (
    predecessorTaskId: string,
    successorTaskId: string,
    dependencyType: DependencyType,
    lagDays: number = 0
  ): Promise<boolean> => {
    try {
      // Vérifier qu'on ne crée pas une dépendance sur soi-même
      if (predecessorTaskId === successorTaskId) {
        toast({
          title: 'Erreur',
          description: 'Une tâche ne peut pas dépendre d\'elle-même',
          variant: 'destructive',
        });
        return false;
      }

      // Vérifier qu'une dépendance similaire n'existe pas déjà
      const existing = dependencies.find(
        (d) =>
          d.depends_on_task_id === predecessorTaskId &&
          d.task_id === successorTaskId &&
          d.dependency_type === dependencyType
      );

      if (existing) {
        toast({
          title: 'Dépendance existante',
          description: 'Cette dépendance existe déjà',
          variant: 'destructive',
        });
        return false;
      }

      // Créer la dépendance
      const { data, error: createError } = await supabase
        .from('task_dependencies')
        .insert({
          depends_on_task_id: predecessorTaskId, // La tâche dont on dépend
          task_id: successorTaskId, // La tâche qui dépend
          dependency_type: dependencyType,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Ajouter à l'état local
      if (data) {
        setDependencies((prev) => [data, ...prev]);
        toast({
          title: 'Dépendance créée',
          description: 'La dépendance entre les tâches a été créée avec succès',
        });
      }

      return true;
    } catch (err: any) {
      console.error('Erreur lors de la création de la dépendance:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de créer la dépendance',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Supprimer une dépendance
  const deleteDependency = async (dependencyId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (deleteError) throw deleteError;

      // Supprimer de l'état local
      setDependencies((prev) => prev.filter((d) => d.id !== dependencyId));
      
      toast({
        title: 'Dépendance supprimée',
        description: 'La dépendance a été supprimée avec succès',
      });

      return true;
    } catch (err: any) {
      console.error('Erreur lors de la suppression de la dépendance:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de supprimer la dépendance',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Obtenir les dépendances d'une tâche
  const getTaskDependencies = (taskId: string) => {
    return {
      predecessors: dependencies.filter((d) => d.task_id === taskId),
      successors: dependencies.filter((d) => d.depends_on_task_id === taskId),
    };
  };

  // Vérifier si une dépendance créerait un cycle
  const wouldCreateCycle = (
    predecessorTaskId: string,
    successorTaskId: string
  ): boolean => {
    // Parcourir le graphe pour détecter les cycles
    const visited = new Set<string>();
    const stack = [successorTaskId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      
      if (current === predecessorTaskId) {
        return true; // Cycle détecté
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      // Ajouter les successeurs de la tâche courante
      const successors = dependencies
        .filter((d) => d.depends_on_task_id === current)
        .map((d) => d.task_id);

      stack.push(...successors);
    }

    return false;
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  return {
    dependencies,
    loading,
    error,
    createDependency,
    deleteDependency,
    getTaskDependencies,
    wouldCreateCycle,
    refresh: loadDependencies,
  };
}
