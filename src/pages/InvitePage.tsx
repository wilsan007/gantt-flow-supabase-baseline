import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Auth } from '@/components/Auth';

/**
 * InvitePage - Gestion des invitations
 * 
 * Deux types d'invitations :
 * 1. tenant_owner : Appelle onboard-tenant-owner (crée le tenant)
 * 2. collaborator : Traité automatiquement par webhook handle-collaborator-confirmation
 */
export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<"idle"|"auth"|"calling"|"waiting"|"error">("idle");
  const [error, setError] = useState<string>("");
  const [invitationType, setInvitationType] = useState<string>("");
  
  const code = searchParams.get('code') ?? "";

  useEffect(() => {
    (async () => {
      if (!code) { 
        setError("Lien invalide"); 
        setStatus("error"); 
        return; 
      }

      setStatus("auth");
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        setError("Veuillez vous connecter pour poursuivre.");
        setStatus("error");
        return;
      }

      try {
        // Récupérer l'invitation pour vérifier son type
        const { data: invitation, error: invitationError } = await supabase
          .from('invitations')
          .select('invitation_type, status')
          .eq('id', code)
          .single();

        if (invitationError || !invitation) {
          setError("Invitation invalide ou expirée");
          setStatus("error");
          return;
        }

        if (invitation.status !== 'pending') {
          setError("Cette invitation a déjà été utilisée");
          setStatus("error");
          return;
        }

        const type = invitation.invitation_type;
        setInvitationType(type);

        // TENANT OWNER : Appeler la fonction manuelle
        if (type === 'tenant_owner') {
          setStatus("calling");
          const token = sessionData.session.access_token;
          const resp = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboard-tenant-owner`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ code }),
            }
          );

          if (!resp.ok) throw new Error(await resp.text());

          const data = await resp.json();
          console.log("✅ Tenant owner créé:", data);
          navigate(`/dashboard`, { replace: true });
        } 
        // COLLABORATEUR : Le webhook handle-collaborator-confirmation s'en charge automatiquement
        else if (type === 'collaborator') {
          setStatus("waiting");
          console.log("ℹ️ Collaborateur - Webhook automatique va traiter l'invitation");
          
          // Attendre quelques secondes que le webhook traite
          setTimeout(() => {
            console.log("✅ Redirection vers dashboard...");
            navigate(`/dashboard`, { replace: true });
          }, 3000);
        }
        else {
          setError(`Type d'invitation non reconnu: ${type}`);
          setStatus("error");
        }

      } catch (e: any) {
        console.error("❌ Erreur:", e);
        setError(e?.message || "Erreur serveur");
        setStatus("error");
      }
    })();
  }, [code, navigate]);

  if (status === "auth" || status === "calling") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Validation de l'invitation…</p>
          {invitationType === 'tenant_owner' && (
            <p className="text-sm text-muted-foreground mt-2">Création de votre organisation</p>
          )}
        </div>
      </div>
    );
  }

  if (status === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-pulse mb-4">
            <div className="h-16 w-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
              <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Bienvenue !</h2>
          <p className="text-muted-foreground">
            Votre compte collaborateur est en cours de création...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Redirection automatique dans quelques instants
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 space-y-4">
          <div className="text-center">
            <div className="h-12 w-12 bg-destructive/20 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold mb-2">Invitation</h1>
            <p className="text-destructive">{error}</p>
          </div>
          {error.includes("connecter") && (
            <div className="mt-6">
              <Auth onAuthStateChange={() => window.location.reload()} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
