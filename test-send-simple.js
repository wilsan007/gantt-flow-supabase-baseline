/**
 * 🧪 TEST SIMPLE SEND-INVITATION
 * 
 * Test direct avec l'utilisateur Super Admin existant
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function testSendInvitationSimple() {
  console.log('🧪 ===== TEST SIMPLE SEND-INVITATION =====');
  console.log('🎯 Test avec Super Admin: 5c5731ce-75d0-4455-8184-bc42c626cb17');
  console.log('');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const superAdminId = '5c5731ce-75d0-4455-8184-bc42c626cb17';

  try {
    console.log('🚀 ÉTAPE 1: Test direct avec Service Role Key...');
    console.log('💡 Hypothèse: La fonction acceptera Service Role Key pour Super Admin');
    
    const timestamp = Date.now();
    const invitationData = {
      email: `test-super-admin-${timestamp}@example.com`,
      fullName: `Test Super Admin ${timestamp}`,
      invitationType: 'tenant_owner',
      siteUrl: 'http://localhost:8080',
      frontendPort: '8080'
    };

    console.log('📋 Données invitation:');
    console.log('   - Email:', invitationData.email);
    console.log('   - Nom:', invitationData.fullName);
    console.log('   - Super Admin ID:', superAdminId);

    const functionUrl = `${SUPABASE_URL}/functions/v1/send-invitation`;

    console.log('');
    console.log('📤 Appel fonction send-invitation...');
    console.log('🔗 URL:', functionUrl);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Test-Super-Admin/1.0',
        'x-super-admin-id': superAdminId // Header personnalisé pour identifier le Super Admin
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
        console.log('');
        console.log('✅ SUCCÈS ! Fonction send-invitation exécutée:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
          console.log('');
          console.log('🎉 INVITATION CRÉÉE AVEC SUCCÈS:');
          console.log('   - User ID:', result.data?.user_id);
          console.log('   - Email:', result.data?.email);
          console.log('   - Magic Link:', result.data?.confirmation_url ? 'GÉNÉRÉ' : 'NON');
          console.log('   - Email envoyé:', result.data?.email_sent ? 'OUI' : 'NON');
          
          if (result.data?.confirmation_url) {
            console.log('');
            console.log('🔗 MAGIC LINK GÉNÉRÉ:');
            console.log(result.data.confirmation_url);
          }
        }
      } catch (parseError) {
        console.log('✅ Réponse texte:', responseText);
      }
    } else {
      console.log('');
      console.log('❌ ERREUR ! Détails:');
      console.log('Status:', response.status);
      console.log('Response:', responseText);
      
      if (response.status === 401) {
        console.log('');
        console.log('💡 SOLUTION POSSIBLE:');
        console.log('La fonction send-invitation nécessite un token utilisateur valide');
        console.log('Service Role Key ne peut pas bypasser l\'authentification utilisateur');
        console.log('Il faut soit:');
        console.log('1. Modifier la fonction pour accepter Service Role Key');
        console.log('2. Créer un vrai token de session utilisateur');
        console.log('3. Utiliser l\'interface web pour tester');
      }
    }

    console.log('');
    console.log('📋 VÉRIFICATION LOGS SUPABASE:');
    console.log('🔗 https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/functions');
    console.log('📁 Fonction: send-invitation');
    console.log('📊 Logs pour timestamp:', new Date().toISOString());

  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }

  console.log('');
  console.log('🏁 Test simple terminé');
}

testSendInvitationSimple().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
