import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore - Deno global disponible dans l'environnement Edge Functions
declare const Deno: any;
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    console.log('');
    console.log('🚀 ===== DÉBUT PROCESSUS D\'ENVOI D\'INVITATION =====');
    console.log('⏰ Timestamp début:', new Date().toISOString());
    console.log('🌐 Méthode:', req.method);
    console.log('🔗 URL:', req.url);
    console.log('');
    
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    console.log('✅ Client Supabase initialisé avec Service Role');
    // Vérifier l'authentification
    console.log('🔍 ÉTAPE 1: Vérification authentification...');
    const authHeader = req.headers.get('Authorization');
    console.log('   - Header Authorization présent:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ ÉCHEC ÉTAPE 1: Header Authorization manquant');
      return new Response(JSON.stringify({
        error: 'Header Authorization requis'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('   - Token extrait (longueur):', token.length);
    
    const authStart = Date.now();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    const authEnd = Date.now();
    
    console.log('   - Durée vérification auth:', (authEnd - authStart), 'ms');
    
    if (authError || !user) {
      console.error('❌ ÉCHEC ÉTAPE 1: Authentification échouée');
      console.error('   - Erreur:', authError?.message || 'Utilisateur null');
      return new Response(JSON.stringify({
        error: 'Token invalide ou expiré',
        details: authError?.message
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ ÉTAPE 1 RÉUSSIE: Utilisateur authentifié');
    console.log('   - User ID:', user.id);
    console.log('   - Email:', user.email);
    // Vérifier que l'utilisateur est Super Admin
    const { data: isSuperAdmin, error: roleError } = await supabaseClient.rpc('is_super_admin', {
      user_id: user.id
    });
    if (roleError || !isSuperAdmin) {
      return new Response(JSON.stringify({
        error: 'Accès Super Admin requis'
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { email, fullName, invitationType = 'tenant_owner', siteUrl } = await req.json();
    // Validation des données
    if (!email || !fullName) {
      return new Response(JSON.stringify({
        error: 'Email et nom complet requis'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Générer l'UUID du futur tenant
    const futureTenantId = crypto.randomUUID();
    // Générer un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '1!';
    console.log('Generated temp password:', tempPassword);
    
    // 🎯 Générer tous les éléments de validation requis (au niveau global)
    const invitationTimestamp = new Date().toISOString();
    const invitationId = crypto.randomUUID();
    const validationCode = Math.random().toString(36).substring(2, 15);
    
    console.log('📋 Génération des éléments de validation:');
    console.log('   - Invitation ID:', invitationId);
    console.log('   - Tenant ID:', futureTenantId);
    console.log('   - Validation Code:', validationCode);
    console.log('   - Timestamp:', invitationTimestamp);
    // Vérifier d'abord si l'utilisateur existe déjà
    console.log('Checking if user already exists for email:', email);
    let userData;
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u)=>u.email === email.toLowerCase());
    if (existingUser) {
      console.log('User already exists, using existing user:', existingUser.id);
      userData = {
        user: existingUser
      };
    } else {
      // Créer un utilisateur temporaire avec Supabase Auth
      console.log('Creating temporary user for email:', email);
      console.log('Using pre-generated validation elements for user creation...');
      
      const { data: newUserData, error: userError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          // 🎯 ÉLÉMENTS DE VALIDATION REQUIS (10 éléments)
          full_name: fullName,                    // 1. Nom complet
          invitation_type: 'tenant_owner',        // 2. Type d'invitation
          temp_user: true,                        // 3. Flag utilisateur temporaire
          temp_password: tempPassword,            // 4. Mot de passe temporaire
          tenant_id: futureTenantId,             // 5. ID du futur tenant
          invitation_id: invitationId,           // 6. ID unique d'invitation
          validation_code: validationCode,       // 7. Code de validation
          created_timestamp: invitationTimestamp, // 8. Timestamp de création
          invited_by_type: 'super_admin',        // 9. Type d'inviteur
          company_name: fullName.split(' ')[0] + ' Company', // 10. Nom de l'entreprise
          
          // Métadonnées supplémentaires pour la robustesse
          invitation_source: 'admin_panel',
          expected_role: 'tenant_admin',
          security_level: 'standard',
          locale: 'fr-FR'
        }
      });
      
      if (userError) {
        console.error('Error creating user:', userError);
        console.error('User error details:', JSON.stringify(userError, null, 2));
        
        // Gestion spécifique des erreurs d'authentification
        if (userError.code === 'email_exists') {
          return new Response(JSON.stringify({
            error: 'Cet email est déjà utilisé',
            code: 'EMAIL_ALREADY_EXISTS',
            message: `L'adresse email ${email} est déjà enregistrée dans le système. Veuillez utiliser une autre adresse email ou contacter l'administrateur si cette personne doit être invitée.`,
            details: {
              email: email,
              suggestion: 'Vérifiez si cette personne a déjà un compte ou utilisez une autre adresse email'
            }
          }), {
            status: 409, // Conflict
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (userError.code === 'invalid_email') {
          return new Response(JSON.stringify({
            error: 'Format d\'email invalide',
            code: 'INVALID_EMAIL_FORMAT',
            message: `L'adresse email "${email}" n'est pas dans un format valide.`,
            details: {
              email: email,
              suggestion: 'Vérifiez le format de l\'adresse email (exemple: nom@domaine.com)'
            }
          }), {
            status: 400, // Bad Request
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (userError.code === 'weak_password') {
          return new Response(JSON.stringify({
            error: 'Mot de passe temporaire faible',
            code: 'WEAK_PASSWORD',
            message: 'Le mot de passe généré automatiquement ne respecte pas les critères de sécurité.',
            details: {
              suggestion: 'Veuillez réessayer, un nouveau mot de passe sera généré'
            }
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (userError.code === 'signup_disabled') {
          return new Response(JSON.stringify({
            error: 'Inscription désactivée',
            code: 'SIGNUP_DISABLED',
            message: 'La création de nouveaux comptes est temporairement désactivée.',
            details: {
              suggestion: 'Contactez l\'administrateur système'
            }
          }), {
            status: 503, // Service Unavailable
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        
        // Erreur générique pour les autres cas
        return new Response(JSON.stringify({
          error: 'Erreur lors de la création du compte',
          code: 'USER_CREATION_FAILED',
          message: 'Une erreur est survenue lors de la création du compte utilisateur.',
          details: {
            error_code: userError.code || 'unknown',
            suggestion: 'Veuillez réessayer ou contacter l\'administrateur'
          }
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else {
        userData = newUserData;
        console.log('User created successfully:', userData.user?.id);
      }
    }
    
    // 🔧 SOLUTION 4: Générer un NOUVEAU token de confirmation
    console.log('🔄 Génération d\'un nouveau token de confirmation...');
    console.log('   - User ID:', userData.user?.id);
    console.log('   - Email:', email);
    
    const { data: newLinkData, error: newLinkError } = await supabaseClient.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `http://localhost:8080/auth/callback?email=${encodeURIComponent(email)}`
      }
    });
    
    if (newLinkError) {
      console.error('❌ Erreur génération nouveau token:', newLinkError);
      return new Response(JSON.stringify({
        error: 'Erreur génération token de confirmation',
        code: 'TOKEN_GENERATION_FAILED',
        details: newLinkError
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Extraire le nouveau token de l'URL
    const newToken = newLinkData.properties.action_link.match(/token=([^&]+)/)?.[1];
    
    if (!newToken) {
      console.error('❌ Impossible d\'extraire le token de l\'URL:', newLinkData.properties.action_link);
      return new Response(JSON.stringify({
        error: 'Token non trouvé dans l\'URL générée',
        code: 'TOKEN_EXTRACTION_FAILED'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ Nouveau token généré avec succès:');
    console.log('   - Token (début):', newToken.substring(0, 20) + '...');
    console.log('   - URL complète:', newLinkData.properties.action_link);
    
    // Générer un lien de confirmation avec token (ANCIEN CODE - maintenant avec nouveau token)
    // Utiliser 'signup' car l'utilisateur doit confirmer son email
    // IMPORTANT: Utiliser l'email du destinataire réel, pas celui du développeur
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'signup',
      email: email, // Email du destinataire réel
      password: tempPassword,
      options: {
        redirectTo: `${siteUrl}/auth/callback?email=${encodeURIComponent(email)}`
      }
    });
    if (linkError) {
      console.error('Error generating link:', linkError);
      
      return new Response(JSON.stringify({
        error: 'Erreur génération du lien d\'invitation',
        code: 'LINK_GENERATION_FAILED',
        message: 'Impossible de générer le lien d\'invitation pour cet utilisateur.',
        details: {
          error_code: linkError.code || 'unknown',
          suggestion: 'Veuillez réessayer ou contacter l\'administrateur'
        }
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Generated link data:', linkData);
    // Extraire le token du lien généré
    const url = new URL(linkData.properties.action_link);
    const supabaseToken = url.searchParams.get('token');
    if (!supabaseToken) {
      return new Response(JSON.stringify({
        error: 'Token d\'invitation manquant',
        code: 'MISSING_INVITATION_TOKEN',
        message: 'Impossible d\'extraire le token du lien d\'invitation généré.',
        details: {
          suggestion: 'Veuillez réessayer la création de l\'invitation'
        }
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Créer l'invitation avec le token Supabase Auth et tous les éléments de validation
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitationMetadata = {
      // Données utilisateur Supabase
      supabase_user_id: userData.user?.id,
      confirmation_url: newLinkData.properties.action_link,  // ✅ NOUVEAU TOKEN
      fresh_token: newToken,  // ✅ TOKEN FRAIS STOCKÉ
      temp_password: tempPassword,
      
      // 🎯 ÉLÉMENTS DE VALIDATION COMPLETS (utilisant les variables locales)
      validation_elements: {
        full_name: fullName,                           // 1. Nom complet
        invitation_type: 'tenant_owner',               // 2. Type d'invitation  
        temp_user: true,                              // 3. Flag utilisateur temporaire
        temp_password: tempPassword,                  // 4. Mot de passe temporaire
        tenant_id: futureTenantId,                   // 5. ID du futur tenant
        invitation_id: invitationId,                 // 6. ID unique
        validation_code: validationCode,             // 7. Code validation
        created_timestamp: invitationTimestamp,      // 8. Timestamp
        invited_by_type: 'super_admin',              // 9. Type d'inviteur
        company_name: fullName.split(' ')[0] + ' Company' // 10. Nom entreprise
      },
      
      // Données de sécurité et audit
      security_info: {
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        invitation_source: 'admin_panel',
        security_level: 'standard'
      },
      
      // Données de configuration
      config: {
        locale: 'fr-FR',
        timezone: 'Europe/Paris',
        expected_role: 'tenant_admin',
        auto_confirm: true
      }
    };
    
    console.log('📦 Métadonnées d\'invitation complètes:', JSON.stringify(invitationMetadata, null, 2));
    
    console.log('');
    console.log('🔍 ÉTAPE 9: Création de l\'invitation dans la table invitations...');
    console.log('   - Token Frais (nouveau):', newToken ? 'PRÉSENT' : 'MANQUANT');
    console.log('   - Token Ancien (supabase):', supabaseToken ? 'PRÉSENT' : 'MANQUANT');
    console.log('   - Email:', email.toLowerCase());
    console.log('   - Nom complet:', fullName);
    console.log('   - Tenant ID:', futureTenantId);
    console.log('   - Type invitation:', invitationType);
    console.log('   - Invité par:', user.id);
    console.log('   - Expire le:', expirationDate.toISOString());
    console.log('   - Métadonnées:', Object.keys(invitationMetadata).length, 'sections');
    
    const invitationStart = Date.now();
    const { data: invitation, error: invitationError } = await supabaseClient.from('invitations').insert({
      token: newToken,  // ✅ UTILISER LE NOUVEAU TOKEN FRAIS au lieu de supabaseToken
      email: email.toLowerCase(),
      full_name: fullName,
      tenant_id: futureTenantId,
      invitation_type: invitationType,
      invited_by: user.id,
      expires_at: expirationDate.toISOString(),
      metadata: invitationMetadata
    }).select().single();
    
    const invitationEnd = Date.now();
    console.log('   - Durée insertion:', (invitationEnd - invitationStart), 'ms');
    if (invitationError) {
      console.error('Erreur création invitation:', invitationError);
      
      // Gestion spécifique des erreurs de base de données
      if (invitationError.code === '23505') { // Violation de contrainte unique
        return new Response(JSON.stringify({
          error: 'Invitation déjà existante',
          code: 'INVITATION_ALREADY_EXISTS',
          message: `Une invitation pour l'email ${email} existe déjà et est en attente.`,
          details: {
            email: email,
            suggestion: 'Vérifiez les invitations en attente ou annulez l\'invitation existante'
          }
        }), {
          status: 409,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (invitationError.code === '23503') { // Violation de clé étrangère
        return new Response(JSON.stringify({
          error: 'Référence invalide',
          code: 'INVALID_REFERENCE',
          message: 'Une référence dans l\'invitation n\'est pas valide (utilisateur invitant ou rôle).',
          details: {
            suggestion: 'Vérifiez que l\'utilisateur qui invite existe et a les permissions'
          }
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      
      return new Response(JSON.stringify({
        error: 'Erreur lors de la création de l\'invitation',
        code: 'INVITATION_CREATION_FAILED',
        message: 'Impossible de créer l\'invitation en base de données.',
        details: {
          error_code: invitationError.code || 'unknown',
          suggestion: 'Veuillez réessayer ou contacter l\'administrateur'
        }
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log('');
    console.log('✅ ÉTAPE 9 RÉUSSIE: Invitation créée dans la base de données!');
    console.log('   - ID invitation:', invitation.id);
    console.log('   - Email:', invitation.email);
    console.log('   - Tenant ID:', invitation.tenant_id);
    console.log('   - Type:', invitation.invitation_type);
    console.log('   - Status:', invitation.status);
    console.log('   - Expire le:', invitation.expires_at);
    console.log('   - Créée le:', invitation.created_at);
    console.log('   - Token présent:', !!invitation.token);
    console.log('   - Métadonnées présentes:', !!invitation.metadata);
    console.log('');
    
    // Enrichir le lien avec les paramètres de validation
    const baseUrl = new URL(linkData.properties.action_link);
    
    // 🎯 ÉTAPE 8: Enrichissement de l'URL avec les 10 éléments de validation
    console.log('');
    console.log('🔗 ÉTAPE 8: Enrichissement URL avec éléments de validation...');
    
    // Récupérer les éléments de validation depuis les variables locales générées
    // (plus fiable que les métadonnées utilisateur qui peuvent être incomplètes)
    const validationElements = {
      invitation_id: invitationId,
      validation_code: validationCode,
      created_timestamp: invitationTimestamp,
      company_name: fullName.split(' ')[0] + ' Company'
    };
    
    console.log('📊 ÉLÉMENTS DE VALIDATION RÉCUPÉRÉS:');
    console.log('   - invitation_id:', validationElements.invitation_id || 'MANQUANT');
    console.log('   - validation_code:', validationElements.validation_code || 'MANQUANT');
    console.log('   - created_timestamp:', validationElements.created_timestamp || 'MANQUANT');
    console.log('   - company_name:', validationElements.company_name || 'MANQUANT');
    
    // Vérifier que tous les éléments critiques sont présents
    const missingElements: string[] = [];
    if (!validationElements.invitation_id) missingElements.push('invitation_id');
    if (!validationElements.validation_code) missingElements.push('validation_code');
    if (!validationElements.created_timestamp) missingElements.push('created_timestamp');
    
    if (missingElements.length > 0) {
      console.error('❌ ÉLÉMENTS DE VALIDATION MANQUANTS:', missingElements);
      throw new Error(`Éléments de validation manquants: ${missingElements.join(', ')}`);
    }
    
    console.log('✅ Tous les éléments critiques présents - Enrichissement URL...');
    
    // Enrichir l'URL avec TOUS les paramètres de validation
    baseUrl.searchParams.set('email', email);
    baseUrl.searchParams.set('tenant_id', futureTenantId);
    baseUrl.searchParams.set('invitation_id', validationElements.invitation_id);
    baseUrl.searchParams.set('validation_code', validationElements.validation_code);
    baseUrl.searchParams.set('full_name', encodeURIComponent(fullName));
    baseUrl.searchParams.set('invitation_type', 'tenant_owner');
    baseUrl.searchParams.set('created_timestamp', validationElements.created_timestamp);
    baseUrl.searchParams.set('company_name', encodeURIComponent(validationElements.company_name));
    
    const finalInvitationUrl = baseUrl.toString();
    
    console.log('');
    console.log('🎯 URL FINALE ENRICHIE GÉNÉRÉE:');
    console.log('   - URL complète:', finalInvitationUrl);
    console.log('   - Paramètres inclus: 8/10 éléments de validation');
    console.log('   - Longueur URL:', finalInvitationUrl.length, 'caractères');
    console.log('');
    console.log('✅ ÉTAPE 8 RÉUSSIE: URL enrichie avec validation complète');
    console.log('');
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invitation Wadashaqeen</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Invitation Wadashaqeen</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Plateforme de gestion d'entreprise</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-top: 0;">Message d'invitation</h2>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px; font-weight: bold;">
              🧪 <strong>MODE TEST - Invitation sécurisée créée</strong><br>
              📧 <strong>Destinataire réel :</strong> <span style="font-size: 16px; color: #333;">${email}</span><br>
              📬 <strong>Notification envoyée à :</strong> <span style="font-size: 16px; color: #333;">osman.awaleh.adn@gmail.com</span><br>
              🔐 <strong>Éléments de validation :</strong> <span style="color: #28a745;">10/10 générés</span><br>
              🏢 <strong>Entreprise :</strong> ${userData.user?.raw_user_meta_data?.company_name || 'Non définie'}
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            <strong>Veuillez transmettre ce message à l'adresse ${email}</strong>
          </p>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Bonjour <strong>${fullName}</strong>,<br><br>
            Vous êtes invité(e) à créer votre compte entreprise sur <strong>Wadashaqeen</strong>, 
            la plateforme complète de gestion d'entreprise.
          </p>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            En tant que propriétaire d'entreprise, vous aurez accès à tous nos modules :
          </p>
          
          <ul style="color: #666; line-height: 1.8;">
            <li>📊 Gestion des projets et tâches</li>
            <li>👥 Gestion des ressources humaines</li>
            <li>📈 Tableaux de bord et analytics</li>
            <li>🔔 Système d'alertes intelligent</li>
            <li>⚙️ Administration complète</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${finalInvitationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;">
              🚀 Créer mon compte entreprise
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              🔑 <strong>Informations de connexion :</strong><br>
              <span style="font-size: 18px; font-weight: bold; color: #333; background: white; padding: 5px 10px; border-radius: 4px; display: inline-block; margin: 5px 0;">${tempPassword}</span><br>
              📋 <strong>ID Invitation :</strong> <code style="background: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${userData.user?.raw_user_meta_data?.invitation_id || 'N/A'}</code><br>
              🏢 <strong>ID Tenant :</strong> <code style="background: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${futureTenantId}</code><br><br>
              <small>Ces informations sont automatiquement validées lors de votre première connexion. Vous pourrez changer votre mot de passe après l'activation.</small>
            </p>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1565c0; font-size: 14px;">
              ⏰ <strong>Cette invitation expire le ${expirationDate.toLocaleDateString('fr-FR')} à ${expirationDate.toLocaleTimeString('fr-FR')}.</strong><br>
              📧 <strong>Votre email (${email}) sera pré-rempli dans le formulaire.</strong><br>
              🔐 <strong>Validation automatique :</strong> Toutes vos informations sont pré-configurées.<br><br>
              💡 <strong>Processus simplifié :</strong><br>
              1️⃣ Cliquez sur le lien ci-dessus<br>
              2️⃣ Saisissez votre mot de passe temporaire<br>
              3️⃣ Votre entreprise sera automatiquement configurée<br><br>
              Si le lien ne fonctionne pas, copiez-collez cette URL dans votre navigateur :<br>
              <code style="background: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; word-break: break-all;">${finalInvitationUrl}</code>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>© 2024 Wadashaqeen - Plateforme de gestion d'entreprise</p>
          <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
        </div>
      </body>
      </html>
    `;
    console.log('📧 Préparation envoi email via Resend...');
    console.log('   - Destinataire:', email);
    console.log('   - Clé API Resend disponible:', Deno.env.get('RESEND_API_KEY') ? 'OUI' : 'NON');
    // Utiliser Resend pour envoyer l'email
    console.log('');
    console.log('📧 ÉTAPE 10: Envoi de l\'email d\'invitation...');
    console.log('   - Destinataire réel:', email);
    console.log('   - Destinataire email:', process.env.NODE_ENV === 'production' ? email : 'osman.awaleh.adn@gmail.com');
    console.log('   - Sujet:', process.env.NODE_ENV === 'production' 
      ? `Invitation Wadashaqeen - ${fullName}` 
      : `🧪 [TEST] Invitation créée pour ${email} - ${fullName}`);
    console.log('   - URL finale longueur:', finalInvitationUrl.length, 'caractères');
    console.log('   - Clé Resend présente:', !!Deno.env.get('RESEND_API_KEY'));
    console.log('   - HTML email longueur:', emailHtml.length, 'caractères');
    
    const emailStart = Date.now();
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Wadashaqeen <onboarding@resend.dev>',
        to: [
          // En mode développement, envoyer à votre email mais avec les bonnes informations
          process.env.NODE_ENV === 'production' ? email : 'osman.awaleh.adn@gmail.com'
        ],
        subject: process.env.NODE_ENV === 'production' 
          ? `Invitation Wadashaqeen - ${fullName}` 
          : `🧪 [TEST] Invitation créée pour ${email} - ${fullName}`,
        html: emailHtml
      })
    });
    
    const emailEnd = Date.now();
    console.log('   - Durée envoi email:', (emailEnd - emailStart), 'ms');
    console.log('   - Status réponse:', resendResponse.status);
    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('');
      console.error('❌ ÉCHEC ÉTAPE 10: Erreur envoi email Resend');
      console.error('   - Status HTTP:', resendResponse.status);
      console.error('   - Status Text:', resendResponse.statusText);
      console.error('   - Réponse brute:', errorText);
      console.error('   - Headers:', Object.fromEntries(resendResponse.headers.entries()));
      console.error('');
      
      let errorResponse;
      try {
        const errorJson = JSON.parse(errorText);
        
        // Gestion spécifique des erreurs Resend
        if (resendResponse.status === 401) {
          errorResponse = {
            error: 'Clé API invalide',
            code: 'INVALID_API_KEY',
            message: 'La clé API Resend n\'est pas valide ou a expiré.',
            details: {
              suggestion: 'Vérifiez la configuration de la clé API Resend'
            }
          };
        } else if (resendResponse.status === 429) {
          errorResponse = {
            error: 'Limite d\'envoi atteinte',
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'La limite d\'envoi d\'emails a été atteinte.',
            details: {
              suggestion: 'Attendez quelques minutes avant de réessayer'
            }
          };
        } else {
          errorResponse = {
            error: 'Erreur service email',
            code: 'EMAIL_SERVICE_ERROR',
            message: 'Le service d\'envoi d\'email a rencontré une erreur.',
            details: {
              status: resendResponse.status,
              error_details: errorJson.message || errorText,
              suggestion: 'Veuillez réessayer dans quelques minutes'
            }
          };
        }
      } catch (parseError) {
        errorResponse = {
          error: 'Erreur lors de l\'envoi de l\'email',
          code: 'EMAIL_SEND_FAILED',
          message: 'Impossible d\'envoyer l\'email d\'invitation.',
          details: {
            status: resendResponse.status,
            suggestion: 'Veuillez réessayer ou contacter l\'administrateur'
          }
        };
      }
      
      return new Response(JSON.stringify(errorResponse), {
        status: resendResponse.status >= 500 ? 500 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const resendResult = await resendResponse.json();
    
    console.log('');
    console.log('🎉 ===== PROCESSUS D\'ENVOI TERMINÉ AVEC SUCCÈS =====');
    console.log('✅ Email envoyé avec succès via Resend:');
    console.log('   - ID email:', resendResult.id);
    console.log('   - Destinataire:', email);
    console.log('   - Nom complet:', fullName);
    console.log('   - Type invitation:', 'tenant_owner');
    console.log('   - Tenant ID:', futureTenantId);
    console.log('   - Invitation ID:', invitation.id);
    console.log('   - URL finale:', finalInvitationUrl.length, 'caractères');
    console.log('   - Éléments validation: 8/10 inclus dans URL');
    console.log('   - Expiration:', expirationDate.toISOString());
    console.log('');
    console.log('🎯 RÉSUMÉ FINAL:');
    console.log('   - Utilisateur temporaire créé: ✅');
    console.log('   - 10 éléments de validation générés: ✅');
    console.log('   - Invitation enregistrée en base: ✅');
    console.log('   - URL enrichie avec validation: ✅');
    console.log('   - Email envoyé avec succès: ✅');
    console.log('');
    console.log('🚀 L\'utilisateur peut maintenant cliquer sur le lien pour confirmer son compte!');
    console.log('🎉 ========================================================');
    console.log('');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Invitation envoyée avec succès - Processus complet',
      data: {
        invitation_id: invitation.id,
        tenant_id: futureTenantId,
        user_id: userData.user?.id,
        email: email,
        full_name: fullName,
        expires_at: expirationDate.toISOString(),
        validation_elements_count: 10,
        url_parameters_count: 8,
        resend_email_id: resendResult.id
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('');
    console.error('💥 ===== ERREUR CRITIQUE DANS LE PROCESSUS D\'INVITATION =====');
    console.error('🚨 ERREUR FATALE non gérée:');
    console.error('   - Nom erreur:', error.name || 'NON DÉFINI');
    console.error('   - Message:', error.message || 'NON DÉFINI');
    console.error('   - Stack trace:', error.stack || 'NON DISPONIBLE');
    console.error('   - Timestamp:', new Date().toISOString());
    console.error('');
    console.error('🎯 CONTEXTE DE L\'ERREUR:');
    console.error('   - Processus: Envoi d\'invitation');
    console.error('   - Fonction: send-invitation');
    console.error('   - Environnement: Supabase Edge Function');
    console.error('');
    console.error('💥 ========================================================');
    console.error('');
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Erreur critique dans le processus d\'invitation',
      details: {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        timestamp: new Date().toISOString(),
        context: 'send-invitation-process'
      }
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
