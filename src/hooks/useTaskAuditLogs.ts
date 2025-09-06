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

  const fetchAuditLogs = async () => {
    if (!taskId) {
      setAuditLogs([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('task_audit_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAuditLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [taskId]);

  return {
    auditLogs,
    loading,
    error,
    refetch: fetchAuditLogs
  };
};