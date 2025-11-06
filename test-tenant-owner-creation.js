/**
 * Test complet de la procédure de création d'un tenant-owner
 * Ce script teste toute la chaîne : invitation → confirmation → configuration automatique
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuration Supabase
const SUPABASE_URL = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Données de test
const TEST_DATA = {
  email: 'test-tenant-owner@example.com',
  fullName: 'Test Tenant Owner',
  companyName: 'Test Company Ltd',
  siteUrl: 'http://localhost:5173'
};

console.log('🚀 Début du test complet de création tenant-owner');
console.log('📧 Email de test:', TEST_DATA.email);

/**
 * Étape 1: Nettoyer les données de test précédentes
 */
async function cleanupTestData() {
  console.log('\n🧹 Nettoyage des données de test...');
  
  try {
    // Supprimer l'utilisateur de test s'il existe
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users?.users?.find(u => u.email === TEST_DATA.email);
    
    if (testUser) {
      console.log('🗑️ Suppression utilisateur existant:', testUser.id);
      
      // Supprimer les enregistrements liés
      await supabase.from('employees').delete().eq('user_id', testUser.id);
      await supabase.from('user_roles').delete().eq('user_id', testUser.id);
      await supabase.from('profiles').delete().eq('user_id', testUser.id);
      
      // Supprimer l'utilisateur
      await supabase.auth.admin.deleteUser(testUser.id);
      console.log('✅ Utilisateur supprimé');
    }
    
    // Supprimer les invitations de test
    const { data: invitations } = await supabase
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
 * Étape 2: Créer une invitation tenant-owner
 */
async function createInvitation() {
  console.log('\n📨 Création de l\'invitation...');
  
  try {
    // Générer un UUID pour le futur tenant
    const tenantId = crypto.randomUUID();
    
    // Créer l'invitation directement en base
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        email: TEST_DATA.email,
        full_name: TEST_DATA.fullName,
        tenant_id: tenantId,
        invitation_type: 'tenant_owner',
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          company_name: TEST_DATA.companyName,
          created_for_test: true
        }
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Invitation créée:', invitation.id);
    console.log('🏢 Tenant ID:', invitation.tenant_id);
    
    return invitation;
    
  } catch (error) {
    console.error('❌ Erreur création invitation:', error.message);
    throw error;
  }
}

/**
 * Étape 3: Créer l'utilisateur et simuler la confirmation d'email
 */
async function createAndConfirmUser() {
  console.log('\n👤 Création de l\'utilisateur...');
  
  try {
    // Générer un mot de passe temporaire (utilisation de randomBytes pour sécurité)
    const tempPassword =
      crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) + 'A1!';
    
    // Créer l'utilisateur
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: TEST_DATA.email,
      password: tempPassword,
      email_confirm: false, // Pas confirmé initialement
      user_metadata: {
        full_name: TEST_DATA.fullName,
        invitation_type: 'tenant_owner'
      }
    });
    
    if (userError) throw userError;
    
    console.log('✅ Utilisateur créé:', userData.user.id);
    console.log('🔑 Mot de passe temporaire:', tempPassword);
    
    // Simuler la confirmation d'email
    console.log('📧 Simulation de la confirmation d\'email...');
    
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      userData.user.id,
      { email_confirm: true }
    );
    
    if (confirmError) throw confirmError;
    
    console.log('✅ Email confirmé');
    
    return { user: userData.user, password: tempPassword };
    
  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error.message);
    throw error;
  }
}

/**
 * Étape 4: Déclencher l'Edge Function handle-email-confirmation
 */
