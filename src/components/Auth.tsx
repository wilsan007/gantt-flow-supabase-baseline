import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { User, Session } from '@supabase/supabase-js';

interface AuthProps {
  onAuthStateChange: (user: User | null, session: Session | null) => void;
}

export const Auth = ({ onAuthStateChange }: AuthProps) => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [fullName, setFullName] = useState('Admin User'); // Ajout du state pour le nom complet
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event);
        if (session?.user) {
          console.log('👤 Utilisateur connecté:', {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            created_at: session.user.created_at
          });
        } else {
          console.log('👤 Aucun utilisateur connecté');
        }
        onAuthStateChange(session?.user ?? null, session);
      }
    );

    // Vérifier s'il y a déjà une session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log('🔄 Session existante détectée:', {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        });
      }
      onAuthStateChange(session?.user ?? null, session);
    });

    return () => subscription.unsubscribe();
  }, [onAuthStateChange]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Générer le nom de l'entreprise basé sur le nom complet
    const companyName = `Entreprise ${fullName}`;
    
    // Étape 1: Créer le tenant et l'invitation
    const { data: tenantData, error: tenantError } = await (supabase as any)
      .from('tenants')
      .insert({
        name: companyName,
        slug: companyName.toLowerCase().replace(/\s+/g, '-'),
        status: 'active'
      })
      .select()
      .single();

    if (tenantError || !tenantData) {
      console.error('Erreur lors de la création du tenant:', tenantError);
      return { error: tenantError || new Error('Impossible de créer le tenant.') };
    }

    const newTenantId = tenantData.id;

    // Étape 2: Créer l'invitation avec l'ID du tenant
    const { error: invitationError } = await (supabase as any).from('invitations').insert({
      email,
      full_name: fullName,
      status: 'pending',
      invitation_type: 'tenant_owner',
      tenant_id: newTenantId,
    });

    if (invitationError) {
      console.error('Erreur lors de la création de l\'invitation:', invitationError);
      // En cas d'erreur, supprimer le tenant qui vient d'être créé pour nettoyer
      await (supabase as any).from('tenants').delete().eq('id', newTenantId);
      return { error: invitationError };
    }

    // Étape 2: Inscrire l'utilisateur avec Supabase Auth
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = isSignUp
        ? await signUp(email, password, fullName)
        : await signIn(email, password);

      if (error) {
        toast({
          title: "Erreur d'authentification",
          description: error.message,
          variant: "destructive",
        });
      } else if (isSignUp) {
        toast({
          title: "Inscription réussie",
          description: "Vérifiez votre email pour confirmer votre compte",
        });
      } else {
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? 'Créer un compte' : 'Connexion'}</CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Créez votre compte admin pour accéder à l\'application'
              : 'Connectez-vous avec vos identifiants admin'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Votre nom complet"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? 'Chargement...' 
                : isSignUp ? 'Créer le compte' : 'Se connecter'
              }
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
            >
              {isSignUp 
                ? 'Déjà un compte ? Se connecter'
                : 'Créer un compte admin'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};