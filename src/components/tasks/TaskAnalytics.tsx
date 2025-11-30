/**
 * TaskAnalytics - Statistiques et KPIs Futuristes 🚀
 *
 * Design : Glassmorphism, Dégradés Vibrants, Animations Fluides
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Zap,
  Target,
  Activity,
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

// Composant Carte Métrique Futuriste
const FuturisticMetricCard = ({ label, value, subtitle, icon, gradient, trend }: any) => (
  <div
    className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${gradient}`}
  >
    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-150" />

    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="mb-1 text-sm font-medium text-white/80">{label}</p>
        <h3 className="text-3xl font-bold tracking-tight text-white">{value}</h3>
      </div>
      <div className="rounded-xl bg-white/20 p-2.5 shadow-inner backdrop-blur-sm">
        {React.cloneElement(icon, { className: 'h-6 w-6 text-white' })}
      </div>
    </div>

    <div className="relative z-10 mt-4 flex items-center gap-2">
      {trend && (
        <span
          className={`flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${trend === 'up' ? 'bg-emerald-400/20 text-emerald-100' : 'bg-rose-400/20 text-rose-100'}`}
        >
          {trend === 'up' ? (
            <TrendingUp className="mr-1 h-3 w-3" />
          ) : (
            <TrendingDown className="mr-1 h-3 w-3" />
          )}
          {trend === 'up' ? '+12%' : '-5%'}
        </span>
      )}
      <p className="text-xs font-medium text-white/60">{subtitle}</p>
    </div>
  </div>
);

export const TaskAnalytics: React.FC = () => {
  const { tasks, loading } = useTasks();
  const { employees } = useHRMinimal({
    enabled: {
      employees: true,
      leaveRequests: false,
      attendances: false,
      leaveBalances: false,
      departments: false,
      absenceTypes: false,
    },
    limits: {
      employees: 20,
    },
  });

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

    tasks
      .filter(task => task.status === 'done' && (task.assigned_to || task.assignee_id))
      .forEach(task => {
        const userId = task.assigned_to || task.assignee_id;
        if (!userId) return;
        const count = contributorMap.get(userId) || 0;
        contributorMap.set(userId, count + 1);
      });

    const contributors: ContributorStats[] = [];
    contributorMap.forEach((completedTasks, userId) => {
      const employee = employees.find(e => e.id === userId);
      if (employee) {
        contributors.push({
          id: userId,
          name:
            employee.full_name ||
            `${(employee as any).first_name || ''} ${(employee as any).last_name || ''}`.trim() ||
            'Employé',
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
        message: `${weekStats.overdue} tâche${weekStats.overdue > 1 ? 's' : ''} en retard`,
      });
    }

    if (weekStats.completionRate < 50 && weekStats.created > 5) {
      result.push({
        type: 'warning',
        message: `Taux de complétion faible (${weekStats.completionRate}%)`,
      });
    }

    return result;
  }, [tasks, weekStats]);

  const getPriorityPercentage = (stats: { total: number; completed: number }) => {
    return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-50 space-y-8 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent dark:from-violet-400 dark:to-indigo-400">
            Analytics
          </h2>
          <p className="text-muted-foreground mt-1">Vue d'ensemble des performances</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-background/50 px-3 py-1 backdrop-blur">
            <Calendar className="mr-2 h-3 w-3" />
            Cette semaine
          </Badge>
        </div>
      </div>

      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <FuturisticMetricCard
          label="Tâches Créées"
          value={weekStats.created}
          subtitle="Nouvelles tâches"
          icon={<Zap />}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20"
          trend="up"
        />
        <FuturisticMetricCard
          label="Terminées"
          value={weekStats.completed}
          subtitle="Objectifs atteints"
          icon={<CheckCircle2 />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"
          trend="up"
        />
        <FuturisticMetricCard
          label="En Retard"
          value={weekStats.overdue}
          subtitle="Action requise"
          icon={<AlertTriangle />}
          gradient="bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/20"
          trend={weekStats.overdue > 0 ? 'down' : undefined}
        />
        <FuturisticMetricCard
          label="Efficacité"
          value={`${weekStats.completionRate}%`}
          subtitle="Taux de complétion"
          icon={<Activity />}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/20"
          trend={weekStats.completionRate >= 70 ? 'up' : 'down'}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Performance par Priorité */}
        <Card className="border-none bg-white/50 shadow-lg backdrop-blur-xl md:col-span-4 dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="text-primary h-5 w-5" />
              Performance par Priorité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              {
                label: 'Haute Priorité',
                stats: priorityStats.high,
                color: 'bg-rose-500',
                track: 'bg-rose-100 dark:bg-rose-900/20',
              },
              {
                label: 'Moyenne Priorité',
                stats: priorityStats.medium,
                color: 'bg-amber-500',
                track: 'bg-amber-100 dark:bg-amber-900/20',
              },
              {
                label: 'Basse Priorité',
                stats: priorityStats.low,
                color: 'bg-emerald-500',
                track: 'bg-emerald-100 dark:bg-emerald-900/20',
              },
            ].map((item, idx) => (
              <div key={idx} className="group space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground group-hover:text-foreground font-medium transition-colors">
                    {item.label}
                  </span>
                  <span className="font-bold">
                    {getPriorityPercentage(item.stats)}%
                    <span className="text-muted-foreground ml-1 text-xs font-normal">
                      ({item.stats.completed}/{item.stats.total})
                    </span>
                  </span>
                </div>
                <div className={`h-3 w-full overflow-hidden rounded-full ${item.track}`}>
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${getPriorityPercentage(item.stats)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Contributeurs */}
        <Card className="border-none bg-white/50 shadow-lg backdrop-blur-xl md:col-span-3 dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-amber-500" />
              Champions de la Semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topContributors.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center opacity-50">
                <Award className="mb-2 h-12 w-12 stroke-1" />
                <p>En attente de champions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <div
                    key={contributor.id}
                    className="group bg-background/40 hover:bg-background/80 flex items-center justify-between rounded-xl p-3 transition-all hover:scale-[1.02] hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold shadow-sm ${
                          index === 0
                            ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-white'
                            : index === 1
                              ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white'
                              : index === 2
                                ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="group-hover:text-primary text-sm font-semibold transition-colors">
                          {contributor.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {contributor.completedTasks} tâches terminées
                        </p>
                      </div>
                    </div>
                    {index === 0 && <Award className="h-5 w-5 animate-pulse text-amber-500" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertes Intelligentes */}
      {alerts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              variant={alert.type === 'error' ? 'destructive' : 'default'}
              className={`${
                alert.type === 'error'
                  ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20'
              } shadow-sm`}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-bold">
                {alert.type === 'error' ? 'Action Requise' : 'Attention'}
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};
