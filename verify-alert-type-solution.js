import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAlertTypeSolution() {
  console.log('=== VÉRIFICATION DE LA TABLE alert_type_solution ===\n');

  try {
    // Tester avec le nom exact fourni par l'utilisateur
    const { data: sampleData, error } = await supabase
      .from('alert_type_solution')
      .select('*')
      .limit(5);

    if (error) {
      console.log(`✗ Erreur: ${error.message}`);
      return;
    }

    console.log(`✓ Table alert_type_solution existe`);
    console.log(`Enregistrements trouvés: ${sampleData.length}\n`);

    if (sampleData.length > 0) {
      const firstRow = sampleData[0];
      const columns = Object.keys(firstRow);
      
      const hasTenantId = columns.includes('tenant_id');
      const hasUserId = columns.includes('user_id');
      const hasAlertTypeId = columns.includes('alert_type_id');
      const hasSolutionId = columns.includes('solution_id');

      console.log('STRUCTURE DE LA TABLE:');
      console.log(`Colonnes (${columns.length}): ${columns.join(', ')}`);
      console.log(`tenant_id: ${hasTenantId ? 'OUI' : 'NON'}`);
      console.log(`user_id: ${hasUserId ? 'OUI' : 'NON'}`);
      console.log(`alert_type_id: ${hasAlertTypeId ? 'OUI' : 'NON'}`);
      console.log(`solution_id: ${hasSolutionId ? 'OUI' : 'NON'}`);

      console.log('\nTYPE DE TABLE:');
      // C'est une table de liaison entre alert_types et alert_solutions
      const isLinkingTable = hasAlertTypeId && hasSolutionId && !hasUserId;
      
      if (isLinkingTable) {
        console.log('TABLE DE LIAISON (alert_types ↔ alert_solutions)');
        console.log('Cette table définit quelles solutions sont recommandées pour quels types d\'alertes');
        console.log(`À CONVERTIR: ${hasTenantId ? 'OUI (supprimer tenant_id)' : 'NON (déjà globale)'}`);
      } else {
        console.log('TABLE DE DONNÉES');
        console.log('À CONVERTIR: NON');
      }

      console.log('\nEXEMPLES DE DONNÉES:');
      sampleData.forEach((row, index) => {
        console.log(`Enregistrement ${index + 1}: ${JSON.stringify(row, null, 2)}`);
      });

      // Analyser les relations
      console.log('\nANALYSE DES RELATIONS:');
      console.log('Cette table fait le lien entre:');
      console.log('- alert_types (types d\'alertes) → alert_type_id');
      console.log('- alert_solutions (solutions d\'alertes) → solution_id');
      console.log('- Avec des métadonnées: priority_order, context_conditions');
      
      if (hasTenantId) {
        console.log('\nPROBLÈME IDENTIFIÉ:');
        console.log('Cette table de liaison a un tenant_id, ce qui cause la duplication');
        console.log('des relations alert_type ↔ solution pour chaque tenant.');
        console.log('Elle devrait être GLOBALE pour définir des relations universelles.');
      }

      return {
        exists: true,
        isLinkingTable,
        hasTenantId,
        shouldConvert: isLinkingTable && hasTenantId,
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

verifyAlertTypeSolution().then(result => {
  console.log('\n=== CONCLUSION ===');
  if (result && result.shouldConvert) {
    console.log('✓ alert_type_solution doit être ajoutée à la liste des tables à convertir');
    console.log('✓ C\'est la 11ème table de définition/liaison à traiter');
  }
  console.log('\n=== VÉRIFICATION TERMINÉE ===');
}).catch(error => {
  console.error('Erreur:', error);
});
