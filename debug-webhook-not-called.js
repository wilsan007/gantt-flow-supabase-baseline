import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugWebhookNotCalled() {
  console.log('🔍 DIAGNOSTIC: WEBHOOK NE SE DÉCLENCHE PLUS');
  console.log('==========================================');
  
  try {
    // 1. Vérifier si le webhook est configuré
    console.log('\n1️⃣ Vérification configuration webhook...');
    console.log('⚠️ Vérifiez manuellement dans Supabase Dashboard:');
    console.log('   - Database > Webhooks');
    console.log('   - Cherchez "email-confirmation-handler"');
    console.log('   - URL: https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation');
    
    // 2. Tester si l'Edge Function existe
    console.log('\n2️⃣ Test direct Edge Function...');
    
    const testResponse = await fetch('https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        type: 'UPDATE',
        table: 'users',
        record: { id: 'test', email_confirmed_at: new Date().toISOString() }
      })
    });
    
    console.log('Status Edge Function:', testResponse.status);
    
    if (testResponse.status === 404) {
      console.log('❌ PROBLÈME: Edge Function non trouvée !');
      console.log('   Solution: Redéployer la fonction');
    } else {
      console.log('✅ Edge Function accessible');
    }
    
    // 3. Créer un utilisateur de test simple pour déclencher le webhook
    console.log('\n3️⃣ Test déclenchement webhook avec utilisateur réel...');
    
    const testEmail = `webhook-test-${Date.now()}@example.com`;
    
    try {
      // Créer utilisateur NON confirmé d'abord
      const { data: user1, error: error1 } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'TestPass123!',
        email_confirm: false // Important: pas confirmé au début
      });
      
      if (error1) {
        console.log('❌ Erreur création utilisateur:', error1.message);
        return;
      }
      
      console.log('✅ Utilisateur créé (non confirmé):', user1.user.id);
      console.log('   Email confirmé:', user1.user.email_confirmed_at ? 'OUI' : 'NON');
      
      // Attendre un peu
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Maintenant confirmer l'email (ceci devrait déclencher le webhook)
      console.log('\n4️⃣ Confirmation email (devrait déclencher webhook)...');
      
      const { data: user2, error: error2 } = await supabase.auth.admin.updateUserById(
        user1.user.id,
        { email_confirm: true }
      );
      
      if (error2) {
        console.log('❌ Erreur confirmation:', error2.message);
      } else {
        console.log('✅ Email confirmé pour:', user2.user.email);
        console.log('   Timestamp confirmation:', user2.user.email_confirmed_at);
        
        // Attendre que le webhook s'exécute
        console.log('\n⏳ Attente exécution webhook (10 secondes)...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Vérifier si un profil a été créé (signe que le webhook a fonctionné)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user1.user.id)
          .single();
        
        if (profile) {
          console.log('🎉 WEBHOOK A FONCTIONNÉ ! Profil créé:', profile.full_name);
        } else {
          console.log('❌ WEBHOOK N\'A PAS FONCTIONNÉ - Aucun profil créé');
          
          console.log('\n🔧 SOLUTIONS POSSIBLES:');
          console.log('1. Webhook pas configuré dans Dashboard');
          console.log('2. URL webhook incorrecte');
          console.log('3. Conditions webhook trop restrictives');
          console.log('4. Edge Function pas déployée');
        }
      }
      
      // Nettoyage
      await supabase.auth.admin.deleteUser(user1.user.id);
      
    } catch (createError) {
      console.log('❌ Erreur création utilisateur test:', createError.message);
    }
    
  } catch (err) {
    console.error('💥 Erreur diagnostic:', err);
  }
}

debugWebhookNotCalled();
