/**
 * 🧪 TEST DÉPLOIEMENT - Vérifier que les fonctions sont accessibles
 */

import { config } from 'dotenv';

config();

async function testDeployment() {
  console.log('🧪 ===== TEST DÉPLOIEMENT DES FONCTIONS =====');
  console.log('🎯 Vérifier que les fonctions répondent correctement');
  console.log('');

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const functions = [
    {
      name: 'send-invitation',
      url: `${supabaseUrl}/functions/v1/send-invitation`,
      method: 'OPTIONS' // Test CORS
    },
    {
      name: 'handle-email-confirmation', 
      url: `${supabaseUrl}/functions/v1/handle-email-confirmation`,
      method: 'OPTIONS' // Test CORS
    }
  ];

  try {
    for (const func of functions) {
      console.log(`🔍 Test ${func.name}...`);
      
      const startTime = Date.now();
      const response = await fetch(func.url, {
        method: func.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });
      const endTime = Date.now();

      console.log(`📊 ${func.name}:`);
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Status Text: ${response.statusText}`);
      console.log(`   - Durée: ${endTime - startTime}ms`);
      
      // Vérifier les headers CORS
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      const corsHeaders = response.headers.get('Access-Control-Allow-Headers');
      
      console.log(`   - CORS Origin: ${corsOrigin}`);
      console.log(`   - CORS Headers: ${corsHeaders ? 'Présents' : 'Manquants'}`);
      
      if (response.status === 200 && corsOrigin === '*') {
        console.log(`   ✅ ${func.name} fonctionne correctement`);
      } else {
        console.log(`   ❌ ${func.name} a des problèmes`);
        
        if (response.status !== 200) {
          const errorText = await response.text();
          console.log(`   - Erreur: ${errorText}`);
        }
      }
      
      console.log('');
    }

    console.log('🎯 ===== RÉSUMÉ =====');
    console.log('✅ Tests de déploiement terminés');
    console.log('💡 Si toutes les fonctions répondent avec status 200 et CORS *, elles sont prêtes');

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  }
}

testDeployment().then(() => {
  console.log('');
  console.log('🏁 Test déploiement terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
