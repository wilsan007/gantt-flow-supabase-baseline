import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qliinxtanjdnwxlvnxji.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
);

async function analyzeGlobalTables() {
  console.log('🔍 Analyse des tables globales (sans tenant_id)...\n');
  
  // Tables potentiellement globales (définitions)
  const potentialGlobalTables = [
    'roles',
    'permissions',
    'role_permissions',
    'alert_types',
    'alert_type_solutions',
    'contract_types',
    'job_titles',
    'departments',
    'leave_types',
    'project_statuses',
    'task_statuses',
    'priority_levels',
    'notification_types',
    'document_types',
    'expense_categories',
    'payment_methods',
    'currencies',
    'countries',
    'time_zones',
    'languages'
  ];
  
  try {
    console.log('📋 Vérification des tables existantes...\n');
    
    for (const tableName of potentialGlobalTables) {
      try {
        // Test d'accès à la table
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`❌ ${tableName}: Table n'existe pas`);
          } else {
            console.log(`⚠️  ${tableName}: Erreur - ${error.message}`);
          }
        } else {
          console.log(`✅ ${tableName}: Table existe`);
          
          // Vérifier si elle a tenant_id
          if (data && data.length > 0) {
            const hasTenantId = 'tenant_id' in data[0];
            const recordCount = await getRecordCount(tableName);
            console.log(`   - Contient tenant_id: ${hasTenantId ? '✅' : '❌'}`);
            console.log(`   - Nombre d'enregistrements: ${recordCount}`);
            
            if (data.length > 0) {
              console.log(`   - Colonnes: ${Object.keys(data[0]).join(', ')}`);
            }
          } else {
            console.log(`   - Table vide`);
          }
        }
        
        console.log(''); // Ligne vide pour la lisibilité
        
      } catch (tableError) {
        console.log(`❌ ${tableName}: Erreur d'accès - ${tableError.message}\n`);
      }
    }
    
    // Vérifier spécifiquement les tables de définition critiques
    console.log('\n🎯 Focus sur les tables critiques:\n');
    
    const criticalTables = ['roles', 'permissions', 'role_permissions'];
    
    for (const tableName of criticalTables) {
      console.log(`📊 Analyse détaillée de ${tableName}:`);
      
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);
        
        if (!error && data) {
          console.log(`   Échantillon de données:`);
          data.forEach((record, index) => {
            console.log(`   ${index + 1}. ${JSON.stringify(record)}`);
          });
        }
      } catch (err) {
        console.log(`   Erreur: ${err.message}`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

async function getRecordCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    return error ? 'Erreur' : count;
  } catch {
    return 'Erreur';
  }
}

analyzeGlobalTables();
