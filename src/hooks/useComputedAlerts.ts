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
  recommendations: AlertSolution[];
}

export const useComputedAlerts = () => {
  const [computedAlerts, setComputedAlerts] = useState<ComputedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculer les alertes basées sur l'état actuel des données
  const calculateCurrentAlerts = async (): Promise<ComputedAlert[]> => {
    const alerts: ComputedAlert[] = [];
    const now = new Date().toISOString();

    try {
      // 1. Alertes de surcharge de travail
      const { data: employees } = await supabase
        .from('employees')
        .select('*, tasks:tasks!assignee_id(count)')
        .eq('status', 'active');

      employees?.forEach(employee => {
        const taskCount = employee.tasks?.[0]?.count || 0;
        if (taskCount > 15) { // Seuil configurable
          alerts.push({
            id: `workload-${employee.id}`,
            type: 'WORKLOAD_HIGH',
            code: 'WORKLOAD_HIGH',
            title: 'Surcharge de travail détectée',
            description: `${employee.full_name} a ${taskCount} tâches assignées`,
            severity: taskCount > 25 ? 'critical' : taskCount > 20 ? 'high' : 'medium',
            category: 'capacity',
            entity_type: 'employee',
            entity_id: employee.id,
            entity_name: employee.full_name,
            context_data: { taskCount, threshold: 15 },
            triggered_at: now,
            recommendations: []
          });
        }
      });

      // 2. Alertes d'absences anormales
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: recentAbsences } = await supabase
        .from('absences')
        .select('employee_id, employees(full_name), total_days')
        .gte('start_date', thirtyDaysAgo)
        .eq('status', 'approved');

      const absencesByEmployee = recentAbsences?.reduce((acc, absence) => {
        const key = absence.employee_id;
        if (!acc[key]) {
          acc[key] = { 
            employee_name: absence.employees?.full_name,
            total_days: 0,
            count: 0
          };
        }
        acc[key].total_days += Number(absence.total_days);
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, { employee_name: string; total_days: number; count: number }>) || {};

      Object.entries(absencesByEmployee).forEach(([employeeId, data]) => {
        if (data.total_days > 10 || data.count > 5) { // Seuils configurables
          alerts.push({
            id: `absence-${employeeId}`,
            type: 'ABSENCE_PATTERN',
            code: 'ABSENCE_PATTERN',
            title: 'Pattern d\'absences anormal',
            description: `${data.employee_name} a ${data.total_days} jours d'absence en 30 jours`,
            severity: data.total_days > 20 ? 'high' : 'medium',
            category: 'hr',
            entity_type: 'employee',
            entity_id: employeeId,
            entity_name: data.employee_name,
            context_data: { totalDays: data.total_days, absenceCount: data.count },
            triggered_at: now,
            recommendations: []
          });
        }
      });

      // 3. Alertes de retard de projets
      const { data: lateTasks } = await supabase
        .from('tasks')
        .select('*, employees(full_name)')
        .lt('due_date', new Date().toISOString().split('T')[0])
        .neq('status', 'done')
        .is('parent_id', null); // Seulement les tâches principales

      lateTasks?.forEach(task => {
        const daysLate = Math.floor((Date.now() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `late-task-${task.id}`,
          type: 'DEADLINE_RISK',
          code: 'DEADLINE_RISK',
          title: 'Tâche en retard',
          description: `"${task.title}" est en retard de ${daysLate} jour(s)`,
          severity: daysLate > 14 ? 'critical' : daysLate > 7 ? 'high' : 'medium',
          category: 'project',
          entity_type: 'task',
          entity_id: task.id,
          entity_name: task.title,
          context_data: { daysLate, dueDate: task.due_date },
          triggered_at: now,
          recommendations: []
        });
      });

      // 4. Alertes de performance (tâches bloquées depuis longtemps)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: stuckTasks } = await supabase
        .from('tasks')
        .select('*, employees(full_name)')
        .eq('status', 'doing')
        .lt('updated_at', sevenDaysAgo)
        .lt('progress', 50);

      stuckTasks?.forEach(task => {
        const daysSinceUpdate = Math.floor((Date.now() - new Date(task.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `stuck-task-${task.id}`,
          type: 'PERFORMANCE_DROP',
          code: 'PERFORMANCE_DROP',
          title: 'Tâche bloquée',
          description: `"${task.title}" (${task.progress}%) n'a pas progressé depuis ${daysSinceUpdate} jours`,
          severity: daysSinceUpdate > 14 ? 'high' : 'medium',
          category: 'performance',
          entity_type: 'task',
          entity_id: task.id,
          entity_name: task.title,
          context_data: { daysSinceUpdate, progress: task.progress },
          triggered_at: now,
          recommendations: []
        });
      });

      // 5. Alertes de congés non pris
      const { data: leaveBalances } = await supabase
        .from('leave_balances')
        .select('*, employees(full_name), absence_types(name)')
        .eq('year', new Date().getFullYear())
        .gt('remaining_days', 20); // Plus de 20 jours restants

      leaveBalances?.forEach(balance => {
        alerts.push({
          id: `unused-leave-${balance.employee_id}-${balance.absence_type_id}`,
          type: 'UNUSED_LEAVE',
          code: 'UNUSED_LEAVE',
          title: 'Congés non utilisés',
          description: `${balance.employees?.full_name} a encore ${balance.remaining_days} jours de ${balance.absence_types?.name}`,
          severity: Number(balance.remaining_days) > 30 ? 'medium' : 'low',
          category: 'hr',
          entity_type: 'employee',
          entity_id: balance.employee_id,
          entity_name: balance.employees?.full_name || 'Employé',
          context_data: { remainingDays: balance.remaining_days, leaveType: balance.absence_types?.name },
          triggered_at: now,
          recommendations: []
        });
      });

      // 6. Alertes de capacité et utilisation
      const { data: capacityData } = await supabase
        .from('capacity_planning')
        .select('*')
        .gte('period_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Derniers 30 jours
        .order('period_start', { ascending: false });

      if (capacityData && capacityData.length > 0) {
        // Calculer la moyenne d'utilisation
        const averageUtilization = capacityData.reduce((sum, item) => 
          sum + (Number(item.capacity_utilization) || 0), 0) / capacityData.length;

        // Récupérer les noms des employés
        const employeeIds = [...new Set(capacityData.map(c => c.employee_id))];
        const { data: employeesData } = await supabase
          .from('employees')
          .select('id, full_name')
          .in('id', employeeIds);

        const employeeNamesMap = new Map(employeesData?.map(emp => [emp.id, emp.full_name]) || []);

        capacityData.forEach(capacity => {
          const utilization = Number(capacity.capacity_utilization) || 0;
          const employeeName = employeeNamesMap.get(capacity.employee_id) || 'Employé';

          // Alerte de sous-utilisation (<30%)
          if (utilization < 30 && utilization > 0) {
            alerts.push({
              id: `underutilization-${capacity.employee_id}`,
              type: 'UNDERUTILIZATION',
              code: 'UNDERUTILIZATION',
              title: 'Sous-utilisation détectée',
              description: `${employeeName} a une utilisation de ${utilization}% (inférieure à 30%)`,
              severity: 'low',
              category: 'capacity',
              entity_type: 'employee',
              entity_id: capacity.employee_id,
              entity_name: employeeName,
              context_data: { utilization, threshold: 30, averageUtilization },
              triggered_at: now,
              recommendations: []
            });
          }

          // Alerte de surcharge critique (≥90%)
          if (utilization >= 90) {
            alerts.push({
              id: `overload-critical-${capacity.employee_id}`,
              type: 'OVERLOAD_90',
              code: 'OVERLOAD_90',
              title: 'Surcharge critique détectée',
              description: `${employeeName} a une utilisation critique de ${utilization}% (≥90%)`,
              severity: 'critical',
              category: 'capacity',
              entity_type: 'employee',
              entity_id: capacity.employee_id,
              entity_name: employeeName,
              context_data: { utilization, threshold: 90, averageUtilization },
              triggered_at: now,
              recommendations: []
            });
          }

          // Alerte d'utilisation élevée vs moyenne (+25% vs moyenne)
          if (utilization > averageUtilization * 1.25 && utilization < 90) {
            alerts.push({
              id: `high-util-vs-avg-${capacity.employee_id}`,
              type: 'HIGH_UTILIZATION_ABOVE_AVG',
              code: 'HIGH_UTILIZATION_ABOVE_AVG',
              title: 'Utilisation élevée vs moyenne',
              description: `${employeeName} a ${utilization}% d'utilisation (+25% vs moyenne de ${averageUtilization.toFixed(1)}%)`,
              severity: 'medium',
              category: 'capacity',
              entity_type: 'employee',
              entity_id: capacity.employee_id,
              entity_name: employeeName,
              context_data: { utilization, averageUtilization, threshold: 25 },
              triggered_at: now,
              recommendations: []
            });
          }
        });
      }

      // 7. Alertes d'évaluations manquantes (>12 mois)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data: allEmployees } = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('status', 'active');

      if (allEmployees) {
        for (const employee of allEmployees) {
          const { data: recentEvaluation } = await supabase
            .from('evaluations')
            .select('id')
            .eq('employee_id', employee.id)
            .gte('created_at', oneYearAgo.toISOString())
            .maybeSingle();

          if (!recentEvaluation) {
            alerts.push({
              id: `no-evaluation-${employee.id}`,
              type: 'NO_EVALUATION',
              code: 'NO_EVALUATION',
              title: 'Évaluation en retard',
              description: `${employee.full_name} n'a pas eu d'évaluation depuis plus de 12 mois`,
              severity: 'medium',
              category: 'performance',
              entity_type: 'employee',
              entity_id: employee.id,
              entity_name: employee.full_name,
              context_data: { monthsSinceEvaluation: 12 },
              triggered_at: now,
              recommendations: []
            });
          }
        }
      }

      // 8. Alertes de congés en retard (>180 jours)
      leaveBalances?.forEach(balance => {
        if (Number(balance.remaining_days) > 25) { // Seuil pour congés en retard
          alerts.push({
            id: `vacation-overdue-${balance.employee_id}`,
            type: 'VACATION_OVERDUE',
            code: 'VACATION_OVERDUE',
            title: 'Congés en retard',
            description: `${balance.employees?.full_name} n'a pas pris ${balance.remaining_days} jours de congés`,
            severity: 'low',
            category: 'hr',
            entity_type: 'employee',
            entity_id: balance.employee_id,
            entity_name: balance.employees?.full_name || 'Employé',
            context_data: { remainingDays: balance.remaining_days, threshold: 180 },
            triggered_at: now,
            recommendations: []
          });
        }
      });

      return alerts;

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

  return {
    computedAlerts,
    loading,
    error,
    refreshAlerts,
    getActiveAlerts,
    getHighPriorityAlerts,
    getCriticalAlerts,
    getAlertsByCategory,
    getTopAlerts
  };
};