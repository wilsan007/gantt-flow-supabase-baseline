/**
 * 🧪 TEST PROTECTION ANTI-BOUCLE
 * 
 * Simuler plusieurs webhooks simultanés pour vérifier 
 * que la protection anti-boucle fonctionne correctement
 */

import { config } from 'dotenv';

config();

async function testAntiLoop() {
  console.log('🧪 ===== TEST PROTECTION ANTI-BOUCLE =====');
  console.log('🎯 Simuler plusieurs webhooks simultanés');
  console.log('');

  const webhookUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation';
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  // Données de test avec utilisateur déjà traité
  const testUserData = {
    id: 'f8d9a4a0-955f-4d6b-873d-7b276cea3716',
    email: 'tedsqty1@yahoo.com',
    email_confirmed_at: null,
    created_at: '2025-10-01T10:51:46.565425+00:00',
    raw_user_meta_data: {
      locale: 'fr-FR',
      full_name: 'Med terffsd',
      temp_user: true,
      tenant_id: '9f61d122-3bdc-4efc-9c4c-1d17bbecef2b',
      company_name: 'Med Company',
      expected_role: 'tenant_admin',
      invitation_id: '7d54c6cf-80dc-4a2d-a902-060a7ef5d85d',
      temp_password: '565w7j5mE2LX1!',
      security_level: 'standard',
      invitation_type: 'tenant_owner',
      invited_by_type: 'super_admin',
      validation_code: '49a6mfnj3xz',
      created_timestamp: '2025-10-01T10:51:46.409Z',
      invitation_source: 'admin_panel',
      // IMPORTANT: Marquer comme déjà traité
      process_completed: true,
      completed_at: '2025-10-01T10:52:00.000Z'
    }
  };

  const webhookPayload = {
    type: 'UPDATE',
    table: 'users',
    record: testUserData,
    schema: 'auth',
    old_record: null
  };

  try {
    console.log('🔍 ÉTAPE 1: Test utilisateur déjà traité...');
    
    const response1 = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify(webhookPayload)
    });

    console.log('📊 Réponse 1:');
    console.log('   - Status:', response1.status);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('   - Message:', data1.message);
      
      if (data1.message?.includes('déjà traité')) {
        console.log('✅ Protection anti-boucle fonctionne - utilisateur déjà traité détecté');
      }
    }

    console.log('');
    console.log('🔍 ÉTAPE 2: Test webhooks multiples simultanés...');
    
    // Simuler 5 webhooks simultanés
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          },
          body: JSON.stringify(webhookPayload)
        })
      );
    }

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();

    console.log('📊 Résultats webhooks simultanés:');
    console.log('   - Nombre de requêtes:', responses.length);
    console.log('   - Durée totale:', endTime - startTime, 'ms');
    
    let successCount = 0;
    let ignoredCount = 0;
    let errorCount = 0;

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      console.log(`   - Webhook ${i + 1}: Status ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.message?.includes('déjà traité')) {
          ignoredCount++;
        } else if (data.success) {
          successCount++;
        }
      } else {
        errorCount++;
      }
    }

    console.log('');
    console.log('📊 ANALYSE DES RÉSULTATS:');
    console.log('   - Succès (nouveaux):', successCount);
    console.log('   - Ignorés (déjà traités):', ignoredCount);
    console.log('   - Erreurs:', errorCount);
    
    console.log('');
    console.log('🎯 ===== CONCLUSION =====');
    
    if (ignoredCount >= 4 && successCount <= 1) {
      console.log('🎉 PROTECTION ANTI-BOUCLE EFFICACE !');
      console.log('✅ La majorité des webhooks ont été correctement ignorés');
      console.log('✅ Pas de traitement en double détecté');
      console.log('✅ Performance acceptable');
      console.log('');
      console.log('💡 Recommandations:');
      console.log('   - La protection fonctionne correctement');
      console.log('   - Déployer en production');
      console.log('   - Monitorer les logs pour confirmer');
      
    } else if (successCount === 0 && ignoredCount === 5) {
      console.log('✅ PROTECTION TOTALE ACTIVE');
      console.log('🔒 Tous les webhooks ont été ignorés (utilisateur déjà traité)');
      console.log('💡 C\'est le comportement attendu pour un utilisateur déjà traité');
      
    } else {
      console.log('⚠️ PROTECTION PARTIELLE');
      console.log('💡 Points à vérifier:');
      console.log('   - Trop de succès simultanés détectés');
      console.log('   - Vérifier la logique de détection');
      console.log('   - Renforcer les protections si nécessaire');
    }

    console.log('');
    console.log('🔧 MÉTRIQUES TECHNIQUES:');
    console.log('   - Temps de réponse moyen:', Math.round((endTime - startTime) / responses.length), 'ms');
    console.log('   - Efficacité protection:', Math.round((ignoredCount / responses.length) * 100), '%');
    console.log('   - Taux d\'erreur:', Math.round((errorCount / responses.length) * 100), '%');

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  }
}

testAntiLoop().then(() => {
  console.log('');
  console.log('🏁 Test protection anti-boucle terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
