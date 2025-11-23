import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Validate Token on Mount
  useEffect(() => {
    if (!token) {
      setError("Token d'invitation manquant");
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        // Use a direct fetch to the edge function URL to ensure query params are passed correctly
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-invitation?token=${token}`;

        const response = await fetch(functionUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Invitation invalide');
        }

        const dataInv = await response.json();
        setInvitation(dataInv);
      } catch (err: any) {
        console.error('Error fetching invitation:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // 2. Handle Account Creation & Acceptance
  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !password) return;

    setIsSubmitting(true);
    try {
      // A. Sign Up (Create Auth User)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
        options: {
          data: {
            invitation_type: invitation.invitation_type,
            invitation_id: invitation.id, // CRITICAL: Required for collaborator lookup
            tenant_id: invitation.tenant_id,
            full_name: invitation.full_name,
            company_name: invitation.tenant_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur lors de la création du compte');

      // B. Call Backend to Link (Accept Invitation)
      // We need the session to be active. signUp might return a session if auto-confirm is on,
      // OR if email confirmation is required, we can't proceed yet.
      // BUT, since we are in a trusted invite flow, we might want to auto-confirm?
      // Wait, standard flow requires email confirmation.
      // If email confirmation is ON in Supabase, the user won't have a session yet.

      // CRITICAL DECISION:
      // If we want "Gold Standard", the user should confirm their email.
      // BUT, they just clicked a link sent to their email! So we know they own it.
      // Ideally, we should auto-confirm them.
      // We can't auto-confirm from the client.

      // Workaround:
      // The `accept-invitation` function should ideally be called with a Service Role key if we trust this flow,
      // OR we ask the user to confirm their email first.

      // Let's assume for now we want a smooth flow.
      // If `signUp` returns a session (because email confirm is off or we are lucky), we proceed.
      // If not, we tell them to check their email.

      if (authData.session) {
        // User is logged in, call accept-invitation
        const { error: acceptError } = await supabase.functions.invoke('accept-invitation', {
          method: 'POST',
          body: { token },
        });

        if (acceptError) throw acceptError;

        toast.success('Compte créé et invitation acceptée !');
        navigate('/'); // Redirect to dashboard
      } else {
        // Email confirmation required
        toast.info('Compte créé ! Veuillez vérifier vos emails pour confirmer votre adresse.');
        // We can't link the tenant yet because we don't have a session.
        // The linking will have to happen AFTER they click the confirmation link in the NEW email.
        // This is the "Double Confirmation" problem.

        // To fix this in "Gold Standard":
        // The `accept-invitation` logic should probably be triggered by the Email Confirmation webhook we built earlier!
        // Remember `handle-email-confirmation`? It can look up the pending invitation by email!

        // YES! That's the robust way.
        // 1. User signs up here.
        // 2. Supabase sends "Confirm Email".
        // 3. User clicks.
        // 4. `handle-email-confirmation` runs, finds the pending invitation in `invitations` table, and links it.

        // So for this page, we just need to Sign Up.
        navigate('/login?message=check_email');
      }
    } catch (err: any) {
      console.error('Error accepting:', err);
      if (err.message.includes('already registered')) {
        // If user exists, try to login?
        toast.error('Cet email est déjà enregistré. Veuillez vous connecter.');
        navigate(`/login?email=${invitation.email}`);
      } else {
        toast.error(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-center text-red-600">Invitation Invalide</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-center text-2xl font-bold">Bienvenue !</CardTitle>
          <CardDescription className="text-center text-base">
            Vous avez été invité à rejoindre <strong>{invitation.tenant_name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-medium">Bonjour {invitation.full_name},</p>
            <p className="mt-1">
              Créez votre mot de passe pour activer votre compte <strong>{invitation.email}</strong>
              .
            </p>
          </div>

          <form onSubmit={handleAccept} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Choisissez un mot de passe sécurisé"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création du compte...
                </>
              ) : (
                'Accepter et Créer mon compte'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            Vous avez déjà un compte ?{' '}
            <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
              Connectez-vous
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
