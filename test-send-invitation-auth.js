/**
 * 🧪 TEST SEND-INVITATION AVEC AUTHENTIFICATION UTILISATEUR
 * 
 * Ce script crée un utilisateur super admin et teste send-invitation
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function testSendInvitationWithAuth() {
  console.log('🧪 ===== TEST SEND-INVITATION AVEC AUTH UTILISATEUR =====');
  console.log('🎯 Création utilisateur super admin + test fonction Edge');
  console.log('');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    // Client admin pour créer l'utilisateur
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Client normal pour l'authentification
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log('🔍 ÉTAPE 1: Création utilisateur super admin temporaire...');
    
    const timestamp = Date.now();
    const testEmail = `superadmin-test-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    // Créer l'utilisateur
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Confirmer directement
      user_metadata: {
        full_name: 'Super Admin Test',
        role: 'super_admin'
      }
    });

    if (createError || !userData?.user) {
      console.error('❌ Erreur création utilisateur:', createError?.message);
      return;
    }

    console.log('✅ Utilisateur créé:', userData.user.id);

    // Ajouter le rôle super_admin
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role_id: '1', // Supposons que 1 = super_admin
        is_active: true
      });

    if (roleError) {
      console.log('⚠️ Erreur ajout rôle (peut être normal):', roleError.message);
    }

    console.log('');
    console.log('🔍 ÉTAPE 2: Connexion utilisateur pour obtenir token...');

    // Se connecter avec l'utilisateur créé
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError || !signInData?.session) {
      console.error('❌ Erreur connexion:', signInError?.message);
      return;
    }

    const userToken = signInData.session.access_token;
    console.log('✅ Token utilisateur obtenu:', userToken.substring(0, 50) + '...');

    console.log('');
    console.log('🚀 ÉTAPE 3: Test fonction send-invitation avec token utilisateur...');

    const invitationData = {
      email: `test-edge-auth-${timestamp}@example.com`,
      fullName: `Test Edge Auth ${timestamp}`,
      invitationType: 'tenant_owner',
      siteUrl: 'http://localhost:8080',
      frontendPort: '8080'
    };

    console.log('📋 Données invitation:', invitationData.email);

    const functionUrl = `${SUPABASE_URL}/functions/v1/send-invitation`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`, // Token utilisateur, pas Service Role
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Test-Script/1.0'
      },
      body: JSON.stringify(invitationData)
    });

    console.log('📊 Réponse fonction:');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);

    const responseText = await response.text();

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ SUCCÈS ! Fonction send-invitation exécutée:');
        console.log(JSON.stringify(result, null, 2));
      } catch (parseError) {
        console.log('✅ Réponse texte:', responseText);
      }
    } else {
      console.log('❌ Erreur fonction:', responseText);
    }

    console.log('');
    console.log('🧹 ÉTAPE 4: Nettoyage utilisateur test...');

    // Supprimer l'utilisateur test
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
    
    if (deleteError) {
      console.log('⚠️ Erreur suppression utilisateur:', deleteError.message);
    } else {
      console.log('✅ Utilisateur test supprimé');
    }

    console.log('');
    console.log('📋 VÉRIFICATION LOGS SUPABASE:');
    console.log('1. Dashboard: https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/functions');
    console.log('2. Fonction: send-invitation');
    console.log('3. Onglet: Logs');
    console.log('4. Timestamp:', new Date().toISOString());

  } catch (error) {
    console.error('💥 Erreur test:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('');
  console.log('🏁 Test send-invitation avec auth terminé');
}

testSendInvitationWithAuth().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
