import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAllTypesAndCategoriesTables() {
  console.log('=== RECHERCHE EXHAUSTIVE DES TABLES AVEC "TYPES" ET "CATEGORIES" ===\n');

  // Récupérer TOUTES les tables de la base de données
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .neq('table_type', 'VIEW');

  if (error) {
    console.error('Erreur lors de la récupération des tables:', error);
    return;
  }

  console.log(`Total des tables trouvées: ${tables.length}\n`);

  // Filtrer les tables avec "types" ou "categories"
  const typesAndCategoriesTables = tables
    .map(t => t.table_name)
    .filter(tableName => 
      tableName.includes('type') || 
      tableName.includes('categor') ||
      tableName.includes('status') ||
      tableName.includes('priority')
    )
    .sort();

  console.log('TABLES AVEC "TYPES", "CATEGORIES", "STATUS", "PRIORITY":');
  typesAndCategoriesTables.forEach(table => {
    console.log(`  - ${table}`);
  });

  console.log(`\nTotal trouvé: ${typesAndCategoriesTables.length} tables\n`);

  // Analyser chaque table trouvée
  const analysisResults = {};
  
  for (const tableName of typesAndCategoriesTables) {
    try {
      console.log(`\n=== ANALYSE: ${tableName} ===`);
      
      // Récupérer la structure de la table
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');

      if (columnsError) {
        console.log(`Erreur colonnes: ${columnsError.message}`);
        continue;
      }

      const columnNames = columns.map(c => c.column_name);
      const hasTenantId = columnNames.includes('tenant_id');
      const hasUserId = columnNames.includes('user_id');
      const hasName = columnNames.includes('name');
      const hasDescription = columnNames.includes('description');

      console.log(`Colonnes (${columnNames.length}): ${columnNames.join(', ')}`);
      console.log(`tenant_id: ${hasTenantId ? 'OUI' : 'NON'}`);
      console.log(`user_id: ${hasUserId ? 'OUI' : 'NON'}`);

      // Récupérer quelques enregistrements d'exemple
      const { data: sampleData, error: dataError } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);

      if (!dataError && sampleData && sampleData.length > 0) {
        console.log(`Enregistrements: ${sampleData.length}`);
        console.log(`Exemple: ${JSON.stringify(sampleData[0], null, 2)}`);
        
        // Vérifier si c'est vraiment une table de définition
        const isDefinitionTable = 
          // Critères pour une table de définition
          (hasName && !hasUserId) || // A un nom mais pas lié aux utilisateurs
          (columnNames.length <= 8 && hasName) || // Peu de colonnes avec nom
          tableName.endsWith('_types') || // Se termine par _types
          tableName.endsWith('_categories') || // Se termine par _categories
          tableName.includes('status') || // Contient status
          tableName.includes('priority'); // Contient priority

        analysisResults[tableName] = {
          columns: columnNames,
          hasTenantId,
          hasUserId,
          hasName,
          hasDescription,
          sampleCount: sampleData.length,
          sampleData: sampleData[0],
          isDefinitionTable,
          shouldConvert: isDefinitionTable && hasTenantId
        };

        console.log(`TYPE: ${isDefinitionTable ? 'TABLE DE DÉFINITION' : 'TABLE DE DONNÉES'}`);
        console.log(`À CONVERTIR: ${isDefinitionTable && hasTenantId ? 'OUI' : 'NON'}`);

      } else {
        console.log('Table vide ou erreur d\'accès');
        analysisResults[tableName] = {
          columns: columnNames,
          hasTenantId,
          hasUserId,
          empty: true,
          isDefinitionTable: false,
          shouldConvert: false
        };
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
  console.log(`- Tables analysées: ${Object.keys(analysisResults).length}`);
  console.log(`- Tables de définition: ${definitionTables.length}`);
  console.log(`- Tables à convertir: ${tablesToConvert.length}`);
  console.log(`- Tables déjà globales: ${alreadyGlobal.length}`);

  return {
    allTables: typesAndCategoriesTables,
    definitionTables,
    tablesToConvert,
    alreadyGlobal,
    analysisResults
  };
}

findAllTypesAndCategoriesTables().then(result => {
  console.log('\n=== RECHERCHE TERMINÉE ===');
}).catch(error => {
  console.error('Erreur:', error);
});
