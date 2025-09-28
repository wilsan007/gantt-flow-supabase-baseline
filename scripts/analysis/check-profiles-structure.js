import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qliinxtanjdnwxlvnxji.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
);

async function checkProfilesStructure() {
  console.log('🔍 Vérification de la structure de la table profiles...\n');
  
  try {
    // Essayer de récupérer un profil existant pour voir la structure
    console.log('1️⃣ Test d\'accès à la table profiles...');
    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erreur d\'accès à profiles:', testError.message);
    } else {
      console.log('✅ Accès à profiles réussi');
      if (testProfile && testProfile.length > 0) {
        console.log('Structure détectée:', Object.keys(testProfile[0]));
        
        // Vérifier tenant_id
        if ('tenant_id' in testProfile[0]) {
          console.log('✅ Colonne tenant_id EXISTE');
        } else {
          console.log('❌ Colonne tenant_id N\'EXISTE PAS');
        }
      } else {
        console.log('Table profiles vide, test avec insertion...');
      }
    }
    
    // Test d'insertion pour détecter les colonnes manquantes
    console.log('\n2️⃣ Test d\'insertion avec tenant_id...');
    const testUserId = 'test-structure-check';
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: testUserId,
        tenant_id: 'test-tenant-id',
        full_name: 'Test Structure',
        email: 'test@structure.com'
      });
    
    if (insertError) {
      console.log('❌ Erreur insertion:', insertError.message);
      if (insertError.message.includes('tenant_id')) {
        console.log('🎯 CONFIRMATION: Colonne tenant_id manquante');
      }
    } else {
      console.log('✅ Insertion réussie - tenant_id existe');
      // Nettoyer le test
      await supabase.from('profiles').delete().eq('user_id', testUserId);
    }
    
    // Vérifier aussi s'il y a des données dans profiles
    console.log('\n📊 Données dans profiles:');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Erreur lors de la récupération des données:', profilesError.message);
    } else {
      console.log(`Nombre d'enregistrements (max 5): ${profilesData?.length || 0}`);
      if (profilesData && profilesData.length > 0) {
        console.log('Premier enregistrement:', profilesData[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

checkProfilesStructure();
