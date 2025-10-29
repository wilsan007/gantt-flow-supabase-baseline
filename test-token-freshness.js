/**
 * 🧪 TEST - Vérifier si le Token est Frais Immédiatement Après Création
 * 
 * Hypothèse: Le token n'est pas consommé à la création mais lors de multiples vérifications
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

async function testTokenFreshness() {
  console.log('🧪 ===== TEST FRAÎCHEUR TOKEN =====');
  console.log('🎯 Objectif: Vérifier si le token est utilisable immédiatement après création');
  console.log('');

  const testEmail = `test-token-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // ÉTAPE 1: Créer un utilisateur de test
    console.log('🔍 ÉTAPE 1: Création utilisateur de test...');
    console.log('   - Email:', testEmail);
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: false  // Important: pas de confirmation automatique
    });

    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError);
      return;
    }

    console.log('✅ Utilisateur créé:', userData.user.id);
    console.log('   - Email confirmé:', userData.user.email_confirmed_at ? 'OUI' : 'NON');
    console.log('');

    // ÉTAPE 2: Générer un lien de confirmation immédiatement
    console.log('🔍 ÉTAPE 2: Génération lien de confirmation...');
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: testEmail,
      password: testPassword,
      options: {
        redirectTo: 'http://localhost:8080/auth/callback'
      }
    });

    if (linkError) {
      console.error('❌ Erreur génération lien:', linkError);
      return;
    }

    // Extraire le token
    const url = new URL(linkData.properties.action_link);
    const token = url.searchParams.get('token');
    
    console.log('✅ Lien généré avec succès');
    console.log('   - Token (début):', token?.substring(0, 20) + '...');
    console.log('   - URL complète:', linkData.properties.action_link);
    console.log('');

    // ÉTAPE 3: Test immédiat du token (première fois)
    console.log('🔍 ÉTAPE 3: Test immédiat du token (PREMIÈRE FOIS)...');
    
    const { data: otpData1, error: otpError1 } = await supabaseAdmin.auth.verifyOtp({
      email: testEmail,
      token: token,
      type: 'signup'
    });

    console.log('📊 Résultat première vérification:');
    console.log('   - Erreur:', otpError1 ? otpError1.message : 'AUCUNE');
    console.log('   - Données:', otpData1 ? 'PRÉSENTES' : 'ABSENTES');
    console.log('   - User confirmé:', otpData1?.user?.email_confirmed_at ? 'OUI' : 'NON');
    console.log('');

    // ÉTAPE 4: Test du même token (deuxième fois) - IMMÉDIATEMENT
    console.log('🔍 ÉTAPE 4: Test du même token (DEUXIÈME FOIS - IMMÉDIAT)...');
    
    const { data: otpData2, error: otpError2 } = await supabaseAdmin.auth.verifyOtp({
      email: testEmail,
      token: token,
      type: 'signup'
    });

    console.log('📊 Résultat deuxième vérification:');
    console.log('   - Erreur:', otpError2 ? otpError2.message : 'AUCUNE');
    console.log('   - Données:', otpData2 ? 'PRÉSENTES' : 'ABSENTES');
    console.log('   - User confirmé:', otpData2?.user?.email_confirmed_at ? 'OUI' : 'NON');
    console.log('');

    // ÉTAPE 5: Attendre et tester à nouveau (troisième fois)
    console.log('🔍 ÉTAPE 5: Test après délai (TROISIÈME FOIS - 2 secondes)...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: otpData3, error: otpError3 } = await supabaseAdmin.auth.verifyOtp({
      email: testEmail,
      token: token,
      type: 'signup'
    });

    console.log('📊 Résultat troisième vérification:');
    console.log('   - Erreur:', otpError3 ? otpError3.message : 'AUCUNE');
    console.log('   - Données:', otpData3 ? 'PRÉSENTES' : 'ABSENTES');
    console.log('');

    // ÉTAPE 6: Vérifier l'état final de l'utilisateur
    console.log('🔍 ÉTAPE 6: État final de l\'utilisateur...');
    
    const { data: finalUser, error: finalError } = await supabaseAdmin.auth.admin.getUserById(userData.user.id);
    
    console.log('📊 État final:');
    console.log('   - Email confirmé:', finalUser?.user?.email_confirmed_at ? 'OUI' : 'NON');
    if (finalUser?.user?.email_confirmed_at) {
      console.log('   - Confirmé le:', finalUser.user.email_confirmed_at);
    }
    console.log('');

    // ÉTAPE 7: Nettoyage - Supprimer l'utilisateur de test
    console.log('🧹 ÉTAPE 7: Nettoyage...');
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Utilisateur de test supprimé');

    // CONCLUSION
    console.log('');
    console.log('🎯 ===== CONCLUSION =====');
    console.log('📊 Résultats:');
    console.log('   - 1ère vérification:', otpError1 ? 'ÉCHEC' : 'SUCCÈS');
    console.log('   - 2ème vérification:', otpError2 ? 'ÉCHEC' : 'SUCCÈS');
    console.log('   - 3ème vérification:', otpError3 ? 'ÉCHEC' : 'SUCCÈS');
    
    if (!otpError1 && otpError2) {
      console.log('');
      console.log('🎯 HYPOTHÈSE CONFIRMÉE: Token consommé après première utilisation');
      console.log('💡 Solution: Éviter les vérifications multiples du même token');
    } else if (otpError1) {
      console.log('');
      console.log('🎯 HYPOTHÈSE INFIRMÉE: Token déjà invalide dès la première utilisation');
      console.log('💡 Problème: Token consommé lors de la création ou génération');
    } else {
      console.log('');
      console.log('🎯 RÉSULTAT INATTENDU: Token réutilisable multiple fois');
      console.log('💡 Investigation: Problème ailleurs dans le processus');
    }

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  }
}

// Lancer le test
testTokenFreshness().then(() => {
  console.log('');
  console.log('🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
