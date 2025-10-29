/**
 * 🧪 TEST COMPLET - Nouvelle Invitation + Webhook
 * 
 * Crée une nouvelle invitation pour tester le processus complet
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qliinxtanjdnwxlvnxji.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCompleteProcess() {
  console.log('🧪 ===== TEST COMPLET NOUVELLE INVITATION =====');
  console.log('🎯 Créer invitation + Déclencher webhook + Vérifier résultat');
  console.log('');

  const timestamp = Date.now();
  const testEmail = `test-final-${timestamp}@example.com`;
  const testName = `Test Final ${timestamp}`;
  const testPassword = 'TestPassword123!';

  try {
    // ÉTAPE 1: Créer un utilisateur de test
    console.log('🔍 ÉTAPE 1: Création utilisateur de test...');
    console.log('   - Email:', testEmail);
    console.log('   - Nom:', testName);

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: false,
      user_metadata: {
        full_name: testName,
        invitation_type: 'tenant_owner',
        temp_user: true,
        temp_password: testPassword,
        tenant_id: '896b4835-fbee-46b7-9165-c095f89e3898',
        invitation_id: `test-${timestamp}`,
        validation_code: 'test123',
        created_timestamp: new Date().toISOString(),
        company_name: 'Test Company',
        invited_by_type: 'super_admin'
      }
    });

    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError);
      return;
    }

    console.log('✅ Utilisateur créé:');
    console.log('   - ID:', userData.user.id);
    console.log('   - Email confirmé:', userData.user.email_confirmed_at ? 'OUI' : 'NON');
    console.log('');

    // ÉTAPE 2: Attendre un peu puis déclencher le webhook manuellement
    console.log('🔍 ÉTAPE 2: Déclenchement webhook handle-email-confirmation...');
    
    const webhookPayload = {
      type: 'UPDATE',
      table: 'users',
      record: {
        id: userData.user.id,
        email: userData.user.email,
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
    console.log('   - Status Text:', webhookResponse.statusText);

    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log('   - Réponse:', JSON.stringify(webhookData, null, 2));
      console.log('');
      
      // ÉTAPE 3: Vérifier l'état de l'utilisateur après le webhook
      console.log('🔍 ÉTAPE 3: Vérification état utilisateur après webhook...');
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes
      
      const { data: finalUser, error: finalError } = await supabaseAdmin.auth.admin.getUserById(userData.user.id);
      
      if (!finalError && finalUser?.user) {
        console.log('📊 État final utilisateur:');
        console.log('   - Email confirmé:', finalUser.user.email_confirmed_at ? 'OUI' : 'NON');
        if (finalUser.user.email_confirmed_at) {
          console.log('   - Confirmé le:', finalUser.user.email_confirmed_at);
        }
        
        console.log('   - Métadonnées confirmation:');
        const metadata = finalUser.user.raw_user_meta_data;
        console.log('     - email_confirmed_automatically:', metadata?.email_confirmed_automatically);
        console.log('     - confirmation_method:', metadata?.confirmation_method);
        console.log('     - server_error_workaround:', metadata?.server_error_workaround);
        console.log('     - validation_completed:', metadata?.validation_completed);
        
        console.log('');
        console.log('🎯 ===== RÉSULTAT FINAL =====');
        if (finalUser.user.email_confirmed_at || metadata?.email_confirmed_automatically) {
          console.log('🎉 SUCCÈS TOTAL: La nouvelle solution fonctionne parfaitement !');
          console.log('✅ Confirmation réussie via contournement intelligent');
          console.log('💡 Le processus peut continuer normalement');
        } else {
          console.log('❌ ÉCHEC: L\'utilisateur n\'est toujours pas confirmé');
          console.log('💡 Vérifier les logs de la fonction Edge');
        }
      } else {
        console.error('❌ Erreur lors de la vérification finale:', finalError);
      }
    } else {
      const errorText = await webhookResponse.text();
      console.log('   - Erreur webhook:', errorText);
      console.log('');
      console.log('❌ ÉCHEC: Le webhook a échoué');
    }

    // ÉTAPE 4: Nettoyage - Supprimer l'utilisateur de test
    console.log('🧹 ÉTAPE 4: Nettoyage...');
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Utilisateur de test supprimé');

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  }
}

// Lancer le test
testCompleteProcess().then(() => {
  console.log('');
  console.log('🏁 Test complet terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
