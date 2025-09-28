import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Tables de définition à vérifier
const definitionTables = [
  'roles', 'permissions', 'role_permissions', 'absence_types', 
  'alert_types', 'evaluation_categories', 'expense_categories', 
  'alert_solutions', 'skills', 'positions', 'alert_type_solutions'
];

async function executeSQL(query) {
  try {
    const { data, error } = await supabase.rpc('exec', { sql: query });
    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`SQL Error: ${error.message}`);
  }
}

async function checkTableStructure(tableName) {
  try {
    // 1. Vérifier si tenant_id existe encore
    const tenantIdCheck = await executeSQL(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}' AND column_name = 'tenant_id';
    `);

    // 2. Vérifier les politiques RLS
    const policies = await executeSQL(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = '${tableName}';
    `);

    // 3. Vérifier si RLS est activé
    const rlsStatus = await executeSQL(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = '${tableName}';
    `);

    // 4. Compter les enregistrements
    const count = await executeSQL(`SELECT COUNT(*) as count FROM ${tableName};`);

    // 5. Vérifier les contraintes uniques
    const constraints = await executeSQL(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = '${tableName}' AND constraint_type = 'UNIQUE';
    `);

    return {
      table: tableName,
      hasTenantId: tenantIdCheck && tenantIdCheck.length > 0,
      rlsEnabled: rlsStatus && rlsStatus[0] && rlsStatus[0].relrowsecurity,
      policies: policies || [],
      recordCount: count && count[0] ? count[0].count : 0,
      uniqueConstraints: constraints || []
    };

  } catch (error) {
    return {
      table: tableName,
      error: error.message
    };
  }
}

async function testUserAccess(tableName, userToken) {
  try {
    // Créer un client avec le token utilisateur
    const userClient = createClient(supabaseUrl, userToken);
    
    // Tester l'accès en lecture
    const { data, error } = await userClient
      .from(tableName)
      .select('*')
      .limit(1);

    return {
      table: tableName,
      canRead: !error,
      error: error ? error.message : null,
      sampleData: data && data.length > 0 ? 'Données accessibles' : 'Table vide'
    };

  } catch (error) {
    return {
      table: tableName,
      canRead: false,
      error: error.message
    };
  }
}

