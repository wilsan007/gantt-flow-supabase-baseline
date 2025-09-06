import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TaskAuditLog {
  id: string;
  task_id: string;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  description: string;
  user_id?: string;
  user_name?: string;
  created_at: string;
  tenant_id?: string;
  related_entity_id?: string;
  related_entity_type?: string;
}

export const useTaskAuditLogs = (taskId?: string) => {
  const [auditLogs, setAuditLogs] = useState<TaskAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setAuditLogs([]);
      return;
    }

    const fetchAuditLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: auditError } = await supabase
          .from('task_audit_logs')
          .select('*')
          .eq('task_id', taskId)
          .order('created_at', { ascending: false });

        if (auditError) {
          console.error('Error fetching audit logs:', auditError);
          setError('Erreur lors du chargement de l\'historique');
          return;
        }

        setAuditLogs(data || []);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setError('Erreur lors du chargement de l\'historique');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [taskId]);

  return {
    auditLogs,
    loading,
    error
  };
};