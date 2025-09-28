import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function testRLSWithAuth() {
  console.log('🔍 TEST RLS AVEC AUTHENTIFICATION');
  console.log('==================================\n');

  // Client anonyme (sans auth)
  const supabaseAnon = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  // Client service role (bypass RLS)
  const supabaseService = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  );

  const testTables = ['profiles', 'employees', 'user_roles', 'tenants', 'invitations', 'projects', 'tasks'];

  console.log('📊 1. TEST AVEC CLIENT ANONYME (RLS actif)');
  console.log('------------------------------------------');
  
  for (const tableName of testTables) {
    try {
      const { data, error } = await supabaseAnon
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('JWT')) {
          console.log(`  🔒 ${tableName} - Authentification requise`);
        } else if (error.message.includes('RLS') || error.message.includes('policy')) {
          console.log(`  🛡️ ${tableName} - Bloqué par RLS: ${error.message}`);
        } else if (error.message.includes('tenant_id')) {
          console.log(`  🏢 ${tableName} - Restriction tenant_id: ${error.message}`);
        } else {
          console.log(`  ⚠️ ${tableName} - ${error.message}`);
        }
      } else {
        console.log(`  ✅ ${tableName} - Accessible anonyme (${data ? data.length : 0} enregistrements)`);
      }
    } catch (err) {
      console.log(`  ❌ ${tableName} - Exception: ${err.message}`);
    }
  }

  console.log('\n📊 2. TEST AVEC SERVICE ROLE (RLS bypass)');
  console.log('------------------------------------------');
  
  for (const tableName of testTables) {
    try {
      const { data, error } = await supabaseService
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`  ❌ ${tableName} - Erreur service: ${error.message}`);
      } else {
        console.log(`  ✅ ${tableName} - Service OK (${data ? data.length : 0} enregistrements)`);
      }
    } catch (err) {
      console.log(`  ❌ ${tableName} - Exception service: ${err.message}`);
    }
  }

  console.log('\n📊 3. TEST INSERT ANONYME (détection RLS)');
  console.log('------------------------------------------');
  
  const testData = {
    profiles: {
      id: '11111111-1111-1111-1111-111111111111',
      user_id: '11111111-1111-1111-1111-111111111111',
      email: 'test-rls@example.com',
      full_name: 'Test RLS User'
    },
    employees: {
      id: '11111111-1111-1111-1111-111111111111',
      employee_id: 'RLS001',
      email: 'test-rls@example.com',
      full_name: 'Test RLS Employee'
    },
    tenants: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Test RLS Tenant'
    }
  };

  for (const [tableName, data] of Object.entries(testData)) {
    try {
      const { error } = await supabaseAnon
        .from(tableName)
        .insert(data)
        .select();

      if (error) {
        if (error.message.includes('JWT') || error.message.includes('anonymous')) {
          console.log(`  🔒 ${tableName} - INSERT bloqué: authentification requise`);
        } else if (error.message.includes('RLS') || error.message.includes('policy')) {
          console.log(`  🛡️ ${tableName} - INSERT bloqué par RLS: ${error.message}`);
        } else if (error.message.includes('tenant_id')) {
          console.log(`  🏢 ${tableName} - INSERT bloqué: tenant_id requis`);
        } else {
          console.log(`  ⚠️ ${tableName} - INSERT bloqué: ${error.message}`);
        }
      } else {
        console.log(`  ✅ ${tableName} - INSERT autorisé anonyme`);
        // Nettoyer
        await supabaseService.from(tableName).delete().eq('id', data.id);
      }
    } catch (err) {
      console.log(`  ❌ ${tableName} - Exception INSERT: ${err.message}`);
    }
  }

  console.log('\n📊 4. ANALYSE DES TABLES GLOBALES');
  console.log('---------------------------------');
  
  const globalTables = ['roles', 'permissions', 'role_permissions', 'alert_types', 'alert_type_solutions', 'expense_categories'];
  
  for (const tableName of globalTables) {
    try {
      // Test anonyme
      const { data: anonData, error: anonError } = await supabaseAnon
        .from(tableName)
        .select('*')
        .limit(1);

      // Test service
      const { data: serviceData, error: serviceError } = await supabaseService
        .from(tableName)
        .select('*')
        .limit(1);

      if (anonError && serviceError) {
        console.log(`  ❌ ${tableName} - Erreur sur les deux clients`);
      } else if (anonError && !serviceError) {
        console.log(`  🛡️ ${tableName} - RLS actif (anonyme bloqué, service OK)`);
      } else if (!anonError && !serviceError) {
        console.log(`  🌐 ${tableName} - Table globale accessible (anonyme: ${anonData?.length || 0}, service: ${serviceData?.length || 0})`);
      } else {
        console.log(`  ⚠️ ${tableName} - État incohérent`);
      }
    } catch (err) {
      console.log(`  ❌ ${tableName} - Exception: ${err.message}`);
    }
  }

  console.log('\n📈 5. RÉSUMÉ RLS');
  console.log('----------------');
  
  let rlsCount = 0;
  let globalCount = 0;
  let errorCount = 0;
  
  const allTables = [...testTables, ...globalTables];
  
  for (const tableName of allTables) {
    try {
      const { error: anonError } = await supabaseAnon.from(tableName).select('*').limit(1);
      const { error: serviceError } = await supabaseService.from(tableName).select('*').limit(1);
      
      if (anonError && !serviceError) {
        rlsCount++;
      } else if (!anonError && !serviceError) {
        globalCount++;
      } else {
        errorCount++;
      }
    } catch (err) {
      errorCount++;
    }
  }
  
  console.log(`🛡️ Tables avec RLS: ${rlsCount}`);
  console.log(`🌐 Tables globales: ${globalCount}`);
  console.log(`❌ Tables avec erreurs: ${errorCount}`);
  console.log(`📊 Total analysé: ${allTables.length}`);
  
  if (rlsCount > 0) {
    console.log(`\n⚠️ CONFIRMATION: ${rlsCount} tables ont bien RLS activé !`);
  }
}

testRLSWithAuth();