async function triggerEmailConfirmationHandler(user) {
  console.log('\n🔧 Déclenchement de l\'Edge Function...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-confirmation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        type: 'UPDATE',
        table: 'users',
        schema: 'auth',
        record: {
          id: user.id,
          email: user.email,
          email_confirmed_at: new Date().toISOString()
        },
        old_record: {
          id: user.id,
          email: user.email,
          email_confirmed_at: null
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${result.error || 'Erreur inconnue'}`);
    }
    
    console.log('✅ Edge Function exécutée avec succès');
    console.log('📊 Résultat:', JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ Erreur Edge Function:', error.message);
    throw error;
  }
}

/**
 * Étape 5: Vérifier la configuration complète
 */
async function verifyConfiguration(user, expectedTenantId) {
  console.log('\n🔍 Vérification de la configuration...');
  
  try {
    // Vérifier le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) throw new Error(`Profil non trouvé: ${profileError.message}`);
    
    console.log('✅ Profil créé:', {
      user_id: profile.user_id,
      tenant_id: profile.tenant_id,
      full_name: profile.full_name,
      role: profile.role
    });
    
    // Vérifier le tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', profile.tenant_id)
      .single();
    
    if (tenantError) throw new Error(`Tenant non trouvé: ${tenantError.message}`);
    
    console.log('✅ Tenant créé:', {
      id: tenant.id,
      name: tenant.name,
      status: tenant.status
    });
    
    // Vérifier le rôle
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles (name)
      `)
      .eq('user_id', user.id)
      .eq('tenant_id', profile.tenant_id)
      .single();
    
    if (roleError) throw new Error(`Rôle non trouvé: ${roleError.message}`);
    
    console.log('✅ Rôle attribué:', {
      role_name: userRole.roles.name,
      tenant_id: userRole.tenant_id,
      is_active: userRole.is_active
    });
    
    // Vérifier l'employé
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', user.id)
      .eq('tenant_id', profile.tenant_id)
      .single();
    
    if (employeeError) throw new Error(`Employé non trouvé: ${employeeError.message}`);
    
    console.log('✅ Employé créé:', {
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      job_title: employee.job_title,
      status: employee.status
    });
    
    // Vérifier l'invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', user.email)
      .eq('invitation_type', 'tenant_owner')
      .single();
    
    if (invitationError) throw new Error(`Invitation non trouvée: ${invitationError.message}`);
    
    console.log('✅ Invitation mise à jour:', {
      status: invitation.status,
      accepted_at: invitation.accepted_at,
      employee_id: invitation.metadata?.employee_id
    });
    
    return {
      profile,
      tenant,
      userRole,
      employee,
      invitation
    };
    
  } catch (error) {
    console.error('❌ Erreur vérification:', error.message);
    throw error;
  }
}

/**
 * Étape 6: Tester la connexion
 */
async function testLogin(user, password) {
  console.log('\n🔐 Test de connexion...');
  
  try {
    // Créer un client Supabase pour l'utilisateur
    const userSupabase = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.lqGJqVYvYNjJJUJzOgYEgJKFLjGCmJJZJHUhHjvhOdE');
    
    // Tenter la connexion
    const { data: authData, error: authError } = await userSupabase.auth.signInWithPassword({
      email: user.email,
      password: password
    });
    
    if (authError) throw authError;
    
    console.log('✅ Connexion réussie');
    console.log('👤 Utilisateur connecté:', authData.user.email);
    
    // Vérifier les claims/rôles
    const { data: session } = await userSupabase.auth.getSession();
    if (session?.session?.access_token) {
      console.log('🎫 Token d\'accès obtenu');
      
      // Décoder le JWT pour voir les claims (optionnel)
      const tokenParts = session.session.access_token.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🏷️ Claims utilisateur:', {
            role: payload.role,
            tenant_id: payload.tenant_id,
            employee_id: payload.employee_id
          });
        } catch (e) {
          console.log('⚠️ Impossible de décoder le token');
        }
      }
    }
    
    return authData;
    
  } catch (error) {
    console.error('❌ Erreur connexion:', error.message);
    throw error;
  }
}

/**
 * Fonction principale de test
 */
async function runCompleteTest() {
  try {
    console.log('🎯 TEST COMPLET DE CRÉATION TENANT-OWNER');
    console.log('=' .repeat(50));
    
    // Étape 1: Nettoyage
    await cleanupTestData();
    
    // Étape 2: Création invitation
    const invitation = await createInvitation();
    
    // Étape 3: Création et confirmation utilisateur
    const { user, password } = await createAndConfirmUser();
    
    // Attendre un peu pour que les triggers se déclenchent
    console.log('⏳ Attente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Étape 4: Déclencher l'Edge Function
    const edgeFunctionResult = await triggerEmailConfirmationHandler(user);
    
    // Étape 5: Vérification
    const config = await verifyConfiguration(user, invitation.tenant_id);
    
    // Étape 6: Test de connexion
    const authData = await testLogin(user, password);
    
    console.log('\n🎉 TEST COMPLET RÉUSSI !');
    console.log('=' .repeat(50));
    console.log('📊 RÉSUMÉ:');
    console.log(`👤 Utilisateur: ${user.email} (${user.id})`);
    console.log(`🏢 Tenant: ${config.tenant.name} (${config.tenant.id})`);
    console.log(`👨‍💼 Employé: ${config.employee.employee_id}`);
    console.log(`🎭 Rôle: ${config.userRole.roles.name}`);
    console.log(`🔐 Connexion: ✅ Réussie`);
    
    return {
      success: true,
      user,
      tenant: config.tenant,
      employee: config.employee,
      invitation: config.invitation
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
  runCompleteTest().then(result => {
    if (result.success) {
      console.log('\n✅ Tous les tests sont passés avec succès !');
      process.exit(0);
    } else {
      console.log('\n❌ Des tests ont échoué.');
      process.exit(1);
    }
  });
}

export { runCompleteTest };
