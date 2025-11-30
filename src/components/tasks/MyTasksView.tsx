/**
 * MyTasksView - Vue des tâches assignées (Futuristic Edition 🚀)
 *
 * Design : Glassmorphism, Néons, Dégradés
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Filter,
  SortAsc,
  MoreVertical,
  Briefcase,
  User,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
} from 'lucide-react';
import { useTasks, type Task } from '@/hooks/optimized';
import { useTaskEditPermissions } from '@/hooks/useTaskEditPermissions';
import { format, isToday, isTomorrow, isThisWeek, parseISO, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EditableTaskTitle } from './inline/EditableTaskTitle';
import { EditableTaskStatus } from './inline/EditableTaskStatus';
import { EditableTaskPriority } from './inline/EditableTaskPriority';
import { EditableTaskAssignee } from './inline/EditableTaskAssignee';
import { useUserProfile } from '@/hooks/useUserAuth';

interface MyTasksViewProps {
  limit?: number;
  compact?: boolean;
  showAllTasks?: boolean;
}

type FilterType = 'all' | 'todo' | 'doing' | 'done';
type SortType = 'date' | 'priority' | 'project';

export const MyTasksView: React.FC<MyTasksViewProps> = ({
  limit,
  compact = false,
  showAllTasks = false,
}) => {
  const { tasks, loading, updateTask } = useTasks();
  const { profile } = useUserProfile();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date');
  const [showCompleted, setShowCompleted] = useState(false);

  // Filtrage et Tri
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
      // Filtrer par utilisateur courant si showAllTasks est faux
      if (!showAllTasks && profile?.userId) {
        // Vérifier assignee_id ou assigned_to (selon le modèle)
        const isAssigned = t.assignee_id === profile.userId || t.assigned_to === profile.userId;
        if (!isAssigned) return false;
      }

      if (!showCompleted && t.status === 'done') return false;
      if (filter === 'all') return true;
      if (filter === 'done') return t.status === 'done';
      if (filter === 'doing') return t.status === 'doing' || t.status === 'in_progress';
      if (filter === 'todo') return t.status === 'todo';
      return true;
    });

    return result.sort((a, b) => {
      if (sort === 'date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (sort === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (
          (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
          (priorityOrder[b.priority as keyof typeof priorityOrder] || 2)
        );
      }
      return 0;
    });
  }, [tasks, filter, sort, showCompleted, showAllTasks, profile]);

  // Groupement par section (Urgent, Aujourd'hui, etc.)
  const groupedTasks = useMemo(() => {
    const groups = {
      urgent: [] as Task[],
      today: [] as Task[],
      week: [] as Task[],
      upcoming: [] as Task[],
      completed: [] as Task[],
    };

    filteredTasks.forEach(task => {
      if (task.status === 'done') {
        groups.completed.push(task);
        return;
      }

      if (task.priority === 'high') {
        groups.urgent.push(task);
        return; // Les tâches urgentes vont dans "Urgent" peu importe la date
      }

      if (!task.due_date) {
        groups.upcoming.push(task);
        return;
      }

      const date = parseISO(task.due_date);
      if (isPast(date) && !isToday(date)) {
        groups.urgent.push(task); // En retard -> Urgent
      } else if (isToday(date)) {
        groups.today.push(task);
      } else if (isThisWeek(date)) {
        groups.week.push(task);
      } else {
        groups.upcoming.push(task);
      }
    });

    return groups;
  }, [filteredTasks]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTask(taskId, { status: newStatus as any });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const handleQuickComplete = (taskId: string) => {
    handleStatusChange(taskId, 'done');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-muted/50 h-24 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-50 space-y-8 duration-700">
      {/* Header & Filtres Futuristes */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-3xl font-bold text-transparent dark:from-violet-400 dark:to-fuchsia-400">
            Mes Tâches
          </h2>
          <p className="text-muted-foreground mt-1">
            {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''} à traiter
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtres Pills */}
          <div className="bg-muted/30 flex rounded-full border border-white/10 p-1 backdrop-blur-sm">
            {(['all', 'todo', 'doing', 'done'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
                  filter === f
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                }`}
              >
                {f === 'all'
                  ? 'Tout'
                  : f === 'todo'
                    ? 'À faire'
                    : f === 'doing'
                      ? 'En cours'
                      : 'Fait'}
              </button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-primary/50 hover:bg-primary/5 rounded-full border-dashed"
              >
                <SortAsc className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSort('date')}>
                <Calendar className="mr-2 h-4 w-4" /> Date d'échéance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('priority')}>
                <AlertCircle className="mr-2 h-4 w-4" /> Priorité
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('project')}>
                <Briefcase className="mr-2 h-4 w-4" /> Projet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Sections de Tâches */}
      <div className="space-y-8">
        {/* 🚨 Urgent & En Retard */}
        {groupedTasks.urgent.length > 0 && (
          <TaskSection
            title="Urgent & En Retard"
            icon={<Zap className="h-5 w-5 text-rose-500" />}
            tasks={groupedTasks.urgent}
            onUpdate={updateTask}
            onComplete={handleQuickComplete}
            gradient="from-rose-500/10 to-orange-500/10"
            borderColor="border-rose-500/20"
          />
        )}

        {/* 📅 Aujourd'hui */}
        {groupedTasks.today.length > 0 && (
          <TaskSection
            title="Aujourd'hui"
            icon={<Target className="h-5 w-5 text-blue-500" />}
            tasks={groupedTasks.today}
            onUpdate={updateTask}
            onComplete={handleQuickComplete}
            gradient="from-blue-500/10 to-cyan-500/10"
            borderColor="border-blue-500/20"
          />
        )}

        {/* 🗓️ Cette Semaine */}
        {groupedTasks.week.length > 0 && (
          <TaskSection
            title="Cette Semaine"
            icon={<Calendar className="h-5 w-5 text-violet-500" />}
            tasks={groupedTasks.week}
            onUpdate={updateTask}
            onComplete={handleQuickComplete}
            gradient="from-violet-500/10 to-purple-500/10"
            borderColor="border-violet-500/20"
          />
        )}

        {/* 🔮 À Venir */}
        {groupedTasks.upcoming.length > 0 && (
          <TaskSection
            title="À Venir"
            icon={<Sparkles className="h-5 w-5 text-emerald-500" />}
            tasks={groupedTasks.upcoming}
            onUpdate={updateTask}
            onComplete={handleQuickComplete}
            gradient="from-emerald-500/10 to-teal-500/10"
            borderColor="border-emerald-500/20"
          />
        )}

        {/* ✅ Terminées (si affichées ou filtre 'done') */}
        {(showCompleted || filter === 'done') && groupedTasks.completed.length > 0 && (
          <TaskSection
            title="Terminées Récemment"
            icon={<CheckCircle2 className="h-5 w-5 text-slate-500" />}
            tasks={groupedTasks.completed}
            onUpdate={updateTask}
            onComplete={handleQuickComplete}
            gradient="from-slate-500/10 to-gray-500/10"
            borderColor="border-slate-500/20"
            isCompleted
          />
        )}

        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-4">
              <div className="bg-primary/20 absolute inset-0 animate-ping rounded-full opacity-75 duration-1000" />
              <div className="relative rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 p-4 dark:from-violet-900/30 dark:to-fuchsia-900/30">
                <Sparkles className="text-primary h-8 w-8" />
              </div>
            </div>
            <h3 className="text-xl font-bold">Tout est calme...</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Aucune tâche ne correspond à vos filtres. Profitez-en pour prendre une pause ! ☕
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant Section de Tâches
const TaskSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  onUpdate: any;
  onComplete: any;
  gradient: string;
  borderColor: string;
  isCompleted?: boolean;
}> = ({ title, icon, tasks, onUpdate, onComplete, gradient, borderColor, isCompleted }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 px-1">
      {icon}
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      <Badge variant="secondary" className="bg-muted/50 ml-2 rounded-full px-2.5">
        {tasks.length}
      </Badge>
    </div>

    <div className="grid gap-3">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onUpdate={onUpdate}
          onComplete={onComplete}
          gradient={gradient}
          borderColor={borderColor}
          isCompleted={isCompleted}
        />
      ))}
    </div>
  </div>
);

// Composant Item de Tâche Futuriste
const TaskItem: React.FC<{
  task: Task;
  onUpdate: any;
  onComplete: any;
  gradient: string;
  borderColor: string;
  isCompleted?: boolean;
}> = ({ task, onUpdate, onComplete, gradient, borderColor, isCompleted }) => {
  const permissions = useTaskEditPermissions({ task });
  const isOverdue =
    task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));

  return (
    <div
      className={`group bg-card/50 relative overflow-hidden rounded-xl border p-4 backdrop-blur-md transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${borderColor} ${isCompleted ? 'opacity-60 grayscale' : ''}`}
    >
      {/* Fond Dégradé Subtil */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />

      {/* Glow Effect on Hover */}
      <div className="bg-primary absolute top-0 bottom-0 -left-1 w-1 opacity-0 transition-all duration-300 group-hover:left-0 group-hover:opacity-100" />

      <div className="relative z-10 flex items-start gap-4">
        {/* Bouton Check */}
        <button
          onClick={() => onComplete(task.id)}
          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
            isCompleted
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/10 hover:text-primary'
          }`}
        >
          {isCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
        </button>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <EditableTaskTitle
                  value={task.title}
                  onChange={value => onUpdate(task.id, { title: value })}
                  readOnly={!permissions.canEditTitle || isCompleted}
                  className={`text-base font-semibold ${isCompleted ? 'text-muted-foreground line-through' : ''}`}
                />
                {isOverdue && !isCompleted && (
                  <Badge
                    variant="destructive"
                    className="animate-pulse px-1.5 py-0 text-[10px] tracking-wider uppercase"
                  >
                    En retard
                  </Badge>
                )}
              </div>
              {task.description && (
                <p className="text-muted-foreground/80 line-clamp-1 text-sm font-light">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Date */}
            {task.due_date && (
              <div
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm ${
                  isOverdue && !isCompleted
                    ? 'border-red-200 bg-red-50/50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                    : 'border-slate-200 bg-slate-50/50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300'
                }`}
              >
                <Calendar className="h-3 w-3" />
                {format(parseISO(task.due_date), 'dd MMM', { locale: fr })}
              </div>
            )}

            {/* Priorité */}
            <EditableTaskPriority
              value={task.priority}
              onChange={value => onUpdate(task.id, { priority: value })}
              readOnly={!permissions.canEditPriority || isCompleted}
            />

            {/* Statut */}
            <EditableTaskStatus
              value={task.status}
              onChange={value => onUpdate(task.id, { status: value })}
              readOnly={!permissions.canEditStatus || isCompleted}
            />

            {/* Projet */}
            {(task.projects?.name || task.project_id) && (
              <div className="flex items-center gap-1.5 rounded-full border border-indigo-200/50 bg-indigo-50/50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 backdrop-blur-sm dark:bg-indigo-900/20 dark:text-indigo-300">
                <Briefcase className="h-3 w-3" />
                <span className="max-w-[100px] truncate">{task.projects?.name || 'Projet'}</span>
              </div>
            )}

            {/* Assigné */}
            <div className="ml-auto">
              <EditableTaskAssignee
                value={task.assigned_to || task.assignee_id || null}
                onChange={value => onUpdate(task.id, { assigned_to: value })}
                readOnly={!permissions.canEditAssignee || isCompleted}
                taskTenantId={task.tenant_id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
