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
  const { isSuperAdmin } = useUserRoles();

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
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <InboxIcon className="h-8 w-8" />
            Boîte de Réception
          </h1>
          <p className="mt-1 text-muted-foreground">
            {stats.unread} non lu{stats.unread > 1 ? 's' : ''} • {stats.actionRequired} action
            {stats.actionRequired > 1 ? 's' : ''} requise{stats.actionRequired > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Archive className="mr-2 h-4 w-4" />
            Archiver tout
          </Button>
          <Button variant="outline" size="sm">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Marquer tout lu
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.unread}</p>
                <p className="text-sm text-muted-foreground">Non lus</p>
              </div>
              <InboxIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.actionRequired}</p>
                <p className="text-sm text-muted-foreground">Actions requises</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.tasks}</p>
                <p className="text-sm text-muted-foreground">Tâches</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.approvals}</p>
                <p className="text-sm text-muted-foreground">Approbations</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de filtrage */}
      <Tabs value={filter} onValueChange={value => setFilter(value as FilterType)}>
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="all">
            <span className="hidden sm:inline">Tout</span>
            <span className="sm:hidden">Tous</span>
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckCircle2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Tâches</span>
          </TabsTrigger>
          <TabsTrigger value="approvals">
            <Clock className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Approbations</span>
          </TabsTrigger>
          <TabsTrigger value="mentions">
            <User className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Mentions</span>
          </TabsTrigger>
          <TabsTrigger value="invites">
            <Users className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Invitations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <InboxIcon className="mb-4 h-16 w-16 text-muted-foreground" />
                <p className="text-lg font-medium">Aucun élément</p>
                <p className="text-sm text-muted-foreground">Votre boîte de réception est vide</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => (
                <Card key={item.id} className={item.isRead ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icône */}
                      <div className="mt-1 flex-shrink-0">{getItemIcon(item.type)}</div>

                      {/* Contenu */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className={`font-medium ${!item.isRead ? 'font-bold' : ''}`}>
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex flex-shrink-0 items-center gap-2">
                            {item.actionRequired && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Action requise
                              </Badge>
                            )}
                            {getPriorityBadge(item.priority)}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.date)}
                          </span>

                          <div className="flex gap-1">
                            {!item.isRead && (
                              <Button variant="ghost" size="sm">
                                Marquer lu
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Archive className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
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
