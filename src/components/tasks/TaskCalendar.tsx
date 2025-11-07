/**
 * TaskCalendar - Vue calendrier/timeline des tâches
 *
 * Fonctionnalités :
 * - Vue mois/semaine/jour
 * - Affichage des tâches par date
 * - Navigation temporelle
 * - Charge de travail visuelle
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useTasks, type Task } from '@/hooks/optimized';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  getDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';

type ViewMode = 'month' | 'week' | 'day';

export const TaskCalendar: React.FC = () => {
  const { tasks, loading } = useTasks();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calculer la plage de dates affichée
  const { startDate, endDate, days } = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      // Ajouter les jours pour compléter la semaine
      const calendarStart = startOfWeek(start, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(end, { weekStartsOn: 1 });
      return {
        startDate: calendarStart,
        endDate: calendarEnd,
        days: eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
      };
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return {
        startDate: start,
        endDate: end,
        days: eachDayOfInterval({ start, end }),
      };
    } else {
      // Vue jour
      return {
        startDate: currentDate,
        endDate: currentDate,
        days: [currentDate],
      };
    }
  }, [currentDate, viewMode]);

  // Grouper les tâches par jour
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();

    tasks.forEach(task => {
      if (!task.due_date) return;

      const dueDate = parseISO(task.due_date);
      const dateKey = format(dueDate, 'yyyy-MM-dd');

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    });

    return map;
  }, [tasks]);

  // Tâches du jour sélectionné
  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  }, [selectedDate, tasksByDate]);

  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      const days = direction === 'prev' ? -7 : 7;
      setCurrentDate(new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000));
    } else {
      const days = direction === 'prev' ? -1 : 1;
      setCurrentDate(new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getTasksForDay = (date: Date): Task[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'haute':
        return 'bg-red-500';
      case 'medium':
      case 'moyenne':
        return 'bg-yellow-500';
      case 'low':
      case 'basse':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Calendrier</h2>
          <p className="text-muted-foreground">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex gap-1 rounded-lg border p-1">
            <Button
              size="sm"
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              onClick={() => setViewMode('month')}
            >
              Mois
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              onClick={() => setViewMode('week')}
            >
              Semaine
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              onClick={() => setViewMode('day')}
            >
              Jour
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendrier Principal */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {viewMode === 'month' && (
              <div className="space-y-2">
                {/* Jours de la semaine */}
                <div className="grid grid-cols-7 gap-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grille des jours */}
                <div className="grid grid-cols-7 gap-2">
                  {days.map(day => {
                    const dayTasks = getTasksForDay(day);
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`min-h-[80px] rounded-lg border p-2 text-left transition-colors hover:bg-accent ${!isCurrentMonth ? 'opacity-40' : ''} ${isToday(day) ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''} `}
                      >
                        <div className="mb-1 text-sm font-medium">{format(day, 'd')}</div>

                        {dayTasks.length > 0 && (
                          <div className="space-y-1">
                            {dayTasks.slice(0, 2).map(task => (
                              <div
                                key={task.id}
                                className={`truncate rounded px-1 py-0.5 text-xs ${getPriorityColor(
                                  task.priority
                                )} text-white`}
                                title={task.title}
                              >
                                {task.title}
                              </div>
                            ))}
                            {dayTasks.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{dayTasks.length - 2} autre{dayTasks.length - 2 > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'week' && (
              <div className="space-y-2">
                {/* Jours de la semaine */}
                <div className="grid grid-cols-7 gap-2">
                  {days.map(day => (
                    <div
                      key={day.toISOString()}
                      className={`p-2 text-center ${isToday(day) ? 'rounded-lg bg-blue-50 dark:bg-blue-950/20' : ''}`}
                    >
                      <div className="text-sm text-muted-foreground">
                        {format(day, 'EEE', { locale: fr })}
                      </div>
                      <div className="text-2xl font-bold">{format(day, 'd')}</div>
                    </div>
                  ))}
                </div>

                {/* Tâches par jour */}
                <div className="grid grid-cols-7 gap-2">
                  {days.map(day => {
                    const dayTasks = getTasksForDay(day);

                    return (
                      <div key={day.toISOString()} className="space-y-1">
                        {dayTasks.map(task => (
                          <div
                            key={task.id}
                            className={`rounded p-1 text-xs ${getPriorityColor(
                              task.priority
                            )} truncate text-white`}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Détails du jour sélectionné */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-4 w-4" />
              {selectedDate
                ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
                : 'Sélectionnez un jour'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayTasks.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">Aucune tâche pour ce jour</p>
            ) : (
              <div className="space-y-3">
                {selectedDayTasks.map(task => (
                  <div
                    key={task.id}
                    className="rounded-lg border p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Badge variant="secondary">{task.status}</Badge>
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(task.due_date), 'HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{tasks.length}</p>
              <p className="text-sm text-muted-foreground">Total tâches</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {Array.from(tasksByDate.values()).filter(t => t.length > 0).length}
              </p>
              <p className="text-sm text-muted-foreground">Jours avec tâches</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {Math.round((tasks.length / days.length) * 10) / 10}
              </p>
              <p className="text-sm text-muted-foreground">Tâches/jour moyen</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {tasks.filter(t => t.priority?.toLowerCase() === 'high').length}
              </p>
              <p className="text-sm text-muted-foreground">Haute priorité</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
