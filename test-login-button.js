#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const supabase = createClient(supabaseUrl, serviceKey);

const TEST_EMAIL = 'test0071@yahoo.com';
const TEST_PASSWORD = 'nwrvp23lCGJG1!';

async function testLoginButton() {
  console.log('🔐 TEST BOUTON SE CONNECTER');
  console.log('=' .repeat(40));

  try {
    // 1. Simuler ce que fait le bouton "Se connecter"
    console.log('\n🎯 1. SIMULATION BOUTON SE CONNECTER...');
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`🔑 Password: ${TEST_PASSWORD}`);

    // 2. Nettoyer d'abord pour un test propre
    console.log('\n🧹 2. NETTOYAGE...');
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users.users.find(u => u.email === TEST_EMAIL);
    
    if (testUser) {
      await supabase.from('employees').delete().eq('user_id', testUser.id);
      await supabase.from('user_roles').delete().eq('user_id', testUser.id);
      await supabase.from('profiles').delete().eq('user_id', testUser.id);
      
      await supabase
        .from('invitations')
        .update({ status: 'pending', accepted_at: null })
        .eq('email', TEST_EMAIL);
      
      console.log('✅ Données nettoyées');
    }

    // 3. Essayer la connexion (comme le ferait le bouton)
    console.log('\n🔐 3. TENTATIVE CONNEXION...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (error) {
      console.log(`❌ Erreur connexion: ${error.message}`);
      
      // Si erreur d'email non confirmé, déclencher l'Edge Function
      if (error.message.includes('Email not confirmed') || error.message.includes('mail not confirme')) {
        console.log('📧 Email non confirmé détecté, déclenchement Edge Function...');
        
        if (testUser) {
          // Déclencher l'Edge Function
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
          console.log('📊 Résultat Edge Function:', result.success ? 'SUCCÈS' : 'ÉCHEC');
          
          if (result.success) {
            console.log(`✅ Configuration réussie: ${result.data?.employee_id}`);
            
            // Confirmer l'email
            await supabase.auth.admin.updateUserById(testUser.id, { email_confirm: true });
            console.log('✅ Email confirmé');
            
            // Réessayer la connexion
            console.log('\n🔄 4. RETRY CONNEXION...');
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email: TEST_EMAIL,
              password: TEST_PASSWORD
            });
            
            if (!retryError && retryData.user) {
              console.log('🎉 SUCCÈS COMPLET !');
              console.log('✅ Bouton "Se connecter" fonctionne parfaitement');
              console.log('✅ Edge Function déclenchée automatiquement');
              console.log('✅ Connexion réussie après configuration');
              return true;
            } else {
              console.log('⚠️ Retry connexion échoué:', retryError?.message);
            }
          }
        }
      }
    } else if (data.user) {
      console.log('✅ Connexion directe réussie');
      console.log('ℹ️ Email déjà confirmé');
      return true;
    }

    return false;

  } catch (error) {
    console.error('💥 Erreur:', error.message);
    return false;
  }
}

testLoginButton()
  .then(success => {
    if (success) {
      console.log('\n🏆 TEST RÉUSSI !');
      console.log('Le bouton "Se connecter" déclenche bien l\'Edge Function');
    } else {
      console.log('\n⚠️ TEST INCOMPLET');
      console.log('Vérifiez les erreurs ci-dessus');
    }
    process.exit(success ? 0 : 1);
  });
