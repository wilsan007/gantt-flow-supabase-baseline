/**
 * 🧪 TEST DIRECT - Appel Webhook handle-email-confirmation
 * 
 * Simule l'appel direct au webhook avec les données utilisateur
 */

import { config } from 'dotenv';

config();

async function testWebhookDirect() {
  console.log('🧪 ===== TEST WEBHOOK DIRECT =====');
  console.log('🎯 Appel direct à handle-email-confirmation');
  console.log('');

  const webhookUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation';
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  // Données du webhook Supabase (simulées)
  const webhookPayload = {
    type: 'UPDATE',
    table: 'users',
    record: {
      id: '328b48e0-500d-4419-a1cf-2c9986815eee',
      email: 'testgser@yahooo.com',
      email_confirmed_at: null,
      created_at: '2025-09-30T23:46:14.025846Z',
      raw_user_meta_data: {
        full_name: 'Mes Testtd',
        invitation_type: 'tenant_owner',
        temp_user: true,
        temp_password: '4vldq36nFC6C1!',
        tenant_id: '896b4835-fbee-46b7-9165-c095f89e3898',
        invitation_id: '31f20fc6-5223-4a43-a4af-44b5b68065ef',
        validation_code: '661px51neas',
        created_timestamp: '2025-09-30T23:46:13.883Z',
        company_name: 'Mes Company',
        invited_by_type: 'super_admin'
      }
    },
    schema: 'auth',
    old_record: null
  };

  try {
    console.log('🔍 Appel webhook handle-email-confirmation...');
    console.log('   - URL:', webhookUrl);
    console.log('   - User ID:', webhookPayload.record.id);
    console.log('   - Email:', webhookPayload.record.email);
    console.log('');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify(webhookPayload)
    });

    console.log('📊 Réponse webhook:');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);

    if (response.ok) {
      const responseData = await response.json();
      console.log('   - Réponse:', JSON.stringify(responseData, null, 2));
      console.log('');
      console.log('✅ SUCCÈS: Webhook exécuté avec succès !');
    } else {
      const errorText = await response.text();
      console.log('   - Erreur:', errorText);
      console.log('');
      console.log('❌ ÉCHEC: Webhook a échoué');
    }

    // Vérifier l'état final de l'utilisateur après le webhook
    console.log('🔍 Vérification état utilisateur après webhook...');
    
    const checkResponse = await fetch(`https://qliinxtanjdnwxlvnxji.supabase.co/rest/v1/rpc/get_user_by_id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        user_id: webhookPayload.record.id
      })
    });

    if (checkResponse.ok) {
      const userData = await checkResponse.json();
      console.log('📊 État final utilisateur:');
      console.log('   - Données récupérées:', !!userData);
      if (userData) {
        console.log('   - Email confirmé:', userData.email_confirmed_at ? 'OUI' : 'NON');
        if (userData.email_confirmed_at) {
          console.log('   - Confirmé le:', userData.email_confirmed_at);
        }
      }
    } else {
      console.log('⚠️ Impossible de vérifier l\'état utilisateur final');
    }

    console.log('');
    console.log('🎯 ===== CONCLUSION =====');
    if (response.ok) {
      console.log('🎉 Le webhook handle-email-confirmation fonctionne !');
      console.log('💡 La nouvelle solution de contournement est opérationnelle');
    } else {
      console.log('❌ Le webhook a des problèmes');
      console.log('💡 Vérifier les logs Supabase pour plus de détails');
    }

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  }
}

// Lancer le test
testWebhookDirect().then(() => {
  console.log('');
  console.log('🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
