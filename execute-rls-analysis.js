import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeAllRLSPolicies() {
  console.log('🔍 ANALYSE COMPLÈTE DES POLITIQUES RLS');
  console.log('=====================================\n');

  try {
    // 1. LISTE DE TOUTES LES TABLES AVEC RLS
    console.log('📊 1. TABLES AVEC RLS ACTIVÉ');
    console.log('----------------------------');
    
    // Test direct des tables connues multitenant
    const knownTables = [
      'profiles', 'employees', 'user_roles', 'tenants', 'invitations',
      'projects', 'tasks', 'departments', 'roles', 'permissions', 
      'role_permissions', 'alert_types', 'alert_type_solutions',
      'expense_categories', 'leaves', 'expenses', 'payrolls'
    ];

    console.log('📋 Test d\'accès aux tables connues:');
    
    for (const tableName of knownTables) {
      try {
        // Test simple SELECT pour vérifier l'existence et RLS
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`  ❌ ${tableName} - Table inexistante`);
          } else if (error.message.includes('RLS') || error.message.includes('policy') || error.message.includes('row-level security')) {
            console.log(`  🛡️ ${tableName} - RLS activé: ${error.message}`);
          } else if (error.message.includes('permission') || error.message.includes('insufficient')) {
            console.log(`  🔒 ${tableName} - Permissions insuffisantes: ${error.message}`);
          } else if (error.message.includes('tenant_id')) {
            console.log(`  🏢 ${tableName} - Restriction tenant_id: ${error.message}`);
          } else {
            console.log(`  ⚠️ ${tableName} - Erreur: ${error.message}`);
          }
        } else {
          console.log(`  ✅ ${tableName} - Accessible (${data ? data.length : 0} enregistrements)`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName} - Exception: ${err.message.substring(0, 50)}...`);
      }
    }

    console.log('\n');

    // 2. ANALYSE DES TABLES CRITIQUES
    console.log('⚠️ 2. TABLES CRITIQUES TENANT OWNER');
    console.log('-----------------------------------');

    const criticalTables = ['profiles', 'employees', 'user_roles', 'tenants', 'invitations'];
    
    for (const tableName of criticalTables) {
      console.log(`\n📋 Table: ${tableName}`);
      
      // Vérifier si la table existe
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);

      if (!tableExists || tableExists.length === 0) {
        console.log(`  ❌ Table '${tableName}' non trouvée`);
        continue;
      }

      console.log(`  ✅ Table trouvée`);

      // Tester l'accès à la table
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`  🔒 Accès bloqué: ${error.message}`);
          
          // Analyser le type d'erreur
          if (error.message.includes('RLS')) {
            console.log(`  🛡️ RLS activé sur cette table`);
          }
          if (error.message.includes('tenant_id')) {
            console.log(`  🏢 Erreur liée à tenant_id`);
          }
          if (error.message.includes('permission')) {
            console.log(`  🚫 Erreur de permissions`);
          }
        } else {
          console.log(`  ✅ Accès autorisé (${data ? data.length : 0} enregistrements visibles)`);
        }
      } catch (err) {
        console.log(`  ❌ Erreur test accès: ${err.message}`);
      }

      // Tester l'insertion
      try {
        const testData = {
          id: '00000000-0000-0000-0000-000000000001'
        };
        
        if (tableName === 'profiles') {
          testData.user_id = '00000000-0000-0000-0000-000000000001';
          testData.email = 'test@example.com';
        } else if (tableName === 'employees') {
          testData.employee_id = 'TEST001';
          testData.email = 'test@example.com';
        } else if (tableName === 'user_roles') {
          testData.user_id = '00000000-0000-0000-0000-000000000001';
          testData.role_id = '00000000-0000-0000-0000-000000000001';
        } else if (tableName === 'tenants') {
          testData.name = 'Test Tenant';
        } else if (tableName === 'invitations') {
          testData.email = 'test@example.com';
          testData.invitation_type = 'test';
        }

        const { error: insertError } = await supabase
          .from(tableName)
          .insert(testData)
          .select();

        if (insertError) {
          console.log(`  🚫 INSERT bloqué: ${insertError.message}`);
          
          if (insertError.message.includes('tenant_id')) {
            console.log(`  ⚠️ PROBLÈME: tenant_id requis pour INSERT`);
          }
          if (insertError.message.includes('RLS')) {
            console.log(`  🛡️ Bloqué par politique RLS`);
          }
        } else {
          console.log(`  ✅ INSERT autorisé (test annulé)`);
          // Supprimer le test
          await supabase.from(tableName).delete().eq('id', testData.id);
        }
      } catch (err) {
        console.log(`  ❌ Erreur test INSERT: ${err.message}`);
      }
    }

    console.log('\n');

    // 3. TEST AVEC TENANT_ID
    console.log('🏢 3. TEST AVEC TENANT_ID');
    console.log('-------------------------');

    const testTenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4'; // Tenant existant
    
    for (const tableName of criticalTables) {
      if (tableName === 'tenants') continue; // Skip tenants table
      
      console.log(`\n📋 Test ${tableName} avec tenant_id`);
      
      try {
        const testData = {
          id: '00000000-0000-0000-0000-000000000002',
          tenant_id: testTenantId
        };
        
        if (tableName === 'profiles') {
          testData.user_id = '00000000-0000-0000-0000-000000000002';
          testData.email = 'test2@example.com';
        } else if (tableName === 'employees') {
          testData.employee_id = 'TEST002';
          testData.email = 'test2@example.com';
        } else if (tableName === 'user_roles') {
          testData.user_id = '00000000-0000-0000-0000-000000000002';
          testData.role_id = '00000000-0000-0000-0000-000000000002';
        } else if (tableName === 'invitations') {
          testData.email = 'test2@example.com';
          testData.invitation_type = 'test';
        }

        const { error: insertError } = await supabase
          .from(tableName)
          .insert(testData)
          .select();

        if (insertError) {
          console.log(`  🚫 INSERT avec tenant_id bloqué: ${insertError.message}`);
        } else {
          console.log(`  ✅ INSERT avec tenant_id autorisé`);
          // Supprimer le test
          await supabase.from(tableName).delete().eq('id', testData.id);
        }
      } catch (err) {
        console.log(`  ❌ Erreur test tenant_id: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter l'analyse
analyzeAllRLSPolicies();
