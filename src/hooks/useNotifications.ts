import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  entity_type?: string;
  entity_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read_at?: string;
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
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setNotifications((data || []) as Notification[]);
      setUnreadCount((data || []).filter(n => !n.read_at).length);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les notifications',
        variant: 'destructive'
      });
    }
  };

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*');

      if (error) throw error;
      setPreferences(data || []);
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase.rpc('mark_notifications_read', {
        notification_ids: notificationIds
      });

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));

    } catch (error: any) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer les notifications comme lues',
        variant: 'destructive'
      });
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
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

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.user.id,
          notification_type: notificationType,
          enabled,
          email_enabled: emailEnabled ?? false,
          in_app_enabled: enabled
        });

      if (error) throw error;

      setPreferences(prev => {
        const existing = prev.find(p => p.notification_type === notificationType);
        if (existing) {
          return prev.map(p => 
            p.notification_type === notificationType 
              ? { ...p, enabled, in_app_enabled: enabled, email_enabled: emailEnabled ?? p.email_enabled }
              : p
          );
        } else {
          return [...prev, {
            id: crypto.randomUUID(),
            notification_type: notificationType,
            enabled,
            email_enabled: emailEnabled ?? false,
            in_app_enabled: enabled
          }];
        }
      });

      toast({
        title: 'Succès',
        description: 'Préférences de notification mises à jour'
      });

    } catch (error: any) {
      console.error('Error updating preference:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les préférences',
        variant: 'destructive'
      });
    }
  };

  const getNotificationsByType = (type: string) => {
    return notifications.filter(n => n.notification_type === type);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.read_at);
  };

  const getPriorityNotifications = () => {
    return notifications.filter(n => n.priority === 'urgent' || n.priority === 'high');
  };

  // Real-time subscription and auto-popup for unread notifications
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('New notification received:', payload);
          const newNotification = payload.new as Notification;
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast for high priority notifications
          if (newNotification.priority === 'urgent' || newNotification.priority === 'high') {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.priority === 'urgent' ? 'destructive' : 'default'
            });
          }
        }
      )
      .subscribe();

    setLoading(false);

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    notifications,
    preferences,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    updatePreference,
    getNotificationsByType,
    getUnreadNotifications,
    getPriorityNotifications
  };
};