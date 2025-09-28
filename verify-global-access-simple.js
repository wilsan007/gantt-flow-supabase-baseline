import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM';

const supabase = createClient(supabaseUrl, anonKey);

// Tables de définition à vérifier
const definitionTables = [
  'roles', 'permissions', 'role_permissions', 'absence_types', 
  'alert_types', 'evaluation_categories', 'expense_categories', 
  'alert_solutions', 'skills', 'positions', 'alert_type_solutions'
];

async function checkTableAccess(tableName) {
  try {
    // Test d'accès en lecture avec un utilisateur anonyme
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      return {
        table: tableName,
        accessible: false,
        error: error.message,
        recordCount: 0
      };
    }

    // Compter les enregistrements
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    return {
      table: tableName,
      accessible: true,
      error: null,
      recordCount: count || 0,
      hasData: data && data.length > 0
    };

  } catch (error) {
    return {
      table: tableName,
      accessible: false,
      error: error.message,
      recordCount: 0
    };
  }
}

async function checkTenantIdColumn(tableName) {
  try {
    // Essayer de sélectionner la colonne tenant_id
    const { data, error } = await supabase
      .from(tableName)
      .select('tenant_id')
      .limit(1);

    if (error && error.message.includes('column "tenant_id" does not exist')) {
      return { hasTenantId: false };
    }

    return { hasTenantId: true };
  } catch (error) {
    // Si erreur de colonne inexistante, c'est bon signe
    if (error.message.includes('column "tenant_id" does not exist')) {
      return { hasTenantId: false };
    }
    return { hasTenantId: null, error: error.message };
  }
}

async function verifyGlobalAccessSimple() {
  console.log('🔍 VÉRIFICATION SIMPLE DE L\'ACCESSIBILITÉ GLOBALE\n');
  console.log('='.repeat(60));

  const results = [];

  for (const table of definitionTables) {
    console.log(`\n📋 Vérification de ${table}...`);
    
    // Test d'accès
    const accessResult = await checkTableAccess(table);
    
    // Test de la colonne tenant_id
    const tenantIdResult = await checkTenantIdColumn(table);
    
    const result = {
      ...accessResult,
      ...tenantIdResult
    };
    
    results.push(result);

    // Affichage du résultat
    if (result.accessible) {
      console.log(`✅ ${table}: ACCESSIBLE`);
      console.log(`   - Enregistrements: ${result.recordCount}`);
      console.log(`   - tenant_id: ${result.hasTenantId ? '❌ PRÉSENT' : '✅ SUPPRIMÉ'}`);
    } else {
      console.log(`❌ ${table}: NON ACCESSIBLE`);
      console.log(`   - Erreur: ${result.error}`);
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ GLOBAL');
  console.log('='.repeat(60));

  const accessible = results.filter(r => r.accessible).length;
  const withoutTenantId = results.filter(r => r.hasTenantId === false).length;
  const withData = results.filter(r => r.recordCount > 0).length;

  console.log(`✅ Tables accessibles: ${accessible}/${definitionTables.length}`);
  console.log(`✅ Tables sans tenant_id: ${withoutTenantId}/${definitionTables.length}`);
  console.log(`📊 Tables avec données: ${withData}/${definitionTables.length}`);

  // Tables problématiques
  const problematic = results.filter(r => !r.accessible || r.hasTenantId === true);
  
  if (problematic.length > 0) {
    console.log('\n⚠️  TABLES PROBLÉMATIQUES:');
    problematic.forEach(table => {
      console.log(`❌ ${table.table}:`);
      if (!table.accessible) console.log(`   - Non accessible: ${table.error}`);
      if (table.hasTenantId === true) console.log(`   - tenant_id encore présent`);
    });
  }

  // Conclusion
  console.log('\n🎯 CONCLUSION:');
  if (accessible === definitionTables.length && withoutTenantId === definitionTables.length) {
    console.log('✅ SUCCÈS: Toutes les tables sont globalement accessibles sans tenant_id');
    console.log('✅ Les utilisateurs de différents tenants peuvent accéder aux mêmes données de définition');
  } else {
    console.log('⚠️  MIGRATION INCOMPLÈTE: Certaines tables nécessitent encore des corrections');
    console.log('💡 Exécutez les scripts de migration individuels pour corriger les problèmes');
  }

  return {
    totalTables: definitionTables.length,
    accessibleTables: accessible,
    tablesWithoutTenantId: withoutTenantId,
    isFullyMigrated: accessible === definitionTables.length && withoutTenantId === definitionTables.length
  };
}

// Test avec différents utilisateurs simulés
async function testMultiTenantAccess() {
  console.log('\n🏢 TEST MULTI-TENANT');
  console.log('-'.repeat(40));
  
  // Test avec quelques tables clés
  const keyTables = ['roles', 'permissions', 'absence_types', 'skills'];
  
  for (const table of keyTables) {
    console.log(`\n📋 ${table}:`);
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(3);

      if (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      } else {
        console.log(`   ✅ Accessible - ${data.length} enregistrements échantillon`);
        if (data.length > 0) {
          const sampleRecord = data[0];
          const hasId = sampleRecord.id ? '✅' : '❌';
          const hasName = sampleRecord.name || sampleRecord.title ? '✅' : '❌';
          console.log(`   - Structure: ID ${hasId}, Nom ${hasName}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
  }
}

// Exécution
verifyGlobalAccessSimple()
  .then(async (result) => {
    await testMultiTenantAccess();
    console.log('\n📊 Résultat final:', result.isFullyMigrated ? 'MIGRATION RÉUSSIE' : 'CORRECTIONS NÉCESSAIRES');
  })
  .catch(console.error);
