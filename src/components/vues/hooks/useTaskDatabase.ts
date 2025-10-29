import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type Task, type TaskAction } from '@/hooks/optimized';
// import { usePermissionFilters } from './usePermissionFilters'; // TODO: À créer si nécessaire

export const useTaskDatabase = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { filterTasksByPermissions } = usePermissionFilters(); // Désactivé temporairement
  
  // Éviter les requêtes multiples simultanées
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);

  const fetchTasks = async () => {
    // Éviter les requêtes simultanées
    if (fetchingRef.current) {
      console.log('📋 Fetch tasks - Requête déjà en cours, ignorée');
      return;
    }

    // Éviter les requêtes trop fréquentes (debounce de 1 seconde)
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) {
      console.log('📋 Fetch tasks - Requête trop récente, ignorée');
      return;
    }
    try {
      fetchingRef.current = true;
      lastFetchRef.current = now;
      setLoading(true);
      setError(null);
      
      // Log de l'utilisateur connecté
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📋 Fetch tasks - Utilisateur:', session?.user ? {
        id: session.user.id,
        email: session.user.email
      } : 'Non connecté');
      
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('display_order', { ascending: true });

      console.log('📋 Tasks query result:', {
        error: tasksError,
        count: tasksData?.length || 0,
        data: tasksData?.slice(0, 2) // Afficher les 2 premiers pour debug
      });

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

        // Filtrer les tâches selon les permissions de l'utilisateur
        // const filteredTasks = await filterTasksByPermissions(tasksWithActions); // Désactivé temporairement
        setTasks(tasksWithActions); // Utilisation directe sans filtrage pour l'instant
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const setupRealtimeSubscription = () => {
    const tasksSubscription = supabase
      .channel('tasks_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        console.log('📋 Realtime - Changement détecté dans tasks');
        setTimeout(() => fetchTasks(), 500); // Debounce de 500ms
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_actions' }, () => {
        console.log('📋 Realtime - Changement détecté dans task_actions');
        setTimeout(() => fetchTasks(), 500); // Debounce de 500ms
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_history' }, () => {
        console.log('📋 Realtime - Changement détecté dans task_history');
        // Pas besoin de refetch les tâches pour l'historique, juste un log
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