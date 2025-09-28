import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAlertTypeSolutionVariations() {
  console.log('=== TEST DES VARIATIONS DE NOM POUR LA TABLE ===\n');

  const possibleNames = [
    'alert_type_solution',
    'alert_type_solutions', 
    'alert_types_solution',
    'alert_types_solutions',
    'alert_solution_types',
    'alert_solution_mapping',
    'alert_type_solution_mapping'
  ];

  for (const tableName of possibleNames) {
    try {
      console.log(`Testant: ${tableName}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(2);

      if (!error && data) {
        console.log(`✓ TROUVÉ: ${tableName}`);
        console.log(`Enregistrements: ${data.length}`);
        
        if (data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`Colonnes: ${columns.join(', ')}`);
          console.log(`Exemple: ${JSON.stringify(data[0], null, 2)}`);
          
          const hasTenantId = columns.includes('tenant_id');
          const hasAlertTypeId = columns.includes('alert_type_id');
          const hasSolutionId = columns.includes('solution_id');
          
          console.log(`Structure: alert_type_id=${hasAlertTypeId}, solution_id=${hasSolutionId}, tenant_id=${hasTenantId}`);
          
          if (hasAlertTypeId && hasSolutionId) {
            console.log('🎯 C\'EST UNE TABLE DE LIAISON alert_types ↔ alert_solutions');
            console.log(`À CONVERTIR: ${hasTenantId ? 'OUI' : 'NON'}`);
            return { found: true, tableName, hasTenantId, data };
          }
        }
        console.log('');
      } else {
        console.log(`✗ ${tableName} n'existe pas`);
      }
    } catch (error) {
      console.log(`✗ ${tableName} erreur: ${error.message}`);
    }
  }

  console.log('\n=== AUCUNE TABLE TROUVÉE ===');
  console.log('La table mentionnée par l\'utilisateur n\'existe peut-être pas encore');
  console.log('ou a un nom différent de ceux testés.');
  
  return { found: false };
}

testAlertTypeSolutionVariations().then(result => {
  if (result.found) {
    console.log(`\n=== RÉSULTAT: Table ${result.tableName} trouvée ===`);
    console.log(`Doit être ajoutée à la liste: ${result.hasTenantId ? 'OUI' : 'NON'}`);
  }
}).catch(error => {
  console.error('Erreur:', error);
});
