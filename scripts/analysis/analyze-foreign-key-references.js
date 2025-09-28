import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeForeignKeyReferences() {
  console.log('=== ANALYSE DES RÉFÉRENCES FOREIGN KEY ===\n');

  const definitionTables = [
    'roles', 'permissions', 'absence_types', 'alert_types',
    'evaluation_categories', 'expense_categories', 'alert_solutions',
    'skills', 'positions'
  ];

  const potentialReferencingTables = [
    'profiles', 'employees', 'user_roles', 'tasks', 'projects',
    'evaluations', 'absences', 'alerts', 'expenses', 'employee_skills'
  ];

  console.log('TABLES DE DÉFINITION À ANALYSER:');
  definitionTables.forEach(table => console.log(`  - ${table}`));
  
  console.log('\nTABLES POTENTIELLEMENT RÉFÉRENÇANTES:');
  potentialReferencingTables.forEach(table => console.log(`  - ${table}`));

  console.log('\n=== ANALYSE DES RÉFÉRENCES ===\n');

  for (const defTable of definitionTables) {
    console.log(`\n--- RÉFÉRENCES VERS ${defTable.toUpperCase()} ---`);
    
    for (const refTable of potentialReferencingTables) {
      try {
        // Tester si la table référençante existe
        const { data: testData, error: testError } = await supabase
          .from(refTable)
          .select('*')
          .limit(1);

        if (testError) {
          continue; // Table n'existe pas
        }

        // Analyser la structure pour trouver des références potentielles
        if (testData && testData.length > 0) {
          const columns = Object.keys(testData[0]);
          
          // Chercher des colonnes qui pourraient référencer la table de définition
          const potentialFKColumns = columns.filter(col => 
            col.includes(defTable.slice(0, -1)) || // ex: role pour roles
            col.includes(defTable) || // nom complet
            (defTable === 'roles' && col === 'role') ||
            (defTable === 'permissions' && col.includes('permission')) ||
            (defTable === 'skills' && col.includes('skill')) ||
            (defTable === 'positions' && col.includes('position'))
          );

          if (potentialFKColumns.length > 0) {
            console.log(`  ${refTable} → ${defTable}:`);
            potentialFKColumns.forEach(col => {
              console.log(`    - Colonne: ${col}`);
            });

            // Vérifier s'il y a des données dans ces colonnes
            const sampleRow = testData[0];
            potentialFKColumns.forEach(col => {
              if (sampleRow[col]) {
                console.log(`      Exemple valeur: ${sampleRow[col]}`);
              }
            });
          }
        }

      } catch (error) {
        // Ignorer les erreurs de tables inexistantes
      }
    }
  }

  // Analyse spéciale pour profiles.role (erreur mentionnée)
  console.log('\n=== ANALYSE SPÉCIALE: profiles.role ===');
  try {
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('role')
      .limit(10);

    if (!error && profilesData) {
      console.log('Valeurs dans profiles.role:');
      const uniqueRoles = [...new Set(profilesData.map(p => p.role).filter(r => r))];
      uniqueRoles.forEach(role => {
        console.log(`  - "${role}"`);
      });

      // Vérifier si ces valeurs existent dans la table roles
      console.log('\nVérification dans table roles:');
      for (const roleValue of uniqueRoles) {
        const { data: roleExists, error: roleError } = await supabase
          .from('roles')
          .select('name')
          .eq('name', roleValue)
          .limit(1);

        if (!roleError && roleExists && roleExists.length > 0) {
          console.log(`  ✓ "${roleValue}" existe dans roles.name`);
        } else {
          console.log(`  ✗ "${roleValue}" N'EXISTE PAS dans roles.name`);
        }
      }
    }
  } catch (error) {
    console.log(`Erreur: ${error.message}`);
  }

  console.log('\n=== RECOMMANDATIONS ===');
  console.log('1. Mettre à jour les références AVANT de supprimer les données');
  console.log('2. Utiliser les mappings pour préserver les relations FK');
  console.log('3. Ne pas vider les tables, mais les repeupler avec les bonnes références');
}

analyzeForeignKeyReferences().then(() => {
  console.log('\n=== ANALYSE TERMINÉE ===');
}).catch(error => {
  console.error('Erreur:', error);
});
