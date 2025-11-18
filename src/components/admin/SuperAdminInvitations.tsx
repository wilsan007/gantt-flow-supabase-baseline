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
  companyName: string;
}

export const SuperAdminInvitations: React.FC = () => {
  const [form, setForm] = useState<InvitationForm>({
    email: '',
    fullName: '',
    companyName: '',
  });

  // Gestion des placeholders
  const { handleFocus, getPlaceholder } = useMultiplePlaceholderHandler({
    email: 'tenant.owner@exemple.com',
    fullName: 'Jean Dupont',
    companyName: 'Société XYZ',
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
        description: 'Le nom de la personne est requis',
        variant: 'destructive',
      });
      return false;
    }

    if (!form.companyName.trim()) {
      toast({
        title: 'Erreur',
        description: "Le nom de l'entreprise est requis",
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
            companyName: form.companyName.trim(),
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
        fullName: form.fullName,
        companyName: form.companyName,
        tenantId: result.tenant_id,
        invitationId: result.invitation_id,
        sentAt: new Date().toISOString(),
      });

      // Réinitialiser le formulaire
      setForm({ email: '', fullName: '', companyName: '' });

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
        <CardContent className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-sm font-medium sm:text-base">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={getPlaceholder('email', form.email)}
                value={form.email}
                onChange={e => handleInputChange('email', e.target.value)}
                onFocus={() => handleFocus('email')}
                disabled={isLoading}
                className="h-11 text-base sm:h-10 sm:text-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium sm:text-base">
                👤 Nom de la personne *
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder={getPlaceholder('fullName', form.fullName)}
                value={form.fullName}
                onChange={e => handleInputChange('fullName', e.target.value)}
                onFocus={() => handleFocus('fullName')}
                disabled={isLoading}
                className="h-11 text-base sm:h-10 sm:text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium sm:text-base">
              🏢 Nom de l'entreprise *
            </Label>
            <Input
              id="companyName"
              type="text"
              placeholder={getPlaceholder('companyName', form.companyName)}
              value={form.companyName}
              onChange={e => handleInputChange('companyName', e.target.value)}
              onFocus={() => handleFocus('companyName')}
              disabled={isLoading}
              className="h-11 text-base sm:h-10 sm:text-sm"
            />
          </div>

          <Button
            onClick={sendInvitation}
            disabled={
              isLoading || !form.email.trim() || !form.fullName.trim() || !form.companyName.trim()
            }
            className="h-11 w-full text-base font-semibold sm:h-10 sm:w-auto sm:text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                <span>Envoyer l'invitation</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {lastInvitation && (
        <Alert className="border-green-200 bg-green-50">
          <Send className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-xs sm:text-sm">
            <strong>Dernière invitation envoyée :</strong>
            <div className="mt-2 space-y-1">
              <div className="flex flex-wrap gap-x-2">
                <span className="font-medium">📧 Email :</span>
                <span className="break-all">{lastInvitation.email}</span>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <span className="font-medium">👤 Personne :</span>
                <span>{lastInvitation.fullName}</span>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <span className="font-medium">🏢 Entreprise :</span>
                <span>{lastInvitation.companyName}</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-medium">🆔 Tenant ID :</span> {lastInvitation.tenantId}
              </div>
              <div className="flex flex-wrap gap-x-2">
                <span className="font-medium">📅 Envoyée le :</span>
                <span>{new Date(lastInvitation.sentAt).toLocaleString('fr-FR')}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">ℹ️ Informations</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-1.5 p-4 text-xs sm:space-y-2 sm:p-6 sm:text-sm">
          <p>• L'invitation expire automatiquement après 7 jours</p>
          <p>• Le tenant owner pourra créer son entreprise lors de l'inscription</p>
          <p className="hidden sm:block">• Un UUID unique sera pré-généré pour le futur tenant</p>
          <p>• L'email d'invitation contient un lien sécurisé vers la page d'inscription</p>
        </CardContent>
      </Card>
    </div>
  );
};
