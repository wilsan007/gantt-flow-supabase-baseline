import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAllTables() {
  console.log('=== RECHERCHE EXHAUSTIVE DE TOUTES LES TABLES ===\n');

  // Liste exhaustive de toutes les tables possibles à tester
  const potentialTables = [
    // Tables déjà connues
    'roles', 'permissions', 'role_permissions', 'user_roles',
    'profiles', 'employees', 'tenants', 'invitations',
    'tasks', 'projects', 'evaluations',
    
    // Tables avec "types"
    'absence_types', 'task_types', 'project_types', 'contract_types', 
    'priority_types', 'status_types', 'notification_types', 'document_types', 
    'evaluation_types', 'alert_types', 'leave_types', 'expense_types',
    'payment_types', 'report_types', 'meeting_types', 'training_types',
    
    // Tables avec "categories"
    'evaluation_categories', 'task_categories', 'project_categories', 
    'expense_categories', 'skill_categories', 'alert_categories',
    'training_categories', 'document_categories', 'report_categories',
    
    // Tables avec "status"
    'task_status', 'project_status', 'employee_status', 'leave_status',
    'evaluation_status', 'contract_status', 'payment_status',
    
    // Tables avec "priority"
    'task_priority', 'project_priority', 'alert_priority',
    
    // Autres tables potentielles de définition
    'alert_solutions', 'skills', 'departments', 'positions',
    'currencies', 'countries', 'languages', 'time_zones',
    'job_titles', 'skill_levels', 'education_levels',
    
    // Tables spécifiques mentionnées
    'alert_types_solutions'
  ];

  console.log(`Testant ${potentialTables.length} tables potentielles...\n`);

  const existingTables = [];
  const analysisResults = {};

  // Tester l'existence de chaque table
  for (const tableName of potentialTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error) {
        existingTables.push(tableName);
        console.log(`✓ ${tableName} existe`);
      }
    } catch (error) {
      // Table n'existe pas, on continue
    }
  }

  console.log(`\nTables existantes trouvées: ${existingTables.length}\n`);

  // Analyser chaque table existante
  for (const tableName of existingTables) {
    try {
      console.log(`\n=== ANALYSE: ${tableName} ===`);
      
      // Récupérer quelques enregistrements pour analyser la structure
      const { data: sampleData, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);

      if (error) {
        console.log(`Erreur: ${error.message}`);
        continue;
      }

      if (!sampleData || sampleData.length === 0) {
        console.log('Table vide');
        analysisResults[tableName] = {
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
      const hasDescription = columns.includes('description');
      const hasTitle = columns.includes('title');
      const hasCode = columns.includes('code');

      console.log(`Colonnes (${columns.length}): ${columns.join(', ')}`);
      console.log(`tenant_id: ${hasTenantId ? 'OUI' : 'NON'}`);
      console.log(`user_id: ${hasUserId ? 'OUI' : 'NON'}`);
      console.log(`Enregistrements: ${sampleData.length}`);

      // Critères pour identifier une table de définition
      const isDefinitionTable = 
        // Tables avec noms typiques
        tableName.includes('type') ||
        tableName.includes('categor') ||
        tableName.includes('status') ||
        tableName.includes('priority') ||
        ['roles', 'permissions', 'skills', 'alert_solutions'].includes(tableName) ||
        // Structure typique: peu de colonnes, avec name/title/code
        (columns.length <= 10 && (hasName || hasTitle || hasCode)) ||
        // Pas liée aux utilisateurs spécifiques
        (!hasUserId && (hasName || hasTitle || hasCode));

      // Exclure les tables qui ne sont PAS des définitions
      const isNotDefinition = 
        tableName === 'departments' || // Table de données organisationnelles
        tableName === 'tenants' ||     // Table de données tenant
        tableName === 'profiles' ||    // Table de données utilisateur
        tableName === 'employees' ||   // Table de données utilisateur
        tableName === 'user_roles' ||  // Table de liaison utilisateur
        tableName === 'invitations' || // Table de données processus
        tableName === 'tasks' ||       // Table de données
        tableName === 'projects' ||    // Table de données
        tableName === 'evaluations' || // Table de données
        columns.includes('manager_id') || // Tables avec manager (organisationnelles)
        columns.includes('budget') ||     // Tables avec budget (données)
        columns.includes('assignee_id');  // Tables avec assignation (données)

      const finalIsDefinition = isDefinitionTable && !isNotDefinition;

      analysisResults[tableName] = {
        columns,
        hasTenantId,
        hasUserId,
        hasName: hasName || hasTitle || hasCode,
        sampleCount: sampleData.length,
        sampleData: firstRow,
        isDefinitionTable: finalIsDefinition,
        shouldConvert: finalIsDefinition && hasTenantId
      };

      console.log(`TYPE: ${finalIsDefinition ? 'TABLE DE DÉFINITION' : 'TABLE DE DONNÉES'}`);
      console.log(`À CONVERTIR: ${finalIsDefinition && hasTenantId ? 'OUI' : 'NON'}`);
      
      if (finalIsDefinition) {
        console.log(`Exemple: ${JSON.stringify(firstRow, null, 2)}`);
      }

    } catch (error) {
      console.log(`Erreur pour ${tableName}: ${error.message}`);
    }
  }

  // Résumé final
  console.log('\n\n=== RÉSUMÉ FINAL ===');
  
  const definitionTables = Object.entries(analysisResults)
    .filter(([name, analysis]) => analysis.isDefinitionTable)
    .map(([name]) => name);

  const tablesToConvert = Object.entries(analysisResults)
    .filter(([name, analysis]) => analysis.shouldConvert)
    .map(([name]) => name);

  const alreadyGlobal = Object.entries(analysisResults)
    .filter(([name, analysis]) => analysis.isDefinitionTable && !analysis.hasTenantId)
    .map(([name]) => name);

  console.log('\nTABLES DE DÉFINITION IDENTIFIÉES:');
  definitionTables.forEach(table => {
    const analysis = analysisResults[table];
    console.log(`  - ${table} (tenant_id: ${analysis.hasTenantId ? 'OUI' : 'NON'})`);
  });

  console.log('\nTABLES À CONVERTIR (avec tenant_id):');
  tablesToConvert.forEach(table => {
    console.log(`  - ${table}`);
  });

  console.log('\nTABLES DÉJÀ GLOBALES (sans tenant_id):');
  alreadyGlobal.forEach(table => {
    console.log(`  - ${table}`);
  });

  console.log(`\nSTATISTIQUES:`);
  console.log(`- Tables testées: ${potentialTables.length}`);
  console.log(`- Tables existantes: ${existingTables.length}`);
  console.log(`- Tables de définition: ${definitionTables.length}`);
  console.log(`- Tables à convertir: ${tablesToConvert.length}`);
  console.log(`- Tables déjà globales: ${alreadyGlobal.length}`);

  return {
    existingTables,
    definitionTables,
    tablesToConvert,
    alreadyGlobal,
    analysisResults
  };
}

findAllTables().then(result => {
  console.log('\n=== RECHERCHE TERMINÉE ===');
}).catch(error => {
  console.error('Erreur:', error);
});
