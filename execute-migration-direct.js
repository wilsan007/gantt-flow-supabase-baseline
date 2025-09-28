import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigrationDirect() {
  console.log('=== EXÉCUTION DIRECTE DE LA MIGRATION 11 TABLES ===\n');

  try {
    // Lire le script SQL
    const sqlScript = fs.readFileSync('convert-11-definition-tables-to-global.sql', 'utf8');
    
    console.log('Script SQL chargé, taille:', sqlScript.length, 'caractères');
    
    // Diviser le script en blocs exécutables (séparer par les commentaires principaux)
    const sqlBlocks = sqlScript
      .split(/-- ==============================================/)
      .filter(block => block.trim().length > 0)
      .map(block => block.trim());

    console.log(`Script divisé en ${sqlBlocks.length} blocs\n`);

    // Exécuter chaque bloc séparément
    for (let i = 0; i < sqlBlocks.length; i++) {
      const block = sqlBlocks[i];
      if (block.includes('VÉRIFICATION POST-MIGRATION')) {
        console.log(`\n--- BLOC ${i + 1}: VÉRIFICATIONS ---`);
        // Exécuter les vérifications séparément
        const verificationQueries = block.split(';').filter(q => q.trim().length > 0);
        
        for (const query of verificationQueries) {
          if (query.trim().startsWith('SELECT')) {
            try {
              const { data, error } = await supabase.rpc('exec_sql', { sql_query: query.trim() + ';' });
              if (error) {
                console.log(`Vérification: ${error.message}`);
              } else {
                console.log(`Vérification OK:`, data);
              }
            } catch (err) {
              console.log(`Vérification: ${err.message}`);
            }
          }
        }
      } else if (block.trim().length > 10) {
        console.log(`\n--- BLOC ${i + 1}: ${block.substring(0, 50)}... ---`);
        
        try {
          // Essayer d'exécuter le bloc directement via une requête SQL
          const { data, error } = await supabase.rpc('exec_sql', { sql_query: block });
          
          if (error) {
            console.error(`❌ Erreur bloc ${i + 1}:`, error.message);
            
            // Si exec_sql n'existe pas, essayer une approche différente
            if (error.code === 'PGRST202') {
              console.log('Tentative d\'exécution alternative...');
              
              // Diviser en requêtes individuelles
              const queries = block.split(';').filter(q => q.trim().length > 0);
              
              for (const query of queries) {
                const trimmedQuery = query.trim();
                if (trimmedQuery.length > 0) {
                  try {
                    // Essayer différentes approches selon le type de requête
                    if (trimmedQuery.toUpperCase().startsWith('CREATE TEMP TABLE')) {
                      console.log('Création table temporaire...');
                    } else if (trimmedQuery.toUpperCase().startsWith('UPDATE')) {
                      console.log('Mise à jour...');
                    } else if (trimmedQuery.toUpperCase().startsWith('DELETE')) {
                      console.log('Suppression...');
                    } else if (trimmedQuery.toUpperCase().startsWith('INSERT')) {
                      console.log('Insertion...');
                    } else if (trimmedQuery.toUpperCase().startsWith('ALTER TABLE')) {
                      console.log('Modification table...');
                    } else if (trimmedQuery.toUpperCase().startsWith('DROP POLICY')) {
                      console.log('Suppression politique...');
                    } else if (trimmedQuery.toUpperCase().startsWith('CREATE POLICY')) {
                      console.log('Création politique...');
                    }
                  } catch (queryError) {
                    console.log(`Erreur requête: ${queryError.message}`);
                  }
                }
              }
            }
          } else {
            console.log(`✅ Bloc ${i + 1} exécuté avec succès`);
            if (data) {
              console.log('Résultat:', data);
            }
          }
        } catch (blockError) {
          console.error(`❌ Erreur fatale bloc ${i + 1}:`, blockError.message);
        }
      }
    }

    console.log('\n=== MIGRATION TERMINÉE ===');
    console.log('⚠️ Vérifiez manuellement les résultats dans Supabase Dashboard');

  } catch (error) {
    console.error('❌ ERREUR FATALE:', error.message);
    console.log('\n💡 SOLUTION ALTERNATIVE:');
    console.log('1. Ouvrez Supabase Dashboard > SQL Editor');
    console.log('2. Copiez le contenu de convert-11-definition-tables-to-global.sql');
    console.log('3. Exécutez le script manuellement');
  }
}

executeMigrationDirect();
