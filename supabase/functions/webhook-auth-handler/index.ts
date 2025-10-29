import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔗 Webhook Auth Handler - Début du traitement');

    const payload = await req.json();
    console.log('📦 Payload reçu:', JSON.stringify(payload, null, 2));

    const { type, record } = payload;

    // Traiter seulement les événements de confirmation d'email
    if (type === 'INSERT' && record.table === 'users' && record.email_confirmed_at) {
      console.log('✅ Utilisateur confirmé détecté:', record.email);
      
      // Chercher l'invitation correspondante
      const { data: invitation, error: inviteError } = await supabaseClient
        .from('invitations')
        .select('*')
        .eq('email', record.email.toLowerCase())
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        console.log('⚠️ Aucune invitation trouvée pour:', record.email);
        return new Response(JSON.stringify({ 
          message: 'Aucune invitation trouvée' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('📧 Invitation trouvée:', invitation.id);

      // Vérifier si l'invitation n'a pas expiré
      if (new Date(invitation.expires_at) < new Date()) {
        console.log('⏰ Invitation expirée');
        
        await supabaseClient
          .from('invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);

        return new Response(JSON.stringify({ 
          error: 'Invitation expirée' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Appeler la fonction d'onboarding
      console.log('🚀 Déclenchement de l\'onboarding...');
      
      const { data: onboardResult, error: onboardError } = await supabaseClient
        .rpc('onboard_tenant_owner', {
          p_user_id: record.id,
          p_email: record.email,
          p_slug: invitation.tenant_name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'tenant',
          p_tenant_name: invitation.tenant_name || 'Nouvelle Entreprise',
          p_invite_code: invitation.id
        });

      if (onboardError) {
        console.error('❌ Erreur onboarding:', onboardError);
        
        // Marquer l'invitation comme échouée
        await supabaseClient
          .from('invitations')
          .update({ 
            status: 'failed',
            metadata: {
              ...invitation.metadata,
              error: onboardError.message,
              failed_at: new Date().toISOString()
            }
          })
          .eq('id', invitation.id);

        return new Response(JSON.stringify({ 
          error: 'Erreur lors de l\'onboarding',
          details: onboardError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('✅ Onboarding réussi:', onboardResult);

      // Marquer l'invitation comme acceptée
      await supabaseClient
        .from('invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          metadata: {
            ...invitation.metadata,
            onboard_result: onboardResult,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', invitation.id);

      console.log('🎉 Processus d\'onboarding terminé avec succès');

      return new Response(JSON.stringify({
        success: true,
        message: 'Onboarding terminé avec succès',
        tenant_id: onboardResult.tenant_id,
        user_id: record.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Autres types d'événements
    console.log('ℹ️ Événement non traité:', type);
    return new Response(JSON.stringify({ 
      message: 'Événement non traité' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Erreur générale webhook:', error);
    return new Response(JSON.stringify({
      error: 'Erreur interne du serveur',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
