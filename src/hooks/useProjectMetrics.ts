import { useMemo } from 'react';
import { useTasks } from './useTasks';
import { useRoleManagement } from './useRoleManagement';

export interface ProjectMetrics {
  totalTasks: number;
  doneTasks: number;
  doingTasks: number;
  blockedTasks: number;
  todoTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  highPriorityTasks: number;
  completionRate: number;
  productivityRate: number;
  tasksCompletedThisWeek: number;
  totalEstimatedHours: number;
  completedHours: number;
  timeProgress: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  performanceScore: number;
  teamEfficiency: number;
}

export const useProjectMetrics = (): ProjectMetrics => {
  const { tasks } = useTasks();
  const { checkUserPermission } = useRoleManagement();

  return useMemo(() => {
    // Les tâches sont déjà filtrées par permissions dans useTaskDatabase
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(task => task.status === 'done').length;
    const doingTasks = tasks.filter(task => task.status === 'doing').length;
    const blockedTasks = tasks.filter(task => task.status === 'blocked').length;
    const todoTasks = tasks.filter(task => task.status === 'todo').length;
    
    const overdueTasks = tasks.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
    ).length;
    
    const dueSoonTasks = tasks.filter(task => {
      if (!task.due_date || task.status === 'done') return false;
      const dueDate = new Date(task.due_date);
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      return dueDate > now && dueDate <= threeDaysFromNow;
    }).length;
    
    const highPriorityTasks = tasks.filter(task => 
      task.priority === 'high' || task.priority === 'urgent'
    ).length;
    
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const productivityRate = totalTasks > 0 ? Math.round(((doneTasks + doingTasks) / totalTasks) * 100) : 0;
    
    // Calcul de la vélocité (tâches terminées)
    const tasksCompletedThisWeek = doneTasks; // Approximation
    
    // Estimation du temps total
    const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.effort_estimate_h || 0), 0);
    const completedHours = tasks
      .filter(task => task.status === 'done')
      .reduce((sum, task) => sum + (task.effort_estimate_h || 0), 0);
    
    const timeProgress = totalEstimatedHours > 0 ? Math.round((completedHours / totalEstimatedHours) * 100) : 0;
    
    // Calcul du niveau de risque
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const riskFactors = [];
    
    if (overdueTasks > totalTasks * 0.2) riskFactors.push('overdue');
    if (blockedTasks > totalTasks * 0.15) riskFactors.push('blocked');
    if (completionRate < 30) riskFactors.push('low_completion');
    if (dueSoonTasks > totalTasks * 0.3) riskFactors.push('due_soon');
    
    if (riskFactors.length >= 3) riskLevel = 'critical';
    else if (riskFactors.length === 2) riskLevel = 'high';
    else if (riskFactors.length === 1) riskLevel = 'medium';
    
    // Score de performance (0-100)
    const performanceScore = Math.max(0, Math.min(100, 
      completionRate * 0.4 + 
      productivityRate * 0.3 + 
      Math.max(0, 100 - (overdueTasks / Math.max(1, totalTasks)) * 100) * 0.2 +
      Math.max(0, 100 - (blockedTasks / Math.max(1, totalTasks)) * 100) * 0.1
    ));
    
    // Efficacité de l'équipe
    const teamEfficiency = totalTasks > 0 ? 
      Math.round((doneTasks / Math.max(1, doingTasks + doneTasks + blockedTasks)) * 100) : 0;

    return {
      totalTasks,
      doneTasks,
      doingTasks,
      blockedTasks,
      todoTasks,
      overdueTasks,
      dueSoonTasks,
      highPriorityTasks,
      completionRate,
      productivityRate,
      tasksCompletedThisWeek,
      totalEstimatedHours,
      completedHours,
      timeProgress,
      riskLevel,
      performanceScore: Math.round(performanceScore),
      teamEfficiency
    };
  }, [tasks]);
};