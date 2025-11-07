/**
 * 🎯 useRealtimeNotifications - Notifications temps réel avec Supabase Realtime
 * Pattern: Linear, Slack, Discord
 * 
 * Fonctionnalités:
 * - Écoute des changements en temps réel
 * - Notifications pour: congés, tâches, approbations
 * - Badge compteur non-lues
 * - Marquage lu/non-lu
 * - Persistence des notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: 'leave_request' | 'leave_approval' | 'task_assigned' | 'task_completed' | 'mention' | 'system';
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

interface UseRealtimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useRealtimeNotifications = (): UseRealtimeNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const channelRef = useRef<RealtimeChannel | null>(null);

  /**
   * Charger les notifications existantes
   */
  const fetchNotifications = useCallback(async () => {
    if (!currentTenant?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Non authentifié');
      }

      // Récupérer les 50 dernières notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications((data as Notification[]) || []);
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.id]);

  /**
   * Configurer l'écoute en temps réel
   */
  useEffect(() => {
    if (!currentTenant?.id) return;

    const setupRealtime = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      // Créer un canal pour écouter les nouvelles notifications
      const channel = supabase
        .channel(`notifications:${session.session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.session.user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            
            // Ajouter la notification à la liste
            setNotifications((prev) => [newNotification, ...prev].slice(0, 50));

            // Afficher un toast
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000,
            });

            // Jouer un son (optionnel)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/favicon.ico',
              });
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    setupRealtime();
    fetchNotifications();

    // Nettoyage
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [currentTenant?.id, fetchNotifications, toast]);

  /**
   * Marquer une notification comme lue
   */
  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Erreur marquage notification:', err);
    }
  }, []);

  /**
   * Marquer toutes les notifications comme lues
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user || !currentTenant?.id) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('tenant_id', currentTenant.id)
        .eq('user_id', session.session.user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error('Erreur marquage toutes notifications:', err);
    }
  }, [currentTenant?.id]);

  /**
   * Supprimer une notification
   */
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Erreur suppression notification:', err);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
};
