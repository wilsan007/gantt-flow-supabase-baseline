import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDefinitionTables() {
  console.log('=== ANALYSE ÉTENDUE DES TABLES DE DÉFINITION ===\n');

  // Tables potentielles de définition à analyser
  const potentialDefinitionTables = [
    // Tables déjà identifiées
    'roles', 'permissions', 'role_permissions',
    
    // Tables avec "types"
    'task_types', 'project_types', 'contract_types', 'priority_types', 'status_types',
    'notification_types', 'document_types', 'evaluation_types', 'alert_types',
    
    // Tables avec "categories"
    'evaluation_categories', 'task_categories', 'project_categories', 'expense_categories',
    'skill_categories', 'alert_categories',
    
    // Tables mentionnées par l'utilisateur
    'alert_types_solutions', 'alert_solutions', 'skills',
    
    // Autres tables potentielles de définition
    'statuses', 'priorities', 'currencies', 'countries', 'languages',
    'departments', 'job_titles', 'skill_levels'
  ];

  console.log('1. ANALYSE DES TABLES POTENTIELLES DE DÉFINITION:');
  
  const definitionAnalysis = {};
  
  for (const tableName of potentialDefinitionTables) {
    try {
      // Tester l'existence et récupérer des échantillons
      const { data: sampleData, error: dataError } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);

      if (!dataError && sampleData) {
        console.log(`\n✓ Table ${tableName} existe`);
        
        if (sampleData.length > 0) {
          const firstRow = sampleData[0];
          const columns = Object.keys(firstRow);
          
          definitionAnalysis[tableName] = {
            exists: true,
            sampleCount: sampleData.length,
            columns: columns,
            hasUserId: columns.includes('user_id'),
            hasTenantId: columns.includes('tenant_id'),
            hasCreatedAt: columns.includes('created_at'),
            hasId: columns.includes('id'),
            hasName: columns.includes('name'),
            hasDescription: columns.includes('description'),
            sampleData: sampleData
          };

          console.log(`  - Colonnes (${columns.length}): ${columns.join(', ')}`);
          console.log(`  - tenant_id: ${columns.includes('tenant_id') ? 'OUI' : 'NON'}`);
          console.log(`  - user_id: ${columns.includes('user_id') ? 'OUI' : 'NON'}`);
          console.log(`  - Enregistrements: ${sampleData.length}`);
          
          // Afficher un échantillon de données
          if (sampleData.length > 0) {
            console.log(`  - Exemple: ${JSON.stringify(sampleData[0], null, 2)}`);
          }
        } else {
          console.log(`  - Table vide`);
          definitionAnalysis[tableName] = {
            exists: true,
            empty: true
          };
        }
      } else {
        console.log(`✗ Table ${tableName} n'existe pas`);
        definitionAnalysis[tableName] = { exists: false };
      }
    } catch (error) {
      console.log(`✗ Erreur pour ${tableName}: ${error.message}`);
      definitionAnalysis[tableName] = { exists: false, error: error.message };
    }
  }

  // 2. Classification des tables de définition
  console.log('\n\n2. CLASSIFICATION DES TABLES DE DÉFINITION:');
  
  const trueDefinitionTables = [];
  const definitionTablesWithTenantId = [];
  const definitionTablesGlobal = [];
  
  Object.entries(definitionAnalysis).forEach(([tableName, analysis]) => {
    if (!analysis.exists || analysis.empty) return;
    
    // Critères pour identifier une vraie table de définition
    const isDefinitionTable = 
      // Tables avec des noms typiques de définition
      tableName.includes('types') ||
      tableName.includes('categories') ||
      tableName.includes('statuses') ||
      tableName.includes('priorities') ||
      ['roles', 'permissions', 'role_permissions', 'skills', 'alert_solutions'].includes(tableName) ||
      // Tables avec structure typique de définition (peu de colonnes, name/description)
      (analysis.columns.length <= 6 && analysis.hasName) ||
      // Tables sans user_id (pas liées aux utilisateurs spécifiques)
      (!analysis.hasUserId && analysis.hasName);
    
    if (isDefinitionTable) {
      trueDefinitionTables.push(tableName);
      
      if (analysis.hasTenantId) {
        definitionTablesWithTenantId.push(tableName);
      } else {
        definitionTablesGlobal.push(tableName);
      }
    }
  });

  console.log('\nTABLES DE DÉFINITION VRAIES:');
  trueDefinitionTables.forEach(table => {
    const analysis = definitionAnalysis[table];
    console.log(`  - ${table} (tenant_id: ${analysis.hasTenantId ? 'OUI' : 'NON'}, colonnes: ${analysis.columns.length})`);
  });

  console.log('\nTABLES DE DÉFINITION AVEC tenant_id (À CONVERTIR):');
  definitionTablesWithTenantId.forEach(table => {
    const analysis = definitionAnalysis[table];
    console.log(`  - ${table}`);
    console.log(`    Colonnes: ${analysis.columns.join(', ')}`);
    if (analysis.sampleData && analysis.sampleData.length > 0) {
      console.log(`    Exemple: ${JSON.stringify(analysis.sampleData[0], null, 2)}`);
    }
  });

  console.log('\nTABLES DE DÉFINITION DÉJÀ GLOBALES:');
  definitionTablesGlobal.forEach(table => {
    const analysis = definitionAnalysis[table];
    console.log(`  - ${table} (${analysis.columns.length} colonnes)`);
  });

  // 3. Analyse spéciale pour role_permissions
  console.log('\n3. ANALYSE SPÉCIALE - role_permissions:');
  if (definitionAnalysis['role_permissions'] && definitionAnalysis['role_permissions'].exists) {
    const rp = definitionAnalysis['role_permissions'];
    console.log('La table role_permissions est une table de LIAISON entre roles et permissions.');
    console.log('Elle ne devrait PAS avoir de tenant_id car elle définit des relations globales.');
    console.log(`Actuellement: tenant_id = ${rp.hasTenantId ? 'PRÉSENT (À SUPPRIMER)' : 'ABSENT (CORRECT)'}`);
    console.log(`Colonnes: ${rp.columns.join(', ')}`);
  }

  // 4. Résumé pour la migration
  console.log('\n4. RÉSUMÉ POUR LA MIGRATION:');
  console.log(`\nTables de définition trouvées: ${trueDefinitionTables.length}`);
  console.log(`Tables à convertir (avec tenant_id): ${definitionTablesWithTenantId.length}`);
  console.log(`Tables déjà globales: ${definitionTablesGlobal.length}`);
  
  console.log('\nLISTE COMPLÈTE DES TABLES À CONVERTIR:');
  definitionTablesWithTenantId.forEach(table => {
    console.log(`  - ${table}`);
  });

  return {
    trueDefinitionTables,
    definitionTablesWithTenantId,
    definitionTablesGlobal,
    definitionAnalysis
  };
}

analyzeDefinitionTables().then(result => {
  console.log('\n=== ANALYSE TERMINÉE ===');
}).catch(error => {
  console.error('Erreur:', error);
});
