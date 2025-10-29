/**
 * 🧪 TEST DIRECT SEND-INVITATION VIA EDGE FUNCTION
 * 
 * Ce script appelle directement la fonction Edge send-invitation
 * pour générer les logs dans le dashboard Supabase
 */

import { config } from 'dotenv';

config();

async function testSendInvitationDirect() {
  console.log('🧪 ===== TEST DIRECT SEND-INVITATION EDGE FUNCTION =====');
  console.log('🎯 Appel direct de la fonction déployée sur Supabase');
  console.log('');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variables d\'environnement manquantes');
    return;
  }

  try {
    const timestamp = Date.now();
    
    // Données d'invitation
    const invitationData = {
      email: `test-edge-${timestamp}@example.com`,
      fullName: `Test Edge ${timestamp}`,
      invitationType: 'tenant_owner',
      siteUrl: 'http://localhost:8080',
      frontendPort: '8080'
    };

    console.log('📋 DONNÉES D\'INVITATION:');
    console.log('   - Email:', invitationData.email);
    console.log('   - Nom:', invitationData.fullName);
    console.log('   - Type:', invitationData.invitationType);
    console.log('   - Site URL:', invitationData.siteUrl);
    console.log('   - Port:', invitationData.frontendPort);
    console.log('');

    console.log('🚀 APPEL DIRECT EDGE FUNCTION...');
    
    const functionUrl = `${SUPABASE_URL}/functions/v1/send-invitation`;
    
    console.log('📤 URL fonction:', functionUrl);
    console.log('🔑 Authentification: Service Role Key');
    console.log('');

    const startTime = Date.now();

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Test-Script/1.0'
      },
      body: JSON.stringify(invitationData)
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('📊 RÉPONSE REÇUE:');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);
    console.log('   - Durée:', duration, 'ms');
    console.log('');

    const responseText = await response.text();

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ SUCCÈS ! Réponse JSON:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
          console.log('');
          console.log('🎉 INVITATION CRÉÉE AVEC SUCCÈS:');
          console.log('   - User ID:', result.data?.user_id);
          console.log('   - Email:', result.data?.email);
          console.log('   - Magic Link:', result.data?.confirmation_url ? 'GÉNÉRÉ' : 'NON GÉNÉRÉ');
          console.log('   - Email envoyé:', result.data?.email_sent ? 'OUI' : 'NON');
          
          if (result.data?.confirmation_url) {
            console.log('');
            console.log('🔗 MAGIC LINK:');
            console.log(result.data.confirmation_url);
          }
        }
      } catch (parseError) {
        console.log('✅ Réponse (texte brut):');
        console.log(responseText);
      }
    } else {
      console.log('❌ ERREUR ! Réponse:');
      console.log('Status:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      console.log('Body:', responseText);
    }

    console.log('');
    console.log('📋 INSTRUCTIONS VÉRIFICATION LOGS:');
    console.log('1. Aller sur: https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/functions');
    console.log('2. Cliquer sur "send-invitation"');
    console.log('3. Onglet "Logs" pour voir l\'exécution');
    console.log('4. Chercher les logs avec timestamp:', new Date().toISOString());

  } catch (error) {
    console.error('💥 Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('');
  console.log('🏁 Test direct send-invitation terminé');
}

testSendInvitationDirect().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
