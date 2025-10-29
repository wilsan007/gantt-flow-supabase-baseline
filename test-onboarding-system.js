import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOnboardingSystem() {
  console.log('🧪 TEST SYSTÈME D\'ONBOARDING COMPLET');
  console.log('=====================================');
  
  const testResults = {
    schemaCheck: false,
    sqlFunction: false,
    edgeFunction: false,
    reactFlow: false,
    idempotence: false
  };
  
  let testInvitationId, edgeTestInvitationId, testUserId, onboardResult, testTenant, edgeTestTenant;

  try {
    // 1. VÉRIFICATION DU SCHÉMA
    console.log('\n1️⃣ VÉRIFICATION DU SCHÉMA...');
    
    const tables = ['invitations', 'tenants', 'profiles', 'user_roles', 'roles'];
    const tableStatus = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          tableStatus[table] = `❌ ${error.message}`;
        } else {
          tableStatus[table] = `✅ ${count} enregistrements`;
        }
      } catch (err) {
        tableStatus[table] = `❌ ${err.message}`;
      }
    }
    
    console.log('📊 État des tables:');
    Object.entries(tableStatus).forEach(([table, status]) => {
      console.log(`   ${table}: ${status}`);
    });
    
    testResults.schemaCheck = Object.values(tableStatus).every(status => status.includes('✅'));
    
    // 2. CRÉER UNE INVITATION DE TEST
    console.log('\n2️⃣ CRÉATION D\'INVITATION DE TEST...');
    
    // Créer un tenant de test d'abord
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'Test Company ' + Date.now(),
        status: 'active',
        settings: {}
      })
      .select()
      .single();
    
    if (tenantError) {
      console.error('❌ Erreur création tenant:', tenantError);
      return testResults;
    }
    
    testTenant = tenantData;
    console.log('✅ Tenant de test créé:', testTenant.name);
    
    // Générer un UUID valide pour l'invitation
    const { data: uuidData } = await supabase.rpc('gen_random_uuid');
    testInvitationId = uuidData || crypto.randomUUID();
    
    const testInvitation = {
      id: testInvitationId,
      token: 'test-token-' + Date.now(),
      email: 'test-tenant-owner@example.com',
      full_name: 'Test Tenant Owner',
      tenant_id: testTenant.id,
      tenant_name: testTenant.name,
      invitation_type: 'tenant_owner',
      invited_by: '5c5731ce-75d0-4455-8184-bc42c626cb17', // Super Admin
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
      metadata: {}
    };
    
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert(testInvitation)
      .select()
      .single();
    
    if (inviteError) {
      console.error('❌ Erreur création invitation:', inviteError);
      return testResults;
    }
    
    console.log('✅ Invitation créée:', invitation.id);
    
    // 3. TESTER LA FONCTION SQL onboard_tenant_owner
    console.log('\n3️⃣ TEST FONCTION SQL onboard_tenant_owner...');
    
    // Générer un UUID valide pour l'utilisateur
    const { data: userUuidData } = await supabase.rpc('gen_random_uuid');
    testUserId = userUuidData || crypto.randomUUID();
    
    try {
      const { data: sqlResult, error: onboardError } = await supabase
        .rpc('onboard_tenant_owner', {
          p_user_id: testUserId,
          p_email: testInvitation.email,
          p_slug: 'test-slug',
          p_tenant_name: testInvitation.tenant_name,
          p_invite_code: invitation.id
        });
      
      if (onboardError) {
        console.error('❌ Erreur fonction SQL:', onboardError);
      } else {
        onboardResult = sqlResult;
        console.log('✅ Fonction SQL réussie:', onboardResult);
        testResults.sqlFunction = true;
        
        // Vérifier que le tenant a été créé
        const { data: tenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', onboardResult.tenant_id)
          .single();
        
        console.log('✅ Tenant créé:', tenant?.name);
        
        // Vérifier que le profil a été créé
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', testUserId)
          .single();
        
        console.log('✅ Profil créé:', profile?.full_name);
        
        // Vérifier que le rôle a été assigné
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('*, roles(*)')
          .eq('user_id', testUserId)
          .single();
        
        console.log('✅ Rôle assigné:', userRole?.roles?.name);
      }
    } catch (err) {
      console.error('❌ Exception fonction SQL:', err);
    }
    
    // 4. TESTER L'EDGE FUNCTION
    console.log('\n4️⃣ TEST EDGE FUNCTION...');
    
    try {
      // Créer un tenant pour l'Edge Function
      const { data: edgeTenantData, error: edgeTenantError } = await supabase
        .from('tenants')
        .insert({
          name: 'Edge Test Company ' + Date.now(),
          status: 'active',
          settings: {}
        })
        .select()
        .single();
      
      if (edgeTenantError) {
        console.error('❌ Erreur création tenant Edge:', edgeTenantError);
        throw edgeTenantError;
      }
      
      edgeTestTenant = edgeTenantData;
      
      // Créer une nouvelle invitation pour l'Edge Function
      const { data: edgeUuidData } = await supabase.rpc('gen_random_uuid');
      edgeTestInvitationId = edgeUuidData || crypto.randomUUID();
      
      const edgeTestInvitation = {
        id: edgeTestInvitationId,
        token: 'edge-token-' + Date.now(),
        email: 'edge-test@example.com',
        full_name: 'Edge Test Owner',
        tenant_id: edgeTestTenant.id,
        tenant_name: edgeTestTenant.name,
        invitation_type: 'tenant_owner',
        invited_by: '5c5731ce-75d0-4455-8184-bc42c626cb17',
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {}
      };
      
      const { data: edgeInvite } = await supabase
        .from('invitations')
        .insert(edgeTestInvitation)
        .select()
        .single();
      
      // Simuler un appel à l'Edge Function
      const edgeResponse = await fetch(
        `${supabaseUrl}/functions/v1/onboard-tenant-owner`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            code: edgeInvite.id 
          }),
        }
      );
      
      if (edgeResponse.ok) {
        const edgeResult = await edgeResponse.json();
        console.log('✅ Edge Function réussie:', edgeResult);
        testResults.edgeFunction = true;
      } else {
        const edgeError = await edgeResponse.text();
        console.error('❌ Edge Function erreur:', edgeError);
      }
    } catch (err) {
      console.error('❌ Exception Edge Function:', err);
    }
    
    // 5. TEST D'IDEMPOTENCE
    console.log('\n5️⃣ TEST D\'IDEMPOTENCE...');
    
    try {
      // Réutiliser la même invitation
      const { data: idempotentResult, error: idempotentError } = await supabase
        .rpc('onboard_tenant_owner', {
          p_user_id: testUserId,
          p_email: testInvitation.email,
          p_slug: 'test-slug-updated',
          p_tenant_name: testInvitation.tenant_name,
          p_invite_code: invitation.id
        });
      
      if (idempotentError) {
        console.log('✅ Idempotence: Invitation déjà utilisée (comportement attendu)');
        testResults.idempotence = true;
      } else {
        console.log('⚠️ Idempotence: Fonction exécutée à nouveau:', idempotentResult);
        // Vérifier si c'est le même tenant
        testResults.idempotence = idempotentResult.tenant_id === onboardResult?.tenant_id;
      }
    } catch (err) {
      console.error('❌ Exception test idempotence:', err);
    }
    
    // 6. NETTOYAGE (optionnel)
    console.log('\n6️⃣ NETTOYAGE DES DONNÉES DE TEST...');
    
    // Supprimer les données de test créées
    if (testUserId) {
      await supabase.from('user_roles').delete().eq('user_id', testUserId);
      await supabase.from('profiles').delete().eq('user_id', testUserId);
    }
    if (testInvitationId) {
      await supabase.from('invitations').delete().eq('id', testInvitationId);
    }
    if (edgeTestInvitationId) {
      await supabase.from('invitations').delete().eq('id', edgeTestInvitationId);
    }
    if (testTenant) {
      await supabase.from('tenants').delete().eq('id', testTenant.id);
    }
    if (edgeTestTenant) {
      await supabase.from('tenants').delete().eq('id', edgeTestTenant.id);
    }
    
    console.log('✅ Nettoyage terminé');
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
  
  // RÉSUMÉ DES TESTS
  console.log('\n📊 RÉSUMÉ DES TESTS');
  console.log('==================');
  
  const tests = [
    { name: 'Schéma de base', status: testResults.schemaCheck },
    { name: 'Fonction SQL', status: testResults.sqlFunction },
    { name: 'Edge Function', status: testResults.edgeFunction },
    { name: 'Flow React', status: testResults.reactFlow },
    { name: 'Idempotence', status: testResults.idempotence }
  ];
  
  tests.forEach(test => {
    console.log(`${test.status ? '✅' : '❌'} ${test.name}`);
  });
  
  const successRate = tests.filter(t => t.status).length / tests.length * 100;
  console.log(`\n🎯 Taux de réussite: ${successRate.toFixed(1)}%`);
  
  if (successRate === 100) {
    console.log('🎉 SYSTÈME D\'ONBOARDING PARFAITEMENT FONCTIONNEL !');
  } else if (successRate >= 80) {
    console.log('✅ Système fonctionnel avec quelques améliorations possibles');
  } else {
    console.log('⚠️ Système nécessite des corrections');
  }
  
  return testResults;
}

// Exécuter les tests
testOnboardingSystem().catch(console.error);
