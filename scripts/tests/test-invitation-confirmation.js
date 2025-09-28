import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testInvitationConfirmation() {
  console.log('🔗 TEST CONFIRMATION INVITATION');
  console.log('===============================\n');

  const invitationData = {
    id: "43f7d2d3-ef92-47f8-a3cd-729e0ca03526",
    token: "a7b1a1c8e5426ea6f26d41815e0416d53807bf0645bda8f36a44b2a5",
    email: "test545@yahoo.com",
    full_name: "Med OSMAN",
    tenant_id: "759356ac-5fda-4776-971c-246daf8ee8da",
    supabase_user_id: "92035620-0eb6-4e34-91c4-6af3cb7c3124",
    temp_password: "phl1othd5AFO1!"
  };

  try {
    // 1. Vérifier l'état actuel de l'invitation
    console.log('1️⃣ Vérification de l\'invitation...');
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationData.id)
      .single();

    if (invError) {
      console.error('❌ Erreur récupération invitation:', invError);
      return;
    }

    console.log(`✅ Invitation trouvée:`);
    console.log(`   - Email: ${invitation.email}`);
    console.log(`   - Status: ${invitation.status}`);
    console.log(`   - Type: ${invitation.invitation_type}`);
    console.log(`   - Tenant ID: ${invitation.tenant_id}`);
    console.log(`   - Expire: ${invitation.expires_at}`);

    // 2. Vérifier l'utilisateur Supabase
    console.log('\n2️⃣ Vérification de l\'utilisateur auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(invitationData.supabase_user_id);

    if (authError) {
      console.error('❌ Erreur récupération utilisateur:', authError);
      return;
    }

    console.log(`✅ Utilisateur trouvé:`);
    console.log(`   - ID: ${authUser.user.id}`);
    console.log(`   - Email: ${authUser.user.email}`);
    console.log(`   - Email confirmé: ${authUser.user.email_confirmed_at ? '✅ OUI' : '❌ NON'}`);
    console.log(`   - Date confirmation: ${authUser.user.email_confirmed_at || 'Non confirmé'}`);

    // 3. Si email non confirmé, simuler la confirmation via le token
    if (!authUser.user.email_confirmed_at) {
      console.log('\n3️⃣ Simulation de la confirmation email...');
      
      // Confirmer l'email manuellement
      const { data: confirmData, error: confirmError } = await supabase.auth.admin.updateUserById(
        invitationData.supabase_user_id,
        { email_confirm: true }
      );

      if (confirmError) {
        console.error('❌ Erreur confirmation email:', confirmError);
      } else {
        console.log('✅ Email confirmé avec succès !');
        console.log('   Le trigger devrait maintenant s\'exécuter...');
      }
    } else {
      console.log('\n3️⃣ Email déjà confirmé');
    }

    // 4. Attendre un peu pour que le trigger s'exécute
    console.log('\n4️⃣ Attente exécution du trigger (3 secondes)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Vérifier les résultats après trigger
    console.log('\n5️⃣ Vérification des résultats...');

    // Vérifier le tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', invitation.tenant_id)
      .single();

    if (tenant) {
      console.log(`✅ Tenant: ${tenant.name} (${tenant.status})`);
    } else {
      console.log('❌ Tenant non trouvé');
    }

    // Vérifier le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', invitationData.supabase_user_id)
      .single();

    if (profile) {
      console.log(`✅ Profile: ${profile.full_name} (${profile.role})`);
      console.log(`   - Tenant ID: ${profile.tenant_id}`);
    } else {
      console.log('❌ Profile non trouvé');
    }

    // Vérifier l'employé
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', invitationData.supabase_user_id)
      .single();

    if (employee) {
      console.log(`✅ Employee: ${employee.employee_id} - ${employee.full_name}`);
      console.log(`   - Job Title: ${employee.job_title}`);
      console.log(`   - Status: ${employee.status}`);
    } else {
      console.log('❌ Employee non trouvé');
    }

    // Vérifier les rôles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*, roles(name)')
      .eq('user_id', invitationData.supabase_user_id);

    if (userRoles && userRoles.length > 0) {
      console.log(`✅ Rôles assignés: ${userRoles.length}`);
      userRoles.forEach(role => {
        console.log(`   - ${role.roles.name} (tenant: ${role.tenant_id})`);
      });
    } else {
      console.log('❌ Aucun rôle assigné');
    }

    // Vérifier le statut de l'invitation
    const { data: updatedInvitation, error: invUpdateError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationData.id)
      .single();

    if (updatedInvitation) {
      console.log(`✅ Invitation status: ${updatedInvitation.status}`);
      if (updatedInvitation.accepted_at) {
        console.log(`   - Acceptée le: ${updatedInvitation.accepted_at}`);
      }
    }

    // 6. Test de connexion
    console.log('\n6️⃣ Test de connexion utilisateur...');
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invitationData.email,
        password: invitationData.temp_password
      });

      if (signInError) {
        console.log(`❌ Connexion échouée: ${signInError.message}`);
        console.log(`   Code erreur: ${signInError.error_code || 'Non spécifié'}`);
      } else {
        console.log('✅ Connexion réussie !');
        console.log(`   - User ID: ${signInData.user.id}`);
        console.log(`   - Email: ${signInData.user.email}`);
        
        // Déconnexion
        await supabase.auth.signOut();
        console.log('✅ Déconnexion effectuée');
      }
    } catch (error) {
      console.log(`❌ Erreur connexion: ${error.message}`);
    }

    console.log('\n🎯 RÉSUMÉ:');
    console.log('─────────────────────────────────────');
    if (tenant && profile && employee && userRoles?.length > 0) {
      console.log('🎉 SUCCÈS COMPLET: Tenant owner créé automatiquement !');
    } else {
      console.log('⚠️ CRÉATION PARTIELLE: Certains éléments manquent');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testInvitationConfirmation();
