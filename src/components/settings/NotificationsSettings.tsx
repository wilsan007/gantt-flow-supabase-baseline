/**
 * NotificationsSettings - Gestion des préférences de notifications
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Mail, MessageSquare, Calendar, Users, FileText } from 'lucide-react';

interface NotificationPreference {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  inApp: boolean;
  email: boolean;
}

export const NotificationsSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      type: 'tasks',
      label: 'Tâches',
      description: 'Notifications sur les tâches assignées',
      icon: <FileText className="h-4 w-4" />,
      inApp: true,
      email: true,
    },
    {
      type: 'mentions',
      label: 'Mentions',
      description: 'Quand quelqu\'un vous mentionne',
      icon: <MessageSquare className="h-4 w-4" />,
      inApp: true,
      email: true,
    },
    {
      type: 'meetings',
      label: 'Réunions',
      description: 'Rappels de réunions et événements',
      icon: <Calendar className="h-4 w-4" />,
      inApp: true,
      email: false,
    },
    {
      type: 'team',
      label: 'Équipe',
      description: 'Mises à jour de l\'équipe',
      icon: <Users className="h-4 w-4" />,
      inApp: true,
      email: false,
    },
  ]);

  const { toast } = useToast();

  const handleToggle = async (index: number, field: 'inApp' | 'email') => {
    const updated = [...preferences];
    updated[index][field] = !updated[index][field];
    setPreferences(updated);

    toast({
      title: 'Préférences mises à jour',
      description: 'Vos préférences de notifications ont été enregistrées.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Préférences de notifications</CardTitle>
          <CardDescription>
            Choisissez comment vous souhaitez être notifié
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {preferences.map((pref, index) => (
            <div key={pref.type} className="flex items-start justify-between py-4 border-b last:border-0">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1 text-muted-foreground">{pref.icon}</div>
                <div className="flex-1">
                  <Label className="text-base font-medium">{pref.label}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{pref.description}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 ml-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${pref.type}-app`} className="text-sm cursor-pointer">
                    Dans l'app
                  </Label>
                  <Switch
                    id={`${pref.type}-app`}
                    checked={pref.inApp}
                    onCheckedChange={() => handleToggle(index, 'inApp')}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${pref.type}-email`} className="text-sm cursor-pointer">
                    Par email
                  </Label>
                  <Switch
                    id={`${pref.type}-email`}
                    checked={pref.email}
                    onCheckedChange={() => handleToggle(index, 'email')}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
