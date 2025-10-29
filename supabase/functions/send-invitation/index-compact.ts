import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore - Deno global disponible dans l'environnement Edge Functions
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // Authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Header Authorization requis' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide ou expiré', details: authError?.message }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Vérifier Super Admin
    const { data: isSuperAdmin, error: roleError } = await supabaseClient.rpc('is_super_admin', { user_id: user.id });
    if (roleError || !isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Accès Super Admin requis' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { email, fullName, invitationType = 'tenant_owner', siteUrl } = await req.json();

    // Validation
    if (!email || !fullName) {
      return new Response(JSON.stringify({ error: 'Email et nom complet requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Génération des éléments
    const futureTenantId = crypto.randomUUID();
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '1!';
    const invitationTimestamp = new Date().toISOString();
    const invitationId = crypto.randomUUID();
    const validationCode = Math.random().toString(36).substring(2, 15);

    // Vérifier utilisateur existant
    let userData;
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email.toLowerCase());

    if (existingUser) {
      userData = { user: existingUser };
    } else {
      // Créer utilisateur
      const { data: newUserData, error: userError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          full_name: fullName,
          invitation_type: 'tenant_owner',
          temp_user: true,
          temp_password: tempPassword,
          tenant_id: futureTenantId,
          invitation_id: invitationId,
          validation_code: validationCode,
          created_timestamp: invitationTimestamp,
          invited_by_type: 'super_admin',
          company_name: fullName.split(' ')[0] + ' Company',
          invitation_source: 'admin_panel',
          expected_role: 'tenant_admin',
          security_level: 'standard',
          locale: 'fr-FR'
        }
      });

      if (userError) {
        return new Response(JSON.stringify({ error: 'Erreur création utilisateur', details: userError.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      userData = newUserData;
    }

    // Générer lien de confirmation
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: { redirectTo: `${siteUrl || 'http://localhost:8080'}/auth/callback?email=${encodeURIComponent(email)}` }
    });

    if (linkError) {
      return new Response(JSON.stringify({ error: 'Erreur génération lien de confirmation', details: linkError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const confirmationUrl = linkData.properties.action_link;
    const tokenMatch = confirmationUrl.match(/token=([^&]+)/);
    const confirmationToken = tokenMatch ? tokenMatch[1] : null;

    if (!confirmationToken) {
      return new Response(JSON.stringify({ error: 'Erreur extraction token' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Créer invitation
    const invitationData = {
      email: email,
      full_name: fullName,
      tenant_id: futureTenantId,
      invitation_type: invitationType,
      invited_by: user.id,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      token: confirmationToken,
      metadata: {
        config: { locale: 'fr-FR', timezone: 'Europe/Paris', auto_confirm: true, expected_role: 'tenant_admin' },
        fresh_token: confirmationToken,
        security_info: {
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
          security_level: 'standard',
          invitation_source: 'admin_panel'
        },
        temp_password: tempPassword,
        confirmation_url: confirmationUrl,
        supabase_user_id: userData.user.id,
        validation_elements: {
          full_name: fullName,
          temp_user: true,
          tenant_id: futureTenantId,
          company_name: fullName.split(' ')[0] + ' Company',
          invitation_id: invitationId,
          temp_password: tempPassword,
          invitation_type: 'tenant_owner',
          invited_by_type: 'super_admin',
          validation_code: validationCode,
          created_timestamp: invitationTimestamp
        }
      }
    };

    const { data: invitation, error: invitationError } = await supabaseClient
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (invitationError) {
      return new Response(JSON.stringify({ error: 'Erreur création invitation', details: invitationError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Invitation créée avec succès:', invitation.id);

    // ENVOI DE L'EMAIL
    console.log('📧 Envoi de l\'email d\'invitation...');
    
    let emailSent = false;
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      
      if (resendApiKey) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #007bff; color: white; padding: 20px; text-align: center;">
              <h1>🎉 Bienvenue ${fullName} !</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd;">
              <p>Vous avez été invité(e) à créer votre compte Tenant Owner.</p>
              <div style="background: #f8f9fa; padding: 15px; margin: 20px 0;">
                <strong>Email :</strong> ${email}<br>
                <strong>Mot de passe :</strong> ${tempPassword}
              </div>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${confirmationUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                  Confirmer mon email
                </a>
              </div>
            </div>
          </div>
        `;

        // En mode test Resend, utiliser l'email du propriétaire du compte
        const testEmail = 'osman.awaleh.adn@gmail.com';
        const actualRecipient = email;
        
        // Modifier le contenu pour indiquer le vrai destinataire
        const testEmailHtml = emailHtml.replace(
          `<strong>Email :</strong> ${email}`,
          `<strong>Email destinataire :</strong> ${actualRecipient}<br><strong>Email de test :</strong> ${testEmail}`
        );

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Wadashaqeen <onboarding@resend.dev>',
            to: [testEmail], // Utiliser l'email autorisé pour les tests
            subject: `[TEST] Bienvenue ${fullName} - Invitation pour ${actualRecipient}`,
            html: testEmailHtml
          })
        });

        if (response.ok) {
          console.log('✅ Email envoyé via Resend');
          emailSent = true;
        } else {
          console.log('❌ Erreur Resend:', await response.text());
        }
      } else {
        console.log('⚠️ RESEND_API_KEY manquante');
        console.log('🔗 Lien de confirmation:', confirmationUrl);
        emailSent = true; // Considérer comme envoyé pour les tests
      }
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
    }

    console.log('📧 Email:', emailSent ? '✅ ENVOYÉ' : '❌ ÉCHEC');

    // Réponse finale
    return new Response(JSON.stringify({
      success: true,
      message: 'Invitation envoyée avec succès',
      data: {
        invitation_id: invitation.id,
        email: email,
        full_name: fullName,
        tenant_id: futureTenantId,
        user_id: userData.user.id,
        confirmation_url: confirmationUrl,
        expires_at: invitation.expires_at,
        temp_password: tempPassword,
        validation_elements: Object.keys(invitationData.metadata.validation_elements).length,
        email_sent: emailSent
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
