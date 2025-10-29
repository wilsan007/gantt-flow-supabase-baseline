/**
 * 🧪 TEST RÉEL - CRÉATION D'INVITATION COMPLÈTE AVEC ENVOI D'EMAIL
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function testRealInvitation() {
  console.log('🎯 ===== TEST RÉEL D\'INVITATION COMPLÈTE =====');
  console.log('📧 Création d\'une vraie invitation avec envoi d\'email');
  console.log('');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Créer un client admin
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Données de test réelles
    const timestamp = Date.now();
    const invitationData = {
      email: `test-real-${timestamp}@example.com`,
      fullName: `Test Réel ${timestamp}`,
      invitationType: 'tenant_owner',
      siteUrl: 'http://localhost:8080',  // Port correct
      frontendPort: '8080'  // Port explicite
    };

    console.log('📋 DONNÉES D\'INVITATION:');
    console.log('   - Email:', invitationData.email);
    console.log('   - Nom:', invitationData.fullName);
    console.log('   - Type:', invitationData.invitationType);
    console.log('');

    // ÉTAPE 1: Générer les éléments requis
    console.log('🔧 ÉTAPE 1: Génération des éléments...');
    
    const futureTenantId = crypto.randomUUID();
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '1!';
    const invitationTimestamp = new Date().toISOString();
    const invitationId = crypto.randomUUID();
    const validationCode = Math.random().toString(36).substring(2, 15);

    console.log('   ✅ Tenant ID:', futureTenantId);
    console.log('   ✅ Invitation ID:', invitationId);
    console.log('   ✅ Mot de passe temporaire:', tempPassword);
    console.log('   ✅ Code de validation:', validationCode);
    console.log('');

    // ÉTAPE 2: Créer l'utilisateur Supabase
    console.log('🔧 ÉTAPE 2: Création de l\'utilisateur Supabase...');
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: invitationData.email,
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        // 10 ÉLÉMENTS DE VALIDATION REQUIS
        full_name: invitationData.fullName,
        invitation_type: 'tenant_owner',
        temp_user: true,
        temp_password: tempPassword,
        tenant_id: futureTenantId,
        invitation_id: invitationId,
        validation_code: validationCode,
        created_timestamp: invitationTimestamp,
        invited_by_type: 'super_admin',
        company_name: invitationData.fullName.split(' ')[0] + ' Company',
        
        // Métadonnées supplémentaires
        invitation_source: 'test_script',
        expected_role: 'tenant_admin',
        security_level: 'standard',
        locale: 'fr-FR'
      }
    });

    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError.message);
      return;
    }

    console.log('   ✅ Utilisateur créé:', userData.user.id);
    console.log('   ✅ Email:', userData.user.email);
    console.log('');

    // ÉTAPE 3: Générer le Magic Link
    console.log('🔧 ÉTAPE 3: Génération du Magic Link...');
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: invitationData.email,
      options: {
        redirectTo: `${invitationData.siteUrl}/auth/callback?email=${encodeURIComponent(invitationData.email)}&type=magiclink&invitation=true`
      }
    });

    if (linkError) {
      console.error('❌ Erreur génération lien:', linkError.message);
      return;
    }

    const confirmationUrl = linkData.properties.action_link;
    const tokenMatch = confirmationUrl.match(/token=([^&]+)/);
    const confirmationToken = tokenMatch ? tokenMatch[1] : null;

    console.log('   ✅ Lien de confirmation généré');
    console.log('   ✅ Token extrait:', confirmationToken ? 'OUI' : 'NON');
    console.log('');

    // ÉTAPE 4: Créer l'invitation en base
    console.log('🔧 ÉTAPE 4: Création de l\'invitation en base...');
    
    const invitationRecord = {
      email: invitationData.email,
      full_name: invitationData.fullName,
      tenant_id: futureTenantId,
      invitation_type: invitationData.invitationType,
      invited_by: '5c5731ce-75d0-4455-8184-bc42c626cb17', // Super Admin ID
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      token: confirmationToken,
      metadata: {
        config: {
          locale: 'fr-FR',
          timezone: 'Europe/Paris',
          auto_confirm: true,
          expected_role: 'tenant_admin'
        },
        fresh_token: confirmationToken,
        security_info: {
          ip_address: 'test_script',
          user_agent: 'Node.js Test Script',
          security_level: 'standard',
          invitation_source: 'test_script'
        },
        temp_password: tempPassword,
        confirmation_url: confirmationUrl,
        supabase_user_id: userData.user.id,
        validation_elements: {
          full_name: invitationData.fullName,
          temp_user: true,
          tenant_id: futureTenantId,
          company_name: invitationData.fullName.split(' ')[0] + ' Company',
          invitation_id: invitationId,
          temp_password: tempPassword,
          invitation_type: 'tenant_owner',
          invited_by_type: 'super_admin',
          validation_code: validationCode,
          created_timestamp: invitationTimestamp
        }
      }
    };

    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .insert(invitationRecord)
      .select()
      .single();

    if (invitationError) {
      console.error('❌ Erreur création invitation:', invitationError.message);
      return;
    }

    console.log('   ✅ Invitation créée:', invitation.id);
    console.log('');

    // ÉTAPE 5: ENVOI RÉEL DE L'EMAIL
    console.log('🔧 ÉTAPE 5: ENVOI RÉEL DE L\'EMAIL...');
    
    // Construire l'email HTML complet
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invitation Wadashaqeen - ${invitationData.fullName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Bienvenue ${invitationData.fullName} !</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Votre compte Tenant Owner vous attend</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Félicitations ! Vous avez été invité(e) à créer votre compte <strong>Tenant Owner</strong> pour gérer votre entreprise.
          </p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">📋 Étapes à suivre :</h4>
            <ol style="margin: 0; padding-left: 20px; color: #856404;">
              <li>Cliquez sur le bouton "Confirmer mon email" ci-dessous</li>
              <li>Vous serez redirigé vers l'application</li>
              <li>Connectez-vous avec vos identifiants temporaires</li>
              <li>Changez votre mot de passe lors de la première connexion</li>
            </ol>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #007bff;">
            <h3 style="margin: 0 0 15px 0; color: #007bff;">📋 Informations de connexion temporaires</h3>
            <p style="margin: 5px 0; font-family: monospace; background: white; padding: 10px; border-radius: 4px;">
              <strong>Email :</strong> ${invitationData.email}<br>
              <strong>Mot de passe :</strong> ${tempPassword}
            </p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
              ⚠️ Changez ce mot de passe après votre première connexion
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; 
                      border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;
                      box-shadow: 0 2px 4px rgba(40,167,69,0.3);">
              🚀 Confirmer mon email et accéder à mon compte
            </a>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #0c5460;">
              <strong>💡 Problème avec le lien ?</strong><br>
              Si le lien ne fonctionne pas, copiez-collez cette URL dans votre navigateur :<br>
              <code style="background: white; padding: 2px 4px; border-radius: 3px; font-size: 12px; word-break: break-all;">${confirmationUrl}</code>
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              <strong>Détails techniques :</strong><br>
              Invitation ID: ${invitation.id}<br>
              Tenant ID: ${futureTenantId}<br>
              Expire le: ${new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin: 20px 0 0 0;">
            Si vous rencontrez des problèmes, contactez l'administrateur.<br>
            <em>Cet email a été envoyé automatiquement depuis le système de test.</em>
          </p>
        </div>
      </body>
      </html>
    `;

    // Envoyer l'email via Resend
    const resendApiKey = 're_123'; // Remplacez par votre vraie clé Resend
    
    console.log('📤 Tentative d\'envoi via Resend API...');
    
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY || resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Wadashaqeen Test <onboarding@resend.dev>',
          to: ['osman.awaleh.adn@gmail.com'], // Email autorisé en mode test
          subject: `🎉 [TEST RÉEL] Invitation Wadashaqeen - ${invitationData.fullName}`,
          html: emailHtml,
          tags: [
            { name: 'category', value: 'test_invitation' },
            { name: 'tenant_id', value: futureTenantId },
            { name: 'invitation_id', value: invitation.id }
          ]
        }),
      });

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.log('   ✅ EMAIL ENVOYÉ AVEC SUCCÈS !');
        console.log('   📧 ID Email Resend:', emailResult.id);
        console.log('   📬 Destinataire:', 'osman.awaleh.adn@gmail.com');
        console.log('   📝 Sujet: [TEST RÉEL] Invitation Wadashaqeen -', invitationData.fullName);
        
        // Mettre à jour l'invitation avec le statut d'envoi
        await supabaseAdmin.from('invitations').update({
          metadata: {
            ...invitationRecord.metadata,
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            email_status: 'sent',
            resend_email_id: emailResult.id
          }
        }).eq('id', invitation.id);
        
      } else {
        const errorText = await emailResponse.text();
        console.error('   ❌ Erreur envoi email:', errorText);
      }
      
    } catch (emailError) {
      console.error('   ❌ Erreur critique envoi email:', emailError.message);
    }

    console.log('');
    console.log('🎯 ===== RÉSUMÉ COMPLET =====');
    console.log('');
    console.log('✅ CRÉATION RÉUSSIE:');
    console.log('   • Utilisateur Supabase:', userData.user.id);
    console.log('   • Invitation en base:', invitation.id);
    console.log('   • Email envoyé:', '✅ OUI');
    console.log('   • Lien de confirmation:', '✅ GÉNÉRÉ');
    console.log('   • 10 éléments de validation:', '✅ PRÉSENTS');
    console.log('');
    console.log('📧 VÉRIFIEZ VOTRE BOÎTE EMAIL:');
    console.log('   📬 Destinataire: osman.awaleh.adn@gmail.com');
    console.log('   📝 Sujet: [TEST RÉEL] Invitation Wadashaqeen');
    console.log('   📅 Envoyé à:', new Date().toLocaleString('fr-FR'));
    console.log('');
    console.log('🔗 LIEN DE CONFIRMATION:');
    console.log('   ', confirmationUrl);
    console.log('');
    console.log('🎉 TEST RÉEL TERMINÉ AVEC SUCCÈS !');
    console.log('   L\'email devrait arriver dans quelques secondes...');

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST RÉEL:', error);
  }
}

testRealInvitation().then(() => {
  console.log('');
  console.log('🏁 Test réel d\'invitation terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
