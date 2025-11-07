/**
 * Calendar Page - Calendrier Personnel + Équipe
 * 
 * Fonctionnalités :
 * - Vue des tâches assignées à l'utilisateur (Personnel)
 * - Vue des tâches des projets de l'utilisateur (Équipe)
 * - Filtrage par permissions et rôles
 * - Vue mois/semaine/jour
 * - Onglets : Mes Tâches / Mon Équipe / Vue Complète
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  Building2,
} from 'lucide-react';
import { useTasks, type Task } from '@/hooks/optimized';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';
import { supabase } from '@/integrations/supabase/client';
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
} from 'date-fns';
import { fr } from 'date-fns/locale';

type ViewMode = 'month' | 'week' | 'day';
type FilterMode = 'personal' | 'team' | 'all';

export default function Calendar() {
  const { tasks, loading } = useTasks();
  const { accessRights } = useRoleBasedAccess();
  const { userRoles, isSuperAdmin } = useUserRoles();
  
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filterMode, setFilterMode] = useState<FilterMode>('personal');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProjects, setUserProjects] = useState<string[]>([]);

  // Récupérer l'ID utilisateur et ses projets
  React.useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);
      
      // Récupérer les projets de l'utilisateur
      const { data: projectMembers } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (projectMembers) {
        setUserProjects(projectMembers.map(pm => pm.project_id));
      }
    };
    
    fetchUserData();
  }, []);

  // Filtrer les tâches selon le mode
  // Note: Le filtrage de base par tenant/permissions est fait dans useTasksEnterprise
  // Ici on filtre uniquement par mode d'affichage (personnel/équipe/tout)
  const filteredTasks = useMemo(() => {
    if (!currentUserId) return [];

    switch (filterMode) {
      case 'personal':
        // Option 1 : Tâches assignées à l'utilisateur
        return tasks.filter(task => task.assignee_id === currentUserId);
      
      case 'team':
        // Option 2 : Tâches des projets de l'utilisateur
        return tasks.filter(task => 
          task.project_id && userProjects.includes(task.project_id)
        );
      
      case 'all':
        // Vue complète : Personnel + Équipe (sans doublons)
        const personalTaskIds = new Set(
          tasks
            .filter(task => task.assignee_id === currentUserId)
            .map(task => task.id)
        );
        
        return tasks.filter(task => 
          personalTaskIds.has(task.id) || 
          (task.project_id && userProjects.includes(task.project_id))
        );
      
      default:
        return tasks;
    }
  }, [tasks, filterMode, currentUserId, userProjects, isSuperAdmin]);

  // Vérifier les permissions pour afficher certaines vues
  const canViewTeamCalendar = useMemo(() => {
    // Peut voir le calendrier d'équipe si:
    // - Super Admin
    // - Tenant Admin
    // - A des permissions de gestion de projets
    return isSuperAdmin() || 
           accessRights.canAccessSuperAdmin || 
           accessRights.canAccessProjects ||
           userProjects.length > 0;
  }, [isSuperAdmin, accessRights, userProjects]);

  // Calculer la plage de dates affichée
  const { startDate, endDate, days } = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
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

    filteredTasks.forEach((task) => {
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

  const getTaskTypeIcon = (task: Task) => {
    if (task.assignee_id === currentUserId) {
      return <User className="h-3 w-3" />;
    }
    return <Users className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendrier</h1>
          <p className="text-muted-foreground">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode */}
          <div className="flex gap-1 border rounded-lg p-1">
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

      {/* Tabs de filtrage */}
      <Tabs value={filterMode} onValueChange={(value) => setFilterMode(value as FilterMode)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Mes Tâches</span>
          </TabsTrigger>
          {canViewTeamCalendar && (
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Mon Équipe</span>
            </TabsTrigger>
          )}
          {canViewTeamCalendar && (
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Vue Complète</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={filterMode} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendrier Principal */}
            <Card className="lg:col-span-2">
              <CardContent className="p-4">
                {viewMode === 'month' && (
                  <div className="space-y-2">
                    {/* Jours de la semaine */}
                    <div className="grid grid-cols-7 gap-2">
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Grille des jours */}
                    <div className="grid grid-cols-7 gap-2">
                      {days.map((day) => {
                        const dayTasks = getTasksForDay(day);
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isSelected = selectedDate && isSameDay(day, selectedDate);

                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={`
                              min-h-[80px] p-2 border rounded-lg text-left hover:bg-accent transition-colors
                              ${!isCurrentMonth ? 'opacity-40' : ''}
                              ${isToday(day) ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}
                              ${isSelected ? 'ring-2 ring-blue-500' : ''}
                            `}
                          >
                            <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>

                            {dayTasks.length > 0 && (
                              <div className="space-y-1">
                                {dayTasks.slice(0, 2).map((task) => (
                                  <div
                                    key={task.id}
                                    className={`text-xs truncate px-1 py-0.5 rounded flex items-center gap-1 ${getPriorityColor(
                                      task.priority
                                    )} text-white`}
                                    title={task.title}
                                  >
                                    {getTaskTypeIcon(task)}
                                    <span className="truncate">{task.title}</span>
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
                      {days.map((day) => (
                        <div
                          key={day.toISOString()}
                          className={`text-center p-2 ${isToday(day) ? 'bg-blue-50 dark:bg-blue-950/20 rounded-lg' : ''}`}
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
                      {days.map((day) => {
                        const dayTasks = getTasksForDay(day);

                        return (
                          <div key={day.toISOString()} className="space-y-1">
                            {dayTasks.map((task) => (
                              <div
                                key={task.id}
                                className={`text-xs p-1 rounded flex items-center gap-1 ${getPriorityColor(
                                  task.priority
                                )} text-white truncate`}
                                title={task.title}
                              >
                                {getTaskTypeIcon(task)}
                                <span className="truncate">{task.title}</span>
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
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate
                    ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
                    : "Sélectionnez un jour"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Aucune tâche pour ce jour
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedDayTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getTaskTypeIcon(task)}
                              <h4 className="font-medium text-sm">{task.title}</h4>
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                          <Badge variant="secondary">{task.status}</Badge>
                          {task.assignee_id === currentUserId && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Ma tâche
                            </Badge>
                          )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{filteredTasks.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {filterMode === 'personal' ? 'Mes tâches' : 
                     filterMode === 'team' ? "Tâches d'équipe" : 
                     'Total tâches'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {Array.from(tasksByDate.values()).filter((t) => t.length > 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Jours avec tâches</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {Math.round((filteredTasks.length / days.length) * 10) / 10}
                  </p>
                  <p className="text-sm text-muted-foreground">Tâches/jour moyen</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {filteredTasks.filter((t) => t.priority?.toLowerCase() === 'high').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Haute priorité</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
