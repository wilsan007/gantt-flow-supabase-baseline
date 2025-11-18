/**
 * Inbox Page - Boîte de Réception
 *
 * Fonctionnalités :
 * - Notifications de tâches assignées
 * - Demandes d'approbation RH
 * - Mentions et commentaires
 * - Invitations aux projets
 * - Filtres et tri
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Inbox as InboxIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Users,
  FileText,
  Calendar,
  Trash2,
  Archive,
} from 'lucide-react';
import { useTasks } from '@/hooks/optimized';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isToday, isYesterday, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

type FilterType = 'all' | 'tasks' | 'approvals' | 'mentions' | 'invites';

interface InboxItem {
  id: string;
  type: 'task' | 'approval' | 'mention' | 'invite';
  title: string;
  description?: string;
  date: string;
  isRead: boolean;
  priority?: 'high' | 'medium' | 'low';
  actionRequired?: boolean;
  relatedId?: string;
}

export default function Inbox() {
  const { tasks, loading: tasksLoading } = useTasks();
  const { leaveRequests, loading: hrLoading } = useHRMinimal();
  const isMobile = useIsMobile();

  const [filter, setFilter] = useState<FilterType>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Récupérer l'ID utilisateur
  React.useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchUser();
  }, []);

  // Construire les éléments de la boîte de réception
  const inboxItems = useMemo((): InboxItem[] => {
    if (!currentUserId) return [];

    const items: InboxItem[] = [];

    // 1. Tâches assignées récemment (dernières 7 jours)
    const recentTasks = tasks.filter(task => {
      if (task.assignee_id !== currentUserId) return false;
      if (!task.created_at) return false;

      const createdDate = parseISO(task.created_at);
      const daysDiff = differenceInDays(new Date(), createdDate);
      return daysDiff <= 7;
    });

    recentTasks.forEach(task => {
      items.push({
        id: task.id,
        type: 'task',
        title: `Nouvelle tâche assignée : ${task.title}`,
        description: task.description,
        date: task.created_at!,
        isRead: false,
        priority: task.priority?.toLowerCase() as any,
        actionRequired: task.status !== 'completed',
        relatedId: task.id,
      });
    });

    // 2. Demandes d'approbation de congés (statut pending)
    const pendingApprovals = leaveRequests.filter(request => request.status === 'pending');

    pendingApprovals.forEach(request => {
      items.push({
        id: request.id,
        type: 'approval',
        title: `Demande de congé : ${request.employee_name || 'Employé'}`,
        description: `${format(parseISO(request.start_date), 'dd MMM', { locale: fr })} - ${format(parseISO(request.end_date), 'dd MMM', { locale: fr })}`,
        date: request.created_at,
        isRead: false,
        actionRequired: true,
        relatedId: request.id,
      });
    });

    // 3. Tâches en retard assignées à l'utilisateur
    const overdueTasks = tasks.filter(task => {
      if (task.assignee_id !== currentUserId) return false;
      if (task.status === 'completed') return false;
      if (!task.due_date) return false;

      const dueDate = parseISO(task.due_date);
      return dueDate < new Date();
    });

    overdueTasks.forEach(task => {
      items.push({
        id: `overdue-${task.id}`,
        type: 'task',
        title: `⚠️ Tâche en retard : ${task.title}`,
        description: `Échéance dépassée depuis ${differenceInDays(new Date(), parseISO(task.due_date!))} jour(s)`,
        date: task.due_date!,
        isRead: false,
        priority: 'high',
        actionRequired: true,
        relatedId: task.id,
      });
    });

    // Trier par date (plus récent en premier)
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tasks, leaveRequests, currentUserId]);

  // Filtrer selon l'onglet sélectionné
  const filteredItems = useMemo(() => {
    if (filter === 'all') return inboxItems;

    switch (filter) {
      case 'tasks':
        return inboxItems.filter(item => item.type === 'task');
      case 'approvals':
        return inboxItems.filter(item => item.type === 'approval');
      case 'mentions':
        return inboxItems.filter(item => item.type === 'mention');
      case 'invites':
        return inboxItems.filter(item => item.type === 'invite');
      default:
        return inboxItems;
    }
  }, [inboxItems, filter]);

  // Statistiques
  const stats = useMemo(() => {
    const unread = inboxItems.filter(item => !item.isRead).length;
    const actionRequired = inboxItems.filter(item => item.actionRequired).length;
    const tasks = inboxItems.filter(item => item.type === 'task').length;
    const approvals = inboxItems.filter(item => item.type === 'approval').length;

    return { unread, actionRequired, tasks, approvals };
  }, [inboxItems]);

  const getItemIcon = (type: InboxItem['type']) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      case 'approval':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'mention':
        return <User className="h-5 w-5 text-purple-500" />;
      case 'invite':
        return <Users className="h-5 w-5 text-green-500" />;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;

    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };

    return <Badge className={colors[priority as keyof typeof colors]}>{priority}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);

    if (isToday(date)) {
      return `Aujourd'hui ${format(date, 'HH:mm')}`;
    }
    if (isYesterday(date)) {
      return `Hier ${format(date, 'HH:mm')}`;
    }

    const daysDiff = differenceInDays(new Date(), date);
    if (daysDiff <= 7) {
      return format(date, 'EEEE HH:mm', { locale: fr });
    }

    return format(date, 'dd MMM yyyy', { locale: fr });
  };

  if (tasksLoading || hrLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header - Ultra Responsive */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold sm:gap-3 sm:text-3xl">
              <InboxIcon className="h-6 w-6 shrink-0 sm:h-8 sm:w-8" />
              <span className="truncate">Boîte de Réception</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              <span className="font-medium">
                {stats.unread} non lu{stats.unread > 1 ? 's' : ''}
              </span>
              <span className="hidden sm:inline"> • </span>
              <span className="block sm:inline">
                {stats.actionRequired} action{stats.actionRequired > 1 ? 's' : ''} requise
                {stats.actionRequired > 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </div>

        {/* Actions - Full width mobile, inline desktop */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" className="w-full justify-center sm:w-auto">
            <Archive className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Archiver</span>
            <span className="sm:hidden">Archiver</span>
            <span className="hidden sm:inline"> tout</span>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-center sm:w-auto">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Marquer tout lu
          </Button>
        </div>
      </div>

      {/* Statistiques rapides - Grid responsive */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold sm:text-2xl">{stats.unread}</p>
                <p className="text-muted-foreground text-xs sm:text-sm">Non lus</p>
              </div>
              <InboxIcon className="text-muted-foreground h-6 w-6 sm:h-8 sm:w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold sm:text-2xl">{stats.actionRequired}</p>
                <p className="text-muted-foreground text-xs sm:text-sm">Actions</p>
              </div>
              <AlertCircle className="h-6 w-6 text-orange-500 sm:h-8 sm:w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold sm:text-2xl">{stats.tasks}</p>
                <p className="text-muted-foreground text-xs sm:text-sm">Tâches</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-blue-500 sm:h-8 sm:w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold sm:text-2xl">{stats.approvals}</p>
                <p className="text-muted-foreground text-xs sm:text-sm">Approb.</p>
              </div>
              <Clock className="h-6 w-6 text-purple-500 sm:h-8 sm:w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de filtrage - Scroll horizontal mobile */}
      <Tabs value={filter} onValueChange={value => setFilter(value as FilterType)}>
        <div className="-mx-4 sm:mx-0">
          <TabsList className="grid h-auto w-full grid-cols-5 gap-1 overflow-x-auto p-1 sm:max-w-2xl sm:gap-0">
            <TabsTrigger value="all" className="shrink-0 text-xs sm:text-sm">
              <span className="hidden sm:inline">Tout</span>
              <span className="sm:hidden">Tous</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="shrink-0 px-2 text-xs sm:px-3 sm:text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Tâches</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="shrink-0 px-2 text-xs sm:px-3 sm:text-sm">
              <Clock className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Approb.</span>
            </TabsTrigger>
            <TabsTrigger value="mentions" className="shrink-0 px-2 text-xs sm:px-3 sm:text-sm">
              <User className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mentions</span>
            </TabsTrigger>
            <TabsTrigger value="invites" className="shrink-0 px-2 text-xs sm:px-3 sm:text-sm">
              <Users className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Invites</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={filter} className="mt-4 sm:mt-6">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <InboxIcon className="text-muted-foreground mb-4 h-16 w-16" />
                <p className="text-lg font-medium">Aucun élément</p>
                <p className="text-muted-foreground text-sm">Votre boîte de réception est vide</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredItems.map(item => (
                <Card
                  key={item.id}
                  className={`group transition-all hover:shadow-md active:scale-[0.99] ${item.isRead ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-4">
                      {/* Icône - Plus petite mobile */}
                      <div className="mt-0.5 shrink-0 sm:mt-1">
                        <div className="hidden sm:block">{getItemIcon(item.type)}</div>
                        <div className="flex sm:hidden">
                          {item.type === 'task' && (
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          )}
                          {item.type === 'approval' && (
                            <Clock className="h-4 w-4 text-orange-500" />
                          )}
                          {item.type === 'mention' && <User className="h-4 w-4 text-purple-500" />}
                          {item.type === 'invite' && <Users className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="min-w-0 flex-1">
                        <div className="space-y-2">
                          {/* Titre et contenu */}
                          <div className="min-w-0">
                            <h3
                              className={`text-sm leading-tight sm:text-base ${!item.isRead ? 'font-bold' : 'font-medium'}`}
                            >
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs sm:text-sm">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Badges - Stack sur mobile si nécessaire */}
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {item.actionRequired && (
                              <Badge variant="destructive" className="text-[10px] sm:text-xs">
                                <AlertCircle className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
                                <span className="hidden sm:inline">Action requise</span>
                                <span className="sm:hidden">Action</span>
                              </Badge>
                            )}
                            {getPriorityBadge(item.priority)}
                          </div>
                        </div>

                        {/* Footer - Actions adaptées mobile */}
                        <div className="mt-2 flex flex-col gap-2 sm:mt-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-muted-foreground flex items-center gap-1 text-[11px] sm:text-xs">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span className="truncate">{formatDate(item.date)}</span>
                          </span>

                          {/* Actions - Icon only mobile, text desktop */}
                          <div className="flex gap-1">
                            {!item.isRead && (
                              <Button variant="ghost" size="sm" className="h-8 text-xs sm:h-9">
                                <CheckCircle2 className="h-3.5 w-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">Marquer lu</span>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                              <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="sr-only">Archiver</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
