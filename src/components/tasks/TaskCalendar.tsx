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
  CheckSquare,
} from '@/lib/icons';
import { useTasks, type Task } from '@/hooks/optimized';
import { useEmployees } from '@/hooks/useEmployees';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter } from 'lucide-react';
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
  const { employees, loading: employeesLoading } = useEmployees();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');

  // Debug employees
  console.log('📅 TaskCalendar - Employees:', {
    count: employees.length,
    loading: employeesLoading,
    sample: employees.slice(0, 3).map(e => ({ id: e.id, name: e.full_name })),
  });

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

  // Filtrer les tâches par personne assignée
  const filteredTasks = useMemo(() => {
    if (selectedAssignee === 'all') {
      return tasks;
    }
    return tasks.filter(task => (task.assigned_to || task.assignee_id) === selectedAssignee);
  }, [tasks, selectedAssignee]);

  // Grouper les tâches par jour
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();

    filteredTasks.forEach(task => {
      if (!task.due_date) return;

      const dueDate = parseISO(task.due_date);
      const dateKey = format(dueDate, 'yyyy-MM-dd');

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    });

    return map;
  }, [filteredTasks]);

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
      {/* Header - Design Futuriste Responsive */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[2px] shadow-2xl">
        <div className="bg-background/95 flex flex-col gap-4 rounded-2xl p-4 backdrop-blur-xl md:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
              📅 Calendrier
            </h2>
            <p className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-base font-semibold text-transparent capitalize md:text-lg">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {/* View Mode - Design moderne */}
            <div className="flex gap-1 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-1 backdrop-blur-sm">
              <Button
                size="sm"
                className={
                  viewMode === 'month'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'hover:bg-white/20'
                }
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                onClick={() => setViewMode('month')}
              >
                Mois
              </Button>
              <Button
                size="sm"
                className={
                  viewMode === 'week'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'hover:bg-white/20'
                }
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                onClick={() => setViewMode('week')}
              >
                Semaine
              </Button>
              <Button
                size="sm"
                className={
                  viewMode === 'day'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg'
                    : 'hover:bg-white/20'
                }
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                onClick={() => setViewMode('day')}
              >
                Jour
              </Button>
            </div>

            {/* Navigation - Design futuriste responsive */}
            <div className="flex gap-1 sm:gap-2">
              <Button
                size="sm"
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:flex-none"
                onClick={() => navigate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-3 text-xs text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:px-4 sm:text-sm"
                onClick={goToToday}
              >
                Aujourd'hui
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:flex-none"
                onClick={() => navigate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 Filtre par personne assignée */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground h-4 w-4" />
              <label className="text-sm font-medium">Filtrer par personne :</label>
            </div>
            <Select
              value={selectedAssignee}
              onValueChange={setSelectedAssignee}
              disabled={employeesLoading}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue
                  placeholder={employeesLoading ? 'Chargement...' : 'Toutes les personnes'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les personnes</SelectItem>
                {employeesLoading ? (
                  <SelectItem value="loading" disabled>
                    Chargement des employés...
                  </SelectItem>
                ) : employees.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Aucun employé trouvé
                  </SelectItem>
                ) : (
                  employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedAssignee !== 'all' && <Badge variant="secondary">Filtre actif</Badge>}
            {!employeesLoading && employees.length === 0 && (
              <span className="text-muted-foreground text-xs">(Aucun employé disponible)</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendrier Principal - Design Futuriste */}
        <Card className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 shadow-2xl backdrop-blur-sm lg:col-span-2">
          <CardContent className="p-3 sm:p-4 md:p-6">
            {viewMode === 'month' && (
              <div className="space-y-2 md:space-y-4">
                {/* Jours de la semaine - Design moderne responsive */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, idx) => (
                    <div
                      key={day}
                      className="text-foreground rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 py-1.5 text-center text-[10px] font-bold sm:py-2 sm:text-xs md:text-sm"
                    >
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.charAt(0)}</span>
                    </div>
                  ))}
                </div>

                {/* Grille des jours - Design élégant responsive */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {days.map(day => {
                    const dayTasks = getTasksForDay(day);
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isTodayDay = isToday(day);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`group relative min-h-[50px] overflow-hidden rounded-lg border-2 p-1.5 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl sm:min-h-[60px] sm:rounded-xl sm:p-2 md:min-h-[70px] ${
                          !isCurrentMonth
                            ? 'border-gray-200/30 opacity-40 dark:border-gray-700/30'
                            : 'border-transparent'
                        } ${
                          isTodayDay
                            ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-2xl ring-2 ring-blue-400'
                            : 'bg-gradient-to-br from-white/60 to-gray-50/60 backdrop-blur-sm dark:from-gray-800/60 dark:to-gray-900/60'
                        } ${isSelected ? 'ring-4 ring-purple-500 ring-offset-2' : ''}`}
                      >
                        {/* Numéro du jour responsive */}
                        <div
                          className={`mb-1 flex items-center justify-between sm:mb-2 ${isTodayDay ? 'text-white' : 'text-foreground'}`}
                        >
                          <span className="text-xs font-bold sm:text-sm md:text-base">
                            {format(day, 'd')}
                          </span>
                          {dayTasks.length > 0 && (
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold sm:h-5 sm:w-5 sm:text-[10px] ${
                                isTodayDay
                                  ? 'bg-white/30 text-white'
                                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                              }`}
                            >
                              {dayTasks.length}
                            </span>
                          )}
                        </div>

                        {/* Tâches - Affichage conditionnel selon écran */}
                        {dayTasks.length > 0 && (
                          <div className="space-y-0.5 sm:space-y-1">
                            {/* Afficher 1 tâche sur mobile, 2 sur tablette+ */}
                            {dayTasks.slice(0, 1).map(task => (
                              <div
                                key={task.id}
                                className={`hidden truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium shadow-sm transition-transform hover:scale-105 sm:block sm:rounded-lg sm:px-2 sm:py-1 sm:text-xs ${getPriorityColor(
                                  task.priority
                                )} text-white`}
                                title={task.title}
                              >
                                {task.title}
                              </div>
                            ))}
                            {dayTasks.length > 1 && (
                              <div
                                className={`hidden truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium shadow-sm md:block md:rounded-lg md:px-2 md:py-1 md:text-xs ${getPriorityColor(
                                  dayTasks[1].priority
                                )} text-white`}
                                title={dayTasks[1].title}
                              >
                                {dayTasks[1].title}
                              </div>
                            )}
                            {dayTasks.length > 2 && (
                              <div className="hidden rounded-lg bg-gradient-to-r from-gray-400 to-gray-500 px-2 py-1 text-xs font-semibold text-white shadow-md sm:block">
                                +{dayTasks.length - 2} autre{dayTasks.length - 2 > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Effet hover */}
                        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
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
                      <div className="text-muted-foreground text-sm">
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

        {/* Détails du jour sélectionné - Design Futuriste */}
        <Card className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-rose-500/5 shadow-2xl backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10" />
          <CardHeader className="relative p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-base font-bold text-transparent sm:text-lg">
              <CalendarIcon className="h-4 w-4 text-purple-500 sm:h-5 sm:w-5" />
              <span className="truncate">
                {selectedDate
                  ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
                  : 'Sélectionnez un jour'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-4 sm:p-6">
            {selectedDayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4 rounded-full bg-gradient-to-r from-gray-400/20 to-gray-500/20 p-4">
                  <CalendarIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-muted-foreground text-center text-sm font-medium">
                  Aucune tâche pour ce jour
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {selectedDayTasks.map(task => (
                  <div
                    key={task.id}
                    className="group relative overflow-hidden rounded-lg border-2 border-transparent bg-gradient-to-br from-white/80 to-gray-50/80 p-3 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-purple-500/50 hover:shadow-2xl sm:rounded-xl sm:p-4 dark:from-gray-800/80 dark:to-gray-900/80"
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-foreground text-xs font-bold sm:text-sm">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-[11px] sm:mt-1.5 sm:text-xs">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-md sm:px-3 sm:py-1 sm:text-xs ${getPriorityColor(task.priority)} text-white`}
                      >
                        {task.priority}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] sm:mt-3 sm:gap-2 sm:text-xs">
                      <span className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-2 py-0.5 font-semibold text-white shadow-md sm:px-2.5 sm:py-1">
                        {task.status}
                      </span>
                      {task.due_date && (
                        <span className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 font-semibold text-white shadow-md sm:gap-1.5 sm:px-2.5 sm:py-1">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {format(parseISO(task.due_date), 'HH:mm')}
                        </span>
                      )}
                    </div>

                    {/* Effet brillant au survol */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-rose-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistiques - Design Futuriste Responsive */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {/* Total tâches */}
        <Card className="hover:shadow-3xl group relative overflow-hidden rounded-xl border-0 bg-gradient-to-br from-blue-500 to-cyan-500 p-[2px] shadow-2xl transition-all duration-300 hover:scale-105 sm:rounded-2xl">
          <CardContent className="bg-background/95 rounded-xl py-4 backdrop-blur-xl sm:rounded-2xl sm:pt-6">
            <div className="text-center">
              <div className="mb-1.5 flex justify-center sm:mb-2">
                <div className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 p-2 sm:p-3">
                  <CheckSquare className="h-4 w-4 text-white sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </div>
              </div>
              <p className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl md:text-4xl">
                {tasks.length}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs font-semibold sm:mt-1 sm:text-sm">
                Total tâches
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Jours avec tâches */}
        <Card className="hover:shadow-3xl group relative overflow-hidden rounded-xl border-0 bg-gradient-to-br from-purple-500 to-pink-500 p-[2px] shadow-2xl transition-all duration-300 hover:scale-105 sm:rounded-2xl">
          <CardContent className="bg-background/95 rounded-xl py-4 backdrop-blur-xl sm:rounded-2xl sm:pt-6">
            <div className="text-center">
              <div className="mb-1.5 flex justify-center sm:mb-2">
                <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-2 sm:p-3">
                  <CalendarIcon className="h-4 w-4 text-white sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </div>
              </div>
              <p className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl md:text-4xl">
                {Array.from(tasksByDate.values()).filter(t => t.length > 0).length}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs font-semibold sm:mt-1 sm:text-sm">
                Jours avec tâches
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Moyenne par jour */}
        <Card className="hover:shadow-3xl group relative overflow-hidden rounded-xl border-0 bg-gradient-to-br from-emerald-500 to-teal-500 p-[2px] shadow-2xl transition-all duration-300 hover:scale-105 sm:rounded-2xl">
          <CardContent className="bg-background/95 rounded-xl py-4 backdrop-blur-xl sm:rounded-2xl sm:pt-6">
            <div className="text-center">
              <div className="mb-1.5 flex justify-center sm:mb-2">
                <div className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 p-2 sm:p-3">
                  <Clock className="h-4 w-4 text-white sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </div>
              </div>
              <p className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl md:text-4xl">
                {Math.round((tasks.length / days.length) * 10) / 10}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs font-semibold sm:mt-1 sm:text-sm">
                Tâches/jour moyen
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Haute priorité */}
        <Card className="hover:shadow-3xl group relative overflow-hidden rounded-xl border-0 bg-gradient-to-br from-rose-500 to-red-500 p-[2px] shadow-2xl transition-all duration-300 hover:scale-105 sm:rounded-2xl">
          <CardContent className="bg-background/95 rounded-xl py-4 backdrop-blur-xl sm:rounded-2xl sm:pt-6">
            <div className="text-center">
              <div className="mb-1.5 flex justify-center sm:mb-2">
                <div className="rounded-full bg-gradient-to-r from-rose-500 to-red-500 p-2 sm:p-3">
                  <AlertTriangle className="h-4 w-4 text-white sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </div>
              </div>
              <p className="bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl md:text-4xl">
                {tasks.filter(t => t.priority?.toLowerCase() === 'high').length}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs font-semibold sm:mt-1 sm:text-sm">
                Haute priorité
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
