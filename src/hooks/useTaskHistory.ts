import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TaskHistoryEntry {
  id: string;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by?: string;
  changed_at: string;
  user_email?: string;
  metadata?: any;
}

export interface RecentActivity {
  task_id: string;
  task_title: string;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by?: string;
  changed_at: string;
  user_email?: string;
}

export const useTaskHistory = (taskId?: string) => {
  const [history, setHistory] = useState<TaskHistoryEntry[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer l'historique d'une tâche spécifique
  const fetchTaskHistory = async (id: string) => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: historyError } = await supabase.rpc('get_task_history', {
        p_task_id: id
      });

      if (historyError) throw historyError;

      setHistory(data || []);
    } catch (err: any) {
      console.error('Error fetching task history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les activités récentes
  const fetchRecentActivities = async (limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: activitiesError } = await supabase.rpc('get_recent_task_activities', {
        p_limit: limit
      });

      if (activitiesError) throw activitiesError;

      setRecentActivities(data || []);
    } catch (err: any) {
      console.error('Error fetching recent activities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Enregistrer une modification manuelle
  const logTaskChange = async (
    taskId: string,
    actionType: string,
    fieldName?: string,
    oldValue?: string,
    newValue?: string,
    metadata?: any
  ) => {
    try {
      const { data, error } = await supabase.rpc('log_task_change', {
        p_task_id: taskId,
        p_action_type: actionType,
        p_field_name: fieldName,
        p_old_value: oldValue,
        p_new_value: newValue,
        p_metadata: metadata || {}
      });

      if (error) throw error;

      // Rafraîchir l'historique si on affiche cette tâche
      if (taskId === taskId) {
        await fetchTaskHistory(taskId);
      }

      return data;
    } catch (err: any) {
      console.error('Error logging task change:', err);
      throw err;
    }
  };

  // Formater le message d'historique pour l'affichage
  const formatHistoryMessage = (entry: TaskHistoryEntry): string => {
    const { action_type, field_name, old_value, new_value } = entry;

    switch (action_type) {
      case 'created':
        return 'Tâche créée';
      
      case 'deleted':
        return 'Tâche supprimée';
      
      case 'status_changed':
        return `Statut changé de "${old_value}" à "${new_value}"`;
      
      case 'updated':
        switch (field_name) {
          case 'title':
            return `Titre modifié: "${old_value}" → "${new_value}"`;
          case 'assigned_name':
            return `Responsable changé: "${old_value || 'Non assigné'}" → "${new_value || 'Non assigné'}"`;
          case 'priority':
            return `Priorité changée: "${old_value}" → "${new_value}"`;
          case 'start_date':
            return `Date de début modifiée: ${old_value} → ${new_value}`;
          case 'due_date':
            return `Date d'échéance modifiée: ${old_value} → ${new_value}`;
          case 'progress':
            return `Progression modifiée: ${old_value}% → ${new_value}%`;
          case 'effort_estimate_h':
            return `Charge estimée modifiée: ${old_value}h → ${new_value}h`;
          case 'description':
            return 'Description modifiée';
          default:
            return `${field_name} modifié: "${old_value}" → "${new_value}"`;
        }
      
      default:
        return `Action: ${action_type}`;
    }
  };

  // Obtenir l'icône pour le type d'action
  const getActionIcon = (actionType: string): string => {
    switch (actionType) {
      case 'created':
        return '✨';
      case 'deleted':
        return '🗑️';
      case 'status_changed':
        return '🔄';
      case 'updated':
        return '✏️';
      default:
        return '📝';
    }
  };

  // Obtenir la couleur pour le type d'action
  const getActionColor = (actionType: string): string => {
    switch (actionType) {
      case 'created':
        return 'text-green-600';
      case 'deleted':
        return 'text-red-600';
      case 'status_changed':
        return 'text-blue-600';
      case 'updated':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  // Effet pour charger l'historique quand taskId change
  useEffect(() => {
    if (taskId) {
      fetchTaskHistory(taskId);
    }
  }, [taskId]);

  // Configuration du temps réel pour l'historique
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`task_history_${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_history',
          filter: `task_id=eq.${taskId}`
        },
        (payload) => {
          // console.log('Task history change detected:', payload);
          // Rafraîchir l'historique
          fetchTaskHistory(taskId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  return {
    history,
    recentActivities,
    loading,
    error,
    fetchTaskHistory,
    fetchRecentActivities,
    logTaskChange,
    formatHistoryMessage,
    getActionIcon,
    getActionColor
  };
};

// Hook spécialisé pour les activités récentes globales
export const useRecentActivities = (limit: number = 50) => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: activitiesError } = await supabase.rpc('get_recent_task_activities', {
        p_limit: limit
      });

      if (activitiesError) throw activitiesError;

      setActivities(data || []);
    } catch (err: any) {
      console.error('Error fetching recent activities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Configuration du temps réel pour les activités
  useEffect(() => {
    const channel = supabase
      .channel('recent_activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_history'
        },
        (payload) => {
          // console.log('New activity detected:', payload);
          // Rafraîchir les activités
          fetchActivities();
        }
      )
      .subscribe();

    // Charger les activités initiales
    fetchActivities();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities
  };
};
