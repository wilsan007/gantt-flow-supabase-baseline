#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const supabase = createClient(supabaseUrl, serviceKey);

const TEST_EMAIL = 'test0071@yahoo.com';

async function testTriggerAfterInstall() {
  console.log('🧪 TEST TRIGGER APRÈS INSTALLATION');
  console.log('=' .repeat(50));

  try {
    // 1. Vérifier l'utilisateur de test
    console.log('\n👤 1. VÉRIFICATION UTILISATEUR...');
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users.users.find(u => u.email === TEST_EMAIL);
    
    if (!testUser) {
      console.log('❌ Utilisateur test non trouvé');
      return false;
    }

    console.log(`✅ Utilisateur: ${testUser.id}`);
    console.log(`📧 Email confirmé: ${testUser.email_confirmed_at ? 'OUI' : 'NON'}`);

    // 2. Nettoyer les données existantes pour un test propre
    console.log('\n🧹 2. NETTOYAGE DONNÉES EXISTANTES...');
    
    await supabase.from('employees').delete().eq('user_id', testUser.id);
    await supabase.from('user_roles').delete().eq('user_id', testUser.id);
    await supabase.from('profiles').delete().eq('user_id', testUser.id);
    
    // Remettre l'invitation en pending
    await supabase
      .from('invitations')
      .update({ 
        status: 'pending', 
        accepted_at: null,
        metadata: null 
      })
      .eq('email', TEST_EMAIL);

    console.log('✅ Données nettoyées');

    // 3. Déclencher la confirmation d'email pour tester le trigger
    console.log('\n🔥 3. DÉCLENCHEMENT TRIGGER...');
    
    // D'abord remettre l'email comme non confirmé
    const { error: resetError } = await supabase.auth.admin.updateUserById(
      testUser.id,
      { email_confirm: false }
    );

    if (resetError) {
      console.log('⚠️ Impossible de reset email_confirmed_at:', resetError.message);
    } else {
      console.log('📧 Email remis en non-confirmé');
    }

    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Maintenant confirmer l'email pour déclencher le trigger
    console.log('🔥 Confirmation email pour déclencher le trigger...');
    
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      testUser.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.log('❌ Erreur confirmation:', confirmError.message);
      return false;
    }

    console.log('✅ Email confirmé, trigger déclenché');

    // 4. Attendre et vérifier les résultats
    console.log('\n⏳ 4. ATTENTE TRAITEMENT (10 secondes)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 5. Vérifier si l'Edge Function s'est déclenchée
    console.log('\n📊 5. VÉRIFICATION RÉSULTATS...');
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    const { data: roles } = await supabase
      .from('user_roles')
      .select('*, roles(name)')
      .eq('user_id', testUser.id);

    const { data: invitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();

    // 6. Afficher les résultats
    console.log('\n📋 RÉSULTATS DU TEST:');
    console.log('─'.repeat(40));
    
    const profileCreated = !!profile;
    const employeeCreated = !!employee;
    const rolesAssigned = roles && roles.length > 0;
    const invitationAccepted = invitation?.status === 'accepted';

    console.log(`👤 Profil créé: ${profileCreated ? '✅ OUI' : '❌ NON'}`);
    console.log(`👨‍💼 Employé créé: ${employeeCreated ? '✅ OUI (' + employee.employee_id + ')' : '❌ NON'}`);
    console.log(`🔐 Rôles assignés: ${rolesAssigned ? '✅ OUI (' + roles.map(r => r.roles.name).join(', ') + ')' : '❌ NON'}`);
    console.log(`📧 Invitation acceptée: ${invitationAccepted ? '✅ OUI' : '❌ NON'}`);

    const score = [profileCreated, employeeCreated, rolesAssigned, invitationAccepted].filter(Boolean).length;
    
    console.log(`\n🎯 Score: ${score}/4`);

    if (score === 4) {
      console.log('🎉 SUCCÈS COMPLET ! Le trigger fonctionne parfaitement');
      console.log('✅ L\'Edge Function est déclenchée automatiquement');
      console.log('🚀 Système prêt pour la production');
      return true;
    } else if (score > 0) {
      console.log('⚠️ SUCCÈS PARTIEL - Le trigger fonctionne mais incomplet');
      console.log('🔧 Vérifiez les logs de l\'Edge Function');
      return false;
    } else {
      console.log('❌ ÉCHEC - Le trigger ne fonctionne pas');
      console.log('🔧 Vérifiez que le SQL a été exécuté correctement');
      console.log('📋 Vérifiez les logs dans Supabase Dashboard');
      return false;
    }

  } catch (error) {
    console.error('💥 Erreur:', error);
    return false;
  }
}

testTriggerAfterInstall()
  .then(success => {
    if (success) {
      console.log('\n🏆 VALIDATION FINALE RÉUSSIE !');
      console.log('Le système Edge Function est opérationnel');
    } else {
      console.log('\n⚠️ PROBLÈME DÉTECTÉ');
      console.log('Consultez les instructions ci-dessus');
    }
    process.exit(success ? 0 : 1);
  });
