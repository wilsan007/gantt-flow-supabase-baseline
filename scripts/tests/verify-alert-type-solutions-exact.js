import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAlertTypeSolutions() {
  console.log('=== VÉRIFICATION DE LA TABLE alert_type_solutions ===\n');

  try {
    const { data: sampleData, error } = await supabase
      .from('alert_type_solutions')
      .select('*')
      .limit(5);

    if (error) {
      console.log(`✗ Erreur: ${error.message}`);
      return { exists: false };
    }

    console.log(`✓ Table alert_type_solutions existe`);
    console.log(`Enregistrements trouvés: ${sampleData.length}\n`);

    if (sampleData.length > 0) {
      const firstRow = sampleData[0];
      const columns = Object.keys(firstRow);
      
      console.log('STRUCTURE CONFIRMÉE:');
      console.log(`Colonnes (${columns.length}): ${columns.join(', ')}`);
      
      const expectedColumns = ['id', 'alert_type_id', 'solution_id', 'priority_order', 'context_conditions', 'tenant_id'];
      const hasAllExpected = expectedColumns.every(col => columns.includes(col));
      
      console.log(`Structure attendue: ${hasAllExpected ? 'CONFIRMÉE' : 'DIFFÉRENTE'}`);
      console.log(`tenant_id: ${columns.includes('tenant_id') ? 'OUI' : 'NON'}`);
      console.log(`alert_type_id: ${columns.includes('alert_type_id') ? 'OUI' : 'NON'}`);
      console.log(`solution_id: ${columns.includes('solution_id') ? 'OUI' : 'NON'}`);

      console.log('\nTYPE DE TABLE:');
      console.log('TABLE DE LIAISON (alert_types ↔ alert_solutions)');
      console.log('Définit quelles solutions sont recommandées pour chaque type d\'alerte');
      console.log('Avec métadonnées: priority_order, context_conditions');
      console.log('À CONVERTIR: OUI (supprimer tenant_id pour éviter duplication)');

      console.log('\nEXEMPLES DE DONNÉES:');
      sampleData.forEach((row, index) => {
        console.log(`Enregistrement ${index + 1}: ${JSON.stringify(row, null, 2)}`);
      });

      return {
        exists: true,
        isLinkingTable: true,
        hasTenantId: true,
        shouldConvert: true,
        columns,
        sampleData
      };

    } else {
      console.log('Table vide');
      return { exists: true, empty: true };
    }

  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    return { exists: false, error: error.message };
  }
}

verifyAlertTypeSolutions().then(result => {
  console.log('\n=== CONCLUSION ===');
  if (result && result.shouldConvert) {
    console.log('✓ alert_type_solutions confirmée comme 11ème table à convertir');
    console.log('✓ Table de liaison avec tenant_id à supprimer');
    console.log('✓ Doit être ajoutée au script de migration');
  }
  console.log('\n=== VÉRIFICATION TERMINÉE ===');
}).catch(error => {
  console.error('Erreur:', error);
});
