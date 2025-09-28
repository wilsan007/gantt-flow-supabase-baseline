import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAllTables() {
  console.log('=== ANALYSE COMPLÈTE DE TOUTES LES TABLES ===\n');

  // Liste des tables connues à analyser
  const knownTables = [
    'roles', 'permissions', 'role_permissions', 'user_roles',
    'tenants', 'profiles', 'employees', 'invitations',
    'tasks', 'task_actions', 'task_dependencies', 'task_comments', 'task_risks', 'task_documents',
    'projects', 'departments',
    'evaluation_categories', 'evaluation_criteria', 'evaluation_responses', 'evaluations',
    'alerts', 'alert_solutions'
  ];

  console.log('1. ANALYSE DES TABLES CONNUES:');
  
  const tableAnalysis = {};
  
  for (const tableName of knownTables) {
    try {
      // Tester l'existence de la table en essayant de lire ses données
      const { data: sampleData, error: dataError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!dataError) {
        console.log(`✓ Table ${tableName} existe`);
        
        // Analyser quelques enregistrements pour comprendre la structure
        const { data: allData, error: allError } = await supabase
          .from(tableName)
          .select('*')
          .limit(3);

        if (!allError && allData && allData.length > 0) {
          const firstRow = allData[0];
          const columns = Object.keys(firstRow);
          
          tableAnalysis[tableName] = {
            exists: true,
            sampleCount: allData.length,
            columns: columns,
            hasUserId: columns.includes('user_id'),
            hasTenantId: columns.includes('tenant_id'),
            hasCreatedAt: columns.includes('created_at'),
            hasId: columns.includes('id'),
            sampleData: allData
          };

          console.log(`  - Colonnes: ${columns.join(', ')}`);
          console.log(`  - Contient tenant_id: ${columns.includes('tenant_id') ? 'OUI' : 'NON'}`);
          console.log(`  - Contient user_id: ${columns.includes('user_id') ? 'OUI' : 'NON'}`);
          console.log(`  - Nombre d'enregistrements (échantillon): ${allData.length}`);
        }
      } else {
        console.log(`✗ Table ${tableName} n'existe pas ou erreur: ${dataError.message}`);
        tableAnalysis[tableName] = { exists: false, error: dataError.message };
      }
    } catch (error) {
      console.log(`✗ Erreur pour ${tableName}: ${error.message}`);
      tableAnalysis[tableName] = { exists: false, error: error.message };
    }
    console.log('');
  }

  // 2. Classification des tables
  console.log('2. CLASSIFICATION DES TABLES:');
  
  const definitionTables = [];
  const dataTables = [];
  const junctionTables = [];
  
  Object.entries(tableAnalysis).forEach(([tableName, analysis]) => {
    if (!analysis.exists) return;
    
    // Tables de définition : généralement sans tenant_id/user_id, ou avec des noms spécifiques
    const isDefinitionTable = 
      ['roles', 'permissions', 'evaluation_categories', 'evaluation_criteria'].includes(tableName) ||
      (!analysis.hasTenantId && !analysis.hasUserId && tableName.includes('categories')) ||
      (!analysis.hasTenantId && !analysis.hasUserId && tableName.includes('types')) ||
      (!analysis.hasTenantId && !analysis.hasUserId && tableName.includes('statuses'));
    
    // Tables de liaison : contiennent des foreign keys multiples
    const isJunctionTable = 
      ['role_permissions', 'user_roles', 'task_dependencies'].includes(tableName) ||
      (tableName.includes('_') && analysis.columns.filter(col => col.endsWith('_id')).length >= 2);
    
    if (isJunctionTable) {
      junctionTables.push(tableName);
    } else if (isDefinitionTable) {
      definitionTables.push(tableName);
    } else {
      dataTables.push(tableName);
    }
  });

  console.log('\nTABLES DE DÉFINITION:');
  definitionTables.forEach(table => {
    const analysis = tableAnalysis[table];
    if (analysis.exists) {
      console.log(`  - ${table} (tenant_id: ${analysis.hasTenantId ? 'OUI' : 'NON'})`);
      if (analysis.sampleData && analysis.sampleData.length > 0) {
        console.log(`    Exemple: ${JSON.stringify(analysis.sampleData[0], null, 2)}`);
      }
    }
  });

  console.log('\nTABLES DE LIAISON:');
  junctionTables.forEach(table => {
    const analysis = tableAnalysis[table];
    if (analysis.exists) {
      console.log(`  - ${table} (tenant_id: ${analysis.hasTenantId ? 'OUI' : 'NON'})`);
    }
  });

  console.log('\nTABLES DE DONNÉES:');
  dataTables.forEach(table => {
    const analysis = tableAnalysis[table];
    if (analysis.exists) {
      console.log(`  - ${table} (tenant_id: ${analysis.hasTenantId ? 'OUI' : 'NON'})`);
    }
  });

  // 3. Résumé pour la migration
  console.log('\n3. RECOMMANDATIONS POUR LA MIGRATION:');
  
  const definitionTablesWithTenantId = definitionTables.filter(table => 
    tableAnalysis[table].exists && tableAnalysis[table].hasTenantId
  );
  
  console.log('\nTables de définition à convertir en globales:');
  definitionTablesWithTenantId.forEach(table => {
    console.log(`  - ${table} (actuellement avec tenant_id)`);
  });

  const definitionTablesAlreadyGlobal = definitionTables.filter(table => 
    tableAnalysis[table].exists && !tableAnalysis[table].hasTenantId
  );
  
  console.log('\nTables de définition déjà globales:');
  definitionTablesAlreadyGlobal.forEach(table => {
    console.log(`  - ${table} (déjà sans tenant_id)`);
  });

  return {
    definitionTables,
    definitionTablesWithTenantId,
    definitionTablesAlreadyGlobal,
    junctionTables,
    dataTables
  };
}

analyzeAllTables().then(result => {
  console.log('\n=== ANALYSE TERMINÉE ===');
}).catch(error => {
  console.error('Erreur:', error);
});
