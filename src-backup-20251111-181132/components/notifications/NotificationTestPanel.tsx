import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Composant de test pour valider le système de notifications intelligent
 * À utiliser uniquement en développement pour tester les fonctionnalités
 */
export const NotificationTestPanel: React.FC = () => {
  const [testTitle, setTestTitle] = useState('Test Notification');
  const [testMessage, setTestMessage] = useState('Ceci est une notification de test');
  const [testPriority, setTestPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isCreating, setIsCreating] = useState(false);

  const {
    unviewedCount,
    unreadCount,
    lastViewedAt,
    getUnviewedNotifications,
    getActiveNotifications,
    markAsViewed,
    markAsDismissed,
    fetchNotifications,
  } = useNotifications();

  const { toast } = useToast();

  const createTestNotification = async () => {
    setIsCreating(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase.from('notifications').insert({
        recipient_id: user.user.id,
        title: testTitle,
        message: testMessage,
        notification_type: 'test',
        priority: testPriority,
        entity_type: 'test',
        entity_id: crypto.randomUUID(),
      });

      if (error) throw error;

      toast({
        title: '✅ Notification créée',
        description: 'Notification de test ajoutée avec succès',
        variant: 'default',
      });

      // Rafraîchir les notifications
      await fetchNotifications();
    } catch (error: any) {
      console.error('Error creating test notification:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la notification',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const testMarkAsViewed = async () => {
    await markAsViewed();
    toast({
      title: '👁️ Marqué comme vu',
      description: 'Toutes les notifications ont été marquées comme vues',
      variant: 'default',
    });
  };

  const testDismissAll = async () => {
    const activeNotifications = getActiveNotifications();
    if (activeNotifications.length > 0) {
      await markAsDismissed(activeNotifications.map(n => n.id));
      toast({
        title: '🗑️ Notifications fermées',
        description: `${activeNotifications.length} notifications fermées`,
        variant: 'default',
      });
    }
  };

  const resetLastViewed = () => {
    localStorage.removeItem('notifications_last_viewed');
    window.location.reload();
  };

  const unviewedNotifications = getUnviewedNotifications();
  const activeNotifications = getActiveNotifications();

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Panel de Test - Notifications Intelligentes
          <Badge variant="outline">DEV ONLY</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* État Actuel */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{unviewedCount}</div>
            <div className="text-sm text-blue-800">Nouvelles</div>
          </div>
          <div className="rounded-lg bg-orange-50 p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
            <div className="text-sm text-orange-800">Non lues</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{activeNotifications.length}</div>
            <div className="text-sm text-green-800">Actives</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-600">Dernière vue</div>
            <div className="text-sm font-medium">
              {lastViewedAt ? new Date(lastViewedAt).toLocaleTimeString() : 'Jamais'}
            </div>
          </div>
        </div>

        {/* Créer une Notification de Test */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-medium">Créer une Notification de Test</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={testTitle}
                onChange={e => setTestTitle(e.target.value)}
                placeholder="Titre de la notification"
              />
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select value={testPriority} onValueChange={(value: any) => setTestPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              placeholder="Message de la notification"
            />
          </div>

          <Button onClick={createTestNotification} disabled={isCreating} className="w-full">
            {isCreating ? 'Création...' : '➕ Créer Notification Test'}
          </Button>
        </div>

        {/* Actions de Test */}
        <div className="space-y-3">
          <h3 className="font-medium">Actions de Test</h3>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Button variant="outline" onClick={testMarkAsViewed} className="w-full">
              👁️ Marquer comme Vu
            </Button>

            <Button
              variant="outline"
              onClick={testDismissAll}
              disabled={activeNotifications.length === 0}
              className="w-full"
            >
              🗑️ Fermer Toutes ({activeNotifications.length})
            </Button>

            <Button variant="destructive" onClick={resetLastViewed} className="w-full">
              🔄 Reset État
            </Button>
          </div>
        </div>

        {/* Liste des Notifications pour Debug */}
        {unviewedNotifications.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">
              Nouvelles Notifications ({unviewedNotifications.length})
            </h3>
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {unviewedNotifications.map(notification => (
                <div
                  key={notification.id}
                  className="rounded border-l-4 border-l-blue-500 bg-blue-50 p-2 text-sm"
                >
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-gray-600">{notification.message}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleString()} - {notification.priority}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded bg-gray-50 p-3 text-xs text-gray-500">
          <strong>Instructions de Test :</strong>
          <ol className="mt-1 list-inside list-decimal space-y-1">
            <li>Créez une notification de test</li>
            <li>Observez le badge sur le bouton notifications</li>
            <li>Ouvrez le popup → notifications marquées comme vues</li>
            <li>Fermez des notifications → elles disparaissent</li>
            <li>Créez de nouvelles notifications → seules les nouvelles apparaissent</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
