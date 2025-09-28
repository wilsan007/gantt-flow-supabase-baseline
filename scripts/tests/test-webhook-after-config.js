#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const supabase = createClient(supabaseUrl, serviceKey);

const TEST_EMAIL = 'test0071@yahoo.com';

async function testWebhookAfterConfig() {
  console.log('🧪 TEST WEBHOOK APRÈS CONFIGURATION');
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

    // 2. Nettoyer pour un test propre
    console.log('\n🧹 2. NETTOYAGE...');
    await supabase.from('employees').delete().eq('user_id', testUser.id);
    await supabase.from('user_roles').delete().eq('user_id', testUser.id);
    await supabase.from('profiles').delete().eq('user_id', testUser.id);
    
    await supabase
      .from('invitations')
      .update({ status: 'pending', accepted_at: null })
      .eq('email', TEST_EMAIL);

    console.log('✅ Données nettoyées');

    // 3. Simuler confirmation d'email pour déclencher le webhook
    console.log('\n🔥 3. SIMULATION CONFIRMATION EMAIL...');
    
    // D'abord remettre email comme non confirmé
    try {
      await supabase.auth.admin.updateUserById(testUser.id, { email_confirm: false });
      console.log('📧 Email remis en non-confirmé');
      
      // Attendre un peu
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Maintenant confirmer pour déclencher le webhook
      await supabase.auth.admin.updateUserById(testUser.id, { email_confirm: true });
      console.log('✅ Email confirmé - webhook devrait se déclencher');
      
    } catch (updateError) {
      console.log('⚠️ Erreur mise à jour email:', updateError.message);
      console.log('🔧 Test avec confirmation directe...');
      
      // Alternative: appeler directement l'Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/handle-email-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceKey
        },
        body: JSON.stringify({
          type: 'UPDATE',
          table: 'users',
          schema: 'auth',
          record: {
            id: testUser.id,
            email: testUser.email,
            email_confirmed_at: new Date().toISOString()
          },
          old_record: {
            id: testUser.id,
            email: testUser.email,
            email_confirmed_at: null
          }
        })
      });

      const result = await response.json();
      console.log('📊 Résultat Edge Function direct:', result.success ? 'SUCCÈS' : 'ÉCHEC');
    }

    // 4. Attendre et vérifier les résultats
    console.log('\n⏳ 4. ATTENTE TRAITEMENT (10 secondes)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 5. Vérifier si le webhook a fonctionné
    console.log('\n📊 5. VÉRIFICATION RÉSULTATS...');
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', testUser.id).single();
    const { data: employee } = await supabase.from('employees').select('*').eq('user_id', testUser.id).single();
    const { data: roles } = await supabase.from('user_roles').select('*, roles(name)').eq('user_id', testUser.id);
    const { data: invitation } = await supabase.from('invitations').select('*').eq('email', TEST_EMAIL).single();

    console.log('📋 RÉSULTATS:');
    console.log(`👤 Profil: ${profile ? '✅ CRÉÉ' : '❌ NON CRÉÉ'}`);
    console.log(`👨‍💼 Employé: ${employee ? '✅ CRÉÉ (' + employee.employee_id + ')' : '❌ NON CRÉÉ'}`);
    console.log(`🔐 Rôles: ${roles?.length > 0 ? '✅ ASSIGNÉS' : '❌ NON ASSIGNÉS'}`);
    console.log(`📧 Invitation: ${invitation?.status === 'accepted' ? '✅ ACCEPTÉE' : '❌ INCHANGÉE'}`);

    const score = [!!profile, !!employee, roles?.length > 0, invitation?.status === 'accepted'].filter(Boolean).length;
    
    console.log(`\n🎯 Score: ${score}/4`);

    if (score === 4) {
      console.log('🎉 WEBHOOK FONCTIONNE PARFAITEMENT !');
      console.log('✅ Configuration automatique réussie');
      console.log('🚀 Système prêt pour production');
      return true;
    } else if (score > 0) {
      console.log('⚠️ WEBHOOK PARTIELLEMENT FONCTIONNEL');
      console.log('🔧 Vérifiez la configuration');
      return false;
    } else {
      console.log('❌ WEBHOOK NE FONCTIONNE PAS');
      console.log('🔧 Vérifiez que le webhook/trigger est bien configuré');
      console.log('📋 Consultez les logs Supabase Dashboard');
      return false;
    }

  } catch (error) {
    console.error('💥 Erreur:', error.message);
    return false;
  }
}

testWebhookAfterConfig()
  .then(success => {
    if (success) {
      console.log('\n🏆 VALIDATION WEBHOOK RÉUSSIE !');
      console.log('Le système automatique fonctionne');
    } else {
      console.log('\n⚠️ PROBLÈME WEBHOOK DÉTECTÉ');
      console.log('Vérifiez la configuration dans Supabase Dashboard');
    }
    process.exit(success ? 0 : 1);
  });
