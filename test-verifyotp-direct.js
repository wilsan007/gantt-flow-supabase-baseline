/**
 * 🧪 TEST DIRECT - verifyOtp avec Token d'Invitation
 * 
 * Test direct de la méthode verifyOtp avec le token depuis l'invitation
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

async function testVerifyOtpDirect() {
  console.log('🧪 ===== TEST DIRECT VERIFYOTP =====');
  console.log('🎯 Objectif: Tester verifyOtp avec token d\'invitation existant');
  console.log('');

  const userEmail = 'testgser@yahooo.com';
  const userId = '328b48e0-500d-4419-a1cf-2c9986815eee';

  try {
    // ÉTAPE 1: Récupérer le token depuis l'invitation
    console.log('🔍 ÉTAPE 1: Récupération token depuis invitation...');
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .select('token, metadata, status')
      .eq('email', userEmail)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      console.error('❌ Invitation non trouvée:', invitationError?.message);
      return;
    }

    console.log('✅ Invitation trouvée:');
    console.log('   - Token (début):', invitation.token?.substring(0, 20) + '...');
    console.log('   - Status:', invitation.status);
    console.log('   - Metadata présente:', !!invitation.metadata);
    console.log('');

    // ÉTAPE 2: État actuel de l'utilisateur
    console.log('🔍 ÉTAPE 2: État actuel utilisateur...');
    const { data: currentUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError) {
      console.error('❌ Erreur getUserById:', getUserError);
      return;
    }

    console.log('📊 État utilisateur:');
    console.log('   - Email:', currentUser.user.email);
    console.log('   - Email confirmé:', currentUser.user.email_confirmed_at ? 'OUI' : 'NON');
    console.log('   - Créé le:', currentUser.user.created_at);
    console.log('');

    // ÉTAPE 3: Test verifyOtp
    console.log('🎯 ÉTAPE 3: Test verifyOtp avec token invitation...');
    console.log('   - Email:', userEmail);
    console.log('   - Token:', invitation.token?.substring(0, 20) + '...');
    console.log('   - Type: signup');

    const verifyStart = Date.now();

    const { data: otpData, error: otpError } = await supabaseAdmin.auth.verifyOtp({
      email: userEmail,
      token: invitation.token,
      type: 'signup'
    });

    const verifyEnd = Date.now();

    console.log('⏱️ Durée verifyOtp:', (verifyEnd - verifyStart), 'ms');
    console.log('');

    console.log('📊 Résultat verifyOtp:');
    console.log('   - Erreur:', otpError ? otpError.message : 'AUCUNE');
    console.log('   - Code erreur:', otpError?.code || 'N/A');
    console.log('   - Données présentes:', otpData ? 'OUI' : 'NON');
    console.log('   - User présent:', otpData?.user ? 'OUI' : 'NON');
    console.log('   - Session présente:', otpData?.session ? 'OUI' : 'NON');

    if (otpData?.user) {
      console.log('   - Email confirmé:', otpData.user.email_confirmed_at ? 'OUI' : 'NON');
      if (otpData.user.email_confirmed_at) {
        console.log('   - Confirmé le:', otpData.user.email_confirmed_at);
      }
    }
    console.log('');

    // ÉTAPE 4: Vérification post-verifyOtp
    if (!otpError && otpData?.user?.email_confirmed_at) {
      console.log('✅ SUCCESS: verifyOtp a fonctionné !');
      console.log('🔍 ÉTAPE 4: Vérification état utilisateur après verifyOtp...');
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
      
      const { data: finalUser, error: finalError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (!finalError && finalUser?.user) {
        console.log('📊 État final utilisateur:');
        console.log('   - Email confirmé:', finalUser.user.email_confirmed_at ? 'OUI' : 'NON');
        if (finalUser.user.email_confirmed_at) {
          console.log('   - Confirmé le:', finalUser.user.email_confirmed_at);
        }
      }
    } else {
      console.log('❌ ÉCHEC: verifyOtp n\'a pas fonctionné');
      console.log('💡 Raison probable: Token déjà utilisé ou expiré');
    }

    console.log('');
    console.log('🎯 ===== CONCLUSION =====');
    if (!otpError && otpData?.user?.email_confirmed_at) {
      console.log('🎉 SUCCÈS: La méthode verifyOtp fonctionne avec ce token !');
      console.log('💡 Solution: Utiliser verifyOtp dans handle-email-confirmation');
    } else {
      console.log('❌ ÉCHEC: verifyOtp ne fonctionne pas avec ce token');
      console.log('💡 Problème: Token probablement consommé lors de la création');
      console.log('🔄 Alternative: Utiliser une autre méthode de confirmation');
    }

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  }
}

// Lancer le test
testVerifyOtpDirect().then(() => {
  console.log('');
  console.log('🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
