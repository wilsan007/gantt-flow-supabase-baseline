import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOnboardingComplete() {
  console.log('🧪 TESTS COMPLETS DU SYSTÈME D\'ONBOARDING');
  console.log('==========================================');
  
  const testResults = {
    rpc_tests: [],
    edge_tests: [],
    e2e_tests: []
  };

  try {
    // ===== TESTS UNITAIRES RPC =====
    console.log('\n1️⃣ TESTS UNITAIRES RPC');
    console.log('======================');

    // Test 1: Invitation valide
    console.log('\n📋 Test 1: RPC avec invitation valide');
    
    const testEmail = `test-onboard-${Date.now()}@example.com`;
    const testSlug = `test-company-${Date.now()}`;
    const testTenantName = 'Test Company Onboarding';
    
    // Créer une invitation de test
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .insert({
        email: testEmail,
        full_name: 'Test User Onboarding',
        tenant_id: crypto.randomUUID(),
        tenant_name: testTenantName,
        invitation_type: 'tenant_owner',
        invited_by: '5c5731ce-75d0-4455-8184-bc42c626cb17', // Super Admin
        status: 'pending',
        token: crypto.randomUUID().replace(/-/g, ''),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: { company_name: testTenantName }
      })
      .select()
      .single();

    if (invError) {
      console.error('❌ Erreur création invitation test:', invError);
      testResults.rpc_tests.push({ test: 'create_invitation', status: 'FAILED', error: invError.message });
    } else {
      console.log('✅ Invitation test créée:', invitation.id);
      testResults.rpc_tests.push({ test: 'create_invitation', status: 'PASSED' });

      // Créer un utilisateur de test
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'TestPassword123!',
        email_confirm: true
      });

      if (authError) {
        console.error('❌ Erreur création utilisateur:', authError);
        testResults.rpc_tests.push({ test: 'create_user', status: 'FAILED', error: authError.message });
      } else {
        console.log('✅ Utilisateur test créé:', authUser.user.id);
        testResults.rpc_tests.push({ test: 'create_user', status: 'PASSED' });

        // Test RPC onboard_tenant_owner
        const { data: rpcResult, error: rpcError } = await supabase.rpc('onboard_tenant_owner', {
          p_user_id: authUser.user.id,
          p_email: testEmail,
          p_slug: testSlug,
          p_tenant_name: testTenantName,
          p_invite_code: invitation.id
        });

        if (rpcError) {
          console.error('❌ Erreur RPC onboard_tenant_owner:', rpcError);
          testResults.rpc_tests.push({ test: 'rpc_onboard', status: 'FAILED', error: rpcError.message });
        } else {
          console.log('✅ RPC onboard_tenant_owner réussie:', rpcResult);
          testResults.rpc_tests.push({ test: 'rpc_onboard', status: 'PASSED', result: rpcResult });

          // Vérifier que tout a été créé correctement
          const verifications = await Promise.all([
            // Vérifier tenant
            supabase.from('tenants').select('*').eq('slug', testSlug).single(),
            // Vérifier profil
            supabase.from('profiles').select('*').eq('user_id', authUser.user.id).single(),
            // Vérifier employé
            supabase.from('employees').select('*').eq('user_id', authUser.user.id).single(),
            // Vérifier user_roles
            supabase.from('user_roles').select('*, roles(name)').eq('user_id', authUser.user.id),
            // Vérifier invitation consommée
            supabase.from('invitations').select('*').eq('id', invitation.id).single()
          ]);

          const [tenantCheck, profileCheck, employeeCheck, rolesCheck, inviteCheck] = verifications;

          console.log('\n🔍 Vérifications post-onboarding:');
          
          if (tenantCheck.data) {
            console.log('✅ Tenant créé:', tenantCheck.data.name);
            testResults.rpc_tests.push({ test: 'tenant_created', status: 'PASSED' });
          } else {
            console.log('❌ Tenant non créé');
            testResults.rpc_tests.push({ test: 'tenant_created', status: 'FAILED' });
          }

          if (profileCheck.data) {
            console.log('✅ Profil créé:', profileCheck.data.full_name);
            testResults.rpc_tests.push({ test: 'profile_created', status: 'PASSED' });
          } else {
            console.log('❌ Profil non créé');
            testResults.rpc_tests.push({ test: 'profile_created', status: 'FAILED' });
          }

          if (employeeCheck.data) {
            console.log('✅ Employé créé:', employeeCheck.data.employee_id);
            testResults.rpc_tests.push({ test: 'employee_created', status: 'PASSED' });
          } else {
            console.log('❌ Employé non créé');
            testResults.rpc_tests.push({ test: 'employee_created', status: 'FAILED' });
          }

          if (rolesCheck.data && rolesCheck.data.length > 0) {
            console.log('✅ Rôles assignés:', rolesCheck.data.map(r => r.roles.name));
            testResults.rpc_tests.push({ test: 'roles_assigned', status: 'PASSED' });
          } else {
            console.log('❌ Aucun rôle assigné');
            testResults.rpc_tests.push({ test: 'roles_assigned', status: 'FAILED' });
          }

          if (inviteCheck.data && inviteCheck.data.accepted_at) {
            console.log('✅ Invitation consommée:', inviteCheck.data.accepted_at);
            testResults.rpc_tests.push({ test: 'invitation_consumed', status: 'PASSED' });
          } else {
            console.log('❌ Invitation non consommée');
            testResults.rpc_tests.push({ test: 'invitation_consumed', status: 'FAILED' });
          }

          // Test idempotence (double appel)
          console.log('\n📋 Test idempotence (double appel RPC)');
          const { data: rpcResult2, error: rpcError2 } = await supabase.rpc('onboard_tenant_owner', {
            p_user_id: authUser.user.id,
            p_email: testEmail,
            p_slug: testSlug,
            p_tenant_name: testTenantName,
            p_invite_code: invitation.id
          });

          if (rpcError2) {
            console.log('✅ Double appel correctement rejeté:', rpcError2.message);
            testResults.rpc_tests.push({ test: 'idempotence', status: 'PASSED' });
          } else {
            console.log('⚠️ Double appel accepté (peut être OK si idempotent)');
            testResults.rpc_tests.push({ test: 'idempotence', status: 'WARNING' });
          }
        }

        // Nettoyage utilisateur
        await supabase.auth.admin.deleteUser(authUser.user.id);
      }

      // Nettoyage invitation
      await supabase.from('invitations').delete().eq('id', invitation.id);
    }

    // ===== TESTS EDGE FUNCTION =====
    console.log('\n2️⃣ TESTS EDGE FUNCTION');
    console.log('======================');

    // Test sans token
    console.log('\n📋 Test Edge Function sans token');
    const noTokenResponse = await fetch(`${supabaseUrl}/functions/v1/onboard-tenant-owner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'test' })
    });

    if (noTokenResponse.status === 401) {
      console.log('✅ Sans token → 401 (correct)');
      testResults.edge_tests.push({ test: 'no_token_401', status: 'PASSED' });
    } else {
      console.log('❌ Sans token → status:', noTokenResponse.status);
      testResults.edge_tests.push({ test: 'no_token_401', status: 'FAILED' });
    }

    // Test avec token invalide
    console.log('\n📋 Test Edge Function avec token invalide');
    const invalidTokenResponse = await fetch(`${supabaseUrl}/functions/v1/onboard-tenant-owner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify({ code: 'test' })
    });

    if (invalidTokenResponse.status === 401) {
      console.log('✅ Token invalide → 401 (correct)');
      testResults.edge_tests.push({ test: 'invalid_token_401', status: 'PASSED' });
    } else {
      console.log('❌ Token invalide → status:', invalidTokenResponse.status);
      testResults.edge_tests.push({ test: 'invalid_token_401', status: 'FAILED' });
    }

    // ===== RÉSUMÉ DES TESTS =====
    console.log('\n🎯 RÉSUMÉ DES TESTS');
    console.log('==================');
    
    const allTests = [...testResults.rpc_tests, ...testResults.edge_tests, ...testResults.e2e_tests];
    const passed = allTests.filter(t => t.status === 'PASSED').length;
    const failed = allTests.filter(t => t.status === 'FAILED').length;
    const warnings = allTests.filter(t => t.status === 'WARNING').length;

    console.log(`✅ Tests réussis: ${passed}`);
    console.log(`❌ Tests échoués: ${failed}`);
    console.log(`⚠️ Avertissements: ${warnings}`);
    console.log(`📊 Total: ${allTests.length}`);

    if (failed === 0) {
      console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
      console.log('Le système d\'onboarding est opérationnel.');
    } else {
      console.log('\n⚠️ Certains tests ont échoué. Vérifiez la configuration.');
    }

    return testResults;

  } catch (error) {
    console.error('💥 Erreur lors des tests:', error);
    return testResults;
  }
}

// Exécuter les tests
testOnboardingComplete();
