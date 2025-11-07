import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore - Deno global disponible dans l'environnement Edge Functions
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

/**
 * Génère un token cryptographiquement sûr
 */
function generateSecureToken(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(36).padStart(2, '0')).join('').slice(0, length);
}

/**
 * Génère un mot de passe sécurisé
 */
function generateSecurePassword(): string {
  const lowercase = generateSecureToken(4);
  const uppercase = generateSecureToken(4).toUpperCase();
  const numbers = Array.from(crypto.getRandomValues(new Uint8Array(2)), n => n % 10).join('');
  const special = '!@#$%';
  const specialChar = special[crypto.getRandomValues(new Uint8Array(1))[0] % special.length];
  return lowercase + uppercase + numbers + specialChar;
}

/**
 * 🎯 EDGE FUNCTION: send-collaborator-invitation
 * Pattern: Stripe, Notion, Linear - Invitation de collaborateurs
 * 
 * Différences avec send-invitation (tenant-owner):
 * ✅ Utilise tenant_id existant (pas de création)
 * ✅ Inviteur = Tenant Admin/Manager (pas Super Admin)
 * ✅ Role variable (manager, employee, etc.)
 * ✅ Validation email unique dans le tenant
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Edge Function: send-collaborator-invitation démarrée');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ============================================================================
    // ÉTAPE 1: AUTHENTIFICATION ET AUTORISATION
    // ============================================================================
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Vous devez être connecté pour effectuer cette action',
        errorCode: 'UNAUTHORIZED',
        suggestion: 'Veuillez vous reconnecter et réessayer.'
      }), {
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Votre session a expiré ou est invalide',
        errorCode: 'SESSION_EXPIRED',
        suggestion: 'Veuillez vous déconnecter et vous reconnecter pour continuer.',
        technicalDetails: authError?.message
      }), {
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const inviter = authData.user;
    console.log('👤 Inviteur authentifié:', inviter.email);

    // Vérifier permissions d'invitation
    const { data: canInvite, error: permError } = await supabaseClient
      .rpc('can_invite_collaborators', { user_id: inviter.id });
    
    if (permError || !canInvite) {
      console.log('❌ Permissions insuffisantes pour:', inviter.email);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Vous n\'avez pas les permissions nécessaires pour inviter des collaborateurs',
        errorCode: 'INSUFFICIENT_PERMISSIONS',
        suggestion: 'Contactez un administrateur de votre entreprise pour obtenir les droits requis (Administrateur, Manager ou Responsable RH).',
        requiredRoles: ['tenant_admin', 'manager', 'hr_manager']
      }), {
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ Permissions validées');

    // ============================================================================
    // ÉTAPE 2: RÉCUPÉRATION TENANT DE L'INVITEUR
    // ============================================================================
    
    const { data: inviterTenantId, error: tenantError } = await supabaseClient
      .rpc('get_user_tenant_id', { user_uuid: inviter.id });
    
    if (tenantError || !inviterTenantId) {
      console.log('❌ Tenant non trouvé pour:', inviter.email);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Votre compte n\'est associé à aucune entreprise',
        errorCode: 'NO_TENANT_FOUND',
        suggestion: 'Votre compte semble incomplet. Contactez le support ou votre administrateur pour associer votre compte à une entreprise.',
        technicalDetails: tenantError?.message
      }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🏢 Tenant ID inviteur:', inviterTenantId);

    // ============================================================================
    // ÉTAPE 3: VALIDATION DES DONNÉES D'ENTRÉE
    // ============================================================================
    
    const { 
      email, 
      fullName, 
      roleToAssign = 'employee',
      department,
      jobPosition,
      siteUrl, 
      frontendPort 
    } = await req.json();

    // Validations
    if (!email || !fullName) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Informations manquantes pour l\'invitation',
        errorCode: 'MISSING_REQUIRED_FIELDS',
        suggestion: 'Veuillez remplir au minimum l\'adresse email et le nom complet du collaborateur.',
        missingFields: [!email && 'email', !fullName && 'fullName'].filter(Boolean)
      }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!roleToAssign) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Le rôle du collaborateur n\'a pas été spécifié',
        errorCode: 'MISSING_ROLE',
        suggestion: 'Veuillez sélectionner un rôle pour le nouveau collaborateur (Manager, Employé, etc.).',
        availableRoles: ['manager', 'employee', 'hr_manager']
      }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📋 Données invitation:');
    console.log('   - Email:', email);
    console.log('   - Nom:', fullName);
    console.log('   - Rôle:', roleToAssign);
    console.log('   - Département:', department || 'Non spécifié');
    console.log('   - Poste:', jobPosition || 'Non spécifié');

    // Vérifier que l'email n'existe pas déjà dans le tenant
    const { data: emailExists, error: checkError } = await supabaseClient
      .rpc('is_email_in_tenant', { 
        email_param: email, 
        tenant_id_param: inviterTenantId 
      });
    
    if (checkError) {
      console.error('❌ Erreur vérification email:', checkError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Impossible de vérifier si cet email est disponible',
        errorCode: 'EMAIL_CHECK_FAILED',
        suggestion: 'Une erreur technique est survenue. Veuillez réessayer dans quelques instants.',
        technicalDetails: checkError.message
      }), {
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (emailExists) {
      console.log('❌ Email déjà existant dans le tenant:', email);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Cette adresse email est déjà utilisée dans votre entreprise',
        errorCode: 'EMAIL_ALREADY_IN_TENANT',
        suggestion: 'Un collaborateur avec cette adresse email existe déjà. Vérifiez la liste de vos employés ou utilisez une autre adresse email.',
        conflictingEmail: email
      }), {
        status: 409, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Email disponible dans le tenant');

    // ============================================================================
    // ÉTAPE 4: GÉNÉRATION DES ÉLÉMENTS DE SÉCURITÉ
    // ============================================================================
    
    const tempPassword = generateSecurePassword(); // Sécurisé avec crypto.getRandomValues()
    const invitationTimestamp = new Date().toISOString();
    const invitationId = crypto.randomUUID();
    const validationCode = generateSecureToken(13); // Sécurisé avec crypto.getRandomValues()

    console.log('🔐 Éléments de sécurité générés');
    console.log('   - Invitation ID:', invitationId);
    console.log('   - Validation Code:', validationCode);
    console.log('   - Timestamp:', invitationTimestamp);

    // ============================================================================
    // ÉTAPE 5: CRÉATION UTILISATEUR SUPABASE
    // ============================================================================
    
    let userData;
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email.toLowerCase());

    if (existingUser) {
      console.log('ℹ️ Utilisateur existant trouvé:', email);
      userData = { user: existingUser };
    } else {
      console.log('🆕 Création nouvel utilisateur:', email);
      
      // Préparer les métadonnées utilisateur
      const userMetadata = {
        // 10 ÉLÉMENTS DE VALIDATION (pattern tenant_owner adapté)
        full_name: fullName,
        invitation_type: 'collaborator', // ⚠️ Différence clé
        temp_user: true,
        temp_password: tempPassword,
        tenant_id: inviterTenantId, // ⚠️ Tenant existant, pas nouveau
        invitation_id: invitationId,
        validation_code: validationCode,
        created_timestamp: invitationTimestamp,
        invited_by_type: 'tenant_member', // ⚠️ Pas super_admin
        invited_by_id: inviter.id, // ⚠️ ID de l'inviteur
        role_to_assign: roleToAssign, // ⚠️ Nouveau champ
        
        // Métadonnées supplémentaires
        invitation_source: 'tenant_admin_panel',
        security_level: 'standard',
        locale: 'fr-FR',
        department: department || null,
        job_position: jobPosition || null,
        
        // Marqueurs pour handle-collaborator-confirmation
        created_by_send_collaborator_invitation: true,
        ready_for_confirmation: true,
        validation_elements_count: 10
      };

      console.log('📦 User metadata préparées:', Object.keys(userMetadata).length, 'champs');

      const { data: newUserData, error: userError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true, // ✅ Email confirmé automatiquement (créé par Tenant Admin)
        user_metadata: userMetadata
      });

      if (userError) {
        console.error('❌ Erreur création utilisateur:', userError);
        console.error('   Code:', userError.code);
        console.error('   Message:', userError.message);
        
        // Messages d'erreur clairs selon le type d'erreur
        let userMessage = 'Une erreur est survenue lors de la création du compte';
        let errorCode = 'USER_CREATION_ERROR';
        let statusCode = 500;
        
        if (userError.message.includes('already been registered') || 
            userError.message.includes('already exists')) {
          userMessage = 'Cette adresse email est déjà utilisée. Veuillez utiliser une autre adresse email.';
          errorCode = 'EMAIL_ALREADY_EXISTS';
          statusCode = 409; // Conflict
        } else if (userError.message.includes('invalid email')) {
          userMessage = 'L\'adresse email fournie n\'est pas valide. Veuillez vérifier le format.';
          errorCode = 'INVALID_EMAIL_FORMAT';
          statusCode = 400;
        } else if (userError.message.includes('password')) {
          userMessage = 'Erreur lors de la génération du mot de passe temporaire. Veuillez réessayer.';
          errorCode = 'PASSWORD_GENERATION_ERROR';
          statusCode = 500;
        } else if (userError.code === 'over_email_send_rate_limit') {
          userMessage = 'Trop de tentatives d\'envoi d\'emails. Veuillez patienter quelques minutes.';
          errorCode = 'RATE_LIMIT_EXCEEDED';
          statusCode = 429;
        }
        
        return new Response(JSON.stringify({ 
          success: false,
          error: userMessage,
          errorCode: errorCode,
          technicalDetails: userError.message,
          suggestion: errorCode === 'EMAIL_ALREADY_EXISTS' 
            ? 'Vérifiez si cet utilisateur n\'a pas déjà un compte actif, ou utilisez une autre adresse email.'
            : 'Veuillez vérifier les informations et réessayer.'
        }), {
          status: statusCode, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      userData = newUserData;
      console.log('✅ Utilisateur créé avec succès');
    }

    // ============================================================================
    // ÉTAPE 6: GÉNÉRATION MAGIC LINK
    // ============================================================================
    
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    
    let baseUrl;
    if (origin) {
      baseUrl = origin.replace(/\/$/, '');
    } else if (referer) {
      const refererUrl = new URL(referer);
      baseUrl = `${refererUrl.protocol}//${refererUrl.host}`;
    } else if (siteUrl) {
      baseUrl = siteUrl.replace(/\/$/, '');
    } else {
      const port = frontendPort || Deno.env.get('FRONTEND_PORT') || '8080';
      baseUrl = `http://localhost:${port}`;
    }
    
    console.log('🌐 URL base détectée:', baseUrl);
    
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: { 
        redirectTo: `${baseUrl}/auth/callback?email=${encodeURIComponent(email)}&type=magiclink&invitation=collaborator`
      }
    });

    if (linkError) {
      console.error('❌ Erreur génération Magic Link:', linkError);
      return new Response(JSON.stringify({ 
        error: 'Erreur génération lien de confirmation', 
        details: linkError.message 
      }), {
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const confirmationUrl = linkData.properties.action_link;
    const tokenMatch = confirmationUrl.match(/token=([^&]+)/);
    const confirmationToken = tokenMatch ? tokenMatch[1] : null;

    if (!confirmationToken) {
      console.error('❌ Impossible d\'extraire le token');
      return new Response(JSON.stringify({ 
        error: 'Erreur extraction token' 
      }), {
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Magic Link généré avec succès');

    // ============================================================================
    // ÉTAPE 7: CRÉATION INVITATION DANS LA BASE
    // ============================================================================
    
    // Récupérer le nom du tenant
    const { data: tenantData } = await supabaseClient
      .from('tenants')
      .select('name')
      .eq('id', inviterTenantId)
      .single();
    
    const tenantName = tenantData?.name || 'Entreprise';

    const invitationData = {
      email: email,
      full_name: fullName,
      tenant_id: inviterTenantId, // ⚠️ Tenant existant
      invitation_type: 'collaborator', // ⚠️ Type différent
      invited_by: inviter.id,
      invited_by_user_id: inviter.id, // ⚠️ Nouveau champ
      role_to_assign: roleToAssign, // ⚠️ Nouveau champ
      department: department || null,
      job_position: jobPosition || null,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      token: confirmationToken,
      metadata: {
        config: { 
          locale: 'fr-FR', 
          timezone: 'Europe/Paris', 
          auto_confirm: true, 
          expected_role: roleToAssign 
        },
        fresh_token: confirmationToken,
        security_info: {
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
          security_level: 'standard',
          invitation_source: 'tenant_admin_panel'
        },
        temp_password: tempPassword,
        confirmation_url: confirmationUrl,
        supabase_user_id: userData.user.id,
        tenant_name: tenantName,
        inviter_email: inviter.email,
        validation_elements: {
          full_name: fullName,
          invitation_type: 'collaborator',
          temp_user: true,
          temp_password: tempPassword,
          tenant_id: inviterTenantId,
          invitation_id: invitationId,
          validation_code: validationCode,
          created_timestamp: invitationTimestamp,
          invited_by_type: 'tenant_member',
          invited_by_id: inviter.id,
          role_to_assign: roleToAssign
        }
      }
    };

    console.log('💾 Insertion invitation dans la base...');
    
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (invitationError) {
      console.error('❌ Erreur création invitation:', invitationError);
      return new Response(JSON.stringify({ 
        error: 'Erreur création invitation', 
        details: invitationError.message 
      }), {
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Invitation créée:', invitation.id);

    // ============================================================================
    // ÉTAPE 8: ENVOI EMAIL (pattern Resend)
    // ============================================================================
    
    console.log('📧 Envoi de l\'email d\'invitation...');
    
    let emailSent = false;
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      
      if (resendApiKey) {
        const testEmail = 'osman.awaleh.adn@gmail.com';
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0;">🎉 Invitation à rejoindre ${tenantName}</h1>
            </div>
            
            <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #333;">Bonjour <strong>${fullName}</strong>,</p>
              
              <p style="font-size: 16px; color: #555; line-height: 1.6;">
                <strong>${inviter.email}</strong> vous a invité(e) à rejoindre <strong>${tenantName}</strong> 
                en tant que <strong>${roleToAssign}</strong>.
              </p>
              
              ${department ? `<p style="font-size: 14px; color: #666;">📁 Département : <strong>${department}</strong></p>` : ''}
              ${jobPosition ? `<p style="font-size: 14px; color: #666;">💼 Poste : <strong>${jobPosition}</strong></p>` : ''}
              
              <div style="background: #f8f9fa; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #667eea;">
                <h3 style="margin: 0 0 15px 0; color: #333;">🚀 Pour commencer :</h3>
                <ol style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
                  <li>Cliquez sur le bouton ci-dessous</li>
                  <li>Vous serez redirigé vers l'application</li>
                  <li>Connectez-vous avec vos identifiants temporaires</li>
                  <li>Changez votre mot de passe lors de la première connexion</li>
                </ol>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 6px; border: 1px solid #ffeaa7;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>📧 Email :</strong> ${email}<br>
                  <strong>🔑 Mot de passe temporaire :</strong> <code style="background: white; padding: 2px 6px; border-radius: 3px;">${tempPassword}</code><br>
                  <small>⚠️ Changez ce mot de passe après votre première connexion</small>
                </p>
              </div>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${confirmationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  ✨ Rejoindre ${tenantName}
                </a>
              </div>
              
              <div style="background: #e8f4f8; border: 1px solid #b8dce8; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #0c5460;">
                  <strong>💡 Problème avec le bouton ?</strong><br>
                  Copiez-collez ce lien dans votre navigateur :<br>
                  <code style="background: white; padding: 2px 4px; border-radius: 3px; font-size: 11px; word-break: break-all; display: block; margin-top: 8px;">${confirmationUrl}</code>
                </p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; text-align: center;">
                <p style="margin: 0;">Cette invitation expire dans 7 jours.</p>
                <p style="margin: 5px 0 0 0;">Si vous n'avez pas demandé cette invitation, ignorez cet email.</p>
              </div>
            </div>
          </div>
        `;
        
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${resendApiKey}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            from: 'Wadashaqeen <onboarding@resend.dev>',
            to: [testEmail],
            subject: `🎉 ${inviter.email} vous invite à rejoindre ${tenantName}`,
            html: emailHtml
          })
        });

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
        emailSent = true;
      }
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
    }

    // ============================================================================
    // ÉTAPE 9: RÉPONSE FINALE
    // ============================================================================
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Invitation de collaborateur envoyée avec succès',
      data: {
        invitation_id: invitation.id,
        email: email,
        full_name: fullName,
        tenant_id: inviterTenantId,
        tenant_name: tenantName,
        role_to_assign: roleToAssign,
        department: department,
        job_position: jobPosition,
        user_id: userData.user.id,
        invited_by: inviter.email,
        confirmation_url: confirmationUrl,
        expires_at: invitation.expires_at,
        temp_password: tempPassword,
        email_sent: emailSent
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erreur globale:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Une erreur inattendue est survenue lors de l\'envoi de l\'invitation',
      errorCode: 'UNEXPECTED_ERROR',
      suggestion: 'Cette erreur n\'était pas prévue. Veuillez réessayer dans quelques instants. Si le problème persiste, contactez le support technique.',
      technicalDetails: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
