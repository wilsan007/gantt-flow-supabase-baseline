/**
 * Test du flux complet d'invitation tenant-owner
 * Ce script teste le processus depuis l'invitation jusqu'à la confirmation
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.lqGJqVYvYNjJJUJzOgYEgJKFLjGCmJJZJHUhHjvhOdE';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Données de test
const TEST_DATA = {
  email: 'nouveau-tenant@example.com',
  fullName: 'Nouveau Tenant Owner',
  companyName: 'Nouvelle Entreprise SARL',
  siteUrl: 'http://localhost:5173'
};

console.log('🚀 Test du flux d\'invitation tenant-owner');
console.log('📧 Email de test:', TEST_DATA.email);
console.log('=' .repeat(60));

/**
 * Étape 1: Nettoyer les données de test
 */
async function cleanupTestData() {
  console.log('\n🧹 Nettoyage des données de test...');
  
  try {
    // Supprimer l'utilisateur de test s'il existe
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const testUser = users?.users?.find(u => u.email === TEST_DATA.email);
    
    if (testUser) {
      console.log('🗑️ Suppression utilisateur existant:', testUser.id);
      
      // Supprimer les enregistrements liés
      await supabaseAdmin.from('employees').delete().eq('user_id', testUser.id);
      await supabaseAdmin.from('user_roles').delete().eq('user_id', testUser.id);
      await supabaseAdmin.from('profiles').delete().eq('user_id', testUser.id);
      
      // Supprimer l'utilisateur
      await supabaseAdmin.auth.admin.deleteUser(testUser.id);
      console.log('✅ Utilisateur supprimé');
    }
    
    // Supprimer les invitations de test
    const { data: invitations } = await supabaseAdmin
      .from('invitations')
      .delete()
      .eq('email', TEST_DATA.email)
      .select();
    
    if (invitations?.length > 0) {
      console.log('✅ Invitations supprimées:', invitations.length);
    }
    
    console.log('✅ Nettoyage terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  }
}

/**
 * Étape 2: Créer une invitation via l'Edge Function
 */
async function createInvitation() {
  console.log('\n📨 Création de l\'invitation via Edge Function...');
  
  try {
    // D'abord, se connecter en tant que super admin
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: 'awalehnasri@gmail.com', // Votre compte super admin
      password: 'Awaleh123!' // Remplacez par votre mot de passe
    });
    
    if (authError) {
      throw new Error(`Erreur connexion super admin: ${authError.message}`);
    }
    
    console.log('✅ Connecté en tant que super admin');
    
    // Appeler l'Edge Function send-invitation
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-invitation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: TEST_DATA.email,
        fullName: TEST_DATA.fullName,
        invitationType: 'tenant_owner',
        siteUrl: TEST_DATA.siteUrl
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${result.error || 'Erreur inconnue'}`);
    }
    
    console.log('✅ Invitation créée avec succès');
    console.log('📊 Résultat:', JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ Erreur création invitation:', error.message);
    throw error;
  }
}

/**
 * Étape 3: Vérifier l'invitation créée
 */
async function verifyInvitation() {
  console.log('\n🔍 Vérification de l\'invitation créée...');
  
  try {
    // Récupérer l'invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('email', TEST_DATA.email)
      .eq('invitation_type', 'tenant_owner')
      .single();
    
    if (invitationError) {
      throw new Error(`Invitation non trouvée: ${invitationError.message}`);
    }
    
    console.log('✅ Invitation trouvée:', {
      id: invitation.id,
      email: invitation.email,
      full_name: invitation.full_name,
      tenant_id: invitation.tenant_id,
      status: invitation.status,
      token: invitation.token ? 'Présent' : 'Absent',
      expires_at: invitation.expires_at
    });
    
    // Vérifier l'utilisateur Supabase Auth
    const supabaseUserId = invitation.metadata?.supabase_user_id;
    if (supabaseUserId) {
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
      
      if (userError) {
        console.log('⚠️ Utilisateur Supabase non trouvé:', userError.message);
      } else {
        console.log('✅ Utilisateur Supabase:', {
          id: user.user.id,
          email: user.user.email,
          email_confirmed_at: user.user.email_confirmed_at,
          created_at: user.user.created_at
        });
      }
    }
    
    return invitation;
    
  } catch (error) {
    console.error('❌ Erreur vérification invitation:', error.message);
    throw error;
  }
}

/**
 * Étape 4: Simuler le clic sur le lien d'invitation
 */
async function simulateInvitationClick(invitation) {
  console.log('\n🖱️ Simulation du clic sur le lien d\'invitation...');
  
  try {
    const confirmationUrl = invitation.metadata?.confirmation_url;
    if (!confirmationUrl) {
      throw new Error('URL de confirmation non trouvée dans l\'invitation');
    }
    
    console.log('🔗 URL de confirmation:', confirmationUrl);
    
    // Extraire le token de l'URL
    const url = new URL(confirmationUrl);
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type');
    
    if (!token) {
      throw new Error('Token non trouvé dans l\'URL de confirmation');
    }
    
    console.log('🎫 Token extrait:', token.substring(0, 20) + '...');
    console.log('📝 Type:', type);
    
    // Simuler la vérification du token
    const { data: verifyData, error: verifyError } = await supabaseClient.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    });
    
    if (verifyError) {
      console.log('❌ Erreur vérification token:', verifyError.message);
      // Essayer avec une approche différente
      console.log('🔄 Tentative avec getSession...');
      
      // Créer un client temporaire avec le token
      const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      await tempClient.auth.setSession({
        access_token: token,
        refresh_token: ''
      });
      
      const { data: sessionData } = await tempClient.auth.getSession();
      console.log('📋 Session:', sessionData.session ? 'Trouvée' : 'Non trouvée');
      
    } else {
      console.log('✅ Token vérifié avec succès');
      console.log('👤 Utilisateur:', verifyData.user?.email);
      console.log('📋 Session:', verifyData.session ? 'Créée' : 'Non créée');
    }
    
    return { token, type, verifyData };
    
  } catch (error) {
    console.error('❌ Erreur simulation clic:', error.message);
    throw error;
  }
}

/**
 * Étape 5: Vérifier le déclenchement de l'Edge Function
 */
async function checkEdgeFunctionTrigger() {
  console.log('\n🔧 Vérification du déclenchement de l\'Edge Function...');
  
  try {
    // Attendre un peu pour que les triggers se déclenchent
    console.log('⏳ Attente de 3 secondes...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Vérifier si un profil a été créé
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', TEST_DATA.email)
      .single();
    
    if (profileError) {
      console.log('❌ Aucun profil créé:', profileError.message);
      return false;
    } else {
      console.log('✅ Profil créé automatiquement:', {
        user_id: profile.user_id,
        tenant_id: profile.tenant_id,
        full_name: profile.full_name,
        role: profile.role
      });
      return true;
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification Edge Function:', error.message);
    return false;
  }
}

/**
 * Fonction principale de test
 */
async function runInvitationTest() {
  try {
    console.log('🎯 TEST COMPLET DU FLUX D\'INVITATION');
    
    // Étape 1: Nettoyage
    await cleanupTestData();
    
    // Étape 2: Création invitation
    const invitationResult = await createInvitation();
    
    // Étape 3: Vérification invitation
    const invitation = await verifyInvitation();
    
    // Étape 4: Simulation clic
    const clickResult = await simulateInvitationClick(invitation);
    
    // Étape 5: Vérification Edge Function
    const edgeFunctionTriggered = await checkEdgeFunctionTrigger();
    
    console.log('\n🎉 TEST TERMINÉ !');
    console.log('=' .repeat(60));
    console.log('📊 RÉSUMÉ:');
    console.log(`📧 Email: ${TEST_DATA.email}`);
    console.log(`📨 Invitation: ✅ Créée`);
    console.log(`🎫 Token: ✅ ${clickResult.token ? 'Généré' : 'Manquant'}`);
    console.log(`🔧 Edge Function: ${edgeFunctionTriggered ? '✅ Déclenchée' : '❌ Non déclenchée'}`);
    
    return {
      success: true,
      invitation,
      clickResult,
      edgeFunctionTriggered
    };
    
  } catch (error) {
    console.error('\n💥 ÉCHEC DU TEST:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Exécuter le test
if (import.meta.main) {
  runInvitationTest().then(result => {
    if (result.success) {
      console.log('\n✅ Test réussi !');
      process.exit(0);
    } else {
      console.log('\n❌ Test échoué.');
      process.exit(1);
    }
  });
}

export { runInvitationTest };
