import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectBaseline() {
  console.log('🔍 INSPECTION DU BASELINE EXISTANT');
  console.log('==================================');
  
  // Tables probables à vérifier
  const tablesToCheck = [
    'invitations',
    'tenants', 
    'profiles',
    'employees',
    'roles',
    'permissions',
    'role_permissions',
    'user_roles'
  ];
  
  const existingTables = {};
  
  for (const tableName of tablesToCheck) {
    try {
      console.log(`\n📋 Vérification table: ${tableName}`);
      
      // Tester si la table existe en faisant une requête SELECT avec LIMIT 0
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (!error) {
        console.log(`✅ Table ${tableName} existe`);
        existingTables[tableName] = true;
        
        // Obtenir quelques exemples de données pour comprendre la structure
        const { data: sample } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (sample && sample.length > 0) {
          console.log(`📄 Structure exemple:`, Object.keys(sample[0]));
        }
      } else {
        console.log(`❌ Table ${tableName} n'existe pas:`, error.message);
        existingTables[tableName] = false;
      }
    } catch (err) {
      console.log(`❌ Erreur ${tableName}:`, err.message);
      existingTables[tableName] = false;
    }
  }
  
  console.log('\n🎯 RÉSUMÉ DES TABLES EXISTANTES:');
  console.log('===============================');
  Object.entries(existingTables).forEach(([table, exists]) => {
    console.log(`${exists ? '✅' : '❌'} ${table}`);
  });
  
  return existingTables;
}

inspectBaseline();
