import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  console.log('=== EXÉCUTION DE LA MIGRATION 11 TABLES DE DÉFINITION ===\n');

  try {
    // Lire le script SQL
    const sqlScript = fs.readFileSync('convert-11-definition-tables-to-global.sql', 'utf8');
    
    console.log('Script SQL chargé, taille:', sqlScript.length, 'caractères');
    console.log('Début de l\'exécution...\n');

    // Exécuter le script SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlScript
    });

    if (error) {
      console.error('❌ ERREUR lors de l\'exécution:', error);
      return;
    }

    console.log('✅ MIGRATION EXÉCUTÉE AVEC SUCCÈS !');
    
    if (data) {
      console.log('Résultat:', data);
    }

    // Vérifications post-migration
    console.log('\n=== VÉRIFICATIONS POST-MIGRATION ===');
    
    // Vérifier que les colonnes tenant_id ont été supprimées
    const { data: tenantIdCheck, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name')
      .eq('table_schema', 'public')
      .eq('column_name', 'tenant_id')
      .in('table_name', [
        'roles', 'permissions', 'role_permissions', 'absence_types', 
        'alert_types', 'evaluation_categories', 'expense_categories', 
        'alert_solutions', 'skills', 'positions', 'alert_type_solutions'
      ]);

    if (!checkError) {
      if (tenantIdCheck && tenantIdCheck.length > 0) {
        console.log('⚠️ ATTENTION: Certaines tables ont encore tenant_id:');
        tenantIdCheck.forEach(row => {
          console.log(`  - ${row.table_name}.${row.column_name}`);
        });
      } else {
        console.log('✅ Toutes les colonnes tenant_id ont été supprimées');
      }
    }

    // Compter les enregistrements dans chaque table
    console.log('\n=== COMPTAGE DES ENREGISTREMENTS ===');
    const tables = [
      'roles', 'permissions', 'role_permissions', 'absence_types',
      'alert_types', 'evaluation_categories', 'expense_categories',
      'alert_solutions', 'skills', 'positions', 'alert_type_solutions'
    ];

    for (const table of tables) {
      try {
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!countError) {
          console.log(`${table}: ${count} enregistrements`);
        } else {
          console.log(`${table}: erreur - ${countError.message}`);
        }
      } catch (err) {
        console.log(`${table}: erreur - ${err.message}`);
      }
    }

    // Vérifier que user_roles pointe vers des rôles valides
    console.log('\n=== VÉRIFICATION DES RÉFÉRENCES ===');
    try {
      const { count: validUserRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('ur.id, r.name', { count: 'exact' })
        .join('roles r', 'ur.role_id', 'r.id');

      if (!userRolesError) {
        console.log(`✅ ${validUserRoles} user_roles pointent vers des rôles valides`);
      }
    } catch (err) {
      console.log('⚠️ Impossible de vérifier user_roles:', err.message);
    }

    console.log('\n=== MIGRATION TERMINÉE ===');

  } catch (error) {
    console.error('❌ ERREUR FATALE:', error);
  }
}

executeMigration();
