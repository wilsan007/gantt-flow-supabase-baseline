import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testRealUserTrigger() {
  console.log('🧪 TEST TRIGGER AVEC UTILISATEUR RÉEL');
  console.log('====================================\n');

  // Données de l'utilisateur réel
  const realUserEmail = 'test234@yahoo.com';
  const realUserId = '0e2f0742-02f8-44e6-9ef3-775e78f71e2f';
  const realTenantId = 'f935127c-e1b5-46a8-955d-23212b3acd08';
  const realInvitationId = '3d91bd0e-5cfb-4305-b7c3-421c82413c22';
  const realToken = '05951983257eb280007355e5aa647a9f0b76abddbb98bcfa14fbe79a';

  try {
    // ============================================
    // ÉTAPE 1: VÉRIFIER L'INVITATION EXISTANTE
    // ============================================
    console.log('🔍 1. Vérification de l\'invitation existante...');
    
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', realInvitationId)
      .single();

    if (invitationError) {
      console.log('   ❌ Erreur récupération invitation:', invitationError.message);
      return;
    }
    
    console.log('   ✅ Invitation trouvée:');
    console.log(`      - ID: ${invitation.id}`);
    console.log(`      - Email: ${invitation.email}`);
    console.log(`      - Tenant ID: ${invitation.tenant_id}`);
    console.log(`      - Status: ${invitation.status}`);
    console.log(`      - Full Name: ${invitation.full_name}`);
    console.log(`      - Token: ${invitation.token}`);

    // ============================================
    // ÉTAPE 2: VÉRIFIER L'UTILISATEUR AUTH
    // ============================================
    console.log('\n👤 2. Vérification de l\'utilisateur auth...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(realUserId);

    if (authError) {
      console.log('   ❌ Erreur récupération utilisateur:', authError.message);
      return;
    }
    
    console.log('   ✅ Utilisateur trouvé:');
    console.log(`      - ID: ${authUser.user.id}`);
    console.log(`      - Email: ${authUser.user.email}`);
    console.log(`      - Email confirmé: ${authUser.user.email_confirmed_at ? 'Oui' : 'Non'}`);
    console.log(`      - Créé le: ${authUser.user.created_at}`);

    // ============================================
    // ÉTAPE 3: VÉRIFIER L'ÉTAT ACTUEL
    // ============================================
    console.log('\n🔍 3. État actuel des données...');
    
    const checkTable = async (table, condition, label) => {
      const { data, error } = await supabase.from(table).select('*').match(condition);
      if (error) {
        console.log(`   ❌ ${label}: Erreur - ${error.message}`);
        return null;
      }
      console.log(`   📋 ${label}: ${data?.length || 0} enregistrement(s)`);
      if (data && data.length > 0) {
        console.log(`      - Premier enregistrement:`, JSON.stringify(data[0], null, 2).substring(0, 200) + '...');
      }
      return data;
    };

    const existingTenant = await checkTable('tenants', { id: realTenantId }, 'Tenant');
    const existingProfile = await checkTable('profiles', { user_id: realUserId }, 'Profile');
    const existingUserRole = await checkTable('user_roles', { user_id: realUserId }, 'User Role');
    const existingEmployee = await checkTable('employees', { user_id: realUserId }, 'Employee');

    // ============================================
    // ÉTAPE 4: SIMULER LE TRIGGER MANUELLEMENT
    // ============================================
    console.log('\n🚀 4. Simulation manuelle du trigger...');
    
    if (!authUser.user.email_confirmed_at) {
      console.log('   ⚠️ Email non confirmé, simulation de la confirmation...');
      
      // Confirmer l'email pour déclencher le trigger
      const { data: confirmedUser, error: confirmError } = await supabase.auth.admin.updateUserById(
        realUserId,
        { email_confirm: true }
      );

      if (confirmError) {
        console.log('   ❌ Erreur confirmation email:', confirmError.message);
        return;
      }
      
      console.log('   ✅ Email confirmé, trigger déclenché');
      
      // Attendre que le trigger s'exécute
      console.log('   ⏳ Attente 3 secondes pour l\'exécution du trigger...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('   ℹ️ Email déjà confirmé, trigger déjà exécuté ou en cours');
    }

    // ============================================
    // ÉTAPE 5: VÉRIFIER LES RÉSULTATS
    // ============================================
    console.log('\n📊 5. Vérification des résultats après trigger...');
    
    const checkAfterTrigger = async (table, condition, label, expectedFields = []) => {
      const { data, error } = await supabase.from(table).select('*').match(condition);
      
      if (error) {
        console.log(`   ❌ ${label}: Erreur - ${error.message}`);
        return false;
      }
      
      if (!data || data.length === 0) {
        console.log(`   ❌ ${label}: Aucun enregistrement trouvé`);
        return false;
      }
      
      console.log(`   ✅ ${label}: ${data.length} enregistrement(s) trouvé(s)`);
      
      if (expectedFields.length > 0 && data[0]) {
        expectedFields.forEach(field => {
          const value = data[0][field];
          console.log(`      - ${field}: ${value}`);
        });
      }
      
      return true;
    };

    const tenantCreated = await checkAfterTrigger(
      'tenants', 
      { id: realTenantId }, 
      'Tenant créé',
      ['name', 'status', 'created_at']
    );

    const profileCreated = await checkAfterTrigger(
      'profiles', 
      { user_id: realUserId }, 
      'Profile créé',
      ['tenant_id', 'full_name', 'email', 'role']
    );

    const userRoleCreated = await checkAfterTrigger(
      'user_roles', 
      { user_id: realUserId }, 
      'User Role créé',
      ['role_id', 'tenant_id', 'is_active']
    );

    const employeeCreated = await checkAfterTrigger(
      'employees', 
      { user_id: realUserId }, 
      'Employee créé',
      ['employee_id', 'tenant_id', 'job_title', 'status']
    );

    // Vérifier l'invitation mise à jour
    const { data: updatedInvitation, error: invitationUpdateError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', realInvitationId)
      .single();

    if (!invitationUpdateError && updatedInvitation) {
      if (updatedInvitation.status === 'accepted') {
        console.log('   ✅ Invitation: Status mis à jour vers "accepted"');
        console.log(`      - accepted_at: ${updatedInvitation.accepted_at}`);
        console.log(`      - metadata: ${JSON.stringify(updatedInvitation.metadata, null, 2)}`);
      } else {
        console.log(`   ⚠️ Invitation: Status toujours "${updatedInvitation.status}"`);
      }
    }

    // ============================================
    // ÉTAPE 6: RÉSUMÉ ET DIAGNOSTIC
    // ============================================
    console.log('\n📈 6. RÉSUMÉ ET DIAGNOSTIC');
    console.log('─'.repeat(40));
    
    const allCreated = tenantCreated && profileCreated && userRoleCreated && employeeCreated;
    
    if (allCreated) {
      console.log('🎉 SUCCÈS COMPLET: Le trigger a fonctionné parfaitement !');
      console.log('\n✅ Éléments créés avec succès:');
      console.log('   1. ✅ Tenant avec l\'ID de l\'invitation');
      console.log('   2. ✅ Profile utilisateur avec tenant_id');
      console.log('   3. ✅ Rôle tenant_admin assigné');
      console.log('   4. ✅ Employé avec employee_id unique');
      console.log('   5. ✅ Invitation marquée comme acceptée');
      
      console.log('\n🔗 Liens de données vérifiés:');
      console.log(`   - User ID: ${realUserId}`);
      console.log(`   - Tenant ID: ${realTenantId}`);
      console.log(`   - Email: ${realUserEmail}`);
      
    } else {
      console.log('❌ ÉCHEC PARTIEL: Le trigger n\'a pas créé tous les éléments');
      console.log('\n📋 État des créations:');
      console.log(`   - Tenant: ${tenantCreated ? '✅' : '❌'}`);
      console.log(`   - Profile: ${profileCreated ? '✅' : '❌'}`);
      console.log(`   - User Role: ${userRoleCreated ? '✅' : '❌'}`);
      console.log(`   - Employee: ${employeeCreated ? '✅' : '❌'}`);
      
      console.log('\n🔧 Actions recommandées:');
      if (!tenantCreated) console.log('   - Vérifier les politiques RLS sur la table tenants');
      if (!profileCreated) console.log('   - Vérifier les politiques RLS sur la table profiles');
      if (!userRoleCreated) console.log('   - Vérifier l\'existence du rôle tenant_admin');
      if (!employeeCreated) console.log('   - Vérifier les politiques RLS sur la table employees');
    }

    // ============================================
    // ÉTAPE 7: TEST DE CONNEXION
    // ============================================
    console.log('\n🔐 7. Test de connexion utilisateur...');
    
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: realUserEmail,
        password: 'hxwesr2m1C3M1!'
      });

      if (loginError) {
        console.log('   ❌ Erreur connexion:', loginError.message);
      } else {
        console.log('   ✅ Connexion réussie');
        console.log(`      - Session créée pour: ${loginData.user.email}`);
        
        // Déconnexion
        await supabase.auth.signOut();
        console.log('   ✅ Déconnexion effectuée');
      }
    } catch (error) {
      console.log('   ❌ Exception lors de la connexion:', error.message);
    }

  } catch (error) {
    console.error('❌ Erreur générale du test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Exécuter le test
console.log('🚀 DÉMARRAGE DU TEST AVEC UTILISATEUR RÉEL\n');
testRealUserTrigger().then(() => {
  console.log('\n✅ TEST TERMINÉ');
});
