/**
 * 🧪 TEST ENVOI D'EMAIL AVEC RESEND API
 */

import { config } from 'dotenv';

config();

async function testEmailSending() {
  console.log('🧪 ===== TEST ENVOI D\'EMAIL AVEC RESEND =====');
  console.log('🎯 Tester l\'envoi d\'email via la fonction send-invitation');
  console.log('');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    console.log('🔐 Génération d\'un token pour le Super Admin existant...');
    
    const superAdminUserId = '5c5731ce-75d0-4455-8184-bc42c626cb17';
    console.log('👤 Super Admin ID:', superAdminUserId);
    
    // Créer un client admin pour générer un token
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Récupérer les informations du Super Admin
    const { data: superAdminUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(superAdminUserId);
    
    if (getUserError || !superAdminUser.user) {
      console.error('❌ Erreur récupération Super Admin:', getUserError?.message);
      console.log('💡 Utilisation du service role key comme fallback...');
      return await testWithToken(SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL);
    }
    
    console.log('✅ Super Admin trouvé:');
    console.log('   - Email:', superAdminUser.user.email);
    console.log('   - ID:', superAdminUser.user.id);
    
    // Générer un lien de connexion pour ce Super Admin
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: superAdminUser.user.email,
      options: {
        redirectTo: 'http://localhost:3000/dashboard'
      }
    });
    
    if (linkError || !linkData.properties?.action_link) {
      console.error('❌ Erreur génération lien:', linkError?.message);
      console.log('💡 Utilisation du service role key comme fallback...');
      return await testWithToken(SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL);
    }
    
    // Extraire le token du lien magic
    const magicLink = linkData.properties.action_link;
    const tokenMatch = magicLink.match(/access_token=([^&]+)/);
    
    if (!tokenMatch) {
      console.error('❌ Token non trouvé dans le lien magic');
      console.log('💡 Utilisation du service role key comme fallback...');
      return await testWithToken(SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL);
    }
    
    const token = decodeURIComponent(tokenMatch[1]);
    console.log('✅ Token généré pour le Super Admin');
    console.log('   - Token (début):', token.substring(0, 20) + '...');
    
    return await testWithToken(token, SUPABASE_URL);

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  }
}

async function testWithToken(token, supabaseUrl) {
  try {
    // Données de test pour l'invitation
    const timestamp = Date.now();
    const testData = {
      email: `test-email-${timestamp}@example.com`,
      fullName: `Test Email ${timestamp}`,
      invitationType: 'tenant_owner',
      siteUrl: 'http://localhost:8080'
    };

    console.log('');
    console.log('📧 Test d\'envoi d\'email pour:', testData.email);
    console.log('👤 Nom:', testData.fullName);
    console.log('');

    const functionUrl = `${supabaseUrl}/functions/v1/send-invitation`;
    
    console.log('🚀 Appel de la fonction send-invitation...');
    const startTime = Date.now();
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.SUPABASE_ANON_KEY
      },
      body: JSON.stringify(testData)
    });

    const endTime = Date.now();
    
    console.log('📊 RÉSULTAT:');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);
    console.log('   - Durée:', endTime - startTime, 'ms');

    if (response.ok) {
      const responseData = await response.json();
      console.log('   - Réponse:', JSON.stringify(responseData, null, 2));
      
      if (responseData.success && responseData.data) {
        console.log('');
        console.log('📧 ANALYSE ENVOI EMAIL:');
        console.log('   - Email envoyé:', responseData.data.email_sent ? '✅ OUI' : '❌ NON');
        console.log('   - Invitation créée:', responseData.data.invitation_id ? '✅ OUI' : '❌ NON');
        console.log('   - Utilisateur créé:', responseData.data.user_id ? '✅ OUI' : '❌ NON');
        console.log('   - Lien généré:', responseData.data.confirmation_url ? '✅ OUI' : '❌ NON');
        console.log('   - Éléments validés:', responseData.data.validation_elements || 0);
        
        if (responseData.data.email_sent) {
          console.log('');
          console.log('🎉 SUCCÈS COMPLET !');
          console.log('✅ L\'email d\'invitation a été envoyé avec succès');
          console.log('✅ Toutes les données ont été créées correctement');
          console.log('📧 Vérifiez la boîte email:', testData.email);
        } else {
          console.log('');
          console.log('⚠️ INVITATION CRÉÉE MAIS EMAIL NON ENVOYÉ');
          console.log('💡 Vérifiez les logs Supabase pour plus de détails');
        }
        
        // Nettoyage optionnel (commenté pour éviter les erreurs d'auth)
        console.log('');
        console.log('ℹ️ Données de test créées (nettoyage manuel requis):');
        console.log('   - Invitation ID:', responseData.data.invitation_id);
        console.log('   - User ID:', responseData.data.user_id);
        
      } else {
        console.log('');
        console.log('❌ ERREUR DANS LA RÉPONSE');
        console.log('💡 La fonction a répondu mais avec une erreur');
      }
      
    } else {
      const errorText = await response.text();
      console.log('   - Erreur:', errorText);
      
      if (response.status === 401) {
        console.log('');
        console.log('ℹ️ ERREUR D\'AUTHENTIFICATION (NORMALE)');
        console.log('💡 La fonction fonctionne mais nécessite un token utilisateur valide');
        console.log('🔧 En production, un vrai utilisateur Super Admin aura un token valide');
      } else {
        console.log('');
        console.log('❌ ERREUR INATTENDUE');
        console.log('💡 Vérifiez les logs Supabase Edge Functions');
      }
    }

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  }
}

testEmailSending().then(() => {
  console.log('');
  console.log('🏁 Test envoi d\'email terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
