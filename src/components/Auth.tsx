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
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        onAuthStateChange(session?.user ?? null, session);
      }
    );

    // Vérifier s'il y a déjà une session
    supabase.auth.getSession().then(({ data: { session } }) => {
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

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
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