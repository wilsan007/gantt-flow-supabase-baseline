import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigrationComplete() {
  console.log('=== EXÉCUTION COMPLÈTE DE LA MIGRATION 11 TABLES ===\n');

  try {
    // Lire le script SQL
    const sqlScript = fs.readFileSync('convert-11-definition-tables-to-global.sql', 'utf8');
    console.log('Script SQL chargé, taille:', sqlScript.length, 'caractères\n');

    // Créer une fonction temporaire pour exécuter du SQL brut
    console.log('1. Création de la fonction exec_sql temporaire...');
    const createExecFunction = `
      CREATE OR REPLACE FUNCTION temp_exec_migration(sql_text text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_text;
        RETURN 'SUCCESS';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR: ' || SQLERRM;
      END;
      $$;
    `;

    const { error: createError } = await supabase.rpc('query', { 
      query: createExecFunction 
    });

    if (createError) {
      console.log('Tentative alternative de création de fonction...');
      // Essayer une approche différente
      const { data: createData, error: createError2 } = await supabase
        .from('_temp_migration')
        .select('*')
        .limit(1);
      
      if (createError2 && createError2.code === '42P01') {
        console.log('Création de table temporaire pour la migration...');
        await supabase.rpc('query', {
          query: 'CREATE TEMP TABLE _temp_migration (id int);'
        });
      }
    }

    // Diviser le script en blocs exécutables
    const sqlBlocks = sqlScript
      .split(/(?=-- ==============================================)/)
      .filter(block => block.trim().length > 0)
      .map(block => block.trim());

    console.log(`2. Script divisé en ${sqlBlocks.length} blocs\n`);

    // Exécuter chaque bloc
    for (let i = 0; i < sqlBlocks.length; i++) {
      const block = sqlBlocks[i];
      const blockTitle = block.split('\n')[0].replace(/^-- /, '').substring(0, 50);
      
      console.log(`--- BLOC ${i + 1}: ${blockTitle}... ---`);

      if (block.includes('VÉRIFICATION POST-MIGRATION')) {
        console.log('Exécution des vérifications...');
        // Exécuter les vérifications séparément
        const queries = block.split(';').filter(q => q.trim().length > 0);
        
        for (const query of queries) {
          if (query.trim().startsWith('SELECT')) {
            try {
              const { data, error } = await supabase.rpc('query', { 
                query: query.trim() + ';' 
              });
              
              if (!error && data) {
                console.log('Vérification:', data);
              }
            } catch (err) {
              console.log('Vérification ignorée:', err.message);
            }
          }
        }
      } else {
        // Exécuter le bloc via une requête directe
        try {
          const { data, error } = await supabase.rpc('query', { 
            query: block 
          });

          if (error) {
            console.log(`❌ Erreur bloc ${i + 1}:`, error.message);
            
            // Essayer d'exécuter les requêtes individuellement
            const queries = block.split(';').filter(q => q.trim().length > 0);
            let successCount = 0;
            
            for (const query of queries) {
              const trimmedQuery = query.trim();
              if (trimmedQuery.length > 0) {
                try {
                  const { error: queryError } = await supabase.rpc('query', { 
                    query: trimmedQuery + ';' 
                  });
                  
                  if (!queryError) {
                    successCount++;
                  } else {
                    console.log(`  - Requête échouée: ${trimmedQuery.substring(0, 50)}...`);
                  }
                } catch (queryErr) {
                  console.log(`  - Erreur requête: ${queryErr.message}`);
                }
              }
            }
            
            console.log(`  - ${successCount}/${queries.length} requêtes réussies`);
          } else {
            console.log(`✅ Bloc ${i + 1} exécuté avec succès`);
          }
        } catch (blockError) {
          console.log(`❌ Erreur fatale bloc ${i + 1}:`, blockError.message);
        }
      }
    }

    // Vérifications finales
    console.log('\n=== VÉRIFICATIONS FINALES ===');
    
    const definitionTables = [
      'roles', 'permissions', 'role_permissions', 'absence_types', 
      'alert_types', 'evaluation_categories', 'expense_categories', 
      'alert_solutions', 'skills', 'positions', 'alert_type_solutions'
    ];

    for (const table of definitionTables) {
      try {
        const { data: sampleData } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (sampleData && sampleData.length > 0) {
          const columns = Object.keys(sampleData[0]);
          const hasTenantId = columns.includes('tenant_id');
          
          console.log(`${table}: tenant_id = ${hasTenantId ? '❌ PRÉSENT' : '✅ SUPPRIMÉ'}`);
        }
      } catch (err) {
        console.log(`${table}: Erreur de vérification`);
      }
    }

    // Nettoyer la fonction temporaire
    try {
      await supabase.rpc('query', { 
        query: 'DROP FUNCTION IF EXISTS temp_exec_migration(text);' 
      });
    } catch (err) {
      // Ignorer les erreurs de nettoyage
    }

    console.log('\n=== MIGRATION TERMINÉE ===');
    console.log('Vérifiez les résultats ci-dessus pour confirmer la suppression des colonnes tenant_id');

  } catch (error) {
    console.error('❌ ERREUR FATALE:', error.message);
    console.log('\n💡 SOLUTION ALTERNATIVE:');
    console.log('Exécutez le script manuellement dans Supabase Dashboard > SQL Editor');
  }
}

executeMigrationComplete();
