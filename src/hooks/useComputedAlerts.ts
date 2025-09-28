import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertType, AlertSolution, AlertInstance } from './useAlerts';

export interface ComputedAlert {
  id: string;
  type: string;
  code: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  context_data?: any;
  triggered_at: string;
  application_domain: 'hr' | 'project';
  recommendations: AlertSolution[];
}

export const useComputedAlerts = () => {
  const [computedAlerts, setComputedAlerts] = useState<ComputedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canViewHRData, setCanViewHRData] = useState(false);

  // Vérifier les permissions directement
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select(`
            *,
            roles:role_id (name)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching user roles:', error);
          return;
        }

        // Les admins ont accès aux données RH
        const hasAdminRole = userRoles?.some(role => 
          ['admin', 'tenant_admin', 'owner'].includes(role.roles.name)
        ) || false;

        setCanViewHRData(hasAdminRole);
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };

    checkPermissions();
  }, []);

  // Récupérer les alertes depuis la vue SQL avec filtrage par permissions
  const calculateCurrentAlerts = async (): Promise<ComputedAlert[]> => {
    try {
      const { data: alerts, error } = await supabase
        .from('current_alerts_view')
        .select('*');

      if (error) {
        console.error('Erreur lors de la récupération des alertes:', error);
        throw error;
      }

      let filteredAlerts = alerts || [];

      // Filtrer selon les permissions
      if (!canViewHRData) {
        filteredAlerts = filteredAlerts.filter(alert => alert.application_domain !== 'hr');
      }

      // Pour les admins, toutes les alertes sont accessibles
      // Pour les non-admins, on pourrait ajouter une logique plus fine plus tard
      const accessibleAlerts = filteredAlerts;

      // Mapper les données de la vue vers le format ComputedAlert
      return accessibleAlerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        code: alert.code,
        title: alert.title,
        description: alert.description,
        severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
        category: alert.category,
        entity_type: alert.entity_type,
        entity_id: alert.entity_id,
        entity_name: alert.entity_name,
        context_data: alert.context_data,
        triggered_at: alert.triggered_at,
        application_domain: alert.application_domain as 'hr' | 'project',
        recommendations: [] // À implémenter si nécessaire
      }));

    } catch (error) {
      console.error('Erreur lors du calcul des alertes:', error);
      throw error;
    }
  };

  const refreshAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const alerts = await calculateCurrentAlerts();
      
      // Trier par sévérité puis par date
      const sortedAlerts = alerts.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        
        return new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime();
      });
      
      setComputedAlerts(sortedAlerts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAlerts();
  }, []);

  // Fonctions utilitaires
  const getActiveAlerts = () => computedAlerts;

  const getHighPriorityAlerts = () => 
    computedAlerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical');

  const getCriticalAlerts = () => 
    computedAlerts.filter(alert => alert.severity === 'critical');

  const getAlertsByCategory = (category: string) => 
    computedAlerts.filter(alert => alert.category === category);

  const getTopAlerts = (limit: number = 4) => 
    computedAlerts.slice(0, limit);

  // Fonctions spécialisées pour filtrer par domaine d'application (utilisant la colonne DB)
  const getHRAlerts = () => 
    computedAlerts.filter(alert => alert.application_domain === 'hr');

  const getHRHighPriorityAlerts = () => 
    getHRAlerts().filter(alert => alert.severity === 'high' || alert.severity === 'critical');

  const getTopHRAlerts = (limit: number = 4) => 
    getHRAlerts().slice(0, limit);

  const getProjectAlerts = () => 
    computedAlerts.filter(alert => alert.application_domain === 'project');

  const getProjectHighPriorityAlerts = () => 
    getProjectAlerts().filter(alert => alert.severity === 'high' || alert.severity === 'critical');

  const getTopProjectAlerts = (limit: number = 4) => 
    getProjectAlerts().slice(0, limit);

  return {
    computedAlerts,
    loading,
    error,
    refreshAlerts,
    getActiveAlerts,
    getHighPriorityAlerts,
    getCriticalAlerts,
    getAlertsByCategory,
    getTopAlerts,
    getHRAlerts,
    getHRHighPriorityAlerts,
    getTopHRAlerts,
    getProjectAlerts,
    getProjectHighPriorityAlerts,
    getTopProjectAlerts
  };
};