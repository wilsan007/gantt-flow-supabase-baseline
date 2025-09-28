import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    console.log('🚀 Edge Function: handle-email-confirmation démarrée');
    // Créer le client Supabase avec service role
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const payload = await req.json();
    console.log('📥 Payload reçu:', JSON.stringify(payload, null, 2));
    // Vérifier que c'est bien une confirmation d'email
    if (payload.type !== 'UPDATE' || payload.table !== 'users') {
      console.log('⚠️ Événement ignoré - pas une mise à jour utilisateur');
      return new Response(JSON.stringify({
        message: 'Événement ignoré'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const user = payload.record;
    const oldUser = payload.old_record;
    // Vérifier si l'email est confirmé (condition plus souple)
    const emailConfirmed = user?.email_confirmed_at;
    if (!emailConfirmed) {
      console.log('⚠️ Email pas confirmé - ignoré');
      return new Response(JSON.stringify({
        message: 'Email pas confirmé'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Vérifier si l'utilisateur a déjà un profil (éviter les doublons)
    console.log('🔍 Vérification profil existant...');
    const { data: existingProfile } = await supabaseAdmin.from('profiles').select('user_id, tenant_id').eq('user_id', user.id).single();
    if (existingProfile?.tenant_id) {
      console.log('ℹ️ Profil déjà existant avec tenant - ignoré');
      return new Response(JSON.stringify({
        message: 'Profil déjà configuré',
        tenant_id: existingProfile.tenant_id
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`✅ Email confirmé pour: ${user.email}`);
    // 1. Chercher l'invitation pour cet utilisateur
    console.log('🔍 Recherche invitation...');
    const { data: invitation, error: invitationError } = await supabaseAdmin.from('invitations').select('*').eq('email', user.email).eq('invitation_type', 'tenant_owner').eq('status', 'pending').single();
    if (invitationError || !invitation) {
      console.log('❌ Aucune invitation tenant_owner trouvée pour:', user.email);
      return new Response(JSON.stringify({
        success: false,
        error: 'Aucune invitation tenant_owner trouvée'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✅ Invitation trouvée:', invitation.id);
    // 2. Créer le tenant
    console.log('🏢 Création du tenant...');
    const companyName = invitation.metadata?.company_name || `Entreprise ${invitation.full_name}`;
    const { error: tenantError } = await supabaseAdmin.from('tenants').upsert({
      id: invitation.tenant_id,
      name: companyName,
      status: 'active',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });
    if (tenantError) {
      console.error('❌ Erreur création tenant:', tenantError);
      throw new Error(`Erreur création tenant: ${tenantError.message}`);
    }
    console.log('✅ Tenant créé:', invitation.tenant_id);
    // 3. Récupérer le rôle tenant_admin
    console.log('🔍 Recherche rôle tenant_admin...');
    const { data: role, error: roleError } = await supabaseAdmin.from('roles').select('id').eq('name', 'tenant_admin').single();
    if (roleError || !role) {
      console.error('❌ Rôle tenant_admin non trouvé:', roleError);
      throw new Error('Rôle tenant_admin non trouvé');
    }
    console.log('✅ Rôle tenant_admin trouvé:', role.id);
    // 4. Créer l'enregistrement user_roles
    console.log('👤 Attribution du rôle tenant_admin...');
    const { error: userRoleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: user.id,
      role_id: role.id,
      tenant_id: invitation.tenant_id,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    if (userRoleError) {
      console.error('❌ Erreur attribution rôle:', userRoleError);
      throw new Error(`Erreur attribution rôle: ${userRoleError.message}`);
    }
    console.log('✅ Rôle tenant_admin attribué');
    // 5. Créer le profil utilisateur
    console.log('📋 Création du profil...');
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      user_id: user.id,
      tenant_id: invitation.tenant_id,
      full_name: invitation.full_name,
      email: user.email,
      role: 'tenant_admin',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
    if (profileError) {
      console.error('❌ Erreur création profil:', profileError);
      throw new Error(`Erreur création profil: ${profileError.message}`);
    }
    console.log('✅ Profil créé');
    // 6. Générer un employee_id unique en utilisant la fonction RPC
    console.log('🔢 Génération employee_id via RPC...');
    const { data: employeeId, error: employeeIdError } = await supabaseAdmin.rpc('generate_next_employee_id', {
      p_tenant_id: invitation.tenant_id,
    });

    if (employeeIdError) {
      console.error('❌ Erreur génération employee_id:', employeeIdError);
      throw new Error(`Erreur génération employee_id: ${employeeIdError.message}`);
    }
    console.log('✅ Employee ID généré:', employeeId);
    // 7. Créer l'enregistrement employé
    console.log('👨‍💼 Création de l\'employé...');
    const { error: employeeError } = await supabaseAdmin.from('employees').insert({
      user_id: user.id,
      employee_id: employeeId,
      full_name: invitation.full_name,
      email: user.email,
      job_title: 'Directeur Général',
      hire_date: new Date().toISOString().split('T')[0],
      contract_type: 'CDI',
      status: 'active',
      tenant_id: invitation.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    if (employeeError) {
      console.error('❌ Erreur création employé:', employeeError);
      throw new Error(`Erreur création employé: ${employeeError.message}`);
    }
    console.log('✅ Employé créé avec ID:', employeeId);
    // 8. Mettre à jour l'invitation
    console.log('📧 Mise à jour de l\'invitation...');
    const { error: invitationUpdateError } = await supabaseAdmin.from('invitations').update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      metadata: {
        ...invitation.metadata,
        completed_by: user.id,
        completed_at: new Date().toISOString(),
        employee_id: employeeId
      }
    }).eq('id', invitation.id);
    if (invitationUpdateError) {
      console.error('❌ Erreur mise à jour invitation:', invitationUpdateError);
    // Non critique - on continue
    } else {
      console.log('✅ Invitation marquée comme acceptée');
    }
    // 9. Résultat final
    const result = {
      success: true,
      message: 'Tenant owner créé avec succès',
      data: {
        user_id: user.id,
        email: user.email,
        tenant_id: invitation.tenant_id,
        tenant_name: companyName,
        employee_id: employeeId,
        role: 'tenant_admin',
        invitation_id: invitation.id
      }
    };
    console.log('🎉 Processus terminé avec succès:', result);
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('💥 Erreur dans Edge Function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});