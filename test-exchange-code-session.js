/**
 * 🧪 TEST - exchangeCodeForSession et Tokens URL
 * 
 * Test des méthodes alternatives avec les tokens d'URL
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

async function testExchangeCodeForSession() {
  console.log('🧪 ===== TEST EXCHANGE CODE FOR SESSION =====');
  console.log('🎯 Objectif: Tester exchangeCodeForSession et tokens URL');
  console.log('');

  const userEmail = 'testgser@yahooo.com';
  const userId = '328b48e0-500d-4419-a1cf-2c9986815eee';

  try {
    // ÉTAPE 1: Récupérer l'URL de confirmation depuis l'invitation
    console.log('🔍 ÉTAPE 1: Récupération URL de confirmation...');
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .select('token, metadata')
      .eq('email', userEmail)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      console.error('❌ Invitation non trouvée:', invitationError?.message);
      return;
    }

    const metadata = typeof invitation.metadata === 'string' 
      ? JSON.parse(invitation.metadata) 
      : invitation.metadata;

    const confirmationUrl = metadata.confirmation_url;
    console.log('✅ URL de confirmation trouvée:');
    console.log('   - URL:', confirmationUrl);
    console.log('');

    // ÉTAPE 2: Analyser l'URL pour extraire les paramètres
    console.log('🔍 ÉTAPE 2: Analyse de l\'URL de confirmation...');
    const url = new URL(confirmationUrl);
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type');
    const redirectTo = url.searchParams.get('redirect_to');

    console.log('📊 Paramètres URL:');
    console.log('   - Token:', token?.substring(0, 20) + '...');
    console.log('   - Type:', type);
    console.log('   - Redirect To:', redirectTo);
    console.log('');

    // ÉTAPE 3: Simuler une visite de l'URL de confirmation
    console.log('🔍 ÉTAPE 3: Simulation visite URL de confirmation...');
    
    try {
      const response = await fetch(confirmationUrl, {
        method: 'GET',
        redirect: 'manual' // Ne pas suivre les redirections automatiquement
      });

      console.log('📊 Réponse URL de confirmation:');
      console.log('   - Status:', response.status);
      console.log('   - Status Text:', response.statusText);
      
      // Vérifier les headers de redirection
      const location = response.headers.get('location');
      if (location) {
        console.log('   - Location Header:', location);
        
        // Analyser l'URL de redirection pour les tokens
        const redirectUrl = new URL(location);
        const accessToken = redirectUrl.searchParams.get('access_token') || 
                           redirectUrl.hash.match(/access_token=([^&]+)/)?.[1];
        const refreshToken = redirectUrl.searchParams.get('refresh_token') ||
                            redirectUrl.hash.match(/refresh_token=([^&]+)/)?.[1];
        const code = redirectUrl.searchParams.get('code');

        console.log('🔑 Tokens extraits de la redirection:');
        console.log('   - Access Token:', accessToken ? accessToken.substring(0, 20) + '...' : 'NON TROUVÉ');
        console.log('   - Refresh Token:', refreshToken ? refreshToken.substring(0, 20) + '...' : 'NON TROUVÉ');
        console.log('   - Code:', code ? code.substring(0, 20) + '...' : 'NON TROUVÉ');
        console.log('');

        // ÉTAPE 4: Test exchangeCodeForSession si on a un code
        if (code) {
          console.log('🎯 ÉTAPE 4: Test exchangeCodeForSession...');
          
          const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.exchangeCodeForSession(code);
          
          console.log('📊 Résultat exchangeCodeForSession:');
          console.log('   - Erreur:', sessionError ? sessionError.message : 'AUCUNE');
          console.log('   - Session présente:', sessionData?.session ? 'OUI' : 'NON');
          console.log('   - User présent:', sessionData?.user ? 'OUI' : 'NON');
          
          if (sessionData?.user) {
            console.log('   - Email confirmé:', sessionData.user.email_confirmed_at ? 'OUI' : 'NON');
            if (sessionData.user.email_confirmed_at) {
              console.log('   - Confirmé le:', sessionData.user.email_confirmed_at);
            }
          }
          console.log('');
        }

        // ÉTAPE 5: Test avec setSession si on a access_token et refresh_token
        if (accessToken && refreshToken) {
          console.log('🎯 ÉTAPE 5: Test setSession avec tokens...');
          
          const { data: setSessionData, error: setSessionError } = await supabaseAdmin.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          console.log('📊 Résultat setSession:');
          console.log('   - Erreur:', setSessionError ? setSessionError.message : 'AUCUNE');
          console.log('   - Session présente:', setSessionData?.session ? 'OUI' : 'NON');
          console.log('   - User présent:', setSessionData?.user ? 'OUI' : 'NON');
          
          if (setSessionData?.user) {
            console.log('   - Email confirmé:', setSessionData.user.email_confirmed_at ? 'OUI' : 'NON');
            if (setSessionData.user.email_confirmed_at) {
              console.log('   - Confirmé le:', setSessionData.user.email_confirmed_at);
            }
          }
          console.log('');
        }

      } else {
        console.log('   - Pas de redirection détectée');
      }

    } catch (fetchError) {
      console.error('❌ Erreur lors de la visite URL:', fetchError.message);
    }

    // ÉTAPE 6: Vérifier l'état final de l'utilisateur
    console.log('🔍 ÉTAPE 6: Vérification état final utilisateur...');
    const { data: finalUser, error: finalError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (!finalError && finalUser?.user) {
      console.log('📊 État final utilisateur:');
      console.log('   - Email confirmé:', finalUser.user.email_confirmed_at ? 'OUI' : 'NON');
      if (finalUser.user.email_confirmed_at) {
        console.log('   - Confirmé le:', finalUser.user.email_confirmed_at);
      }
    }

    console.log('');
    console.log('🎯 ===== CONCLUSION =====');
    console.log('💡 Cette approche simule ce qui se passe quand l\'utilisateur clique sur le lien');
    console.log('🔄 Si ça fonctionne, on peut l\'intégrer dans handle-email-confirmation');

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  }
}

// Lancer le test
testExchangeCodeForSession().then(() => {
  console.log('');
  console.log('🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
