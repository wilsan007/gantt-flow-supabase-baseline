import { useComputedAlerts } from './useComputedAlerts';

export const useProjectAlerts = () => {
  const { 
    computedAlerts,
    loading,
    error,
    refreshAlerts,
    getProjectAlerts,
    getProjectHighPriorityAlerts,
    getTopProjectAlerts
  } = useComputedAlerts();

  // Fonctions spécialisées pour la gestion de projet
  const getActiveProjectAlerts = () => getProjectAlerts();
  
  const getProjectAlertsCount = () => getProjectAlerts().length;
  
  const getCriticalProjectAlerts = () => 
    getProjectAlerts().filter(alert => alert.severity === 'critical');
  
  const getProjectAlertsByCategory = (category: string) => 
    getProjectAlerts().filter(alert => alert.category === category);

  // Métriques spécifiques aux projets
  const getProjectMetrics = () => {
    const projectAlerts = getProjectAlerts();
    
    return {
      total: projectAlerts.length,
      critical: projectAlerts.filter(alert => alert.severity === 'critical').length,
      high: projectAlerts.filter(alert => alert.severity === 'high').length,
      medium: projectAlerts.filter(alert => alert.severity === 'medium').length,
      low: projectAlerts.filter(alert => alert.severity === 'low').length,
      deadlineRisks: projectAlerts.filter(alert => alert.type === 'DEADLINE_RISK').length,
      performanceIssues: projectAlerts.filter(alert => alert.type === 'PERFORMANCE_DROP').length
    };
  };

  return {
    // Données de base
    computedAlerts: getProjectAlerts(),
    loading,
    error,
    
    // Actions
    refreshAlerts,
    
    // Fonctions de filtrage
    getActiveProjectAlerts,
    getProjectHighPriorityAlerts,
    getTopProjectAlerts,
    getCriticalProjectAlerts,
    getProjectAlertsByCategory,
    
    // Métriques
    getProjectAlertsCount,
    getProjectMetrics
  };
};