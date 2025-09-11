import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AlertType {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  auto_trigger_conditions?: any;
  created_at: string;
  tenant_id?: string;
}

export interface AlertSolution {
  id: string;
  title: string;
  description: string;
  action_steps?: any;
  effectiveness_score: number;
  implementation_time: 'immediate' | 'short_term' | 'long_term';
  required_roles?: string[];
  cost_level: 'low' | 'medium' | 'high';
  category: string;
  created_at: string;
  tenant_id?: string;
}

export interface AlertInstance {
  id: string;
  alert_type_id: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  context_data?: any;
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
  alert_type?: AlertType;
  recommendations?: AlertInstanceRecommendation[];
}

export interface AlertInstanceRecommendation {
  id: string;
  alert_instance_id: string;
  solution_id: string;
  recommended_score?: number;
  is_primary: boolean;
  tenant_id?: string;
  created_at: string;
  solution?: AlertSolution;
}

export const useAlerts = () => {
  const [alertTypes, setAlertTypes] = useState<AlertType[]>([]);
  const [alertSolutions, setAlertSolutions] = useState<AlertSolution[]>([]);
  const [alertInstances, setAlertInstances] = useState<AlertInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAlertTypes(),
        fetchAlertSolutions(),
        fetchAlertInstances()
      ]);
    } catch (error: any) {
      console.error('Error fetching alerts data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertTypes = async () => {
    const { data, error } = await supabase
      .from('alert_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAlertTypes((data || []) as AlertType[]);
  };

  const fetchAlertSolutions = async () => {
    const { data, error } = await supabase
      .from('alert_solutions')
      .select('*')
      .order('effectiveness_score', { ascending: false });

    if (error) throw error;
    setAlertSolutions((data || []) as AlertSolution[]);
  };

  const fetchAlertInstances = async () => {
    const { data, error } = await supabase
      .from('alert_instances')
      .select(`
        *,
        alert_type:alert_types(*),
        recommendations:alert_instance_recommendations(
          *,
          solution:alert_solutions(*)
        )
      `)
      .order('triggered_at', { ascending: false });

    if (error) throw error;
    setAlertInstances((data || []) as AlertInstance[]);
  };

  const createAlertInstance = async (alertData: Omit<AlertInstance, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('alert_instances')
        .insert([alertData])
        .select()
        .single();

      if (error) throw error;

      // Calculer les recommandations automatiquement
      await supabase.rpc('calculate_alert_recommendations', {
        p_alert_instance_id: data.id
      });

      await fetchAlertInstances();
      return data;
    } catch (error: any) {
      console.error('Error creating alert instance:', error);
      setError(error.message);
      throw error;
    }
  };

  const updateAlertStatus = async (
    id: string, 
    status: 'active' | 'acknowledged' | 'resolved' | 'dismissed',
    resolvedBy?: string
  ) => {
    try {
      const updates: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'acknowledged') {
        updates.acknowledged_at = new Date().toISOString();
      } else if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        if (resolvedBy) {
          updates.resolved_by = resolvedBy;
        }
      }

      const { error } = await supabase
        .from('alert_instances')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchAlertInstances();
    } catch (error: any) {
      console.error('Error updating alert status:', error);
      setError(error.message);
      throw error;
    }
  };

  const getActiveAlerts = () => {
    return alertInstances.filter(alert => alert.status === 'active');
  };

  const getHighPriorityAlerts = () => {
    return alertInstances.filter(
      alert => 
        alert.status === 'active' && 
        (alert.severity === 'high' || alert.severity === 'critical')
    );
  };

  const getAlertsByCategory = (category: string) => {
    return alertInstances.filter(
      alert => alert.alert_type?.category === category
    );
  };

  const initializeAlertData = async () => {
    try {
      setLoading(true);
      
      // Vérifier si des données existent déjà
      const { data: existingTypes } = await supabase
        .from('alert_types')
        .select('id')
        .limit(1);

      if (existingTypes && existingTypes.length > 0) {
        console.log('Alert data already initialized');
        return;
      }

      // Insérer les types d'alertes
      const alertTypesToInsert = [
        { code: 'WORKLOAD_HIGH', name: 'Surcharge de travail', description: 'Employé avec une charge de travail excessive', category: 'capacity', severity: 'high' },
        { code: 'ABSENCE_PATTERN', name: 'Pattern d\'absences anormal', description: 'Augmentation significative des absences', category: 'hr', severity: 'medium' },
        { code: 'PERFORMANCE_DROP', name: 'Baisse de performance', description: 'Diminution notable des performances', category: 'performance', severity: 'medium' },
        { code: 'DEADLINE_RISK', name: 'Risque d\'échéance', description: 'Projet en retard ou à risque', category: 'project', severity: 'high' },
        { code: 'TEAM_TURNOVER', name: 'Rotation d\'équipe élevée', description: 'Turnover anormalement élevé', category: 'hr', severity: 'critical' },
        // ... Ajouter les 45 autres types d'alertes
      ];

      await supabase.from('alert_types').insert(alertTypesToInsert);

      // Insérer les solutions
      const solutionsToInsert = [
        { title: 'Redistribution des tâches', description: 'Répartir les tâches vers d\'autres membres', category: 'capacity', implementation_time: 'immediate', effectiveness_score: 85 },
        { title: 'Planification d\'entretien individuel', description: 'Organiser un entretien pour comprendre les causes', category: 'hr', implementation_time: 'short_term', effectiveness_score: 75 },
        { title: 'Formation ciblée', description: 'Proposer une formation adaptée aux besoins', category: 'performance', implementation_time: 'long_term', effectiveness_score: 70 },
        { title: 'Extension de délai', description: 'Négocier une extension du délai avec le client', category: 'project', implementation_time: 'immediate', effectiveness_score: 60 },
        { title: 'Plan de rétention', description: 'Mise en place d\'un plan de rétention des talents', category: 'hr', implementation_time: 'long_term', effectiveness_score: 80 },
        // ... Ajouter les 90 autres solutions
      ];

      await supabase.from('alert_solutions').insert(solutionsToInsert);

      await fetchAllData();
    } catch (error: any) {
      console.error('Error initializing alert data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    alertTypes,
    alertSolutions,
    alertInstances,
    loading,
    error,
    refetch: fetchAllData,
    createAlertInstance,
    updateAlertStatus,
    getActiveAlerts,
    getHighPriorityAlerts,
    getAlertsByCategory,
    initializeAlertData
  };
};