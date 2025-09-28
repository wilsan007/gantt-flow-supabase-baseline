const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Liste des fichiers de migration dans l'ordre d'exécution
const migrationFiles = [
  'migrate-roles.sql',
  'migrate-permissions.sql', 
  'migrate-role-permissions.sql',
  'migrate-absence-types.sql',
  'migrate-alert-types.sql',
  'migrate-evaluation-categories.sql',
  'migrate-expense-categories.sql',
  'migrate-alert-solutions.sql',
  'migrate-skills.sql',
  'migrate-positions.sql',
  'migrate-alert-type-solutions.sql'
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

async function checkTableTenantId(tableName) {
  try {
    const { data, error } = await supabase
      .rpc('exec', { 
        sql: `SELECT column_name FROM information_schema.columns WHERE table_name = '${tableName}' AND column_name = 'tenant_id';`
      });
    
    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.log(`❓ Erreur vérification ${tableName}: ${error.message}`);
    return null;
  }
}

async function getTableCount(tableName) {
  try {
    const { data, error } = await supabase
      .rpc('exec', { sql: `SELECT COUNT(*) as count FROM ${tableName};` });
    
    if (error) throw error;
    return data && data[0] ? data[0].count : 0;
  } catch (error) {
    console.log(`❓ Erreur comptage ${tableName}: ${error.message}`);
    return 0;
  }
}

async function testSingleMigration(filename) {
  console.log(`\n=== TEST MIGRATION: ${filename} ===`);
  
  try {
    // Lire le fichier SQL
    const sqlContent = fs.readFileSync(filename, 'utf8');
    const tableName = filename.replace('migrate-', '').replace('.sql', '').replace('-', '_');
    
    console.log(`📋 Table cible: ${tableName}`);
    
    // Vérifier l'état avant migration
    const beforeTenantId = await checkTableTenantId(tableName);
    const beforeCount = await getTableCount(tableName);
    
    console.log(`📊 Avant migration:`);
    console.log(`   - tenant_id présent: ${beforeTenantId ? '✅' : '❌'}`);
    console.log(`   - Nombre d'enregistrements: ${beforeCount}`);
    
    // Exécuter la migration
    console.log(`🚀 Exécution de la migration...`);
    await executeSQL(sqlContent);
    
    // Vérifier l'état après migration
    const afterTenantId = await checkTableTenantId(tableName);
    const afterCount = await getTableCount(tableName);
    
    console.log(`📊 Après migration:`);
    console.log(`   - tenant_id présent: ${afterTenantId ? '❌ ÉCHEC' : '✅ SUCCÈS'}`);
    console.log(`   - Nombre d'enregistrements: ${afterCount}`);
    
    // Résultat
    const success = !afterTenantId;
    console.log(`\n${success ? '✅ MIGRATION RÉUSSIE' : '❌ MIGRATION ÉCHOUÉE'} pour ${tableName}`);
    
    return {
      table: tableName,
      success,
      beforeCount,
      afterCount,
      tenantIdRemoved: !afterTenantId
    };
    
  } catch (error) {
    console.log(`❌ ERREUR lors de la migration ${filename}:`);
    console.log(`   ${error.message}`);
    
    return {
      table: filename.replace('migrate-', '').replace('.sql', ''),
      success: false,
      error: error.message
    };
  }
}

async function testAllMigrations() {
  console.log('🎯 DÉBUT DES TESTS DE MIGRATION INDIVIDUELS\n');
  
  const results = [];
  
  for (const filename of migrationFiles) {
    if (fs.existsSync(filename)) {
      const result = await testSingleMigration(filename);
      results.push(result);
      
      // Pause entre les migrations
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log(`⚠️  Fichier manquant: ${filename}`);
      results.push({
        table: filename,
        success: false,
        error: 'Fichier non trouvé'
      });
    }
  }
  
  // Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ DES MIGRATIONS');
  console.log('='.repeat(60));
  
  let successCount = 0;
  
  for (const result of results) {
    const status = result.success ? '✅ SUCCÈS' : '❌ ÉCHEC';
    console.log(`${status} - ${result.table}`);
    
    if (result.success) {
      successCount++;
      if (result.beforeCount !== undefined) {
        console.log(`   Enregistrements: ${result.beforeCount} → ${result.afterCount}`);
      }
    } else if (result.error) {
      console.log(`   Erreur: ${result.error}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 RÉSULTAT GLOBAL: ${successCount}/${results.length} migrations réussies`);
  
  if (successCount === results.length) {
    console.log('🎉 TOUTES LES MIGRATIONS ONT RÉUSSI !');
  } else {
    console.log('⚠️  Certaines migrations ont échoué. Vérifiez les détails ci-dessus.');
  }
}

// Fonction pour tester une seule table
async function testSpecificTable(tableName) {
  const filename = `migrate-${tableName.replace('_', '-')}.sql`;
  
  if (!fs.existsSync(filename)) {
    console.log(`❌ Fichier non trouvé: ${filename}`);
    return;
  }
  
  await testSingleMigration(filename);
}

// Exécution
if (process.argv.length > 2) {
  // Test d'une table spécifique
  const tableName = process.argv[2];
  testSpecificTable(tableName).catch(console.error);
} else {
  // Test de toutes les migrations
  testAllMigrations().catch(console.error);
}
