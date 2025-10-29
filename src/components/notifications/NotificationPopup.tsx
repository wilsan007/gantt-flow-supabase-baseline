import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  MessageSquare, 
  Users, 
  Webhook, 
  Smartphone,
  ExternalLink,
  Settings,
  Send,
  Check
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationChannels } from '@/hooks/useNotificationChannels';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  open,
  onOpenChange
}) => {
  const { 
    getUnviewedNotifications, 
    getActiveNotifications,
    markAsRead, 
    markAsViewed, 
    markAsDismissed,
    unviewedCount 
  } = useNotifications();
  const { 
    channels, 
    loading, 
    sendEmailNotifications, 
    sendSlackNotification, 
    sendTeamsNotification,
    sendWebPushNotification,
    setChannels 
  } = useNotificationChannels();

  const [slackWebhook, setSlackWebhook] = useState('');
  const [teamsWebhook, setTeamsWebhook] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Utiliser les nouvelles notifications non vues au lieu des non lues
  const unviewedNotifications = getUnviewedNotifications();
  const activeNotifications = getActiveNotifications(); // Toutes les notifications non fermées

  useEffect(() => {
    if (open) {
      // Marquer comme vu dès l'ouverture du popup
      markAsViewed();
      
      // Auto-select high priority notifications parmi les nouvelles
      if (unviewedNotifications.length > 0) {
        const highPriorityIds = unviewedNotifications
          .filter(n => n.priority === 'urgent' || n.priority === 'high')
          .map(n => n.id);
        setSelectedNotifications(highPriorityIds);
      }
    }
  }, [open, unviewedNotifications.length, markAsViewed]);

  const handleSendEmails = async () => {
    if (selectedNotifications.length === 0) return;
    await sendEmailNotifications(selectedNotifications);
    markAsRead(selectedNotifications);
  };

  const handleSendSlack = async () => {
    if (selectedNotifications.length === 0 || !slackWebhook) return;
    await sendSlackNotification(selectedNotifications, slackWebhook);
  };

  const handleSendTeams = async () => {
    if (selectedNotifications.length === 0 || !teamsWebhook) return;
    await sendTeamsNotification(selectedNotifications, teamsWebhook);
  };

  const handleSendBrowserNotifications = async () => {
    for (const notification of activeNotifications.filter(n => selectedNotifications.includes(n.id))) {
      await sendWebPushNotification(
        notification.title,
        notification.message,
        {
          tag: notification.id,
          requireInteraction: notification.priority === 'urgent',
          silent: notification.priority === 'low'
        }
      );
    }
  };

  // Nouvelle fonction pour fermer les notifications
  const handleDismissNotifications = async () => {
    if (selectedNotifications.length === 0) return;
    await markAsDismissed(selectedNotifications);
    setSelectedNotifications([]);
    onOpenChange(false); // Fermer le popup
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'slack': return <MessageSquare className="h-4 w-4" />;
      case 'teams': return <Users className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📢 Nouvelles notifications
            <Badge variant="destructive">{unviewedNotifications.length}</Badge>
            {activeNotifications.length > unviewedNotifications.length && (
              <Badge variant="outline">
                {activeNotifications.length - unviewedNotifications.length} anciennes
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">
              Notifications ({activeNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="channels">
              Canaux de diffusion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="flex-1 flex flex-col overflow-hidden">
            {activeNotifications.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium">Tout est à jour !</h3>
                  <p>Aucune nouvelle notification</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
                {/* Liste des notifications */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      Notifications 
                      {unviewedNotifications.length > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {unviewedNotifications.length} nouvelles
                        </Badge>
                      )}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedNotifications.length === activeNotifications.length) {
                            setSelectedNotifications([]);
                          } else {
                            setSelectedNotifications(activeNotifications.map(n => n.id));
                          }
                        }}
                      >
                        {selectedNotifications.length === activeNotifications.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDismissNotifications}
                        disabled={selectedNotifications.length === 0}
                      >
                        Fermer ({selectedNotifications.length})
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {activeNotifications.map((notification) => {
                        const isNew = unviewedNotifications.some(n => n.id === notification.id);
                        return (
                        <Card 
                          key={notification.id} 
                          className={`cursor-pointer transition-all ${
                            selectedNotifications.includes(notification.id) 
                              ? 'ring-2 ring-primary bg-accent/50' 
                              : 'hover:bg-accent/30'
                          } ${isNew ? 'border-l-4 border-l-blue-500' : ''}`}
                          onClick={() => {
                            setSelectedNotifications(prev => 
                              prev.includes(notification.id)
                                ? prev.filter(id => id !== notification.id)
                                : [...prev, notification.id]
                            );
                          }}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getPriorityColor(notification.priority)}`} />
                              <CardTitle className="text-sm flex items-center gap-2">
                                {notification.title}
                                {isNew && <Badge variant="secondary" className="text-xs">Nouveau</Badge>}
                              </CardTitle>
                              <Badge variant="outline" className="text-xs ml-auto">
                                {notification.priority}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: fr
                              })}
                            </div>
                          </CardContent>
                        </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Actions d'envoi */}
                <div className="space-y-4">
                  <h3 className="font-medium">Diffuser via</h3>
                  
                  <div className="space-y-3">
                    {/* Email */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">
                          Envoyer des emails avec templates professionnels
                        </p>
                        <Button 
                          onClick={handleSendEmails}
                          disabled={selectedNotifications.length === 0 || loading}
                          className="w-full"
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer emails ({selectedNotifications.length})
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Notifications navigateur */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Webhook className="h-4 w-4" />
                          Notifications navigateur
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">
                          Notifications push directes dans le navigateur
                        </p>
                        <Button 
                          onClick={handleSendBrowserNotifications}
                          disabled={selectedNotifications.length === 0}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Notifier navigateur
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Slack */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Slack
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Input
                            placeholder="Webhook URL Slack..."
                            value={slackWebhook}
                            onChange={(e) => setSlackWebhook(e.target.value)}
                            className="text-xs"
                          />
                          <Button 
                            onClick={handleSendSlack}
                            disabled={selectedNotifications.length === 0 || !slackWebhook || loading}
                            variant="outline"
                            className="w-full"
                            size="sm"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer Slack
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Teams */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Microsoft Teams
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Input
                            placeholder="Webhook URL Teams..."
                            value={teamsWebhook}
                            onChange={(e) => setTeamsWebhook(e.target.value)}
                            className="text-xs"
                          />
                          <Button 
                            onClick={handleSendTeams}
                            disabled={selectedNotifications.length === 0 || !teamsWebhook || loading}
                            variant="outline"
                            className="w-full"
                            size="sm"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer Teams
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="channels" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Configurez les différents canaux de notification disponibles.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {channels.map((channel) => (
                    <Card key={channel.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {getChannelIcon(channel.type)}
                          {channel.name}
                          <Switch
                            checked={channel.enabled}
                            onCheckedChange={(enabled) => {
                              setChannels(prev => 
                                prev.map(c => c.id === channel.id ? { ...c, enabled } : c)
                              );
                            }}
                            className="ml-auto"
                          />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {channel.type === 'email' && 'Notifications par email avec templates HTML'}
                            {channel.type === 'slack' && 'Intégration Slack via webhook'}
                            {channel.type === 'teams' && 'Intégration Microsoft Teams'}
                            {channel.type === 'webhook' && channel.config.type === 'browser_push' && 'Notifications push navigateur'}
                          </p>
                          
                          {(channel.type === 'slack' || channel.type === 'teams') && (
                            <div className="text-xs text-muted-foreground">
                              <p>Pour configurer :</p>
                              <p>1. Créez un webhook dans {channel.name}</p>
                              <p>2. Copiez l'URL du webhook</p>
                              <p>3. Utilisez-la dans la section notifications</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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