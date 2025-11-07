import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserFilterContext } from '@/hooks/useUserAuth';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  entity_type?: string;
  entity_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read_at?: string;
  viewed_at?: string; // Nouvelle propriété pour "vu"
  dismissed_at?: string; // Nouvelle propriété pour "fermé"
  created_at: string;
  metadata?: any;
  sender_id?: string;
}

export interface NotificationPreference {
  id: string;
  notification_type: string;
  enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unviewedCount, setUnviewedCount] = useState(0); // Nouvelles notifications non vues
  const [lastViewedAt, setLastViewedAt] = useState<string | null>(null); // Dernière consultation
  const { toast } = useToast();

  // 🔒 Contexte utilisateur pour le filtrage
  const { userContext } = useUserFilterContext();

  const fetchNotifications = async () => {
    if (!userContext) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // 🔒 Appliquer le filtrage par rôle (notifications sont déjà filtrées par user_id dans roleBasedFiltering)
      query = applyRoleFilters(query, userContext, 'notifications');

      const { data, error } = await query;

      if (error) throw error;

      const notificationData = (data || []) as Notification[];
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.read_at).length);

      // Calculer les notifications non vues (nouvelles depuis la dernière consultation)
      const storedLastViewed = localStorage.getItem('notifications_last_viewed');
      if (storedLastViewed) {
        setLastViewedAt(storedLastViewed);
        const lastViewedDate = new Date(storedLastViewed);
        setUnviewedCount(
          notificationData.filter(n => new Date(n.created_at) > lastViewedDate && !n.dismissed_at)
            .length
        );
      } else {
        setUnviewedCount(notificationData.filter(n => !n.dismissed_at).length);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les notifications',
        variant: 'destructive',
      });
    }
  };

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase.from('notification_preferences').select('*');

      if (error) throw error;
      setPreferences(data || []);
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase.rpc('mark_notifications_read', {
        notification_ids: notificationIds,
      });

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          notificationIds.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error: any) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer les notifications comme lues',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  // Marquer les notifications comme vues (lors de l'ouverture du popup)
  const markAsViewed = async () => {
    const now = new Date().toISOString();
    localStorage.setItem('notifications_last_viewed', now);
    setLastViewedAt(now);
    setUnviewedCount(0);

    // Mettre à jour en base de données avec une requête directe
    try {
      const unviewedIds = notifications
        .filter(n => !lastViewedAt || new Date(n.created_at) > new Date(lastViewedAt))
        .map(n => n.id);

      if (unviewedIds.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .update({ viewed_at: now } as any)
          .in('id', unviewedIds);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error marking notifications as viewed:', error);
    }
  };

  // Marquer des notifications comme fermées/ignorées
  const markAsDismissed = async (notificationIds: string[]) => {
    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: now } as any)
        .in('id', notificationIds);

      if (error) throw error;

      // Mettre à jour l'état local
      setNotifications(prev =>
        prev.map(n => (notificationIds.includes(n.id) ? { ...n, dismissed_at: now } : n))
      );

      // Recalculer les compteurs
      localStorage.setItem('notifications_last_viewed', now);
      setLastViewedAt(now);
      setUnviewedCount(0);

      toast({
        title: '✅ Notifications fermées',
        description: 'Les notifications ont été marquées comme vues.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error dismissing notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de fermer les notifications',
        variant: 'destructive',
      });
    }
  };

  const updatePreference = async (
    notificationType: string,
    enabled: boolean,
    emailEnabled?: boolean
  ) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase.from('notification_preferences').upsert({
        user_id: user.user.id,
        notification_type: notificationType,
        enabled,
        email_enabled: emailEnabled ?? false,
        in_app_enabled: enabled,
      });

      if (error) throw error;

      setPreferences(prev => {
        const existing = prev.find(p => p.notification_type === notificationType);
        if (existing) {
          return prev.map(p =>
            p.notification_type === notificationType
              ? {
                  ...p,
                  enabled,
                  in_app_enabled: enabled,
                  email_enabled: emailEnabled ?? p.email_enabled,
                }
              : p
          );
        } else {
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              notification_type: notificationType,
              enabled,
              email_enabled: emailEnabled ?? false,
              in_app_enabled: enabled,
            },
          ];
        }
      });

      toast({
        title: 'Succès',
        description: 'Préférences de notification mises à jour',
      });
    } catch (error: any) {
      console.error('Error updating preference:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les préférences',
        variant: 'destructive',
      });
    }
  };

  const getNotificationsByType = (type: string) => {
    return notifications.filter(n => n.notification_type === type);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.read_at);
  };

  // Nouvelles notifications depuis la dernière consultation
  const getUnviewedNotifications = () => {
    if (!lastViewedAt) {
      return notifications.filter(n => !n.dismissed_at);
    }
    const lastViewedDate = new Date(lastViewedAt);
    return notifications.filter(n => new Date(n.created_at) > lastViewedDate && !n.dismissed_at);
  };

  // Notifications non fermées (à afficher dans le popup)
  const getActiveNotifications = () => {
    return notifications.filter(n => !n.dismissed_at);
  };

  const getPriorityNotifications = () => {
    return notifications.filter(n => n.priority === 'urgent' || n.priority === 'high');
  };

  // Real-time subscription and auto-popup for unread notifications
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();

    let channel: any = null;

    // Subscribe to new notifications for current user
    const setupSubscription = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      channel = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.user.id}`,
          },
          payload => {
            // console.log('New notification received:', payload);
            const newNotification = payload.new as Notification;

            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            setUnviewedCount(prev => prev + 1); // Nouvelle notification = non vue

            // Show toast for high priority notifications
            if (newNotification.priority === 'urgent' || newNotification.priority === 'high') {
              toast({
                title: newNotification.title,
                description: newNotification.message,
                variant: newNotification.priority === 'urgent' ? 'destructive' : 'default',
              });
            }
          }
        )
        .subscribe();
    };

    setupSubscription();
    setLoading(false);

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return {
    notifications,
    preferences,
    loading,
    unreadCount,
    unviewedCount, // Nouvelles notifications non vues
    lastViewedAt,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    markAsViewed, // Marquer comme vu lors de l'ouverture
    markAsDismissed, // Marquer comme fermé
    updatePreference,
    getNotificationsByType,
    getUnreadNotifications,
    getUnviewedNotifications, // Nouvelles notifications
    getActiveNotifications, // Notifications non fermées
    getPriorityNotifications,
  };
};
