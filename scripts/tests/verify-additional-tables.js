import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAdditionalTables() {
  console.log('=== VÉRIFICATION DES TABLES SUPPLÉMENTAIRES ===\n');

  const additionalTables = [
    'alert_types_solutions',
    'notification_preferences',
    'role_permissions'
  ];

  const results = {};

  for (const tableName of additionalTables) {
    try {
      console.log(`\n=== ANALYSE: ${tableName} ===`);
      
      const { data: sampleData, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);

      if (error) {
        console.log(`✗ Table ${tableName} n'existe pas ou erreur: ${error.message}`);
        results[tableName] = { exists: false, error: error.message };
        continue;
      }

      console.log(`✓ Table ${tableName} existe`);

      if (!sampleData || sampleData.length === 0) {
        console.log('Table vide');
        results[tableName] = {
          exists: true,
          empty: true,
          isDefinitionTable: false
        };
        continue;
      }

      const firstRow = sampleData[0];
      const columns = Object.keys(firstRow);
      
      const hasTenantId = columns.includes('tenant_id');
      const hasUserId = columns.includes('user_id');
      const hasName = columns.includes('name');
      const hasTitle = columns.includes('title');
      const hasCode = columns.includes('code');

      console.log(`Colonnes (${columns.length}): ${columns.join(', ')}`);
      console.log(`tenant_id: ${hasTenantId ? 'OUI' : 'NON'}`);
      console.log(`user_id: ${hasUserId ? 'OUI' : 'NON'}`);
      console.log(`Enregistrements: ${sampleData.length}`);

      // Analyser si c'est une table de définition
      let isDefinitionTable = false;
      let tableType = '';

      if (tableName === 'role_permissions') {
        isDefinitionTable = true;
        tableType = 'TABLE DE LIAISON (roles ↔ permissions)';
      } else if (tableName === 'alert_types_solutions') {
        isDefinitionTable = true;
        tableType = 'TABLE DE LIAISON (alert_types ↔ alert_solutions)';
      } else if (tableName === 'notification_preferences') {
        // Vérifier si c'est des préférences utilisateur ou des définitions
        if (hasUserId) {
          isDefinitionTable = false;
          tableType = 'TABLE DE DONNÉES UTILISATEUR';
        } else {
          isDefinitionTable = true;
          tableType = 'TABLE DE DÉFINITION';
        }
      }

      results[tableName] = {
        exists: true,
        columns,
        hasTenantId,
        hasUserId,
        hasName: hasName || hasTitle || hasCode,
        sampleCount: sampleData.length,
        sampleData: firstRow,
        isDefinitionTable,
        tableType,
        shouldConvert: isDefinitionTable && hasTenantId
      };

      console.log(`TYPE: ${tableType}`);
      console.log(`À CONVERTIR: ${isDefinitionTable && hasTenantId ? 'OUI' : 'NON'}`);
      console.log(`Exemple: ${JSON.stringify(firstRow, null, 2)}`);

    } catch (error) {
      console.log(`✗ Erreur pour ${tableName}: ${error.message}`);
      results[tableName] = { exists: false, error: error.message };
    }
  }

  // Résumé
  console.log('\n\n=== RÉSUMÉ DES TABLES SUPPLÉMENTAIRES ===');
  
  const existingTables = Object.entries(results)
    .filter(([name, result]) => result.exists)
    .map(([name]) => name);

  const definitionTables = Object.entries(results)
    .filter(([name, result]) => result.isDefinitionTable)
    .map(([name]) => name);

  const tablesToConvert = Object.entries(results)
    .filter(([name, result]) => result.shouldConvert)
    .map(([name]) => name);

  console.log('\nTABLES EXISTANTES:');
  existingTables.forEach(table => {
    const result = results[table];
    console.log(`  - ${table} (${result.tableType})`);
  });

  console.log('\nTABLES DE DÉFINITION/LIAISON:');
  definitionTables.forEach(table => {
    const result = results[table];
    console.log(`  - ${table} (tenant_id: ${result.hasTenantId ? 'OUI' : 'NON'})`);
  });

  console.log('\nTABLES À CONVERTIR:');
  tablesToConvert.forEach(table => {
    console.log(`  - ${table}`);
  });

  return results;
}

verifyAdditionalTables().then(result => {
  console.log('\n=== VÉRIFICATION TERMINÉE ===');
}).catch(error => {
  console.error('Erreur:', error);
});
