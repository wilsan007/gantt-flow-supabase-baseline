import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeCurrentRLSPolicies() {
  console.log('🔍 ANALYSE DES POLITIQUES RLS ACTUELLES');
  console.log('======================================\n');

  try {
    // Analyser les politiques sur les tables critiques
    const criticalTables = ['profiles', 'employees', 'user_roles', 'tenants'];
    
    for (const tableName of criticalTables) {
      console.log(`📋 Table: ${tableName}`);
      console.log('─'.repeat(30));
      
      // Test 1: Vérifier l'existence de get_user_tenant_id()
      try {
        const { data: funcTest, error: funcError } = await supabase.rpc('get_user_tenant_id');
        if (funcError) {
          console.log(`  ⚠️ Fonction get_user_tenant_id(): ${funcError.message}`);
        } else {
          console.log(`  ✅ Fonction get_user_tenant_id() existe, retourne: ${funcTest}`);
        }
      } catch (err) {
        console.log(`  ❌ Erreur test get_user_tenant_id(): ${err.message}`);
      }

      // Test 2: Insertion sans tenant_id
      console.log(`\n  🧪 Test INSERT sans tenant_id:`);
      try {
        const testData = {
          id: '22222222-2222-2222-2222-222222222222'
        };
        
        if (tableName === 'profiles') {
          testData.user_id = '22222222-2222-2222-2222-222222222222';
          testData.email = 'test-no-tenant@example.com';
          testData.full_name = 'Test No Tenant';
        } else if (tableName === 'employees') {
          testData.employee_id = 'NOTENANT001';
          testData.email = 'test-no-tenant@example.com';
          testData.full_name = 'Test No Tenant';
        } else if (tableName === 'user_roles') {
          testData.user_id = '22222222-2222-2222-2222-222222222222';
          testData.role_id = '2f8398a3-95f3-4f24-96c4-5bd211a53b1b'; // tenant_admin role
        } else if (tableName === 'tenants') {
          testData.name = 'Test No Tenant';
        }

        const { error: insertError } = await supabase
          .from(tableName)
          .insert(testData)
          .select();

        if (insertError) {
          if (insertError.message.includes('get_user_tenant_id')) {
            console.log(`    🏢 BLOQUÉ par get_user_tenant_id(): ${insertError.message}`);
          } else if (insertError.message.includes('tenant_id')) {
            console.log(`    🏢 BLOQUÉ par tenant_id: ${insertError.message}`);
          } else if (insertError.message.includes('policy') || insertError.message.includes('RLS')) {
            console.log(`    🛡️ BLOQUÉ par politique RLS: ${insertError.message}`);
          } else {
            console.log(`    ⚠️ BLOQUÉ autre raison: ${insertError.message}`);
          }
        } else {
          console.log(`    ✅ INSERT sans tenant_id AUTORISÉ`);
          // Nettoyer
          await supabase.from(tableName).delete().eq('id', testData.id);
        }
      } catch (err) {
        console.log(`    ❌ Exception: ${err.message}`);
      }

      // Test 3: Insertion avec tenant_id valide
      console.log(`\n  🧪 Test INSERT avec tenant_id:`);
      try {
        const testData = {
          id: '33333333-3333-3333-3333-333333333333',
          tenant_id: '878c5ac9-4e99-4baf-803a-14f8ac964ec4' // Tenant existant
        };
        
        if (tableName === 'profiles') {
          testData.user_id = '33333333-3333-3333-3333-333333333333';
          testData.email = 'test-with-tenant@example.com';
          testData.full_name = 'Test With Tenant';
        } else if (tableName === 'employees') {
          testData.employee_id = 'WITHTENANT001';
          testData.email = 'test-with-tenant@example.com';
          testData.full_name = 'Test With Tenant';
        } else if (tableName === 'user_roles') {
          testData.user_id = '33333333-3333-3333-3333-333333333333';
          testData.role_id = '2f8398a3-95f3-4f24-96c4-5bd211a53b1b';
        } else if (tableName === 'tenants') {
          delete testData.tenant_id; // Les tenants n'ont pas de tenant_id
          testData.name = 'Test With Tenant';
        }

        const { error: insertError } = await supabase
          .from(tableName)
          .insert(testData)
          .select();

        if (insertError) {
          console.log(`    🚫 BLOQUÉ même avec tenant_id: ${insertError.message}`);
        } else {
          console.log(`    ✅ INSERT avec tenant_id AUTORISÉ`);
          // Nettoyer
          await supabase.from(tableName).delete().eq('id', testData.id);
        }
      } catch (err) {
        console.log(`    ❌ Exception: ${err.message}`);
      }

      console.log('\n');
    }

    // Test spécial: Simuler le contexte du trigger
    console.log('🔧 SIMULATION CONTEXTE TRIGGER');
    console.log('─'.repeat(30));
    
    // Test avec un utilisateur qui n'a pas encore de profil
    console.log('📝 Test création profil pour nouvel utilisateur:');
    
    const newUserId = '44444444-4444-4444-4444-444444444444';
    const newTenantId = '55555555-5555-5555-5555-555555555555';
    
    try {
      // 1. Créer le tenant d'abord
      console.log('  1️⃣ Création tenant...');
      const { error: tenantError } = await supabase
        .from('tenants')
        .insert({
          id: newTenantId,
          name: 'Test Trigger Tenant',
          status: 'active'
        });
      
      if (tenantError) {
        console.log(`    🚫 Échec création tenant: ${tenantError.message}`);
      } else {
        console.log(`    ✅ Tenant créé`);
        
        // 2. Créer le profil
        console.log('  2️⃣ Création profil...');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: '66666666-6666-6666-6666-666666666666',
            user_id: newUserId,
            tenant_id: newTenantId,
            email: 'test-trigger@example.com',
            full_name: 'Test Trigger User',
            role: 'tenant_admin'
          });
        
        if (profileError) {
          console.log(`    🚫 Échec création profil: ${profileError.message}`);
        } else {
          console.log(`    ✅ Profil créé`);
          
          // 3. Créer l'employé
          console.log('  3️⃣ Création employé...');
          const { error: employeeError } = await supabase
            .from('employees')
            .insert({
              id: '77777777-7777-7777-7777-777777777777',
              user_id: newUserId,
              tenant_id: newTenantId,
              employee_id: 'TRIGGER001',
              email: 'test-trigger@example.com',
              full_name: 'Test Trigger Employee',
              job_title: 'Test',
              hire_date: new Date().toISOString().split('T')[0],
              contract_type: 'CDI',
              status: 'active'
            });
          
          if (employeeError) {
            console.log(`    🚫 Échec création employé: ${employeeError.message}`);
          } else {
            console.log(`    ✅ Employé créé`);
          }
        }
      }
      
      // Nettoyer
      await supabase.from('employees').delete().eq('user_id', newUserId);
      await supabase.from('profiles').delete().eq('user_id', newUserId);
      await supabase.from('tenants').delete().eq('id', newTenantId);
      
    } catch (err) {
      console.log(`  ❌ Exception simulation: ${err.message}`);
    }

    console.log('\n📊 RÉSUMÉ DES BLOCAGES RLS');
    console.log('─'.repeat(30));
    console.log('Les tests montrent les politiques RLS qui bloquent le trigger.');
    console.log('Le trigger auto_create_tenant_owner() échoue probablement car:');
    console.log('1. 🏢 get_user_tenant_id() retourne NULL pour les nouveaux utilisateurs');
    console.log('2. 🛡️ Les politiques RLS bloquent les INSERT même avec SECURITY DEFINER');
    console.log('3. 🔄 Ordre de création: tenant → profil → employé → user_roles');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

analyzeCurrentRLSPolicies();
