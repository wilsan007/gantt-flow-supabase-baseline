/**
 * 🧪 TEST SEND-INVITATION AVEC UTILISATEUR EXISTANT
 * 
 * Test avec l'user ID: 5c5731ce-75d0-4455-8184-bc42c626cb17
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function testWithExistingUser() {
  console.log('🧪 ===== TEST SEND-INVITATION AVEC UTILISATEUR EXISTANT =====');
  console.log('🎯 User ID: 5c5731ce-75d0-4455-8184-bc42c626cb17');
  console.log('');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  const existingUserId = '5c5731ce-75d0-4455-8184-bc42c626cb17';

  try {
    // Client admin pour récupérer l'utilisateur
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('🔍 ÉTAPE 1: Récupération utilisateur existant...');
    
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(existingUserId);
    
    if (getUserError || !userData?.user) {
      console.error('❌ Utilisateur non trouvé:', getUserError?.message);
      return;
    }

    console.log('✅ Utilisateur trouvé:');
    console.log('   - ID:', userData.user.id);
    console.log('   - Email:', userData.user.email);
    console.log('   - Créé le:', userData.user.created_at);
    console.log('   - Métadonnées:', Object.keys(userData.user.raw_user_meta_data || {}));

    console.log('');
    console.log('🔍 ÉTAPE 2: Création session temporaire...');

    // Créer une session temporaire pour cet utilisateur
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      user_id: existingUserId
    });

    if (sessionError || !sessionData?.session) {
      console.error('❌ Erreur création session:', sessionError?.message);
      console.log('⚠️ Tentative alternative avec Service Role Key...');
      
      // Utiliser directement le Service Role Key (bypass auth)
      const userToken = SUPABASE_SERVICE_ROLE_KEY;
      console.log('✅ Utilisation Service Role Key pour bypass auth');
    } else {
      const userToken = sessionData.session.access_token;
      console.log('✅ Token session créé:', userToken.substring(0, 50) + '...');
    }

    const userToken = sessionData?.session?.access_token || SUPABASE_SERVICE_ROLE_KEY;

    console.log('');
    console.log('🚀 ÉTAPE 3: Test fonction send-invitation...');

    const timestamp = Date.now();
    const invitationData = {
      email: `test-existing-user-${timestamp}@example.com`,
      fullName: `Test Existing User ${timestamp}`,
      invitationType: 'tenant_owner',
      siteUrl: 'http://localhost:8080',
      frontendPort: '8080'
    };

    console.log('📋 Données invitation:');
    console.log('   - Email:', invitationData.email);
    console.log('   - Nom:', invitationData.fullName);

    const functionUrl = `${SUPABASE_URL}/functions/v1/send-invitation`;

    console.log('📤 Appel fonction send-invitation...');

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Test-Script/1.0'
      },
      body: JSON.stringify(invitationData)
    });

    console.log('📊 Réponse:');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);

    const responseText = await response.text();

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ SUCCÈS ! Fonction exécutée:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success && result.data) {
          console.log('');
          console.log('🎉 INVITATION CRÉÉE:');
          console.log('   - User ID:', result.data.user_id);
          console.log('   - Email:', result.data.email);
          console.log('   - Magic Link:', result.data.confirmation_url ? 'GÉNÉRÉ' : 'NON');
          console.log('   - Email envoyé:', result.data.email_sent ? 'OUI' : 'NON');
        }
      } catch (parseError) {
        console.log('✅ Réponse texte:', responseText);
      }
    } else {
      console.log('❌ Erreur:', responseText);
    }

    console.log('');
    console.log('📋 VÉRIFICATION LOGS:');
    console.log('🔗 Dashboard: https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/functions');
    console.log('📁 Fonction: send-invitation');
    console.log('📊 Onglet: Logs');
    console.log('⏰ Timestamp:', new Date().toISOString());

  } catch (error) {
    console.error('💥 Erreur:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('');
  console.log('🏁 Test terminé');
}

testWithExistingUser().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