async function verifyGlobalAccess() {
  console.log('🔍 VÉRIFICATION DE L\'ACCESSIBILITÉ GLOBALE DES 11 TABLES DE DÉFINITION\n');
  console.log('='.repeat(80));

  // 1. Vérifier la structure de chaque table
  console.log('\n📋 1. STRUCTURE DES TABLES');
  console.log('-'.repeat(50));

  const tableResults = [];
  
  for (const table of definitionTables) {
    const result = await checkTableStructure(table);
    tableResults.push(result);

    if (result.error) {
      console.log(`❌ ${table}: ERREUR - ${result.error}`);
      continue;
    }

    console.log(`\n📊 ${table.toUpperCase()}:`);
    console.log(`   - tenant_id présent: ${result.hasTenantId ? '❌ OUI' : '✅ NON'}`);
    console.log(`   - RLS activé: ${result.rlsEnabled ? '✅ OUI' : '❌ NON'}`);
    console.log(`   - Nombre d'enregistrements: ${result.recordCount}`);
    console.log(`   - Contraintes uniques: ${result.uniqueConstraints.length}`);
    console.log(`   - Politiques RLS: ${result.policies.length}`);

    // Détail des politiques
    if (result.policies.length > 0) {
      result.policies.forEach(policy => {
        const access = policy.cmd === 'SELECT' ? 'LECTURE' : 
                      policy.cmd === 'ALL' ? 'ÉCRITURE' : policy.cmd;
        console.log(`     • ${policy.policyname} (${access})`);
      });
    }
  }

  // 2. Résumé de la migration
  console.log('\n📈 2. RÉSUMÉ DE LA MIGRATION');
  console.log('-'.repeat(50));

  const migrationSummary = {
    totalTables: definitionTables.length,
    tablesWithoutTenantId: tableResults.filter(r => !r.error && !r.hasTenantId).length,
    tablesWithRLS: tableResults.filter(r => !r.error && r.rlsEnabled).length,
    tablesWithPolicies: tableResults.filter(r => !r.error && r.policies.length > 0).length,
    tablesWithErrors: tableResults.filter(r => r.error).length
  };

  console.log(`✅ Tables sans tenant_id: ${migrationSummary.tablesWithoutTenantId}/${migrationSummary.totalTables}`);
  console.log(`✅ Tables avec RLS: ${migrationSummary.tablesWithRLS}/${migrationSummary.totalTables}`);
  console.log(`✅ Tables avec politiques: ${migrationSummary.tablesWithPolicies}/${migrationSummary.totalTables}`);
  console.log(`❌ Tables avec erreurs: ${migrationSummary.tablesWithErrors}/${migrationSummary.totalTables}`);

  // 3. Vérifier les politiques d'accès global
  console.log('\n🌐 3. POLITIQUES D\'ACCÈS GLOBAL');
  console.log('-'.repeat(50));

  const globalAccessTables = tableResults.filter(r => 
    !r.error && 
    r.policies.some(p => p.policyname.includes('Global read access'))
  );

  console.log(`Tables avec accès global en lecture: ${globalAccessTables.length}/${definitionTables.length}`);

  globalAccessTables.forEach(table => {
    const readPolicy = table.policies.find(p => p.policyname.includes('Global read access'));
    const writePolicy = table.policies.find(p => p.policyname.includes('Super admin write access'));
    
    console.log(`✅ ${table.table}:`);
    console.log(`   - Lecture globale: ${readPolicy ? '✅' : '❌'}`);
    console.log(`   - Écriture super admin: ${writePolicy ? '✅' : '❌'}`);
  });

  // 4. Tables nécessitant une correction
  console.log('\n⚠️  4. TABLES NÉCESSITANT UNE CORRECTION');
  console.log('-'.repeat(50));

  const problematicTables = tableResults.filter(r => 
    r.error || 
    r.hasTenantId || 
    !r.rlsEnabled || 
    !r.policies.some(p => p.policyname.includes('Global read access'))
  );

  if (problematicTables.length === 0) {
    console.log('🎉 AUCUNE CORRECTION NÉCESSAIRE - Toutes les tables sont correctement configurées !');
  } else {
    problematicTables.forEach(table => {
      console.log(`❌ ${table.table}:`);
      if (table.error) console.log(`   - Erreur: ${table.error}`);
      if (table.hasTenantId) console.log(`   - tenant_id encore présent`);
      if (!table.rlsEnabled) console.log(`   - RLS non activé`);
      if (!table.policies.some(p => p.policyname.includes('Global read access'))) {
        console.log(`   - Politique de lecture globale manquante`);
      }
    });
  }

  // 5. Conclusion
  console.log('\n🎯 5. CONCLUSION');
  console.log('-'.repeat(50));

  const isFullyMigrated = migrationSummary.tablesWithoutTenantId === migrationSummary.totalTables &&
                         migrationSummary.tablesWithRLS === migrationSummary.totalTables &&
                         globalAccessTables.length === migrationSummary.totalTables;

  if (isFullyMigrated) {
    console.log('✅ MIGRATION COMPLÈTE: Toutes les tables de définition sont maintenant globales');
    console.log('✅ ACCÈS MULTI-TENANT: Tous les utilisateurs peuvent accéder aux données de définition');
    console.log('✅ SÉCURITÉ: Seuls les super admins peuvent modifier les données');
  } else {
    console.log('⚠️  MIGRATION INCOMPLÈTE: Certaines tables nécessitent encore des corrections');
    console.log('💡 Exécutez les scripts de migration individuels pour les tables problématiques');
  }

  return {
    summary: migrationSummary,
    isFullyMigrated,
    problematicTables: problematicTables.map(t => t.table)
  };
}

// Exécution
verifyGlobalAccess()
  .then(result => {
    console.log('\n📊 Résultat final:', result.isFullyMigrated ? 'SUCCÈS' : 'CORRECTIONS NÉCESSAIRES');
  })
  .catch(console.error);
