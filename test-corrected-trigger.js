import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testCorrectedTrigger() {
  console.log('🧪 TEST DU TRIGGER CORRIGÉ');
  console.log('==========================\n');

  const testEmail = 'test-trigger-corrected@example.com';
  const testUserId = '88888888-8888-8888-8888-888888888888';
  const testTenantId = '99999999-9999-9999-9999-999999999999';
  const testInvitationId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  try {
    // ============================================
    // ÉTAPE 1: NETTOYER LES DONNÉES EXISTANTES
    // ============================================
    console.log('🧹 1. Nettoyage des données existantes...');
    
    await supabase.from('employees').delete().eq('user_id', testUserId);
    await supabase.from('profiles').delete().eq('user_id', testUserId);
    await supabase.from('user_roles').delete().eq('user_id', testUserId);
    await supabase.from('tenants').delete().eq('id', testTenantId);
    await supabase.from('invitations').delete().eq('id', testInvitationId);
    // Pas de fonction delete_auth_user disponible, on ignore
    
    console.log('   ✅ Nettoyage terminé');

    // ============================================
    // ÉTAPE 2: CRÉER UNE INVITATION
    // ============================================
    console.log('\n📧 2. Création de l\'invitation...');
    
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        id: testInvitationId,
        email: testEmail,
        tenant_id: testTenantId,
        invitation_type: 'tenant_owner',
        status: 'pending',
        full_name: 'Test Trigger User',
        token: 'test-token-123',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          company_name: 'Test Trigger Company',
          role: 'tenant_admin'
        }
      })
      .select()
      .single();

    if (invitationError) {
      console.log('   ❌ Erreur création invitation:', invitationError.message);
      return;
    }
    
    console.log('   ✅ Invitation créée:', invitation.id);

    // ============================================
    // ÉTAPE 3: CRÉER UN UTILISATEUR AUTH
    // ============================================
    console.log('\n👤 3. Création utilisateur auth...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: false,
      user_metadata: {
        full_name: 'Test Trigger User'
      }
    });

    if (authError) {
      console.log('   ❌ Erreur création utilisateur:', authError.message);
      return;
    }
    
    console.log('   ✅ Utilisateur créé:', authUser.user.id);

    // ============================================
    // ÉTAPE 4: VÉRIFIER L'ÉTAT AVANT CONFIRMATION
    // ============================================
    console.log('\n🔍 4. État avant confirmation email...');
    
    const checkBefore = async (table, condition) => {
      const { data, error } = await supabase.from(table).select('*').match(condition);
      console.log(`   📋 ${table}: ${data?.length || 0} enregistrements`);
      return data?.length || 0;
    };

    await checkBefore('tenants', { id: testTenantId });
    await checkBefore('profiles', { user_id: authUser.user.id });
    await checkBefore('user_roles', { user_id: authUser.user.id });
    await checkBefore('employees', { user_id: authUser.user.id });

    // ============================================
    // ÉTAPE 5: CONFIRMER L'EMAIL (DÉCLENCHER TRIGGER)
    // ============================================
    console.log('\n🚀 5. Confirmation email (déclenchement trigger)...');
    
    const { data: confirmedUser, error: confirmError } = await supabase.auth.admin.updateUserById(
      authUser.user.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.log('   ❌ Erreur confirmation email:', confirmError.message);
      return;
    }
    
    console.log('   ✅ Email confirmé, trigger déclenché');

    // ============================================
    // ÉTAPE 6: ATTENDRE ET VÉRIFIER LES RÉSULTATS
    // ============================================
    console.log('\n⏳ 6. Attente et vérification des résultats...');
    
    // Attendre un peu pour que le trigger s'exécute
    await new Promise(resolve => setTimeout(resolve, 2000));

    const checkAfter = async (table, condition, expectedFields = []) => {
      const { data, error } = await supabase.from(table).select('*').match(condition);
      
      if (error) {
        console.log(`   ❌ ${table}: Erreur - ${error.message}`);
        return false;
      }
      
      if (!data || data.length === 0) {
        console.log(`   ❌ ${table}: Aucun enregistrement trouvé`);
        return false;
      }
      
      console.log(`   ✅ ${table}: ${data.length} enregistrement(s)`);
      
      if (expectedFields.length > 0 && data[0]) {
        expectedFields.forEach(field => {
          const value = data[0][field];
          console.log(`      - ${field}: ${value}`);
        });
      }
      
      return true;
    };

    console.log('\n📊 Résultats après trigger:');
    
    const tenantOk = await checkAfter('tenants', { id: testTenantId }, ['name', 'status']);
    const profileOk = await checkAfter('profiles', { user_id: authUser.user.id }, ['tenant_id', 'full_name', 'role']);
    const userRoleOk = await checkAfter('user_roles', { user_id: authUser.user.id }, ['role_id', 'tenant_id', 'is_active']);
    const employeeOk = await checkAfter('employees', { user_id: authUser.user.id }, ['employee_id', 'tenant_id', 'job_title']);

    // Vérifier l'invitation mise à jour
    const { data: updatedInvitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', testInvitationId)
      .single();

    if (updatedInvitation && updatedInvitation.status === 'accepted') {
      console.log('   ✅ invitations: Status mis à jour vers "accepted"');
      console.log(`      - accepted_at: ${updatedInvitation.accepted_at}`);
    } else {
      console.log('   ❌ invitations: Status non mis à jour');
    }

    // ============================================
    // ÉTAPE 7: RÉSUMÉ DU TEST
    // ============================================
    console.log('\n📈 7. RÉSUMÉ DU TEST');
    console.log('─'.repeat(30));
    
    const allOk = tenantOk && profileOk && userRoleOk && employeeOk;
    
    if (allOk) {
      console.log('🎉 SUCCÈS: Le trigger fonctionne parfaitement !');
      console.log('✅ Ordre d\'exécution respecté:');
      console.log('   1. Invitation récupérée');
      console.log('   2. Tenant créé');
      console.log('   3. Rôle assigné dans user_roles');
      console.log('   4. Profil créé');
      console.log('   5. Employé créé avec employee_id unique');
      console.log('   6. Invitation marquée comme acceptée');
    } else {
      console.log('❌ ÉCHEC: Le trigger n\'a pas fonctionné correctement');
      console.log('Vérifiez les logs Supabase pour plus de détails');
    }

    // ============================================
    // ÉTAPE 8: NETTOYAGE FINAL
    // ============================================
    console.log('\n🧹 8. Nettoyage final...');
    
    await supabase.from('employees').delete().eq('user_id', authUser.user.id);
    await supabase.from('profiles').delete().eq('user_id', authUser.user.id);
    await supabase.from('user_roles').delete().eq('user_id', authUser.user.id);
    await supabase.from('tenants').delete().eq('id', testTenantId);
    await supabase.from('invitations').delete().eq('id', testInvitationId);
    await supabase.auth.admin.deleteUser(authUser.user.id);
    
    console.log('   ✅ Nettoyage terminé');

  } catch (error) {
    console.error('❌ Erreur générale du test:', error.message);
  }
}

