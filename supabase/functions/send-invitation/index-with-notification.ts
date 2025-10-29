import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
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

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Non autorisé'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Vérifier que l'utilisateur est Super Admin
    const { data: isSuperAdmin, error: roleError } = await supabaseClient.rpc('is_super_admin', {
      user_id: user.id
    });

    if (roleError || !isSuperAdmin) {
      return new Response(JSON.stringify({
        error: 'Accès Super Admin requis'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { email, fullName, invitationType = 'tenant_owner', siteUrl } = await req.json();

    // Validation des données
    if (!email || !fullName) {
      return new Response(JSON.stringify({
        error: 'Email et nom complet requis'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🎯 Création invitation pour:', email);

    // Générer un token unique pour l'invitation
    const invitationToken = crypto.randomUUID();
    const invitationId = crypto.randomUUID();

    // Créer l'invitation en base de données
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('invitations')
      .insert({
        id: invitationId,
        token: invitationToken,
        email: email.toLowerCase(),
        full_name: fullName,
        tenant_name: `Entreprise de ${fullName}`,
        invitation_type: invitationType,
        invited_by: user.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
        metadata: {
          site_url: siteUrl,
          created_via: 'edge_function',
          original_recipient: email // Stocker l'email original
        }
      })
      .select()
      .single();

    if (inviteError) {
      console.error('❌ Erreur création invitation:', inviteError);
      return new Response(JSON.stringify({
        error: 'Erreur lors de la création de l\'invitation',
        details: inviteError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Invitation créée:', invitation.id);

    // Construire l'URL d'invitation
    const invitationUrl = `${siteUrl}/invitation/${invitationToken}`;

    // Préparer l'email de notification (envoyé à l'adresse vérifiée)
    const verifiedEmail = 'osman.awaleh.adn@gmail.com';
    
    // Email de notification au Super Admin
    const notificationEmailData = {
      from: 'onboarding@resend.dev',
      to: [verifiedEmail],
      subject: `🎯 [TEST] Invitation créée pour ${email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">📧 Notification d'Invitation</h1>
            <p style="color: white; margin: 10px 0 0 0;">Mode Test - Système d'Onboarding</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">✅ Invitation Créée avec Succès</h2>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #1976d2;"><strong>📧 Destinataire:</strong> ${email}</p>
                <p style="margin: 5px 0 0 0; color: #1976d2;"><strong>👤 Nom:</strong> ${fullName}</p>
                <p style="margin: 5px 0 0 0; color: #1976d2;"><strong>🏢 Type:</strong> ${invitationType}</p>
              </div>

              <h3 style="color: #333;">📋 Détails de l'Invitation</h3>
              <ul style="color: #666;">
                <li><strong>ID:</strong> ${invitation.id}</li>
                <li><strong>Token:</strong> ${invitationToken}</li>
                <li><strong>Statut:</strong> En attente</li>
                <li><strong>Expire le:</strong> ${new Date(invitation.expires_at).toLocaleDateString('fr-FR')}</li>
              </ul>

              <div style="background: #fff3e0; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="color: #f57c00; margin-top: 0;">🔗 Lien d'Invitation</h4>
                <p style="margin: 0; word-break: break-all;">
                  <a href="${invitationUrl}" style="color: #1976d2;">${invitationUrl}</a>
                </p>
              </div>

              <div style="background: #f3e5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="color: #7b1fa2; margin-top: 0;">📝 Instructions pour le Test</h4>
                <p style="margin: 0; color: #666;">
                  En mode production, cet email serait envoyé directement à <strong>${email}</strong>.
                  Pour tester le processus d'onboarding, utilisez le lien ci-dessus.
                </p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${invitationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold;
                          display: inline-block;">
                  🚀 Tester l'Onboarding
                </a>
              </div>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #ccc; margin: 0; font-size: 12px;">
              Système d'Onboarding GanttFlow - Mode Test<br>
              Cette notification est envoyée car Resend limite les emails de test à votre adresse vérifiée.
            </p>
          </div>
        </div>
      `
    };

    // Envoyer l'email de notification
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationEmailData),
      });

      const resendResult = await resendResponse.json();
      
      if (resendResponse.ok) {
        console.log('✅ Email de notification envoyé:', resendResult.id);
        
        // Mettre à jour l'invitation avec l'ID de l'email
        await supabaseClient
          .from('invitations')
          .update({
            metadata: {
              ...invitation.metadata,
              notification_email_id: resendResult.id,
              notification_sent_to: verifiedEmail,
              notification_sent_at: new Date().toISOString()
            }
          })
          .eq('id', invitation.id);

        return new Response(JSON.stringify({
          success: true,
          message: 'Invitation créée et notification envoyée',
          invitation_id: invitation.id,
          invitation_url: invitationUrl,
          notification: {
            sent_to: verifiedEmail,
            original_recipient: email,
            email_id: resendResult.id
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } else {
        console.error('❌ Erreur Resend:', resendResult);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Invitation créée mais erreur envoi email',
          invitation_id: invitation.id,
          invitation_url: invitationUrl,
          email_error: resendResult
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    } catch (emailError) {
      console.error('❌ Exception email:', emailError);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Invitation créée mais exception email',
        invitation_id: invitation.id,
        invitation_url: invitationUrl,
        email_error: emailError.message
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error);
    return new Response(JSON.stringify({
      error: 'Erreur interne du serveur',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
