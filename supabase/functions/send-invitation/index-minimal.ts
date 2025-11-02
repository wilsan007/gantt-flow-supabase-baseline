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
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    console.log('🚀 ===== DÉBUT PROCESSUS D\'ENVOI D\'INVITATION =====');
    console.log('⏰ Timestamp début:', new Date().toISOString());
    
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    console.log('✅ Client Supabase initialisé avec Service Role');

    // ÉTAPE 1: Vérification authentification
    console.log('🔍 ÉTAPE 1: Vérification authentification...');
    const authHeader = req.headers.get('Authorization');
    
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
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ ÉCHEC ÉTAPE 1: Authentification échouée');
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

    // Vérifier Super Admin
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

    // Générer les éléments requis
    const futureTenantId = crypto.randomUUID();
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '1!';
    const invitationTimestamp = new Date().toISOString();
    const invitationId = crypto.randomUUID();
    const validationCode = Math.random().toString(36).substring(2, 15);
    
    console.log('📋 Génération des éléments de validation:');
    console.log('   - Invitation ID:', invitationId);
    console.log('   - Tenant ID:', futureTenantId);
    console.log('   - Validation Code:', validationCode);

    // Vérifier si l'utilisateur existe déjà
    console.log('Checking if user already exists for email:', email);
    let userData;
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email.toLowerCase());

    if (existingUser) {
      console.log('User already exists, using existing user:', existingUser.id);
      userData = { user: existingUser };
    } else {
      // Créer un utilisateur temporaire avec Supabase Auth
      console.log('Creating temporary user for email:', email);
      console.log('Using pre-generated validation elements for user creation...');
      
      const { data: newUserData, error: userError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true, // ✅ Email confirmé automatiquement (créé par Super Admin)
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
        console.error('❌ Erreur création utilisateur:', userError);
        return new Response(JSON.stringify({
          error: 'Erreur création utilisateur',
          details: userError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      userData = newUserData;
      console.log('✅ Utilisateur créé:', userData.user.id);
    }

    // Générer le lien de confirmation (Magic Link)
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink', // Changé de 'signup' à 'magiclink' pour cohérence
      email: email,
      options: {
        redirectTo: `${siteUrl || 'http://localhost:8080'}/auth/callback?email=${encodeURIComponent(email)}&type=magiclink&invitation=tenant_owner`
        // Ajout des paramètres pour le routing intelligent dans AuthCallback
      }
    });

    if (linkError) {
      console.error('❌ Erreur génération lien:', linkError);
      return new Response(JSON.stringify({
        error: 'Erreur génération lien de confirmation',
        details: linkError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extraire le token du lien
    const confirmationUrl = linkData.properties.action_link;
    const tokenMatch = confirmationUrl.match(/token=([^&]+)/);
    const confirmationToken = tokenMatch ? tokenMatch[1] : null;

    if (!confirmationToken) {
      console.error('❌ Token non trouvé dans le lien');
      return new Response(JSON.stringify({ error: 'Erreur extraction token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Créer l'invitation dans la base
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
        config: {
          locale: 'fr-FR',
          timezone: 'Europe/Paris',
          auto_confirm: true,
          expected_role: 'tenant_admin'
        },
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
      console.error('❌ Erreur création invitation:', invitationError);
      return new Response(JSON.stringify({
        error: 'Erreur création invitation',
        details: invitationError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Invitation créée avec succès:', invitation.id);
    console.log('🔗 Lien de confirmation généré:', confirmationUrl);
    console.log('🎯 Processus d\'invitation terminé avec succès');

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
        validation_elements: Object.keys(invitationData.metadata.validation_elements).length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString(),
      context: 'send-invitation-process'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
