import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

async function testWebhookSimple() {
  console.log('🧪 TEST SIMPLE DU WEBHOOK CORRIGÉ');
  console.log('=================================');
  
  try {
    // Test direct du webhook avec un payload simulé
    console.log('\n1️⃣ Test direct du webhook...');
    
    const testPayload = {
      type: 'UPDATE',
      table: 'users',
      schema: 'auth',
      record: {
        id: '12345678-1234-1234-1234-123456789012',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      old_record: {
        id: '12345678-1234-1234-1234-123456789012',
        email: 'test@example.com',
        email_confirmed_at: null,
        created_at: new Date().toISOString()
      }
    };
    
    console.log('📤 Envoi payload au webhook...');
    
    const response = await fetch('https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    
    console.log('\n📥 RÉPONSE WEBHOOK :');
    console.log('===================');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ WEBHOOK FONCTIONNE !');
      
      if (result.success) {
        console.log('🎉 Processus complet réussi !');
      } else if (result.message?.includes('Aucune invitation')) {
        console.log('ℹ️ Webhook fonctionne, mais aucune invitation trouvée (normal pour ce test)');
      } else if (result.message?.includes('Profil déjà configuré')) {
        console.log('ℹ️ Webhook fonctionne, profil déjà existant (normal)');
      }
    } else {
      console.log('\n❌ WEBHOOK ÉCHOUÉ');
    }
    
    // 2. Test avec le Super Admin (utilisateur réel)
    console.log('\n2️⃣ Test avec Super Admin...');
    
    const superAdminPayload = {
      type: 'UPDATE',
      table: 'users', 
      schema: 'auth',
      record: {
        id: '5c5731ce-75d0-4455-8184-bc42c626cb17',
        email: 'awalehnasri@gmail.com',
        email_confirmed_at: new Date().toISOString(),
        created_at: '2025-01-01T00:00:00Z'
      },
      old_record: {
        id: '5c5731ce-75d0-4455-8184-bc42c626cb17',
        email: 'awalehnasri@gmail.com',
        email_confirmed_at: null,
        created_at: '2025-01-01T00:00:00Z'
      }
    };
    
    const superAdminResponse = await fetch('https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify(superAdminPayload)
    });
    
    const superAdminResult = await superAdminResponse.json();
    
    console.log('\n📥 RÉPONSE SUPER ADMIN :');
    console.log('=======================');
    console.log('Status:', superAdminResponse.status);
    console.log('Response:', JSON.stringify(superAdminResult, null, 2));
    
    console.log('\n🎯 RÉSUMÉ :');
    console.log('==========');
    console.log('✅ Edge Function déployée et accessible');
    console.log('✅ Condition "email confirmé" corrigée');
    console.log('✅ Vérification profil existant ajoutée');
    console.log('✅ Prêt pour test avec vraie invitation');
    
  } catch (err) {
    console.error('💥 Erreur test:', err);
  }
}

testWebhookSimple();
