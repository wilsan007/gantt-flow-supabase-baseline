/**
 * 🧪 TEST - Nouvelle Méthode Token Frais + exchangeCodeForSession
 * 
 * Simule exactement ce que fait la nouvelle fonction handle-email-confirmation
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

async function testNewMethod() {
  console.log('🧪 ===== TEST NOUVELLE MÉTHODE =====');
  console.log('🎯 Token Frais + exchangeCodeForSession');
  console.log('');

  const userEmail = 'testgser@yahooo.com';
  const userId = '328b48e0-500d-4419-a1cf-2c9986815eee';

  try {
    // ÉTAPE 1: État initial
    console.log('🔍 ÉTAPE 1: État initial utilisateur...');
    const { data: initialUser, error: initialError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (initialError) {
      console.error('❌ Erreur getUserById:', initialError);
      return;
    }

    console.log('📊 État initial:');
    console.log('   - Email:', initialUser.user.email);
    console.log('   - Email confirmé:', initialUser.user.email_confirmed_at ? 'OUI' : 'NON');
    console.log('');

    // ÉTAPE 2: Génération nouveau token (comme dans la nouvelle fonction)
    console.log('🔍 ÉTAPE 2: Génération nouveau token de confirmation...');
    const { data: newLinkData, error: newLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: userEmail,
      options: {
        redirectTo: 'http://localhost:8080/auth/callback'
      }
    });
    
    if (newLinkError) {
      console.error('❌ Erreur génération nouveau token:', newLinkError);
      return;
    }
    
    console.log('✅ Nouveau token généré');
    console.log('   - URL:', newLinkData.properties.action_link);
    console.log('');

    // ÉTAPE 3: Simulation visite URL (comme dans la nouvelle fonction)
    console.log('🔍 ÉTAPE 3: Simulation visite URL de confirmation...');
    const response = await fetch(newLinkData.properties.action_link, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log('📊 Réponse simulation:');
    console.log('   - Status:', response.status);
    
    const location = response.headers.get('location');
    if (location) {
      console.log('   - Redirection vers:', location);
      console.log('');
      
      // ÉTAPE 4: Extraction tokens (comme dans la nouvelle fonction)
      const redirectUrl = new URL(location);
      const accessToken = redirectUrl.searchParams.get('access_token') || 
                         redirectUrl.hash.match(/access_token=([^&]+)/)?.[1];
      const refreshToken = redirectUrl.searchParams.get('refresh_token') ||
                          redirectUrl.hash.match(/refresh_token=([^&]+)/)?.[1];
      const code = redirectUrl.searchParams.get('code');
      const error = redirectUrl.searchParams.get('error') || 
                   redirectUrl.hash.match(/error=([^&]+)/)?.[1];
      
      console.log('🔑 Analyse URL de redirection:');
      console.log('   - Access Token:', accessToken ? 'PRÉSENT (' + accessToken.substring(0, 20) + '...)' : 'ABSENT');
      console.log('   - Refresh Token:', refreshToken ? 'PRÉSENT (' + refreshToken.substring(0, 20) + '...)' : 'ABSENT');
      console.log('   - Code:', code ? 'PRÉSENT (' + code.substring(0, 20) + '...)' : 'ABSENT');
      console.log('   - Error:', error || 'AUCUNE');
      console.log('');

      let confirmationSuccess = false;

      // ÉTAPE 5: Tentative exchangeCodeForSession
      if (code) {
        console.log('🔍 ÉTAPE 5A: Test exchangeCodeForSession...');
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.exchangeCodeForSession(code);
        
        console.log('📊 Résultat exchangeCodeForSession:');
        console.log('   - Erreur:', sessionError ? sessionError.message : 'AUCUNE');
        console.log('   - Session présente:', sessionData?.session ? 'OUI' : 'NON');
        console.log('   - User présent:', sessionData?.user ? 'OUI' : 'NON');
        
        if (!sessionError && sessionData?.user?.email_confirmed_at) {
          console.log('   - Email confirmé:', 'OUI');
          console.log('   - Confirmé le:', sessionData.user.email_confirmed_at);
          confirmationSuccess = true;
        } else if (sessionData?.user) {
          console.log('   - Email confirmé:', sessionData.user.email_confirmed_at ? 'OUI' : 'NON');
        }
        console.log('');
      }
      
      // ÉTAPE 6: Tentative setSession si pas de code
      else if (accessToken && refreshToken) {
        console.log('🔍 ÉTAPE 5B: Test setSession avec tokens...');
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        console.log('📊 Résultat setSession:');
        console.log('   - Erreur:', sessionError ? sessionError.message : 'AUCUNE');
        console.log('   - Session présente:', sessionData?.session ? 'OUI' : 'NON');
        console.log('   - User présent:', sessionData?.user ? 'OUI' : 'NON');
        
        if (!sessionError && sessionData?.user?.email_confirmed_at) {
          console.log('   - Email confirmé:', 'OUI');
          console.log('   - Confirmé le:', sessionData.user.email_confirmed_at);
          confirmationSuccess = true;
        } else if (sessionData?.user) {
          console.log('   - Email confirmé:', sessionData.user.email_confirmed_at ? 'OUI' : 'NON');
        }
        console.log('');
      }
      
      // ÉTAPE 7: Vérification si pas de tokens mais pas d'erreur
      else if (!error) {
        console.log('🔍 ÉTAPE 5C: Vérification directe état utilisateur...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
        
        const { data: updatedUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (updatedUser?.user?.email_confirmed_at) {
          console.log('✅ Confirmation détectée après simulation !');
          console.log('   - Confirmé le:', updatedUser.user.email_confirmed_at);
          confirmationSuccess = true;
        } else {
          console.log('❌ Pas de confirmation détectée');
        }
        console.log('');
      }

      // ÉTAPE 8: État final
      console.log('🔍 ÉTAPE 6: Vérification état final...');
      const { data: finalUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      console.log('📊 État final utilisateur:');
      console.log('   - Email confirmé:', finalUser?.user?.email_confirmed_at ? 'OUI' : 'NON');
      if (finalUser?.user?.email_confirmed_at) {
        console.log('   - Confirmé le:', finalUser.user.email_confirmed_at);
      }
      console.log('');

      // CONCLUSION
      console.log('🎯 ===== CONCLUSION =====');
      if (confirmationSuccess || finalUser?.user?.email_confirmed_at) {
        console.log('🎉 SUCCÈS: La nouvelle méthode fonctionne !');
        console.log('💡 Solution validée: Token frais + simulation callback');
      } else {
        console.log('❌ ÉCHEC: La nouvelle méthode ne fonctionne pas');
        console.log('💡 Problème: Même avec token frais, la confirmation échoue');
        if (error) {
          console.log('🚨 Erreur détectée:', error);
        }
      }
      
    } else {
      console.log('❌ Pas de redirection détectée');
    }

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  }
}

// Lancer le test
testNewMethod().then(() => {
  console.log('');
  console.log('🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
