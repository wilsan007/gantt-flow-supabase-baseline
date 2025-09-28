import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdvancedHR } from '@/hooks/useAdvancedHR';
import { useHR } from '@/hooks/useHR';
import { useTasks } from '@/hooks/useTasks';
import { 
  Users, 
  Target, 
  BarChart3, 
  AlertTriangle,
  TrendingUp,
  Building2,
  Calendar
} from 'lucide-react';

interface KPIDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpiType: 'employees' | 'utilization' | 'analytics' | 'alerts' | null;
}

export const KPIDetailDialog = ({ open, onOpenChange, kpiType }: KPIDetailDialogProps) => {
  const { capacityPlanning, employeeInsights, hrAnalytics, loading } = useAdvancedHR();
  const { employees } = useHR();
  const { tasks } = useTasks();

  // Ne pas rendre si en cours de chargement pour éviter les re-renders
  if (loading) {
    return null;
  }

  // Fonction de traduction des métriques
  const translateMetricName = (name: string) => {
    const translations: Record<string, string> = {
      'employee_satisfaction': 'Satisfaction employés',
      'turnover_rate': 'Taux de rotation',
      'productivity_score': 'Score de productivité',
      'attendance_rate': 'Taux de présence',
      'training_completion': 'Completion formation',
      'performance_rating': 'Évaluation performance',
      'engagement_score': 'Score d\'engagement',
      'retention_rate': 'Taux de rétention',
      'absenteeism_rate': 'Taux d\'absentéisme',
      'overtime_hours': 'Heures supplémentaires',
    };
    return translations[name] || name;
  };

  const translateMetricType = (type: string) => {
    const translations: Record<string, string> = {
      'percentage': 'Pourcentage',
      'score': 'Score',
      'rate': 'Taux',
      'hours': 'Heures',
      'count': 'Nombre',
      'ratio': 'Ratio',
      'index': 'Indice',
    };
    return translations[type] || type;
  };

  const renderContent = () => {
    switch (kpiType) {
      case 'employees':
        const uniqueEmployees = Array.from(new Set(capacityPlanning.map(cp => cp.employee_id)));
        const realEmployeeCount = employees.length;
        
        // Calculs pour les tâches
        const assignedEmployees = Array.from(new Set(tasks.map(task => task.assignee))).filter(assignee => assignee);
        const employeesWithTasks = assignedEmployees.length;
        const employeesWithoutTasks = realEmployeeCount - employeesWithTasks;
        const avgTasksPerEmployee = realEmployeeCount > 0 ? Math.round((tasks.length / realEmployeeCount) * 10) / 10 : 0;
        
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Total employés</h4>
                <p className="text-sm text-muted-foreground">Nombre d'employés enregistrés</p>
              </div>
              <div className="text-2xl font-bold text-primary">{realEmployeeCount}</div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Employés avec tâches</h4>
                <p className="text-sm text-muted-foreground">Employés ayant des tâches assignées</p>
              </div>
              <div className="text-2xl font-bold text-success">{employeesWithTasks}</div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Employés sans tâches</h4>
                <p className="text-sm text-muted-foreground">Employés disponibles</p>
              </div>
              <div className="text-2xl font-bold text-warning">{employeesWithoutTasks}</div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Moyenne tâches/employé</h4>
                <p className="text-sm text-muted-foreground">Charge de travail moyenne</p>
              </div>
              <div className="text-2xl font-bold text-info">{avgTasksPerEmployee}</div>
            </div>
          </div>
        );

      case 'utilization':
        const avgUtilization = capacityPlanning.length > 0 
          ? Math.round(capacityPlanning.reduce((sum, cp) => sum + (cp.capacity_utilization || 0), 0) / capacityPlanning.length)
          : 0;
        
        return (
          <div className="space-y-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">{avgUtilization}%</div>
              <p className="text-muted-foreground">Taux d'utilisation moyen</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Détail par période</h4>
                  {capacityPlanning.slice(0, 5).map((cp) => {
                    // Trouver le nom de l'employé correspondant
                    const employee = employees.find(emp => emp.id === cp.employee_id);
                    const employeeName = employee?.full_name || `Employé ${cp.employee_id.slice(0, 8)}...`;
                    
                    return (
                    <div key={cp.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{employeeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {cp.period_start} - {cp.period_end}
                        </div>
                      </div>
                       <div className="text-right">
                         <div className="text-lg font-bold">{cp.capacity_utilization || 0}%</div>
                         <Progress value={cp.capacity_utilization || 0} className="w-20 h-2" />
                       </div>
                     </div>
                   );
                 })}
            </div>
          </div>
        );

      case 'analytics':
        // Éliminer les doublons basés sur le nom de la métrique
        const uniqueMetrics = hrAnalytics.reduce((acc, metric) => {
          const existing = acc.find(m => m.metric_name === metric.metric_name && m.metric_type === metric.metric_type);
          if (!existing) {
            acc.push(metric);
          }
          return acc;
        }, [] as typeof hrAnalytics);

        return (
          <div className="space-y-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">{uniqueMetrics.length}</div>
              <p className="text-muted-foreground">Métriques RH uniques calculées</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Liste complète des métriques</h4>
              {uniqueMetrics.length > 0 ? uniqueMetrics.map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{translateMetricName(metric.metric_name)}</div>
                    <div className="text-sm text-muted-foreground">{translateMetricType(metric.metric_type)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{metric.metric_value}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(metric.calculated_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center p-4 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p>Aucune métrique RH calculée disponible</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'alerts':
        const highRiskInsights = employeeInsights.filter(insight => 
          insight.risk_level === 'high' || insight.risk_level === 'critical'
        );
        
        return (
          <div className="space-y-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-destructive mb-2">{highRiskInsights.length}</div>
              <p className="text-muted-foreground">Alertes critiques détectées</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Détail des alertes</h4>
              {highRiskInsights.map((insight) => (
                <div key={insight.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{insight.insight_type}</span>
                    <Badge variant={
                      insight.risk_level === 'critical' ? 'destructive' : 'default'
                    }>
                      {insight.risk_level}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  {insight.recommendations && (
                    <p className="text-sm text-primary mt-2">💡 {insight.recommendations}</p>
                  )}
                </div>
              ))}
              
              {highRiskInsights.length === 0 && (
                <div className="text-center p-4 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success" />
                  <p>Aucune alerte critique détectée</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <div>Sélectionnez une carte pour voir les détails</div>;
    }
  };

  const getTitle = () => {
    switch (kpiType) {
      case 'employees': return 'Détail - Employés Actifs';
      case 'utilization': return 'Détail - Utilisation Capacité';
      case 'analytics': return 'Détail - Métriques RH';
      case 'alerts': return 'Détail - Alertes IA';
      default: return 'Détails KPI';
    }
  };

  const getIcon = () => {
    switch (kpiType) {
      case 'employees': return <Users className="h-5 w-5" />;
      case 'utilization': return <Target className="h-5 w-5" />;
      case 'analytics': return <BarChart3 className="h-5 w-5" />;
      case 'alerts': return <AlertTriangle className="h-5 w-5" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};