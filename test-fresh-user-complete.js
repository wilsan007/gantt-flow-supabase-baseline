/**
 * 🧪 TEST COMPLET - Nouvel utilisateur + Solution finale
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testFreshUserComplete() {
  console.log('🧪 ===== TEST UTILISATEUR FRAIS COMPLET =====');
  console.log('🎯 Créer utilisateur + Tester solution finale');
  console.log('');

  const timestamp = Date.now();
  const testEmail = `test-solution-finale-${timestamp}@example.com`;
  const testName = `Test Solution ${timestamp}`;

  let createdUserId = null;

  try {
    // ÉTAPE 1: Créer un nouvel utilisateur
    console.log('🔍 ÉTAPE 1: Création nouvel utilisateur...');
    console.log('   - Email:', testEmail);

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: false,
      user_metadata: {
        full_name: testName,
        invitation_type: 'tenant_owner',
        temp_user: true,
        tenant_id: '896b4835-fbee-46b7-9165-c095f89e3898',
        company_name: 'Test Company',
        invitation_id: `test-${timestamp}`,
        validation_code: 'test123',
        created_timestamp: new Date().toISOString(),
        invited_by_type: 'super_admin'
      }
    });

    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError);
      return;
    }

    createdUserId = userData.user.id;
    console.log('✅ Utilisateur créé:');
    console.log('   - ID:', createdUserId);
    console.log('   - Email confirmé:', userData.user.email_confirmed_at ? 'OUI' : 'NON');
    console.log('');

    // ÉTAPE 2: Tester email_confirm: true sur utilisateur frais
    console.log('🔍 ÉTAPE 2: Test email_confirm: true sur utilisateur frais...');
    
    const { data: confirmResult, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(createdUserId, {
      email_confirm: true
    });

    console.log('📊 Résultat confirmation:');
    console.log('   - Erreur:', confirmError ? confirmError.message : 'AUCUNE');
    console.log('   - Données présentes:', !!confirmResult);

    if (confirmError) {
      console.error('❌ Erreur confirmation:', confirmError);
      console.log('💡 Même sur utilisateur frais, email_confirm: true échoue');
    } else {
      console.log('✅ Confirmation réussie sur utilisateur frais !');
    }

    // ÉTAPE 3: Vérifier l'état après confirmation
    console.log('\n🔍 ÉTAPE 3: Vérification état après confirmation...');
    
    const { data: finalUser } = await supabaseAdmin.auth.admin.getUserById(createdUserId);
    
    console.log('📊 État final:');
    console.log('   - Email confirmé:', finalUser?.user?.email_confirmed_at ? 'OUI' : 'NON');
    if (finalUser?.user?.email_confirmed_at) {
      console.log('   - Confirmé le:', finalUser.user.email_confirmed_at);
    }

    // ÉTAPE 4: Si email_confirm: true ne fonctionne pas, tester le webhook
    if (!finalUser?.user?.email_confirmed_at) {
      console.log('\n🔍 ÉTAPE 4: Test webhook avec utilisateur frais...');
      
      const webhookPayload = {
        type: 'UPDATE',
        table: 'users',
        record: {
          id: createdUserId,
          email: testEmail,
          email_confirmed_at: null,
          created_at: userData.user.created_at,
          raw_user_meta_data: userData.user.raw_user_meta_data
        },
        schema: 'auth',
        old_record: null
      };

      const webhookResponse = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify(webhookPayload)
      });

      console.log('📊 Réponse webhook:');
      console.log('   - Status:', webhookResponse.status);

      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        console.log('   - Réponse:', JSON.stringify(webhookData, null, 2));
      } else {
        const errorText = await webhookResponse.text();
        console.log('   - Erreur:', errorText);
      }
    }

    // CONCLUSION
    console.log('\n🎯 ===== CONCLUSION FINALE =====');
    
    const finalCheck = await supabaseAdmin.auth.admin.getUserById(createdUserId);
    const isConfirmed = !!finalCheck?.data?.user?.email_confirmed_at;
    
    if (isConfirmed) {
      console.log('🎉 SUCCÈS TOTAL !');
      console.log('✅ La solution fonctionne avec un utilisateur frais');
      console.log('💡 Le problème était l\'utilisateur corrompu précédent');
      console.log('🚀 RECOMMANDATION: Déployer cette solution en production');
    } else {
      console.log('❌ ÉCHEC: Même avec utilisateur frais, la confirmation échoue');
      console.log('💡 Problème plus profond dans la configuration Supabase');
      console.log('🔧 Investigation supplémentaire nécessaire');
    }

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  } finally {
    // Nettoyage
    if (createdUserId) {
      console.log('\n🧹 Nettoyage...');
      try {
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        console.log('✅ Utilisateur de test supprimé');
      } catch (cleanupError) {
        console.error('⚠️ Erreur nettoyage:', cleanupError.message);
      }
    }
  }
}

testFreshUserComplete().then(() => {
  console.log('\n🏁 Test complet terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
