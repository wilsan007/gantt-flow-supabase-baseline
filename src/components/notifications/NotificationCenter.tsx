import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bell,
  Check,
  CheckCheck,
  Search,
  Clock,
  AlertTriangle,
  Settings,
  Filter,
} from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onOpenChange }) => {
  const {
    notifications,
    preferences,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    updatePreference,
    getUnreadNotifications,
    getPriorityNotifications,
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const notificationTypes = [
    { key: 'task_assigned', label: 'Tâches assignées', icon: '📝' },
    { key: 'task_updated', label: 'Modifications de tâches', icon: '✏️' },
    { key: 'task_comment_added', label: 'Commentaires', icon: '💬' },
    { key: 'leave_request_submitted', label: 'Demandes de congé', icon: '🏖️' },
    { key: 'leave_request_approved', label: 'Congés approuvés', icon: '✅' },
    { key: 'leave_request_rejected', label: 'Congés refusés', icon: '❌' },
    { key: 'expense_report_submitted', label: 'Notes de frais', icon: '💰' },
    { key: 'expense_report_approved', label: 'Frais approuvés', icon: '✅' },
    { key: 'expense_report_rejected', label: 'Frais refusés', icon: '❌' },
    { key: 'task_deadline_approaching', label: 'Échéances proches', icon: '⏰' },
    { key: 'workload_alert', label: 'Alertes de charge', icon: '⚠️' },
  ];

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || notification.notification_type === selectedType;
    return matchesSearch && matchesType;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'Haute';
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Faible';
      default:
        return 'Normale';
    }
  };

  const getNotificationIcon = (type: string) => {
    const notifType = notificationTypes.find(nt => nt.key === type);
    return notifType?.icon || '📢';
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead([notification.id]);
    }
  };

  const getPreferenceValue = (type: string) => {
    const pref = preferences.find(p => p.notification_type === type);
    return pref?.in_app_enabled !== false; // Default to true if not set
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Centre de notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="flex flex-1 flex-col overflow-hidden">
            <div className="space-y-4">
              {/* Search and filters */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans les notifications..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="rounded-md border bg-background px-3 py-2"
                >
                  <option value="all">Tous les types</option>
                  {notificationTypes.map(type => (
                    <option key={type.key} value={type.key}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Tout marquer comme lu
                </Button>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-muted p-3 text-center">
                  <div className="text-2xl font-bold">{unreadCount}</div>
                  <div className="text-sm text-muted-foreground">Non lues</div>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <div className="text-2xl font-bold">{getPriorityNotifications().length}</div>
                  <div className="text-sm text-muted-foreground">Prioritaires</div>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <div className="text-2xl font-bold">{notifications.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </div>

            {/* Notifications list */}
            <ScrollArea className="mt-4 flex-1">
              <div className="space-y-2">
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Chargement des notifications...
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {searchTerm || selectedType !== 'all'
                      ? 'Aucune notification trouvée pour ces critères'
                      : 'Aucune notification'}
                  </div>
                ) : (
                  filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`cursor-pointer rounded-lg border p-4 transition-all hover:bg-accent/50 ${
                        !notification.read_at ? 'border-l-4 border-l-primary bg-accent/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {getNotificationIcon(notification.notification_type)}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{notification.title}</h4>
                            <Badge
                              className={`text-xs ${getPriorityColor(notification.priority)} text-white`}
                            >
                              {getPriorityLabel(notification.priority)}
                            </Badge>
                            {!notification.read_at && (
                              <Badge variant="secondary" className="text-xs">
                                Nouveau
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground">{notification.message}</p>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.read_at && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={e => {
                                e.stopPropagation();
                                markAsRead([notification.id]);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preferences" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  Configurez les types de notifications que vous souhaitez recevoir.
                </div>

                <div className="space-y-4">
                  {notificationTypes.map(type => (
                    <div
                      key={type.key}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{type.icon}</span>
                        <div>
                          <Label className="font-medium">{type.label}</Label>
                          <div className="text-sm text-muted-foreground">
                            Recevoir des notifications pour {type.label.toLowerCase()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={getPreferenceValue(type.key)}
                            onCheckedChange={checked => updatePreference(type.key, checked)}
                          />
                          <Label className="text-sm">Activer</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
