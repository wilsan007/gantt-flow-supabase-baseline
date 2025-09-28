import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAllTables() {
  console.log('=== ANALYSE COMPLÈTE DE TOUTES LES TABLES ===\n');

  try {
    // 1. Lister toutes les tables du schéma public via requête SQL directe
    console.log('1. TOUTES LES TABLES DU SCHÉMA PUBLIC:');
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT table_name, table_type 
              FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE' 
              ORDER BY table_name` 
      });

    if (tablesError) {
      console.error('Erreur lors de la récupération des tables:', tablesError);
      return;
    }

    console.log(`Nombre total de tables: ${tables.length}`);
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // 2. Analyser la structure de chaque table
    console.log('\n2. STRUCTURE DÉTAILLÉE DE CHAQUE TABLE:');
    
    const tableAnalysis = {};
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      // Récupérer les colonnes
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', tableName)
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (!colError && columns) {
        tableAnalysis[tableName] = {
          columns: columns,
          hasUserId: columns.some(col => col.column_name === 'user_id'),
          hasTenantId: columns.some(col => col.column_name === 'tenant_id'),
          hasCreatedAt: columns.some(col => col.column_name === 'created_at'),
          hasUpdatedAt: columns.some(col => col.column_name === 'updated_at'),
          hasId: columns.some(col => col.column_name === 'id'),
        };

        console.log(`\nTable: ${tableName}`);
        console.log(`  Colonnes (${columns.length}):`);
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`    - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
        });
      }
    }

    // 3. Classifier les tables par type
    console.log('\n3. CLASSIFICATION DES TABLES:');
    
    const definitionTables = [];
    const dataTables = [];
    const junctionTables = [];
    
    Object.entries(tableAnalysis).forEach(([tableName, analysis]) => {
      // Critères pour identifier les tables de définition
      const isDefinitionTable = 
        // Tables avec des noms typiques de définition
        ['roles', 'permissions', 'statuses', 'categories', 'types', 'priorities'].some(keyword => 
          tableName.includes(keyword)) ||
        // Tables sans user_id ni tenant_id (potentiellement globales)
        (!analysis.hasUserId && !analysis.hasTenantId && analysis.hasId) ||
        // Tables avec très peu de colonnes (souvent des lookups)
        analysis.columns.length <= 5;
      
      // Critères pour identifier les tables de liaison
      const isJunctionTable = 
        tableName.includes('_') && 
        analysis.columns.filter(col => col.column_name.endsWith('_id')).length >= 2;
      
      if (isJunctionTable) {
        junctionTables.push(tableName);
      } else if (isDefinitionTable) {
        definitionTables.push(tableName);
      } else {
        dataTables.push(tableName);
      }
    });

    console.log('\nTABLES DE DÉFINITION (potentielles):');
    definitionTables.forEach(table => {
      const analysis = tableAnalysis[table];
      console.log(`  - ${table} (${analysis.columns.length} colonnes, tenant_id: ${analysis.hasTenantId ? 'OUI' : 'NON'})`);
    });

    console.log('\nTABLES DE LIAISON:');
    junctionTables.forEach(table => {
      const analysis = tableAnalysis[table];
      console.log(`  - ${table} (${analysis.columns.length} colonnes)`);
    });

    console.log('\nTABLES DE DONNÉES:');
    dataTables.forEach(table => {
      const analysis = tableAnalysis[table];
      console.log(`  - ${table} (${analysis.columns.length} colonnes, tenant_id: ${analysis.hasTenantId ? 'OUI' : 'NON'})`);
    });

    // 4. Analyser le contenu des tables potentiellement de définition
    console.log('\n4. CONTENU DES TABLES DE DÉFINITION:');
    
    for (const tableName of definitionTables) {
      try {
        const { data: content, error: contentError } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);

        if (!contentError && content) {
          console.log(`\nTable ${tableName} (${content.length} premiers enregistrements):`);
          content.forEach((row, index) => {
            console.log(`  ${index + 1}. ${JSON.stringify(row, null, 2)}`);
          });
        }
      } catch (error) {
        console.log(`  Erreur lors de la lecture de ${tableName}: ${error.message}`);
      }
    }

    // 5. Résumé et recommandations
    console.log('\n5. RÉSUMÉ ET RECOMMANDATIONS:');
    console.log(`\nTables identifiées comme définitions: ${definitionTables.length}`);
    console.log(`Tables de données utilisateur: ${dataTables.length}`);
    console.log(`Tables de liaison: ${junctionTables.length}`);
    
    const definitionTablesWithTenantId = definitionTables.filter(table => 
      tableAnalysis[table].hasTenantId
    );
    
    if (definitionTablesWithTenantId.length > 0) {
      console.log(`\nTables de définition avec tenant_id à convertir:`);
      definitionTablesWithTenantId.forEach(table => {
        console.log(`  - ${table}`);
      });
    }

  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

analyzeAllTables();
