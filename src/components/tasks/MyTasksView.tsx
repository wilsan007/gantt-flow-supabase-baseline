/**
 * MyTasksView - Vue personnalisée des tâches de l'utilisateur
 * 
 * Affiche les tâches organisées par urgence :
 * - 🔥 Urgent (échéance < 24h ou priorité haute)
 */

// @ts-nocheck

/**
 * (suite du commentaire)
 * - 📅 Aujourd'hui
 * - 📆 Cette semaine
 * - ✅ Terminées récemment
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar,
  ChevronRight,
  Flame,
  CalendarDays,
  User,
  RefreshCw
} from 'lucide-react';
import { useTasks, type Task } from '@/hooks/optimized';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isThisWeek, isBefore, startOfDay, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TaskItemProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onPostpone: (taskId: string) => void;
  onDelegate: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete, onPostpone, onDelegate }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'haute':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
      case 'moyenne':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
      case 'basse':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in_progress':
      case 'en_cours':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed':
      case 'terminé':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'blocked':
      case 'bloqué':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const dueDate = task.due_date ? parseISO(task.due_date) : null;
  const isOverdue = dueDate && isBefore(dueDate, startOfDay(new Date()));

  return (
    <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{task.title}</h4>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                En retard
              </Badge>
            )}
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {dueDate && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {format(dueDate, 'dd MMM HH:mm', { locale: fr })}
              </Badge>
            )}
            
            {task.priority && (
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            )}
            
            {task.status && (
              <Badge className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
            )}
            
            {task.project_id && (
              <Badge variant="secondary" className="gap-1">
                Projet #{task.project_id.slice(0, 8)}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onComplete(task.id)}
            title="Marquer comme terminé"
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onPostpone(task.id)}
            title="Reporter"
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelegate(task.id)}
            title="Déléguer"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const MyTasksView: React.FC = () => {
  const { tasks, loading, error, updateTask, refresh } = useTasks();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  const [expandedSections, setExpandedSections] = useState({
    urgent: true,
    today: true,
    week: true,
    completed: false,
  });

  // Filtrer les tâches de l'utilisateur
  const myTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter(
      task => (task.assigned_to || task.assignee_id) === user.id && 
              task.status !== 'completed' && task.status !== 'done'
    );
  }, [tasks, user]);

  const completedTasks = useMemo(() => {
    if (!user) return [];
    const twoDaysAgo = addDays(new Date(), -2);
    return tasks.filter(
      task => 
        (task.assigned_to || task.assignee_id) === user.id && 
        (task.status === 'completed' || task.status === 'done') &&
        task.updated_at &&
        parseISO(task.updated_at) > twoDaysAgo
    );
  }, [tasks, user]);

  // Catégoriser les tâches
  const categorizedTasks = useMemo(() => {
    const now = new Date();
    const tomorrow = addDays(startOfDay(now), 1);

    const urgent: Task[] = [];
    const today: Task[] = [];
    const thisWeek: Task[] = [];

    myTasks.forEach(task => {
      const dueDate = task.due_date ? parseISO(task.due_date) : null;
      const isHighPriority = task.priority?.toLowerCase() === 'high' || task.priority?.toLowerCase() === 'haute';
      const isDueSoon = dueDate && isBefore(dueDate, tomorrow);

      if (isHighPriority || isDueSoon) {
        urgent.push(task);
      } else if (dueDate && isToday(dueDate)) {
        today.push(task);
      } else if (dueDate && isThisWeek(dueDate, { weekStartsOn: 1 })) {
        thisWeek.push(task);
      } else {
        thisWeek.push(task); // Par défaut dans "cette semaine"
      }
    });

    return { urgent, today, thisWeek };
  }, [myTasks]);

  const handleComplete = async (taskId: string) => {
    try {
      await updateTask(taskId, { status: 'done' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handlePostpone = async (taskId: string) => {
    // Implémenter la logique de report (ajouter 1 jour par exemple)
    const task = tasks.find(t => t.id === taskId);
    if (!task?.due_date) return;

    const newDate = addDays(parseISO(task.due_date), 1);
    try {
      await updateTask(taskId, { due_date: newDate.toISOString() });
    } catch (error) {
      console.error('Erreur lors du report:', error);
    }
  };

  const handleDelegate = async (taskId: string) => {
    // À implémenter : ouvrir un dialogue pour sélectionner un utilisateur
    console.log('Déléguer tâche:', taskId);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des tâches: {typeof error === 'string' ? error : error?.message || 'Erreur inconnue'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mes Tâches</h2>
          <p className="text-muted-foreground">
            {myTasks.length} tâche{myTasks.length > 1 ? 's' : ''} en cours
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p className="text-2xl font-bold">{categorizedTasks.urgent.length}</p>
              </div>
              <Flame className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold">{categorizedTasks.today.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cette semaine</p>
                <p className="text-2xl font-bold">{categorizedTasks.thisWeek.length}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Urgent */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-accent/50"
          onClick={() => toggleSection('urgent')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500" />
              <span>🔥 URGENT</span>
              <Badge variant="destructive">{categorizedTasks.urgent.length}</Badge>
            </div>
            <ChevronRight 
              className={`h-5 w-5 transition-transform ${expandedSections.urgent ? 'rotate-90' : ''}`} 
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.urgent && (
          <CardContent className="space-y-3">
            {categorizedTasks.urgent.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucune tâche urgente 🎉
              </p>
            ) : (
              categorizedTasks.urgent.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onPostpone={handlePostpone}
                  onDelegate={handleDelegate}
                />
              ))
            )}
          </CardContent>
        )}
      </Card>

      {/* Section Aujourd'hui */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-accent/50"
          onClick={() => toggleSection('today')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span>📅 AUJOURD'HUI</span>
              <Badge variant="secondary">{categorizedTasks.today.length}</Badge>
            </div>
            <ChevronRight 
              className={`h-5 w-5 transition-transform ${expandedSections.today ? 'rotate-90' : ''}`} 
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.today && (
          <CardContent className="space-y-3">
            {categorizedTasks.today.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucune tâche pour aujourd'hui
              </p>
            ) : (
              categorizedTasks.today.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onPostpone={handlePostpone}
                  onDelegate={handleDelegate}
                />
              ))
            )}
          </CardContent>
        )}
      </Card>

      {/* Section Cette Semaine */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-accent/50"
          onClick={() => toggleSection('week')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-yellow-500" />
              <span>📆 CETTE SEMAINE</span>
              <Badge variant="outline">{categorizedTasks.thisWeek.length}</Badge>
            </div>
            <ChevronRight 
              className={`h-5 w-5 transition-transform ${expandedSections.week ? 'rotate-90' : ''}`} 
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.week && (
          <CardContent className="space-y-3">
            {categorizedTasks.thisWeek.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucune tâche cette semaine
              </p>
            ) : (
              categorizedTasks.thisWeek.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onPostpone={handlePostpone}
                  onDelegate={handleDelegate}
                />
              ))
            )}
          </CardContent>
        )}
      </Card>

      {/* Section Terminées Récemment */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-accent/50"
          onClick={() => toggleSection('completed')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>✅ TERMINÉES RÉCEMMENT</span>
              <Badge variant="secondary">{completedTasks.length}</Badge>
            </div>
            <ChevronRight 
              className={`h-5 w-5 transition-transform ${expandedSections.completed ? 'rotate-90' : ''}`} 
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.completed && (
          <CardContent className="space-y-3">
            {completedTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucune tâche terminée récemment
              </p>
            ) : (
              completedTasks.slice(0, 10).map(task => (
                <div key={task.id} className="p-4 border rounded-lg opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium line-through">{task.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        Terminée {task.updated_at && format(parseISO(task.updated_at), 'PPp', { locale: fr })}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};
