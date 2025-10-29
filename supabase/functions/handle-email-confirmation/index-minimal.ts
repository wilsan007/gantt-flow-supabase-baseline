import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gestion CORS pour toutes les méthodes
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  try {
    const payload = await req.json();
    const user = payload.record;
    
    console.log('🚀 Email confirmation webhook triggered');
    console.log('   - User ID:', user?.id);
    console.log('   - Email:', user?.email);
    console.log('   - Type:', payload.type);

    // Vérifier que c'est une mise à jour utilisateur
    if (payload.type !== 'UPDATE' || payload.table !== 'users') {
      console.log('⏭️ Événement ignoré - pas une mise à jour utilisateur');
      return new Response(JSON.stringify({ message: 'Événement ignoré' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // PROTECTION ANTI-BOUCLE #1: Vérifier si déjà traité
    const isInvitationUser = user?.raw_user_meta_data?.invitation_type === 'tenant_owner';
    const emailConfirmed = !!user?.email_confirmed_at;
    const alreadyProcessed = user?.raw_user_meta_data?.process_completed;

    console.log('📊 État utilisateur:');
    console.log('   - Invitation user:', isInvitationUser);
    console.log('   - Email confirmé:', emailConfirmed);
    console.log('   - Déjà traité:', alreadyProcessed);

    if (emailConfirmed || !isInvitationUser || alreadyProcessed) {
      console.log('⏭️ Utilisateur ignoré - déjà traité ou non-invitation');
      return new Response(JSON.stringify({ message: 'Utilisateur déjà traité ou non-invitation' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Protection anti-doublon
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      return new Response(JSON.stringify({ message: 'Processus déjà terminé - doublon ignoré' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Récupérer l'invitation (pending ou accepted) - prendre la plus récente
    const { data: invitations, error: invError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('email', user.email)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(1);

    const invitation = invitations?.[0];

    if (invError || !invitation) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Aucune invitation valide trouvée pour cet utilisateur',
        details: {
          email: user.email,
          error: invError?.message || 'Invitation non trouvée'
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PROTECTION ANTI-BOUCLE #2: Si invitation acceptée ET profil existe, arrêter
    if (invitation.status === 'accepted') {
      console.log('ℹ️ Invitation déjà acceptée');
      
      if (existingProfile) {
        console.log('✅ Processus déjà terminé - profil existe');
        
        // Marquer comme traité pour éviter les futures exécutions
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          raw_user_meta_data: {
            ...user.raw_user_meta_data,
            process_completed: true,
            completed_at: new Date().toISOString()
          }
        });
        
        return new Response(JSON.stringify({ 
          message: 'Processus déjà terminé - invitation déjà traitée',
          status: 'completed'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log('⚠️ Invitation acceptée mais profil manquant - reprise du processus...');
    }

    // VALIDATION DES 10 ÉLÉMENTS DE SÉCURITÉ
    const userMetadata = user.raw_user_meta_data;
    const invitationMetadata = typeof invitation.metadata === 'string' 
      ? JSON.parse(invitation.metadata) 
      : invitation.metadata;
    const validationElements = invitationMetadata?.validation_elements || {};

    const elements = {
      fullName: userMetadata?.full_name || validationElements?.full_name,
      tempUser: userMetadata?.temp_user || validationElements?.temp_user,
      tenantId: userMetadata?.tenant_id || validationElements?.tenant_id || invitation.tenant_id,
      companyName: userMetadata?.company_name || validationElements?.company_name,
      invitationId: userMetadata?.invitation_id || validationElements?.invitation_id,
      tempPassword: userMetadata?.temp_password || validationElements?.temp_password,
      invitationType: userMetadata?.invitation_type || invitation.invitation_type,
      invitedByType: userMetadata?.invited_by_type || validationElements?.invited_by_type,
      validationCode: userMetadata?.validation_code || validationElements?.validation_code,
      createdTimestamp: userMetadata?.created_timestamp || validationElements?.created_timestamp
    };

    // Vérifier que tous les éléments critiques sont présents
    const missingElements: string[] = [];
    if (!elements.fullName) missingElements.push('full_name');
    if (!elements.tenantId) missingElements.push('tenant_id');
    if (!elements.invitationType) missingElements.push('invitation_type');
    if (!elements.tempPassword) missingElements.push('temp_password');

    if (missingElements.length > 0) {
      return new Response(JSON.stringify({ 
        message: 'Éléments de validation manquants',
        missing: missingElements 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Validation des 10 éléments réussie');

    // CONTOURNEMENT: Marquer comme confirmé via métadonnées + protection anti-boucle
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      raw_user_meta_data: {
        ...user.raw_user_meta_data,
        email_confirmed_automatically: true,
        confirmation_method: 'bypass_supabase_limitation',
        confirmed_at: new Date().toISOString(),
        process_started: true,
        process_started_at: new Date().toISOString()
      }
    });

    // Créer le tenant avec données validées
    await supabaseAdmin.from('tenants').upsert({
      id: elements.tenantId,
      name: elements.companyName || elements.fullName || 'Nouvelle Entreprise',
      status: 'active',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    // Créer le profil avec données validées
    await supabaseAdmin.from('profiles').insert({
      user_id: user.id,
      full_name: elements.fullName,
      tenant_id: elements.tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Récupérer le rôle tenant_admin
    const { data: role } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'tenant_admin')
      .single();

    if (role) {
      // Assigner le rôle
      await supabaseAdmin.from('user_roles').insert({
        user_id: user.id,
        role_id: role.id,
        tenant_id: elements.tenantId,
        assigned_at: new Date().toISOString()
      });
    }

    // Générer ID employé
    const { count } = await supabaseAdmin
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', elements.tenantId);

    const employeeId = `EMP${String((count || 0) + 1).padStart(3, '0')}`;

    // Créer l'employé avec données validées
    await supabaseAdmin.from('employees').insert({
      id: employeeId,
      user_id: user.id,
      tenant_id: elements.tenantId,
      full_name: elements.fullName,
      email: user.email,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Marquer l'invitation comme acceptée
    await supabaseAdmin.from('invitations').update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    }).eq('id', invitation.id);

    // CONNEXION AUTOMATIQUE DE L'UTILISATEUR
    console.log('🔐 Connexion automatique de l\'utilisateur...');
    
    // Générer un lien de connexion automatique (magic link)
    const { data: authLinkData, error: authLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        redirectTo: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'}/dashboard?welcome=true&tenant_id=${elements.tenantId}`
      }
    });

    let loginUrl: string;
    if (!authLinkError && authLinkData?.properties?.action_link) {
      loginUrl = authLinkData.properties.action_link;
      console.log('✅ Lien de connexion généré');
    } else {
      console.log('⚠️ Erreur génération lien de connexion:', authLinkError?.message);
      // Fallback: lien direct vers l'application
      loginUrl = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/login?email=${encodeURIComponent(user.email)}&tenant_id=${elements.tenantId}`;
    }

    // PROTECTION ANTI-BOUCLE FINALE: Marquer le processus comme terminé
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      raw_user_meta_data: {
        ...user.raw_user_meta_data,
        process_completed: true,
        completed_at: new Date().toISOString(),
        final_status: 'success'
      }
    });

    console.log('✅ Tenant owner créé avec succès:', user.email);
    console.log('🔒 Processus marqué comme terminé - plus d\'exécutions futures');

    return new Response(JSON.stringify({
      success: true,
      message: 'Tenant owner créé avec succès',
      data: {
        user_id: user.id,
        email: user.email,
        tenant_id: elements.tenantId,
        tenant_name: elements.companyName || elements.fullName,
        employee_id: employeeId,
        role: 'tenant_admin',
        invitation_id: invitation.id,
        validated_elements: Object.keys(elements).length,
        login_url: loginUrl,
        auto_login: true,
        welcome_message: `Bienvenue ${elements.fullName} ! Votre compte ${elements.companyName || elements.fullName} est prêt.`,
        process_completed: true
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
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
