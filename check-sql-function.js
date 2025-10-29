import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSQLFunction() {
  console.log('🔍 VÉRIFICATION FONCTION SQL onboard_tenant_owner');
  console.log('===============================================');
  
  try {
    // Vérifier si la fonction existe en essayant de l'appeler avec des paramètres invalides
    const { data, error } = await supabase
      .rpc('onboard_tenant_owner', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_email: 'test@test.com',
        p_slug: 'test',
        p_tenant_name: 'test',
        p_invite_code: '00000000-0000-0000-0000-000000000000'
      });
    
    if (error) {
      if (error.code === 'PGRST202') {
        console.log('❌ Fonction onboard_tenant_owner n\'existe pas');
        console.log('💡 SOLUTION: Exécuter le script create-onboard-function.sql');
        return false;
      } else {
        console.log('✅ Fonction onboard_tenant_owner existe (erreur attendue avec paramètres test)');
        console.log('Erreur:', error.message);
        return true;
      }
    } else {
      console.log('✅ Fonction onboard_tenant_owner existe et fonctionne');
      return true;
    }
  } catch (err) {
    console.error('💥 Erreur:', err);
    return false;
  }
}

// Vérifier aussi l'Edge Function
async function checkEdgeFunction() {
  console.log('\n🔍 VÉRIFICATION EDGE FUNCTION');
  console.log('============================');
  
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/onboard-tenant-owner`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: 'test' }),
      }
    );
    
    if (response.status === 404) {
      console.log('❌ Edge Function onboard-tenant-owner n\'existe pas');
      console.log('💡 SOLUTION: Déployer l\'Edge Function avec supabase functions deploy');
      return false;
    } else {
      console.log('✅ Edge Function onboard-tenant-owner existe');
      console.log('Status:', response.status);
      return true;
    }
  } catch (err) {
    console.error('💥 Erreur Edge Function:', err.message);
    return false;
  }
}

async function main() {
  const sqlExists = await checkSQLFunction();
  const edgeExists = await checkEdgeFunction();
  
  console.log('\n📊 RÉSUMÉ');
  console.log('=========');
  console.log(`Fonction SQL: ${sqlExists ? '✅' : '❌'}`);
  console.log(`Edge Function: ${edgeExists ? '✅' : '❌'}`);
  
  if (!sqlExists || !edgeExists) {
    console.log('\n🛠️ ACTIONS REQUISES:');
    if (!sqlExists) {
      console.log('1. Exécuter create-onboard-function.sql dans Supabase Dashboard');
    }
    if (!edgeExists) {
      console.log('2. Déployer l\'Edge Function avec: supabase functions deploy onboard-tenant-owner');
    }
  }
}

main();
