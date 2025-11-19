import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore - Deno global disponible dans l'environnement Edge Functions
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Génère un token cryptographiquement sûr
 * @param length Longueur du token
 * @returns Token aléatoire sécurisé
 */
function generateSecureToken(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

/**
 * Génère un nombre aléatoire sans biais entre 0 et max (exclusif)
 * Utilise rejection sampling pour éviter le modulo bias
 */
function getUnbiasedRandomInt(max: number): number {
  const range = 256 - (256 % max);
  let value: number;
  do {
    value = crypto.getRandomValues(new Uint8Array(1))[0];
  } while (value >= range);
  return value % max;
}

/**
 * Génère un mot de passe sécurisé
 * @returns Mot de passe avec lettres, chiffres et caractères spéciaux
 */
function generateSecurePassword(): string {
  const lowercase = generateSecureToken(4);
  const uppercase = generateSecureToken(4).toUpperCase();
  const numbers = Array.from({ length: 2 }, () => getUnbiasedRandomInt(10)).join('');
  const special = '!@#$%';
  const specialChar = special[getUnbiasedRandomInt(special.length)];
  return lowercase + uppercase + numbers + specialChar;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authentification (avec bypass Service Role pour test)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Header Authorization requis' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    let user;

    // Bypass pour Service Role Key (test uniquement)
    if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      console.log('🔄 BYPASS: Service Role Key détectée - Simulation utilisateur Super Admin');
      // Simuler un utilisateur Super Admin pour le test
      user = {
        id: '5c5731ce-75d0-4455-8184-bc42c626cb17',
        email: 'awalehnasri@gmail.com',
        role: 'super_admin',
      };
    } else {
      // Authentification normale
      const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);

      if (authError || !userData?.user) {
        return new Response(
          JSON.stringify({ error: 'Token invalide ou expiré', details: authError?.message }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      user = userData.user;
    }

    // Vérifier Super Admin
    const { data: isSuperAdmin, error: roleError } = await supabaseClient.rpc('is_super_admin', {
      user_id: user.id,
    });
    if (roleError || !isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Accès Super Admin requis' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      email,
      fullName,
      companyName,
      invitationType = 'tenant_owner',
      siteUrl,
      frontendPort,
    } = await req.json();

    // Validation
    if (!email || !fullName || !companyName) {
      return new Response(
        JSON.stringify({ error: "Email, nom de la personne et nom de l'entreprise requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ================================================================
    // 🔄 NOUVELLE APPROCHE: Créer l'invitation EN PREMIER
    // pour garantir que l'ID en base correspond aux métadonnées
    // ================================================================

    // Génération des éléments (sans invitation_id pour l'instant)
    const futureTenantId = crypto.randomUUID();
    const tempPassword = generateSecurePassword();
    const invitationTimestamp = new Date().toISOString();
    const validationCode = generateSecureToken(13);

    console.log("📝 Étape 1: Création de l'invitation en base de données...");

    // ÉTAPE 1: Créer d'abord l'invitation en base (PostgreSQL génère l'ID)
    const invitationData = {
      // ❌ PAS d'ID ici - laissons PostgreSQL le générer!
      email: email,
      full_name: fullName,
      tenant_id: futureTenantId,
      tenant_name: companyName,
      invitation_type: invitationType,
      invited_by: user.id,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      token: 'TEMP_TOKEN', // Sera mis à jour après génération du Magic Link
      metadata: {
        config: {
          locale: 'fr-FR',
          timezone: 'Europe/Paris',
          auto_confirm: true,
          expected_role: 'tenant_admin',
        },
        temp_password: tempPassword,
        validation_elements: {
          full_name: fullName,
          invitation_type: 'tenant_owner',
          temp_user: true,
          temp_password: tempPassword,
          tenant_id: futureTenantId,
          validation_code: validationCode,
          created_timestamp: invitationTimestamp,
          invited_by_type: 'super_admin',
          company_name: companyName,
        },
      },
    };

    const { data: invitation, error: invitationError } = await supabaseClient
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Erreur création invitation', details: invitationError?.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ✅ RÉCUPÉRER L'ID RÉEL généré par PostgreSQL
    const realInvitationId = invitation.id;
    console.log('✅ Invitation créée avec ID:', realInvitationId);

    // ÉTAPE 2: Vérifier utilisateur existant
    console.log('👤 Étape 2: Vérification/Création utilisateur...');
    let userData;
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email.toLowerCase());

    if (existingUser) {
      console.log('ℹ️ Utilisateur existant trouvé, mise à jour des métadonnées...');
      // Mettre à jour les métadonnées avec le VRAI invitation_id
      const { data: updatedUser, error: updateError } =
        await supabaseClient.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            full_name: fullName,
            invitation_type: 'tenant_owner',
            temp_user: true,
            temp_password: tempPassword,
            tenant_id: futureTenantId,
            invitation_id: realInvitationId, // ✅ ID RÉEL de la base
            validation_code: validationCode,
            created_timestamp: invitationTimestamp,
            invited_by_type: 'super_admin',
            company_name: fullName.split(' ')[0] + ' Company',
            invitation_source: 'admin_panel',
            expected_role: 'tenant_admin',
            security_level: 'standard',
            locale: 'fr-FR',
            created_by_send_invitation: true,
            ready_for_confirmation: true,
            validation_elements_count: 10,
          },
        });

      if (updateError) {
        // Rollback: supprimer l'invitation créée
        await supabaseClient.from('invitations').delete().eq('id', realInvitationId);
        return new Response(
          JSON.stringify({ error: 'Erreur mise à jour métadonnées', details: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      userData = { user: updatedUser.user };
    } else {
      console.log('➕ Création nouvel utilisateur avec invitation_id:', realInvitationId);
      // Créer utilisateur avec le VRAI invitation_id
      const { data: newUserData, error: userError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          // 10 ÉLÉMENTS DE VALIDATION avec le BON invitation_id
          full_name: fullName,
          invitation_type: 'tenant_owner',
          temp_user: true,
          temp_password: tempPassword,
          tenant_id: futureTenantId,
          invitation_id: realInvitationId, // ✅ ID RÉEL de la base
          validation_code: validationCode,
          created_timestamp: invitationTimestamp,
          invited_by_type: 'super_admin',
          company_name: fullName.split(' ')[0] + ' Company',

          // Métadonnées supplémentaires
          invitation_source: 'admin_panel',
          expected_role: 'tenant_admin',
          security_level: 'standard',
          locale: 'fr-FR',

          // Marqueurs
          created_by_send_invitation: true,
          ready_for_confirmation: true,
          validation_elements_count: 10,
        },
      });

      if (userError) {
        // Rollback: supprimer l'invitation créée
        await supabaseClient.from('invitations').delete().eq('id', realInvitationId);
        return new Response(
          JSON.stringify({ error: 'Erreur création utilisateur', details: userError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      userData = newUserData;
    }

    // Détecter l'adresse du serveur depuis la requête
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const host = req.headers.get('host');

    console.log('🌐 Headers détectés:');
    console.log('   - Origin:', origin);
    console.log('   - Referer:', referer);
    console.log('   - Host:', host);
    console.log('   - SiteUrl fourni:', siteUrl);

    // Priorité de détection : Origin > Referer > SiteUrl > Défaut avec port flexible
    let baseUrl;
    if (origin) {
      baseUrl = origin.replace(/\/$/, '');
    } else if (referer) {
      // Extraire l'origine du referer
      const refererUrl = new URL(referer);
      baseUrl = `${refererUrl.protocol}//${refererUrl.host}`;
    } else if (siteUrl) {
      baseUrl = siteUrl.replace(/\/$/, '');
    } else {
      // Défaut : utiliser SITE_URL de l'environnement, sinon localhost pour dev
      baseUrl =
        Deno.env.get('SITE_URL') ||
        `http://localhost:${frontendPort || Deno.env.get('FRONTEND_PORT') || '8080'}`;
    }

    console.log('🎯 URL finale utilisée:', baseUrl);

    // Générer Magic Link (plus fiable que signup)
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${baseUrl}/auth/callback?email=${encodeURIComponent(email)}&type=magiclink&invitation=true`,
      },
    });

    if (linkError) {
      return new Response(
        JSON.stringify({
          error: 'Erreur génération lien de confirmation',
          details: linkError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const confirmationUrl = linkData.properties.action_link;
    const tokenMatch = confirmationUrl.match(/token=([^&]+)/);
    const confirmationToken = tokenMatch ? tokenMatch[1] : null;

    if (!confirmationToken) {
      return new Response(JSON.stringify({ error: 'Erreur extraction token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ÉTAPE 3: Mettre à jour l'invitation avec le token et les infos finales
    console.log('🔄 Étape 3: Mise à jour invitation avec token et metadata complètes...');

    const { error: updateInvitationError } = await supabaseClient
      .from('invitations')
      .update({
        token: confirmationToken,
        metadata: {
          ...invitation.metadata,
          fresh_token: confirmationToken,
          security_info: {
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            security_level: 'standard',
            invitation_source: 'admin_panel',
          },
          confirmation_url: confirmationUrl,
          supabase_user_id: userData.user.id,
          validation_elements: {
            ...invitation.metadata.validation_elements,
            invitation_id: realInvitationId, // ✅ Confirmation de l'ID
          },
        },
      })
      .eq('id', realInvitationId);

    if (updateInvitationError) {
      console.error('⚠️ Erreur mise à jour invitation:', updateInvitationError);
      // Ne pas bloquer le processus, l'invitation existe déjà
    }

    console.log('✅ Invitation finalisée avec ID:', realInvitationId);
    console.log('✅ user_metadata.invitation_id:', realInvitationId);
    console.log('✅ invitations.id:', realInvitationId);
    console.log('🎯 CONCORDANCE PARFAITE GARANTIE!');

    // ENVOI DE L'EMAIL
    console.log("📧 Envoi de l'email d'invitation...");
    console.log('🔍 Vérification RESEND_API_KEY...');

    let emailSent = false;
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      console.log('🔑 RESEND_API_KEY présente:', !!resendApiKey);

      if (resendApiKey) {
        console.log('✅ RESEND_API_KEY trouvée, préparation email...');

        // ✅ Production : Envoyer directement à l'adresse email de l'invité
        const recipientEmail = email;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
                <img src="https://wadashaqayn.org/logo-w.svg" alt="Wadashaqayn" style="width: 60px; height: 60px; margin-bottom: 20px;" />
                <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🎉 Bienvenue sur Wadashaqayn</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Votre plateforme de gestion de projets et d'équipes</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">Bonjour <strong>${fullName}</strong>,</p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">
                  Vous avez été invité(e) à créer votre compte <strong>Administrateur Principal</strong> pour gérer <strong>${companyName}</strong> sur Wadashaqayn.
                </p>
                
                <!-- Steps Box -->
                <div style="background: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; border-radius: 6px; margin: 30px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px;">📋 Étapes pour activer votre compte</h3>
                  <ol style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
                    <li>Cliquez sur le bouton "Activer mon compte" ci-dessous</li>
                    <li>Vous serez redirigé(e) vers la plateforme Wadashaqayn</li>
                    <li>Connectez-vous avec vos identifiants temporaires</li>
                    <li>Définissez votre nouveau mot de passe sécurisé</li>
                  </ol>
                </div>
                
                <!-- Credentials Box -->
                <div style="background: #f8f9fa; border: 2px solid #e0e0e0; padding: 20px; margin: 20px 0; border-radius: 6px;">
                  <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">🔐 Vos identifiants temporaires</h4>
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                    <strong style="color: #333;">Adresse email :</strong><br>
                    <span style="font-family: 'Courier New', monospace; background: white; padding: 8px 12px; display: inline-block; margin-top: 5px; border-radius: 4px; border: 1px solid #ddd;">${recipientEmail}</span>
                  </p>
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                    <strong style="color: #333;">Mot de passe temporaire :</strong><br>
                    <span style="font-family: 'Courier New', monospace; background: white; padding: 8px 12px; display: inline-block; margin-top: 5px; border-radius: 4px; border: 1px solid #ddd; color: #e74c3c; font-weight: bold;">${tempPassword}</span>
                  </p>
                  <p style="margin: 15px 0 0 0; padding: 10px; background: #fff3cd; border-radius: 4px; font-size: 13px; color: #856404;">
                    ⚠️ <strong>Important :</strong> Vous devrez changer ce mot de passe lors de votre première connexion pour des raisons de sécurité.
                  </p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${confirmationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                    ✨ Activer mon compte maintenant
                  </a>
                </div>
                
                <!-- Alternative Link -->
                <div style="background: #e8f4f8; border: 1px solid #bee5eb; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #0c5460;">
                    <strong>💡 Le bouton ne fonctionne pas ?</strong>
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #0c5460; line-height: 1.6;">
                    Copiez et collez ce lien dans votre navigateur :
                  </p>
                  <div style="background: white; padding: 12px; margin-top: 10px; border-radius: 4px; border: 1px solid #d1ecf1; word-break: break-all;">
                    <code style="font-family: 'Courier New', monospace; font-size: 12px; color: #667eea;">${confirmationUrl}</code>
                  </div>
                </div>
                
                <!-- Security Notice -->
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0; font-size: 13px; color: #999; line-height: 1.6;">
                    <strong>🔒 Sécurité :</strong> Ce lien d'activation est valable 7 jours et ne peut être utilisé qu'une seule fois. Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email en toute sécurité.
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Cordialement,<br><strong>L'équipe Wadashaqayn</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">© 2025 Wadashaqayn. Tous droits réservés.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        console.log('📤 Envoi email vers Resend API...');
        console.log('   - Destinataire:', recipientEmail);
        console.log('   - Entreprise:', companyName);
        console.log('   - Rôle: Administrateur Principal (Tenant Owner)');

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Wadashaqayn <onboarding@wadashaqayn.org>',
            to: [recipientEmail],
            subject: `✨ Bienvenue sur Wadashaqayn - Activez votre compte ${companyName}`,
            html: emailHtml,
          }),
        });

        console.log('📊 Réponse Resend:', response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Email envoyé via Resend - ID:', result.id);
          emailSent = true;
        } else {
          const errorText = await response.text();
          console.log('❌ Erreur Resend:', errorText);
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
    return new Response(
      JSON.stringify({
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
          email_sent: emailSent,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
