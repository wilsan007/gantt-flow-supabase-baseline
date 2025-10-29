/**
 * TaskAnalytics - Statistiques et KPIs des tâches
 * 
 * Affiche :
 * - KPIs de la semaine (créées, terminées, en retard, taux)
 * - Performance par priorité
 * - Top contributeurs
 * - Alertes intelligentes
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MetricCard, ProgressBar } from '@/components/ui/badges';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Users,
  Calendar,
} from 'lucide-react';
import { useTasks } from '@/hooks/optimized';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { 
  startOfWeek, 
  endOfWeek, 
  isWithinInterval, 
  isBefore, 
  startOfDay,
  parseISO,
  subDays,
} from 'date-fns';

interface TaskStats {
  created: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

interface PriorityStats {
  high: { total: number; completed: number };
  medium: { total: number; completed: number };
  low: { total: number; completed: number };
}

interface ContributorStats {
  id: string;
  name: string;
  completedTasks: number;
}

export const TaskAnalytics: React.FC = () => {
  const { tasks, loading } = useTasks();
  const { employees } = useHRMinimal();

  // Stats de la semaine en cours
  const weekStats = useMemo((): TaskStats => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const tasksThisWeek = tasks.filter(task => {
      if (!task.created_at) return false;
      const createdDate = parseISO(task.created_at);
      return isWithinInterval(createdDate, { start: weekStart, end: weekEnd });
    });

    const created = tasksThisWeek.length;
    const completed = tasksThisWeek.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = parseISO(task.due_date);
      return isBefore(dueDate, startOfDay(now)) && task.status !== 'done';
    }).length;

    const completionRate = created > 0 ? Math.round((completed / created) * 100) : 0;

    return { created, completed, overdue, completionRate };
  }, [tasks]);

  // Stats par priorité
  const priorityStats = useMemo((): PriorityStats => {
    const stats: PriorityStats = {
      high: { total: 0, completed: 0 },
      medium: { total: 0, completed: 0 },
      low: { total: 0, completed: 0 },
    };

    tasks.forEach(task => {
      const priority = task.priority?.toLowerCase();
      const isCompleted = task.status === 'done';

      if (priority === 'high' || priority === 'haute') {
        stats.high.total++;
        if (isCompleted) stats.high.completed++;
      } else if (priority === 'medium' || priority === 'moyenne') {
        stats.medium.total++;
        if (isCompleted) stats.medium.completed++;
      } else if (priority === 'low' || priority === 'basse') {
        stats.low.total++;
        if (isCompleted) stats.low.completed++;
      }
    });

    return stats;
  }, [tasks]);

  // Top contributeurs
  const topContributors = useMemo((): ContributorStats[] => {
    const contributorMap = new Map<string, number>();

    // Compter les tâches terminées par utilisateur
    tasks
      .filter(task => task.status === 'done' && (task.assigned_to || task.assignee_id))
      .forEach(task => {
        const userId = task.assigned_to || task.assignee_id;
        if (!userId) return;
        const count = contributorMap.get(userId) || 0;
        contributorMap.set(userId, count + 1);
      });

    // Convertir en array et trier
    const contributors: ContributorStats[] = [];
    contributorMap.forEach((completedTasks, userId) => {
      const employee = employees.find(e => e.id === userId);
      if (employee) {
        contributors.push({
          id: userId,
          name: employee.full_name || `${(employee as any).first_name || ''} ${(employee as any).last_name || ''}`.trim() || 'Employé',
          completedTasks,
        });
      }
    });

    return contributors.sort((a, b) => b.completedTasks - a.completedTasks).slice(0, 5);
  }, [tasks, employees]);

  // Alertes
  const alerts = useMemo(() => {
    const result: Array<{ type: 'warning' | 'error'; message: string }> = [];

    if (weekStats.overdue > 0) {
      result.push({
        type: 'error',
        message: `${weekStats.overdue} tâche${weekStats.overdue > 1 ? 's' : ''} en retard nécessite${weekStats.overdue > 1 ? 'nt' : ''} une attention immédiate`,
      });
    }

    const unassignedOld = tasks.filter(task => {
      if (task.assigned_to || task.status === 'completed') return false;
      if (!task.created_at) return false;
      const created = parseISO(task.created_at);
      return isBefore(created, subDays(new Date(), 7));
    });

    if (unassignedOld.length > 0) {
      result.push({
        type: 'warning',
        message: `${unassignedOld.length} tâche${unassignedOld.length > 1 ? 's' : ''} sans assignation depuis plus de 7 jours`,
      });
    }

    if (weekStats.completionRate < 50 && weekStats.created > 5) {
      result.push({
        type: 'warning',
        message: `Taux de complétion faible cette semaine (${weekStats.completionRate}%)`,
      });
    }

    return result;
  }, [tasks, weekStats]);

  // Calculer le pourcentage de complétion par priorité
  const getPriorityPercentage = (stats: { total: number; completed: number }) => {
    return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Statistiques & Analytics</h2>
        <p className="text-muted-foreground">
          Performance et indicateurs clés
        </p>
      </div>

      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Créées"
          value={weekStats.created}
          subtitle="Cette semaine"
          icon={<BarChart3 className="w-6 h-6" />}
          color="blue"
        />

        <MetricCard
          label="Terminées"
          value={weekStats.completed}
          subtitle="Cette semaine"
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="green"
        />

        <MetricCard
          label="En retard"
          value={weekStats.overdue}
          subtitle="Nécessitent action"
          icon={<XCircle className="w-6 h-6" />}
          color="red"
        />

        <MetricCard
          label="Taux"
          value={`${weekStats.completionRate}%`}
          subtitle={weekStats.completionRate >= 70 ? "Excellent" : weekStats.completionRate >= 50 ? "Moyen" : "Faible"}
          icon={<TrendingUp className="w-6 h-6" />}
          color={weekStats.completionRate >= 70 ? "green" : weekStats.completionRate >= 50 ? "orange" : "red"}
          trend={weekStats.completionRate >= 70 ? "up" : weekStats.completionRate >= 50 ? undefined : "down"}
        />
      </div>

      {/* Performance par Priorité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance par Priorité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Haute */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">🔴 Haute</span>
              <span className="text-muted-foreground">
                {getPriorityPercentage(priorityStats.high)}% ({priorityStats.high.completed}/{priorityStats.high.total})
              </span>
            </div>
            <ProgressBar value={getPriorityPercentage(priorityStats.high)} color="red" />
          </div>

          {/* Moyenne */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">🟡 Moyenne</span>
              <span className="text-muted-foreground">
                {getPriorityPercentage(priorityStats.medium)}% ({priorityStats.medium.completed}/{priorityStats.medium.total})
              </span>
            </div>
            <ProgressBar value={getPriorityPercentage(priorityStats.medium)} color="orange" />
          </div>

          {/* Basse */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">🟢 Basse</span>
              <span className="text-muted-foreground">
                {getPriorityPercentage(priorityStats.low)}% ({priorityStats.low.completed}/{priorityStats.low.total})
              </span>
            </div>
            <ProgressBar value={getPriorityPercentage(priorityStats.low)} color="green" />
          </div>
        </CardContent>
      </Card>

      {/* Top Contributeurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Contributeurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topContributors.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucune tâche terminée récemment
            </p>
          ) : (
            <div className="space-y-3">
              {topContributors.map((contributor, index) => (
                <div
                  key={contributor.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      <span className="font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{contributor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {contributor.completedTasks} tâche{contributor.completedTasks > 1 ? 's' : ''} terminée{contributor.completedTasks > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes
          </h3>
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {alert.type === 'error' ? 'Action Requise' : 'Attention'}
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Info supplémentaires */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{tasks.length}</p>
              <p className="text-sm text-muted-foreground">Total tâches</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{employees.length}</p>
              <p className="text-sm text-muted-foreground">Collaborateurs</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {tasks.filter(t => t.status === 'in_progress' || t.status === 'en_cours').length}
              </p>
              <p className="text-sm text-muted-foreground">En cours</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
