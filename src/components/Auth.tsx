import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMultiplePlaceholderHandler } from '@/hooks/usePlaceholderHandler';
import { SocialAuth } from '@/components/auth/SocialAuth';
import type { User, Session } from '@supabase/supabase-js';

interface AuthProps {
  onAuthStateChange: (user: User | null, session: Session | null) => void;
}

export const Auth = ({ onAuthStateChange }: AuthProps) => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Ajout du state pour le nom complet
  const [showMFAInput, setShowMFAInput] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  // Gestion des placeholders (sécurisée - pas d'auto-complétion)
  const { handleFocus, getPlaceholder, forceHidePlaceholder } = useMultiplePlaceholderHandler({
    email: 'admin@example.com',
    password: 'Votre mot de passe',
    fullName: 'Votre nom complet',
  });

  // Forcer le masquage des placeholders si des valeurs sont détectées (sécurité)
  useEffect(() => {
    if (email) forceHidePlaceholder('email');
    if (password) forceHidePlaceholder('password');
    if (fullName) forceHidePlaceholder('fullName');
  }, [email, password, fullName, forceHidePlaceholder]);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  // Gérer les erreurs d'URL (ex: retour de callback échoué)
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'invitation_failed') {
      toast({
        title: '⚠️ Lien expiré ou invalide',
        description:
          "Le lien d'invitation n'a pas pu être validé. Veuillez vous connecter avec votre email et le mot de passe temporaire reçu.",
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  // Pas besoin d'écouter les changements ici, c'est géré par useSessionManager
  // Le composant Auth se contente d'afficher le formulaire de connexion

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Vérifier si MFA est requis
    if (error?.message?.includes('MFA') || error?.message?.includes('verification required')) {
      setShowMFAInput(true);
      return { error: null }; // Ne pas afficher d'erreur, juste montrer l'input MFA
    }

    return { error };
  };

  const verifyMFA = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      return { error: new Error('Code à 6 chiffres requis') };
    }

    // Utiliser la méthode mfa.challenge pour les codes TOTP
    const factors = await supabase.auth.mfa.listFactors();
    if (factors.data?.totp && factors.data.totp.length > 0) {
      const factorId = factors.data.totp[0].id;
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: mfaCode,
      });
      return { data, error };
    }

    return { error: new Error('Aucun facteur MFA trouvé') };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Inscription standard avec Supabase Auth
    // La création du tenant se fait désormais via le flux d'invitation sécurisé (Edge Function)
    // ou via un processus d'onboarding séparé après l'inscription.

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
        // Gestion d'erreurs moderne pour l'authentification
        let errorTitle = "❌ Erreur d'authentification";
        let errorMessage = error.message || "Une erreur s'est produite.";

        // Email déjà utilisé
        if (
          error.message?.toLowerCase().includes('email') &&
          (error.message?.toLowerCase().includes('already') ||
            error.message?.toLowerCase().includes('exists') ||
            error.message?.toLowerCase().includes('taken'))
        ) {
          errorTitle = '📧 Email déjà utilisé';
          errorMessage = 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre.';
        }

        // Identifiants invalides
        else if (
          error.message?.toLowerCase().includes('invalid') ||
          error.message?.toLowerCase().includes('credentials')
        ) {
          errorTitle = '🔐 Email ou mot de passe incorrect';
          errorMessage =
            "L'email et/ou le mot de passe sont erronés. Veuillez vérifier vos informations.";
        }

        // Mot de passe faible
        else if (
          error.message?.toLowerCase().includes('password') &&
          (error.message?.toLowerCase().includes('weak') ||
            error.message?.toLowerCase().includes('strength'))
        ) {
          errorTitle = '🔒 Mot de passe trop faible';
          errorMessage =
            'Votre mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules, chiffres et symboles.';
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (isSignUp) {
        toast({
          title: 'Inscription réussie',
          description: 'Vérifiez votre email pour confirmer votre compte',
        });
      } else if (!showMFAInput) {
        toast({
          title: 'Connexion réussie',
          description: 'Vous êtes maintenant connecté',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMFAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await verifyMFA();

      if (error) {
        toast({
          title: '❌ Code incorrect',
          description: 'Le code MFA est incorrect. Veuillez réessayer.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '✅ Connexion réussie',
          description: 'Authentification à deux facteurs validée',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? 'Créer un compte' : 'Connexion'}</CardTitle>
          <CardDescription>
            {isSignUp
              ? "Créez votre compte admin pour accéder à l'application"
              : 'Connectez-vous avec vos identifiants admin'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* OAuth Google activé ✅ */}
          {!showMFAInput && !isSignUp && <SocialAuth />}

          {showMFAInput ? (
            <form onSubmit={handleMFAVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfaCode">Code d'authentification à deux facteurs</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  value={mfaCode}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setMfaCode(value);
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center font-mono text-2xl tracking-widest"
                  autoComplete="off"
                  required
                />
                <p className="text-muted-foreground text-center text-sm">
                  Entrez le code à 6 chiffres depuis votre application d'authentification
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading || mfaCode.length !== 6}>
                {loading ? 'Vérification...' : 'Vérifier'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowMFAInput(false);
                  setMfaCode('');
                }}
              >
                Retour
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    onFocus={() => handleFocus('fullName')}
                    onClick={() => handleFocus('fullName')}
                    placeholder={getPlaceholder('fullName', fullName)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
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
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => handleFocus('email')}
                  onClick={() => handleFocus('email')}
                  placeholder={getPlaceholder('email', email)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => handleFocus('password')}
                  onClick={() => handleFocus('password')}
                  placeholder={getPlaceholder('password', password)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Chargement...' : isSignUp ? 'Créer le compte' : 'Se connecter'}
              </Button>
            </form>
          )}
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="text-sm">
              {isSignUp ? 'Déjà un compte ? Se connecter' : 'Créer un compte admin'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
