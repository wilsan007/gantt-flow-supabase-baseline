#!/usr/bin/env node

/**
 * Test direct du trigger en forçant un UPDATE sur email_confirmed_at
 * pour déclencher le trigger même si l'email est déjà confirmé
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

async function testTriggerDirect() {
  console.log('🧪 TEST DIRECT: Forcer déclenchement trigger');
  console.log('📧 Email:', TEST_EMAIL);
  console.log('👤 User ID:', TEST_USER_ID);
  console.log('⏰ Début:', new Date().toISOString());
  console.log('=' .repeat(60));

  try {
    // 1. Nettoyer les données existantes
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
        console.log(`⚠️  Nettoyage: ${error.message.substring(0, 50)}...`);
      }
    }
    console.log('✅ Nettoyage terminé');

    // 2. Vérifier état initial
    console.log('\n📋 ÉTAPE 2: État initial...');
    
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

    console.log('Profil:', profile ? '✅ EXISTE' : '❌ ABSENT');
    console.log('Employé:', employee ? '✅ EXISTE' : '❌ ABSENT');

    // 3. Installer le trigger
    console.log('\n🔧 ÉTAPE 3: Installation trigger...');
    
    try {
      const fs = require('fs');
      const triggerScript = fs.readFileSync('./fix-trigger-on-email-confirmation.sql', 'utf8');
      
      // Exécuter le script complet
      await supabase.rpc('exec_sql', { sql: triggerScript });
      console.log('✅ Trigger installé');
    } catch (error) {
      console.log('⚠️  Installation trigger:', error.message.substring(0, 100));
    }

    // 4. Forcer déclenchement du trigger
    console.log('\n🚀 ÉTAPE 4: Forcer déclenchement trigger...');
    
    try {
      // Méthode 1: Réinitialiser puis confirmer
      await supabase.rpc('exec_sql', { 
        sql: `UPDATE auth.users SET email_confirmed_at = NULL WHERE id = '${TEST_USER_ID}';`
      });
      console.log('✅ Email_confirmed_at réinitialisé');

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Maintenant confirmer pour déclencher le trigger
      await supabase.rpc('exec_sql', { 
        sql: `UPDATE auth.users SET email_confirmed_at = now() WHERE id = '${TEST_USER_ID}';`
      });
      console.log('✅ Email confirmé - trigger déclenché');

    } catch (error) {
      console.error('❌ Erreur déclenchement:', error);
      
      // Méthode alternative: appeler directement la fonction trigger
      console.log('\n🔄 Tentative alternative: appel direct fonction...');
      try {
        await supabase.rpc('exec_sql', { 
          sql: `SELECT global_auto_create_tenant_owner_on_confirmation() FROM auth.users WHERE id = '${TEST_USER_ID}';`
        });
        console.log('✅ Fonction trigger appelée directement');
      } catch (funcError) {
        console.error('❌ Erreur fonction directe:', funcError);
      }
    }

    // 5. Attendre exécution
    console.log('\n⏳ ÉTAPE 5: Attente (3 secondes)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 6. Vérifications
    console.log('\n📊 ÉTAPE 6: Vérifications...');
    
    const { data: newProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();
    
    const { data: newEmployee } = await supabase
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

    console.log('👤 Profil créé:', newProfile ? `✅ OUI (${newProfile.role})` : '❌ NON');
    console.log('👨‍💼 Employé créé:', newEmployee ? `✅ OUI (${newEmployee.employee_id})` : '❌ NON');
    console.log('💌 Invitation acceptée:', invitation?.status === 'accepted' ? '✅ OUI' : '❌ NON');
    console.log('🔐 Rôles créés:', userRoles && userRoles.length > 0 ? `✅ OUI (${userRoles.length})` : '❌ NON');

    // 7. Score
    const results = [
      !!newProfile,
      !!newEmployee,
      invitation?.status === 'accepted',
      userRoles && userRoles.length > 0
    ];

    const score = results.filter(Boolean).length;
    console.log(`\n🎯 Score: ${score}/4`);

    if (score === 4) {
      console.log('🎉 TRIGGER FONCTIONNE !');
    } else if (score > 0) {
      console.log('⚠️  TRIGGER PARTIEL');
    } else {
      console.log('❌ TRIGGER ÉCHOUÉ');
      
      // Debug: vérifier si le trigger existe
      console.log('\n🔍 DEBUG: Vérification trigger...');
      try {
        const { data: triggers } = await supabase.rpc('exec_sql', { 
          sql: `SELECT trigger_name, event_manipulation, action_timing FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users' AND trigger_name LIKE '%confirmation%';`
        });
        console.log('Triggers trouvés:', triggers);
      } catch (debugError) {
        console.log('Erreur debug:', debugError.message);
      }
    }

    // Détails
    if (newProfile) {
      console.log('\n📋 Profil:', {
        id: newProfile.id,
        email: newProfile.email,
        role: newProfile.role,
        tenant_id: newProfile.tenant_id
      });
    }

    if (newEmployee) {
      console.log('👤 Employé:', {
        id: newEmployee.id,
        employee_id: newEmployee.employee_id,
        email: newEmployee.email
      });
    }

  } catch (error) {
    console.error('💥 ERREUR:', error);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('⏰ Fin:', new Date().toISOString());
}

testTriggerDirect()
  .then(() => {
    console.log('🏁 Test terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