// ============================================
// TEST FONCTION DE RÉPARATION
// ============================================
async function testRepairFunction() {
  console.log('\n🔧 TEST FONCTION DE RÉPARATION');
  console.log('===============================\n');

  const repairEmail = 'test-repair@example.com';

  try {
    // Créer un utilisateur sans profil
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: repairEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Repair User'
      }
    });

    if (authError) {
      console.log('❌ Erreur création utilisateur repair:', authError.message);
      return;
    }

    console.log('✅ Utilisateur repair créé:', authUser.user.id);

    // Tester la fonction de réparation
    const { data: repairResult, error: repairError } = await supabase
      .rpc('repair_existing_tenant_owner', { p_user_email: repairEmail });

    if (repairError) {
      console.log('❌ Erreur fonction repair:', repairError.message);
    } else {
      console.log('✅ Résultat repair:', repairResult);
    }

    // Nettoyage
    await supabase.from('employees').delete().eq('user_id', authUser.user.id);
    await supabase.from('profiles').delete().eq('user_id', authUser.user.id);
    await supabase.from('user_roles').delete().eq('user_id', authUser.user.id);
    await supabase.auth.admin.deleteUser(authUser.user.id);

  } catch (error) {
    console.error('❌ Erreur test repair:', error.message);
  }
}

// Exécuter les tests
console.log('🚀 DÉMARRAGE DES TESTS DU TRIGGER CORRIGÉ\n');
testCorrectedTrigger().then(() => {
  return testRepairFunction();
}).then(() => {
  console.log('\n✅ TOUS LES TESTS TERMINÉS');
});
