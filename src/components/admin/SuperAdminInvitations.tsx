import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMultiplePlaceholderHandler } from '@/hooks/usePlaceholderHandler';

interface InvitationForm {
  email: string;
  fullName: string;
}

export const SuperAdminInvitations: React.FC = () => {
  const [form, setForm] = useState<InvitationForm>({
    email: '',
    fullName: '',
  });

  // Gestion des placeholders
  const { handleFocus, getPlaceholder } = useMultiplePlaceholderHandler({
    email: 'tenant.owner@exemple.com',
    fullName: 'Jean Dupont',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastInvitation, setLastInvitation] = useState<any>(null);
  const { toast } = useToast();

  const handleInputChange = (field: keyof InvitationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!form.email.trim()) {
      toast({
        title: 'Erreur',
        description: "L'email est requis",
        variant: 'destructive',
      });
      return false;
    }

    if (!form.fullName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom complet est requis',
        variant: 'destructive',
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast({
        title: 'Erreur',
        description: "Format d'email invalide",
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const sendInvitation = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Récupérer le token d'authentification
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Session non trouvée');
      }

      // Appeler la Edge Function
      const response = await fetch(
        `https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/send-invitation`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: form.email.toLowerCase().trim(),
            fullName: form.fullName.trim(),
            invitationType: 'tenant_owner',
            siteUrl: window.location.origin,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'envoi de l'invitation");
      }

      // Succès
      setLastInvitation({
        email: form.email,
        tenantId: result.tenant_id,
        invitationId: result.invitation_id,
        sentAt: new Date().toISOString(),
      });

      // Réinitialiser le formulaire
      setForm({ email: '', fullName: '' });

      toast({
        title: '✅ Invitation envoyée !',
        description: `L'invitation a été envoyée à ${form.email}`,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Erreur envoi invitation:', error);

      // Gestion d'erreurs moderne basée sur les meilleures pratiques
      let errorTitle = "❌ Erreur d'invitation";
      let errorMessage = error.message || "Erreur lors de l'envoi de l'invitation";

      // Email déjà utilisé (inspiré de Stripe, Notion, Linear)
      if (
        error.message?.toLowerCase().includes('email') &&
        (error.message?.toLowerCase().includes('already') ||
          error.message?.toLowerCase().includes('exists') ||
          error.message?.toLowerCase().includes('taken'))
      ) {
        errorTitle = '📧 Email déjà utilisé';
        errorMessage = 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre.';
      }

      // Erreur de validation
      else if (
        error.message?.toLowerCase().includes('invalid') &&
        error.message?.toLowerCase().includes('email')
      ) {
        errorTitle = "📧 Format d'email invalide";
        errorMessage = "L'adresse email saisie n'est pas dans un format valide.";
      }

      // Erreur de permissions
      else if (
        error.message?.toLowerCase().includes('permission') ||
        error.message?.toLowerCase().includes('unauthorized')
      ) {
        errorTitle = '🔒 Permissions insuffisantes';
        errorMessage = "Vous n'avez pas les permissions nécessaires pour envoyer des invitations.";
      }

      // Erreur réseau
      else if (
        error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('fetch')
      ) {
        errorTitle = '🌐 Problème de connexion';
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserPlus className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
            <span className="truncate">Inviter un Tenant Owner</span>
          </CardTitle>
          <CardDescription className="text-sm">
            Envoyez une invitation pour créer un nouveau tenant avec son propriétaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder={getPlaceholder('email', form.email)}
                value={form.email}
                onChange={e => handleInputChange('email', e.target.value)}
                onFocus={() => handleFocus('email')}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder={getPlaceholder('fullName', form.fullName)}
                value={form.fullName}
                onChange={e => handleInputChange('fullName', e.target.value)}
                onFocus={() => handleFocus('fullName')}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            onClick={sendInvitation}
            disabled={isLoading || !form.email.trim() || !form.fullName.trim()}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Envoyer l'invitation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {lastInvitation && (
        <Alert>
          <Send className="h-4 w-4" />
          <AlertDescription>
            <strong>Dernière invitation envoyée :</strong>
            <br />
            📧 Email : {lastInvitation.email}
            <br />
            👤 Nom : {lastInvitation.fullName}
            <br />
            🏢 Tenant ID : {lastInvitation.tenantId}
            <br />
            📅 Envoyée le : {new Date(lastInvitation.sentAt).toLocaleString('fr-FR')}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• L'invitation expire automatiquement après 7 jours</p>
          <p>• Le tenant owner pourra créer son entreprise lors de l'inscription</p>
          <p>• Un UUID unique sera pré-généré pour le futur tenant</p>
          <p>• L'email d'invitation contient un lien sécurisé vers la page d'inscription</p>
        </CardContent>
      </Card>
    </div>
  );
};
