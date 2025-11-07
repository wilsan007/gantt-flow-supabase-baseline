/**
 * TeamSettings - Gestion de l'équipe (Admin uniquement)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Mail, Shield, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: string;
  status: string;
}

export const TeamSettings = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer les membres de l'équipe via le tenant
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.tenant_id) return;

      const { data: teamMembers, error } = await supabase
        .from('user_profiles')
        .select(
          `
          user_id,
          tenant_id,
          users:user_id (
            email,
            raw_user_metadata
          ),
          user_roles!inner (
            role_id,
            roles (name)
          )
        `
        )
        .eq('tenant_id', profile.tenant_id);

      if (error) throw error;

      // Formatter les données
      const formatted =
        teamMembers?.map((member: any) => ({
          id: member.user_id,
          email: member.users?.email || '',
          full_name: member.users?.raw_user_metadata?.full_name || 'Utilisateur',
          avatar_url: member.users?.raw_user_metadata?.avatar_url || '',
          role: member.user_roles?.[0]?.roles?.name || 'user',
          status: 'active',
        })) || [];

      setMembers(formatted);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les membres de l'équipe",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-3 w-3" />;
      case 'tenant_admin':
        return <Shield className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      super_admin: 'default',
      tenant_admin: 'secondary',
      user: 'outline',
    };

    const labels: Record<string, string> = {
      super_admin: 'Super Admin',
      tenant_admin: 'Admin',
      user: 'Utilisateur',
    };

    return (
      <Badge variant={variants[role] || 'outline'} className="gap-1">
        {getRoleIcon(role)}
        {labels[role] || role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membres de l'équipe
              </CardTitle>
              <CardDescription>Gérez les membres de votre entreprise</CardDescription>
            </div>
            <Button onClick={() => navigate('/invite-collaborators')}>
              <UserPlus className="mr-2 h-4 w-4" />
              Inviter un membre
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun membre pour le moment</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/invite-collaborators')}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Inviter le premier membre
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar_url} alt={member.full_name} />
                      <AvatarFallback>
                        {member.full_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getRoleBadge(member.role)}
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    >
                      Actif
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitations en attente (à venir) */}
      <Card>
        <CardHeader>
          <CardTitle>Invitations en attente</CardTitle>
          <CardDescription>Invitations envoyées en attente d'acceptation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aucune invitation en attente</p>
        </CardContent>
      </Card>
    </div>
  );
};
