#!/usr/bin/env node

/**
 * Test de la solution Edge Function pour la création automatique de tenant
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://qliinxtanjdnwxlvnxji.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_EMAIL = 'medtest1@yahoo.com';
const TEST_USER_ID = 'bdef6cd4-3019-456b-aee4-a037dee6ff00';

async function testEdgeFunctionSolution() {
  console.log('🚀 TEST: Solution Edge Function');
  console.log('📧 Email:', TEST_EMAIL);
  console.log('👤 User ID:', TEST_USER_ID);
  console.log('⏰ Début:', new Date().toISOString());
  console.log('=' .repeat(60));

  try {
    // 1. Nettoyer les données
    console.log('\n🧹 ÉTAPE 1: Nettoyage...');
    
    const cleanupQueries = [
      `DELETE FROM public.employees WHERE email = '${TEST_EMAIL}'`,
      `DELETE FROM public.user_roles WHERE user_id = '${TEST_USER_ID}'`,
      `DELETE FROM public.profiles WHERE email = '${TEST_EMAIL}'`,
      `UPDATE public.invitations SET status = 'pending' WHERE email = '${TEST_EMAIL}'`
    ];

    for (const query of cleanupQueries) {
      try {
        await supabase.rpc('exec_sql', { sql: query });
      } catch (error) {
        console.log(`⚠️  ${error.message.substring(0, 50)}...`);
      }
    }
    console.log('✅ Nettoyage terminé');

    // 2. Vérifier Edge Function existe
    console.log('\n🔍 ÉTAPE 2: Vérification Edge Function...');
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/handle-email-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          record: {
            id: TEST_USER_ID,
            email: TEST_EMAIL,
            email_confirmed_at: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Edge Function accessible');
        console.log('📋 Réponse:', result.message || 'OK');
      } else {
        console.log('❌ Edge Function inaccessible:', response.status);
        const error = await response.text();
        console.log('Erreur:', error.substring(0, 100));
      }
    } catch (error) {
      console.log('❌ Erreur appel Edge Function:', error.message);
    }

    // 3. Vérifier résultats
    console.log('\n📊 ÉTAPE 3: Vérification résultats...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();
    
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();

    const { data: invitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('*, roles(name)')
      .eq('user_id', TEST_USER_ID);

    console.log('👤 Profil créé:', profile ? `✅ OUI (${profile.role})` : '❌ NON');
    console.log('👨‍💼 Employé créé:', employee ? `✅ OUI (${employee.employee_id})` : '❌ NON');
    console.log('💌 Invitation acceptée:', invitation?.status === 'accepted' ? '✅ OUI' : '❌ NON');
    console.log('🔐 Rôles créés:', userRoles && userRoles.length > 0 ? `✅ OUI (${userRoles.length})` : '❌ NON');

    // 4. Score final
    const results = [
      !!profile,
      !!employee,
      invitation?.status === 'accepted',
      userRoles && userRoles.length > 0
    ];

    const score = results.filter(Boolean).length;
    console.log(`\n🎯 Score Edge Function: ${score}/4`);

    if (score === 4) {
      console.log('🎉 EDGE FUNCTION FONCTIONNE !');
    } else if (score > 0) {
      console.log('⚠️  EDGE FUNCTION PARTIELLE');
    } else {
      console.log('❌ EDGE FUNCTION ÉCHOUÉE');
    }

    // 5. Instructions de déploiement
    console.log('\n📋 INSTRUCTIONS DE DÉPLOIEMENT:');
    console.log('1. Déployer l\'Edge Function:');
    console.log('   supabase functions deploy handle-email-confirmation');
    console.log('');
    console.log('2. Configurer le webhook dans Supabase Dashboard:');
    console.log('   - Aller dans Database > Webhooks');
    console.log('   - Créer un nouveau webhook');
    console.log('   - Table: auth.users');
    console.log('   - Events: UPDATE');
    console.log('   - Conditions: email_confirmed_at IS NOT NULL');
    console.log(`   - URL: ${supabaseUrl}/functions/v1/handle-email-confirmation`);
    console.log('');
    console.log('3. Alternative: Exécuter setup-webhook-for-email-confirmation.sql');

    return score === 4;

  } catch (error) {
    console.error('💥 ERREUR:', error);
    return false;
  }

  console.log('\n' + '=' .repeat(60));
  console.log('⏰ Fin:', new Date().toISOString());
}

testEdgeFunctionSolution()
  .then((success) => {
    if (success) {
      console.log('🏁 Test réussi - Edge Function est la solution !');
    } else {
      console.log('🏁 Test terminé - Voir instructions de déploiement');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
