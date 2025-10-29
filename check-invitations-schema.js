import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkInvitationsSchema() {
  console.log('🔍 VÉRIFICATION SCHÉMA TABLE INVITATIONS');
  console.log('=======================================');
  
  try {
    // Récupérer un exemple d'invitation existante
    const { data: sample, error } = await supabase
      .from('invitations')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    console.log('📋 Structure de la table invitations:');
    console.log(JSON.stringify(sample, null, 2));
    
    console.log('\n🔑 Colonnes disponibles:');
    Object.keys(sample).forEach(key => {
      const value = sample[key];
      const type = value === null ? 'null' : typeof value;
      console.log(`   ${key}: ${type} = ${value}`);
    });
    
  } catch (err) {
    console.error('💥 Erreur:', err);
  }
}

checkInvitationsSchema();
