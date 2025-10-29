/**
 * 🧪 TEST ISOLÉ - ÉTAPE 4 : Confirmation Email Automatique
 * 
 * Ce script teste uniquement la méthode de confirmation email
 * pour vérifier si elle fonctionne correctement.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Charger les variables d'environnement depuis .env
config();

// Configuration Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qliinxtanjdnwxlvnxji.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configuration:');
console.log('   - SUPABASE_URL:', SUPABASE_URL);
console.log('   - SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'PRÉSENTE (' + SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...)' : 'MANQUANTE');

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY manquante dans le fichier .env');
  process.exit(1);
}

// Créer le client admin
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * 🔍 Fonction de test de confirmation email
 */
async function testEmailConfirmation(userId) {
  console.log('🧪 ===== TEST ISOLÉ - CONFIRMATION EMAIL =====');
  console.log('🎯 Objectif: Tester uniquement la méthode updateUserById');
  console.log('📧 User ID à tester:', userId);
  console.log('⏰ Début du test:', new Date().toISOString());
  console.log('');

  try {
    // ÉTAPE 1: Vérifier l'état actuel de l'utilisateur
    console.log('🔍 ÉTAPE 1: Récupération état actuel utilisateur...');
    const getUserStart = Date.now();
    
    const { data: currentUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    const getUserEnd = Date.now();
    
    console.log('⏱️ Durée getUserById:', (getUserEnd - getUserStart), 'ms');
    
    if (getUserError) {
      console.error('❌ Erreur getUserById:', getUserError);
      return false;
    }
    
    if (!currentUser?.user) {
      console.error('❌ Utilisateur non trouvé');
      return false;
    }
    
    console.log('✅ Utilisateur trouvé:');
    console.log('   - Email:', currentUser.user.email);
    console.log('   - Email confirmé:', currentUser.user.email_confirmed_at || 'NON');
    console.log('   - Créé le:', currentUser.user.created_at);
    console.log('');

    // ÉTAPE 2: Test de confirmation email
    console.log('🏆 ÉTAPE 2: Test méthode de confirmation email...');
    console.log('   - Méthode: supabaseAdmin.auth.admin.updateUserById');
    console.log('   - Paramètre: email_confirm: true');
    console.log('   - User ID:', userId);
    
    const confirmStart = Date.now();
    
    // Test avec différentes méthodes
    console.log('🧪 Test Méthode 1: email_confirm: true');
    const { data: updateData1, error: confirmError1 } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true
    });
    
    if (confirmError1) {
      console.log('❌ Méthode 1 échouée:', confirmError1.message);
      console.log('🧪 Test Méthode 2: email_confirmed_at direct');
      
      const { data: updateData2, error: confirmError2 } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirmed_at: new Date().toISOString()
      });
      
      if (confirmError2) {
        console.log('❌ Méthode 2 échouée:', confirmError2.message);
        console.log('🧪 Test Méthode 3: user_metadata update');
        
        const { data: updateData3, error: confirmError3 } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...currentUser.user.user_metadata,
            email_confirmed_manually: true
          }
        });
        
        var updateData = updateData3;
        var confirmError = confirmError3;
      } else {
        var updateData = updateData2;
        var confirmError = confirmError2;
      }
    } else {
      var updateData = updateData1;
      var confirmError = confirmError1;
    }
    
    const confirmEnd = Date.now();
    
    console.log('⏱️ Durée updateUserById:', (confirmEnd - confirmStart), 'ms');
    
    if (confirmError) {
      console.error('❌ ÉCHEC confirmation email:');
      console.error('   - Code:', confirmError.code);
      console.error('   - Message:', confirmError.message);
      console.error('   - Status:', confirmError.status);
      return false;
    }
    
    console.log('✅ Confirmation réussie!');
    console.log('   - User confirmé:', !!updateData?.user);
    console.log('   - Email confirmé le:', updateData?.user?.email_confirmed_at);
    console.log('');

    // ÉTAPE 2.5: Test avec Token de Confirmation (VRAIE MÉTHODE)
    console.log('🔍 ÉTAPE 2.5: Recherche du token de confirmation...');
    
    // Chercher l'invitation pour récupérer le token
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .select('token, email, metadata')
      .eq('email', currentUser.user.email)
      .eq('status', 'pending')
      .single();
    
    if (invitation?.token) {
      console.log('✅ Token trouvé:', invitation.token.substring(0, 20) + '...');
      console.log('🧪 Test Méthode 4: Confirmation via Token (VRAIE MÉTHODE)');
      
      // MÉTHODE 1: URL de vérification directe
      const verifyUrl = `${SUPABASE_URL}/auth/v1/verify?token=${invitation.token}&type=signup`;
      console.log('🔗 URL de vérification:', verifyUrl.substring(0, 80) + '...');
      
      try {
        const verifyResponse = await fetch(verifyUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 Réponse URL vérification:', verifyResponse.status, verifyResponse.statusText);
        
        if (verifyResponse.ok) {
          console.log('✅ Confirmation via URL RÉUSSIE !');
          var confirmationMethod = 'url_verification';
        } else {
          console.log('❌ URL échouée, test verifyOtp...');
          var confirmationMethod = 'url_failed';
        }
      } catch (error) {
        console.error('🚨 Exception URL:', error.message);
        var confirmationMethod = 'url_failed';
      }
      
      // MÉTHODE 2: verifyOtp (NOUVELLE APPROCHE)
      console.log('🧪 Test Méthode 5: supabase.auth.verifyOtp');
      console.log('   - Email:', currentUser.user.email);
      console.log('   - Token:', invitation.token.substring(0, 20) + '...');
      console.log('   - Type: signup');
      
      try {
        const { data: otpData, error: otpError } = await supabaseAdmin.auth.verifyOtp({
          email: currentUser.user.email,
          token: invitation.token,
          type: 'signup'
        });
        
        console.log('📊 Résultat verifyOtp:');
        console.log('   - Erreur:', otpError ? otpError.message : 'AUCUNE');
        console.log('   - Données:', otpData ? 'PRÉSENTES' : 'ABSENTES');
        
        if (otpData && !otpError) {
          console.log('✅ CONFIRMATION VIA VERIFYOTP RÉUSSIE !');
          console.log('   - User:', otpData.user ? 'CONFIRMÉ' : 'NON CONFIRMÉ');
          console.log('   - Session:', otpData.session ? 'CRÉÉE' : 'NON CRÉÉE');
          if (otpData.user?.email_confirmed_at) {
            console.log('   - Confirmé le:', otpData.user.email_confirmed_at);
          }
          var confirmationMethod = 'verifyOtp_success';
        } else {
          console.log('❌ verifyOtp échoué:', otpError?.message || 'Données manquantes');
          var confirmationMethod = confirmationMethod === 'url_verification' ? 'url_verification' : 'verifyOtp_failed';
        }
      } catch (error) {
        console.error('🚨 Exception verifyOtp:', error.message);
        var confirmationMethod = confirmationMethod === 'url_verification' ? 'url_verification' : 'verifyOtp_exception';
      }
    } else {
      console.log('⚠️ Aucun token trouvé dans l\'invitation');
      var confirmationMethod = 'no_token';
    }
    
    // ÉTAPE 3: Vérification post-confirmation (avec délai)
    console.log('🔍 ÉTAPE 3: Vérification post-confirmation...');
    console.log('⏳ Attente 3 secondes pour propagation...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const recheckStart = Date.now();
    
    const { data: recheckUser, error: recheckError } = await supabaseAdmin.auth.admin.getUserById(userId);
    const recheckEnd = Date.now();
    
    console.log('⏱️ Durée vérification:', (recheckEnd - recheckStart), 'ms');
    
    if (recheckError) {
      console.error('❌ Erreur vérification:', recheckError);
      return false;
    }
    
    const wasConfirmedBefore = !!currentUser.user.email_confirmed_at;
    const isConfirmedNow = !!recheckUser?.user?.email_confirmed_at;
    
    console.log('📊 RÉSULTATS COMPARATIFS:');
    console.log('   - Avant confirmation:', wasConfirmedBefore ? 'CONFIRMÉ' : 'NON CONFIRMÉ');
    console.log('   - Après confirmation:', isConfirmedNow ? 'CONFIRMÉ' : 'NON CONFIRMÉ');
    console.log('   - Changement effectué:', (!wasConfirmedBefore && isConfirmedNow) ? 'OUI ✅' : 'NON ⚠️');
    console.log('   - Méthode réussie:', confirmationMethod || 'aucune');
    
    if (isConfirmedNow) {
      console.log('   - Confirmé le:', recheckUser.user.email_confirmed_at);
      console.log('   - Timestamp valide:', new Date(recheckUser.user.email_confirmed_at).getTime() > 0 ? 'OUI' : 'NON');
    }
    
    console.log('');
    console.log('🎉 ===== TEST TERMINÉ =====');
    console.log('📊 Résultat final:', isConfirmedNow ? 'SUCCÈS ✅' : 'ÉCHEC ❌');
    console.log('⏰ Fin du test:', new Date().toISOString());
    
    return isConfirmedNow;
    
  } catch (error) {
    console.error('🚨 EXCEPTION durant le test:', error);
    console.error('   - Type:', error.constructor.name);
    console.error('   - Message:', error.message);
    console.error('   - Stack:', error.stack?.substring(0, 200) + '...');
    return false;
  }
}

/**
 * 🚀 Fonction principale
 */
async function main() {
  // Vous pouvez remplacer cet ID par un vrai ID utilisateur de votre base
  const TEST_USER_ID = process.argv[2];
  
  if (!TEST_USER_ID) {
    console.log('📋 Usage: node test-email-confirmation.js <USER_ID>');
    console.log('');
    console.log('💡 Pour obtenir un USER_ID, exécutez cette requête SQL:');
    console.log('   SELECT id, email, email_confirmed_at FROM auth.users WHERE email = \'votre@email.com\';');
    console.log('');
    process.exit(1);
  }
  
  console.log('🔧 Configuration:');
  console.log('   - Supabase URL:', SUPABASE_URL);
  console.log('   - Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? 'PRÉSENTE' : 'MANQUANTE');
  console.log('   - User ID à tester:', TEST_USER_ID);
  console.log('');
  
  const success = await testEmailConfirmation(TEST_USER_ID);
  
  console.log('');
  console.log('🏁 RÉSULTAT FINAL:', success ? 'SUCCÈS ✅' : 'ÉCHEC ❌');
  
  process.exit(success ? 0 : 1);
}

// Lancer le test
main().catch(console.error);
