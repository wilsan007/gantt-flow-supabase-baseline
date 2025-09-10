import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OnboardingProcess {
  id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  department: string;
  start_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface OnboardingTask {
  id: string;
  process_id: string;
  title: string;
  responsible: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
  category: 'rh' | 'it' | 'manager' | 'employee';
  description?: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface OffboardingProcess {
  id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  department: string;
  last_work_day: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  progress: number;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface OffboardingTask {
  id: string;
  process_id: string;
  title: string;
  responsible: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
  category: 'rh' | 'it' | 'manager' | 'employee';
  description?: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export const useOnboardingOffboarding = () => {
  const [onboardingProcesses, setOnboardingProcesses] = useState<OnboardingProcess[]>([]);
  const [offboardingProcesses, setOffboardingProcesses] = useState<OffboardingProcess[]>([]);
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([]);
  const [offboardingTasks, setOffboardingTasks] = useState<OffboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [onboardingRes, offboardingRes, onboardingTasksRes, offboardingTasksRes] = await Promise.all([
        supabase.from('onboarding_processes').select('*').order('created_at', { ascending: false }),
        supabase.from('offboarding_processes').select('*').order('created_at', { ascending: false }),
        supabase.from('onboarding_tasks').select('*').order('due_date'),
        supabase.from('offboarding_tasks').select('*').order('due_date')
      ]);

      if (onboardingRes.error) throw onboardingRes.error;
      if (offboardingRes.error) throw offboardingRes.error;
      if (onboardingTasksRes.error) throw onboardingTasksRes.error;
      if (offboardingTasksRes.error) throw offboardingTasksRes.error;

      setOnboardingProcesses(onboardingRes.data as OnboardingProcess[] || []);
      setOffboardingProcesses(offboardingRes.data as OffboardingProcess[] || []);
      setOnboardingTasks(onboardingTasksRes.data as OnboardingTask[] || []);
      setOffboardingTasks(offboardingTasksRes.data as OffboardingTask[] || []);
    } catch (err: any) {
      console.error('Error fetching onboarding/offboarding data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createOnboardingProcess = async (data: Omit<OnboardingProcess, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('onboarding_processes')
        .insert(data);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Processus d'onboarding créé avec succès"
      });

      fetchData();
    } catch (err: any) {
      console.error('Error creating onboarding process:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer le processus d'onboarding",
        variant: "destructive"
      });
    }
  };

  const createOffboardingProcess = async (data: Omit<OffboardingProcess, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('offboarding_processes')
        .insert(data);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Processus d'offboarding créé avec succès"
      });

      fetchData();
    } catch (err: any) {
      console.error('Error creating offboarding process:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer le processus d'offboarding",
        variant: "destructive"
      });
    }
  };

  const updateTaskStatus = async (taskId: string, status: 'pending' | 'completed' | 'overdue', isOnboarding: boolean) => {
    try {
      const table = isOnboarding ? 'onboarding_tasks' : 'offboarding_tasks';
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Statut de la tâche mis à jour"
      });

      fetchData();
    } catch (err: any) {
      console.error('Error updating task status:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la tâche",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    onboardingProcesses,
    offboardingProcesses,
    onboardingTasks,
    offboardingTasks,
    loading,
    error,
    refetch: fetchData,
    createOnboardingProcess,
    createOffboardingProcess,
    updateTaskStatus
  };
};