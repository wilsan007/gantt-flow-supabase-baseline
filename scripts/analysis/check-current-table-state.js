import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentTableState() {
  console.log('=== VÉRIFICATION DE L\'ÉTAT ACTUEL DES TABLES ===\n');

  const definitionTables = [
    'roles', 'permissions', 'role_permissions', 'absence_types', 
    'alert_types', 'evaluation_categories', 'expense_categories', 
    'alert_solutions', 'skills', 'positions', 'alert_type_solutions'
  ];

  console.log('1. VÉRIFICATION DES COLONNES tenant_id:');
  
  for (const table of definitionTables) {
    try {
      const { data: sampleData, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (!error && sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0]);
        const hasTenantId = columns.includes('tenant_id');
        
        console.log(`${table}: tenant_id = ${hasTenantId ? 'PRÉSENT' : 'ABSENT'}`);
        
        if (hasTenantId) {
          // Compter les enregistrements avec tenant_id
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          console.log(`  - ${count} enregistrements avec tenant_id`);
        }
      } else {
        console.log(`${table}: ERREUR ou table vide`);
      }
    } catch (err) {
      console.log(`${table}: ERREUR - ${err.message}`);
    }
  }

  console.log('\n2. POURQUOI exec_sql N\'EXISTE PAS:');
  console.log('Supabase ne fournit pas de fonction exec_sql() via l\'API REST.');
  console.log('Cette fonction n\'existe que dans certains environnements PostgreSQL personnalisés.');
  console.log('L\'API Supabase utilise PostgREST qui ne permet pas l\'exécution de SQL arbitraire.');

  console.log('\n3. SOLUTIONS ALTERNATIVES:');
  console.log('A) Exécution manuelle via Supabase Dashboard > SQL Editor');
  console.log('B) Créer une fonction PostgreSQL personnalisée');
  console.log('C) Exécuter les requêtes une par une via l\'API');

  console.log('\n4. CRÉATION D\'UNE FONCTION EXEC_SQL:');
  
  try {
    // Essayer de créer une fonction exec_sql personnalisée
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
        RETURN 'SUCCESS';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR: ' || SQLERRM;
      END;
      $$;
    `;

    console.log('Tentative de création de la fonction exec_sql...');
    
    // Cette approche ne fonctionnera probablement pas non plus via l'API REST
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSQL });
    
    if (error) {
      console.log('❌ Impossible de créer exec_sql via API:', error.message);
      console.log('\n💡 SOLUTION RECOMMANDÉE:');
      console.log('1. Ouvrez Supabase Dashboard > SQL Editor');
      console.log('2. Créez d\'abord la fonction exec_sql:');
      console.log(createFunctionSQL);
      console.log('3. Puis exécutez le script de migration');
    } else {
      console.log('✅ Fonction exec_sql créée avec succès!');
    }
  } catch (err) {
    console.log('❌ Erreur lors de la création de exec_sql:', err.message);
  }

  console.log('\n=== ÉTAT ACTUEL VÉRIFIÉ ===');
}

checkCurrentTableState();
