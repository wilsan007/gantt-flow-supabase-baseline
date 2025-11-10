import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore - Deno global disponible dans l'environnement Edge Functions
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * 🎯 EDGE FUNCTION: handle-collaborator-confirmation
 * Pattern: Stripe, Notion, Linear - Confirmation collaborateur
 *
 * WORKFLOW COLLABORATEUR (différent de tenant_owner):
 * ❌ PAS de création de tenant
 * ✅ Ajout au tenant existant
 * ✅ Attribution du rôle spécifié (pas forcément tenant_admin)
 * ✅ Création profil + employé dans le tenant existant
 */

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Edge Function: handle-collaborator-confirmation démarrée');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const payload = await req.json();
    console.log('📥 Payload reçu:', JSON.stringify(payload, null, 2));

    // Vérifier que c'est bien une mise à jour utilisateur
    if (payload.type !== 'UPDATE' || payload.table !== 'users') {
      console.log('⚠️ Événement ignoré - pas une mise à jour utilisateur');
      return new Response(
        JSON.stringify({
          message: 'Événement ignoré',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const user = payload.record;
    const oldUser = payload.old_record;

    // ============================================================================
    // PROTECTION ANTI-BOUCLE CRITIQUE
    // ============================================================================

    console.log('🔒 VÉRIFICATION ANTI-BOUCLE...');

    const alreadyProcessed = user?.raw_user_meta_data?.collaborator_confirmed_automatically;
    const hasValidatedElements = user?.raw_user_meta_data?.validated_elements;

    console.log('   - Déjà traité automatiquement:', alreadyProcessed ? 'OUI' : 'NON');
    console.log('   - A des éléments validés:', hasValidatedElements ? 'OUI' : 'NON');

    if (alreadyProcessed && hasValidatedElements) {
      console.log('🛑 PROTECTION ANTI-BOUCLE ACTIVÉE');
      console.log('   - Utilisateur déjà traité par cette fonction');
      console.log('   - User ID:', user.id);
      console.log('   - Email:', user.email);

      return new Response(
        JSON.stringify({
          message: 'Utilisateur déjà traité - Protection anti-boucle',
          user_id: user.id,
          already_processed: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Protection anti-boucle OK - Processus peut continuer');

    // ============================================================================
    // VÉRIFICATION TYPE INVITATION
    // ============================================================================

    const invitationType = user?.raw_user_meta_data?.invitation_type;
    console.log("📋 Type d'invitation détecté:", invitationType);

    // Cette fonction ne traite que les collaborateurs
    if (invitationType !== 'collaborator') {
      console.log('⚠️ Type invitation non géré par cette fonction:', invitationType);
      return new Response(
        JSON.stringify({
          message: 'Type invitation non géré - utiliser handle-email-confirmation',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Type collaborateur confirmé - Workflow spécifique activé');

    // ============================================================================
    // VALIDATION DES ÉLÉMENTS D'INVITATION
    // ============================================================================

    console.log("🔍 VALIDATION DES DONNÉES D'INVITATION...");

    const userMetadata = user?.raw_user_meta_data;
    const fullName = userMetadata?.full_name;
    const tempPassword = userMetadata?.temp_password;
    const isTempUser = userMetadata?.temp_user;
    const tenantId = userMetadata?.tenant_id;
    const roleToAssign = userMetadata?.role_to_assign;
    const invitedById = userMetadata?.invited_by_id;

    console.log('   - Nom complet:', fullName || 'MANQUANT');
    console.log('   - Tenant ID:', tenantId || 'MANQUANT');
    console.log('   - Rôle à assigner:', roleToAssign || 'MANQUANT');
    console.log('   - Invité par:', invitedById || 'MANQUANT');

    // Rechercher l'invitation correspondante
    console.log('🔍 Recherche invitation correspondante...');
    const { data: pendingInvitation, error: invitationCheckError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('email', user.email)
      .eq('invitation_type', 'collaborator')
      .eq('status', 'pending')
      .single();

    if (invitationCheckError || !pendingInvitation) {
      console.log('❌ Aucune invitation collaborateur valide trouvée pour:', user.email);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Aucune invitation collaborateur valide trouvée',
          details: {
            email: user.email,
            error: invitationCheckError?.message,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Invitation trouvée:', pendingInvitation.id);
    console.log('   - Tenant ID:', pendingInvitation.tenant_id);
    console.log('   - Rôle:', pendingInvitation.role_to_assign);
    console.log('   - Département:', pendingInvitation.department || 'Non spécifié');
    console.log('   - Poste:', pendingInvitation.job_position || 'Non spécifié');

    // Extraire éléments de validation
    const validationElements = pendingInvitation.metadata?.validation_elements || {};

    // Validations complètes
    const validationErrors: string[] = [];

    console.log('🔍 Validation des éléments critiques:');

    if (!fullName || fullName.trim().length < 2) {
      validationErrors.push('1. Nom complet manquant ou invalide');
      console.log('❌ 1. Nom complet: INVALIDE');
    } else {
      console.log('✅ 1. Nom complet: VALIDE (' + fullName + ')');
    }

    if (invitationType !== 'collaborator') {
      validationErrors.push("2. Type d'invitation incorrect");
      console.log('❌ 2. Type invitation: INVALIDE');
    } else {
      console.log('✅ 2. Type invitation: VALIDE (collaborator)');
    }

    if (!isTempUser) {
      validationErrors.push('3. Flag utilisateur temporaire manquant');
      console.log('❌ 3. Flag temp_user: INVALIDE');
    } else {
      console.log('✅ 3. Flag temp_user: VALIDE');
    }

    if (!tempPassword || tempPassword.length < 8) {
      validationErrors.push('4. Mot de passe temporaire manquant');
      console.log('❌ 4. Mot de passe temporaire: INVALIDE');
    } else {
      console.log('✅ 4. Mot de passe temporaire: VALIDE');
    }

    if (!tenantId) {
      validationErrors.push('5. ID tenant manquant');
      console.log('❌ 5. Tenant ID: INVALIDE');
    } else {
      console.log('✅ 5. Tenant ID: VALIDE (' + tenantId + ')');
    }

    if (!roleToAssign) {
      validationErrors.push('6. Rôle à assigner manquant');
      console.log('❌ 6. Rôle: INVALIDE');
    } else {
      console.log('✅ 6. Rôle: VALIDE (' + roleToAssign + ')');
    }

    if (validationErrors.length > 0) {
      console.log('❌ Erreurs de validation:', validationErrors);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Données d'invitation invalides",
          validation_errors: validationErrors,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Toutes les validations passées - confirmation automatique...');

    // ============================================================================
    // CONFIRMATION EMAIL AUTOMATIQUE
    // ============================================================================

    console.log('🔄 CONFIRMATION EMAIL AUTOMATIQUE...');

    const confirmationTime = new Date().toISOString();

    try {
      const result = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.raw_user_meta_data,
          collaborator_confirmed_automatically: true,
          confirmation_method: 'collaborator_auto_confirm',
          confirmed_at: confirmationTime,
          validation_completed: true,
          invitation_processed: true,
          simulated_email_confirmed_at: confirmationTime,
          process_can_continue: true,
          validated_elements: {
            full_name: fullName,
            invitation_type: 'collaborator',
            tenant_id: tenantId,
            role_to_assign: roleToAssign,
            invited_by_id: invitedById,
          },
        },
      });

      if (result.error) {
        console.error('❌ Erreur confirmation:', result.error);
      } else {
        console.log('✅ Email confirmé avec succès (simulation)');
        user.email_confirmed_at = confirmationTime;
        user.raw_user_meta_data = result.data.user.user_metadata;
      }
    } catch (error) {
      console.error('❌ Exception confirmation:', error);
    }

    // ============================================================================
    // VÉRIFICATION PROFIL EXISTANT (éviter doublons)
    // ============================================================================

    console.log('🔍 Vérification profil existant...');
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, tenant_id, created_at')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      console.log('ℹ️ Profil déjà existant - Arrêt pour éviter doublon');
      console.log('   - Profile ID:', existingProfile.id);
      console.log('   - Tenant ID:', existingProfile.tenant_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Profil déjà existant - Webhook en doublon ignoré',
          data: {
            user_id: user.id,
            tenant_id: existingProfile.tenant_id,
            already_completed: true,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Aucun doublon - Processus peut continuer');

    // ============================================================================
    // VÉRIFICATION QUE LE TENANT EXISTE
    // ============================================================================

    console.log('🏢 Vérification du tenant existant...');
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, status')
      .eq('id', pendingInvitation.tenant_id)
      .single();

    if (tenantError || !tenantData) {
      console.error('❌ Tenant non trouvé:', pendingInvitation.tenant_id);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Le tenant n'existe pas",
          details: tenantError?.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Tenant trouvé:', tenantData.name);
    console.log('   - Status:', tenantData.status);

    // ============================================================================
    // RÉCUPÉRATION DU RÔLE À ASSIGNER
    // ============================================================================

    console.log('🔍 Recherche du rôle:', pendingInvitation.role_to_assign);
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name, display_name')
      .eq('name', pendingInvitation.role_to_assign)
      .single();

    if (roleError || !role) {
      console.error('❌ Rôle non trouvé:', pendingInvitation.role_to_assign);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rôle invalide',
          details: roleError?.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Rôle trouvé:', role.display_name);

    // ============================================================================
    // ATTRIBUTION DU RÔLE
    // ============================================================================

    console.log('👤 Attribution du rôle...');

    // Vérifier si le rôle existe déjà
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role_id', role.id)
      .eq('tenant_id', pendingInvitation.tenant_id)
      .single();

    if (!existingRole) {
      const { error: userRoleError } = await supabaseAdmin.from('user_roles').insert({
        user_id: user.id,
        role_id: role.id,
        tenant_id: pendingInvitation.tenant_id,
        context_type: 'tenant',
        context_id: pendingInvitation.tenant_id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (userRoleError) {
        console.error('❌ Erreur attribution rôle:', userRoleError);
        throw new Error(`Erreur attribution rôle: ${userRoleError.message}`);
      }

      console.log('✅ Rôle attribué avec succès');
    } else {
      console.log('ℹ️ Rôle déjà existant');
    }

    // ============================================================================
    // CRÉATION PROFIL
    // ============================================================================

    console.log('📋 Création du profil...');
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        user_id: user.id,
        tenant_id: pendingInvitation.tenant_id,
        full_name: pendingInvitation.full_name,
        email: user.email,
        role: pendingInvitation.role_to_assign,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (profileError) {
      console.error('❌ Erreur création profil:', profileError);
      throw new Error(`Erreur création profil: ${profileError.message}`);
    }

    console.log('✅ Profil créé');

    // ============================================================================
    // GÉNÉRATION EMPLOYEE_ID UNIQUE
    // ============================================================================

    console.log('🔢 Génération employee_id...');
    const { data: existingEmployees } = await supabaseAdmin
      .from('employees')
      .select('employee_id')
      .like('employee_id', 'EMP%');

    const usedNumbers = new Set();
    if (existingEmployees && existingEmployees.length > 0) {
      existingEmployees.forEach((emp: any) => {
        const match = emp.employee_id.match(/^EMP(\d{3})$/);
        if (match) {
          usedNumbers.add(parseInt(match[1]));
        }
      });
    }

    let nextNumber = 1;
    while (usedNumbers.has(nextNumber)) {
      nextNumber++;
    }

    const employeeId = `EMP${String(nextNumber).padStart(3, '0')}`;
    console.log('✅ Employee ID généré:', employeeId);

    // ============================================================================
    // CRÉATION EMPLOYÉ
    // ============================================================================

    console.log("👔 Création de l'employé...");
    const { error: employeeError } = await supabaseAdmin.from('employees').insert({
      user_id: user.id,
      tenant_id: pendingInvitation.tenant_id,
      employee_id: employeeId,
      full_name: pendingInvitation.full_name,
      email: user.email,
      department: pendingInvitation.department || null,
      job_position: pendingInvitation.job_position || null,
      status: 'active',
      hire_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (employeeError) {
      console.error('❌ Erreur création employé:', employeeError);
      throw new Error(`Erreur création employé: ${employeeError.message}`);
    }

    console.log('✅ Employé créé');

    // ============================================================================
    // MARQUER INVITATION COMME ACCEPTÉE
    // ============================================================================

    console.log('✔️ Marquage invitation comme acceptée...');
    const { error: updateInvitationError } = await supabaseAdmin
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', pendingInvitation.id);

    if (updateInvitationError) {
      console.error('⚠️ Erreur mise à jour invitation:', updateInvitationError);
    } else {
      console.log('✅ Invitation marquée comme acceptée');
    }

    // ============================================================================
    // RÉPONSE FINALE
    // ============================================================================

    console.log('');
    console.log('🎉 PROCESSUS COLLABORATEUR TERMINÉ AVEC SUCCÈS !');
    console.log('   - User ID:', user.id);
    console.log('   - Email:', user.email);
    console.log('   - Tenant:', tenantData.name);
    console.log('   - Rôle:', role.display_name);
    console.log('   - Employee ID:', employeeId);
    console.log('');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Collaborateur ajouté avec succès',
        data: {
          user_id: user.id,
          email: user.email,
          tenant_id: pendingInvitation.tenant_id,
          tenant_name: tenantData.name,
          role: role.display_name,
          employee_id: employeeId,
          department: pendingInvitation.department,
          job_position: pendingInvitation.job_position,
          invitation_id: pendingInvitation.id,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erreur globale:', error);
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
