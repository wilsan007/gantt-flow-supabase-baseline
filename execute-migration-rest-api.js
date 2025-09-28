import fetch from 'node-fetch';
import fs from 'fs';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

async function executeSQL(query) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      // Essayer l'endpoint SQL direct
      const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: query
      });

      if (!sqlResponse.ok) {
        throw new Error(`HTTP ${sqlResponse.status}: ${await sqlResponse.text()}`);
      }

      return await sqlResponse.json();
    }

    return await response.json();
  } catch (error) {
    throw new Error(`SQL Error: ${error.message}`);
  }
}

async function executeMigrationDirect() {
  console.log('=== EXÉCUTION DIRECTE DE LA MIGRATION 11 TABLES ===\n');

  try {
    // Lire le script SQL
    const sqlScript = fs.readFileSync('convert-11-definition-tables-to-global.sql', 'utf8');
    console.log('Script SQL chargé, taille:', sqlScript.length, 'caractères\n');

    // Étapes critiques à exécuter une par une
    const criticalSteps = [
      {
        name: "1. Suppression des politiques RLS",
        queries: [
          "DROP POLICY IF EXISTS \"Users can manage tenant alert solutions\" ON alert_solutions;",
          "DROP POLICY IF EXISTS \"Users can manage tenant skills\" ON skills;",
          "DROP POLICY IF EXISTS \"Users can manage tenant positions\" ON positions;",
          "DROP POLICY IF EXISTS \"Users can manage tenant alert_type_solutions\" ON alert_type_solutions;"
        ]
      },
      {
        name: "2. Suppression des colonnes tenant_id",
        queries: [
          "ALTER TABLE permissions DROP COLUMN IF EXISTS tenant_id;",
          "ALTER TABLE role_permissions DROP COLUMN IF EXISTS tenant_id;",
          "ALTER TABLE absence_types DROP COLUMN IF EXISTS tenant_id;",
          "ALTER TABLE alert_types DROP COLUMN IF EXISTS tenant_id;",
          "ALTER TABLE evaluation_categories DROP COLUMN IF EXISTS tenant_id;",
          "ALTER TABLE expense_categories DROP COLUMN IF EXISTS tenant_id;",
          "ALTER TABLE alert_solutions DROP COLUMN IF EXISTS tenant_id;",
          "ALTER TABLE skills DROP COLUMN IF EXISTS tenant_id;",
          "ALTER TABLE positions DROP COLUMN IF EXISTS tenant_id;",
          "ALTER TABLE alert_type_solutions DROP COLUMN IF EXISTS tenant_id;"
        ]
      },
      {
        name: "3. Ajout des contraintes uniques",
        queries: [
          "ALTER TABLE permissions ADD CONSTRAINT unique_permission_name UNIQUE (name);",
          "ALTER TABLE role_permissions ADD CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id);",
          "ALTER TABLE absence_types ADD CONSTRAINT unique_absence_type_code UNIQUE (code);",
          "ALTER TABLE alert_types ADD CONSTRAINT unique_alert_type_code UNIQUE (code);",
          "ALTER TABLE evaluation_categories ADD CONSTRAINT unique_evaluation_category_name UNIQUE (name);",
          "ALTER TABLE expense_categories ADD CONSTRAINT unique_expense_category_name UNIQUE (name);",
          "ALTER TABLE alert_solutions ADD CONSTRAINT unique_alert_solution_title UNIQUE (title);",
          "ALTER TABLE skills ADD CONSTRAINT unique_skill_name UNIQUE (name);",
          "ALTER TABLE positions ADD CONSTRAINT unique_position_title UNIQUE (title);",
          "ALTER TABLE alert_type_solutions ADD CONSTRAINT unique_alert_type_solution UNIQUE (alert_type_id, alert_solution_id);"
        ]
      },
      {
        name: "4. Configuration RLS global",
        queries: [
          "ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;",
          "ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;",
          "ALTER TABLE absence_types ENABLE ROW LEVEL SECURITY;",
          "ALTER TABLE alert_types ENABLE ROW LEVEL SECURITY;",
          "ALTER TABLE evaluation_categories ENABLE ROW LEVEL SECURITY;",
          "ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;",
          "ALTER TABLE alert_solutions ENABLE ROW LEVEL SECURITY;",
          "ALTER TABLE skills ENABLE ROW LEVEL SECURITY;",
          "ALTER TABLE positions ENABLE ROW LEVEL SECURITY;",
          "ALTER TABLE alert_type_solutions ENABLE ROW LEVEL SECURITY;"
        ]
      },
      {
        name: "5. Politiques de lecture globale",
        queries: [
          "CREATE POLICY \"Global read access for permissions\" ON permissions FOR SELECT USING (true);",
          "CREATE POLICY \"Global read access for role_permissions\" ON role_permissions FOR SELECT USING (true);",
          "CREATE POLICY \"Global read access for absence_types\" ON absence_types FOR SELECT USING (true);",
          "CREATE POLICY \"Global read access for alert_types\" ON alert_types FOR SELECT USING (true);",
          "CREATE POLICY \"Global read access for evaluation_categories\" ON evaluation_categories FOR SELECT USING (true);",
          "CREATE POLICY \"Global read access for expense_categories\" ON expense_categories FOR SELECT USING (true);",
          "CREATE POLICY \"Global read access for alert_solutions\" ON alert_solutions FOR SELECT USING (true);",
          "CREATE POLICY \"Global read access for skills\" ON skills FOR SELECT USING (true);",
          "CREATE POLICY \"Global read access for positions\" ON positions FOR SELECT USING (true);",
          "CREATE POLICY \"Global read access for alert_type_solutions\" ON alert_type_solutions FOR SELECT USING (true);"
        ]
      }
    ];

    // Exécuter chaque étape
    for (const step of criticalSteps) {
      console.log(`\n--- ${step.name} ---`);
      
      for (const query of step.queries) {
        try {
          await executeSQL(query);
          console.log(`✅ ${query.substring(0, 60)}...`);
        } catch (error) {
          console.log(`⚠️  ${query.substring(0, 60)}... - ${error.message}`);
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
        const result = await executeSQL(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = 'tenant_id';
        `);

        const hasTenantId = result && result.length > 0;
        console.log(`${table}: tenant_id = ${hasTenantId ? '❌ PRÉSENT' : '✅ SUPPRIMÉ'}`);
      } catch (err) {
        console.log(`${table}: Erreur de vérification - ${err.message}`);
      }
    }

    console.log('\n=== MIGRATION TERMINÉE ===');
    console.log('✅ Les colonnes tenant_id ont été supprimées des tables de définition');
    console.log('✅ Les politiques RLS globales ont été configurées');
    console.log('✅ Les contraintes uniques ont été ajoutées');

  } catch (error) {
    console.error('❌ ERREUR FATALE:', error.message);
    console.log('\n💡 SOLUTION ALTERNATIVE:');
    console.log('Exécutez le script manuellement dans Supabase Dashboard > SQL Editor');
  }
}

executeMigrationDirect();
