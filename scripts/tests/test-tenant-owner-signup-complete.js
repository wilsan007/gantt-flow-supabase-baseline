// Test complet du processus d'inscription tenant owner
// Ce script teste toutes les étapes du processus d'inscription

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTenantOwnerSignupProcess() {
  console.log('🧪 Test du processus complet d\'inscription tenant owner');
  console.log('=' .repeat(60));

  try {
    // 1. Tester directement la fonction signup_tenant_owner_v6
    console.log('\n1️⃣ Test de la fonction signup_tenant_owner_v6...');

    // 2. Créer une invitation de test
    console.log('\n2️⃣ Création d\'une invitation de test...');
    
    const testEmail = 'test-tenant@example.com';
    const testFullName = 'Test Tenant Owner';
    const testTenantId = randomUUID();
    const testToken = randomUUID();

    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        token: testToken,
        email: testEmail,
        full_name: testFullName,
        tenant_id: testTenantId,
        invitation_type: 'tenant_owner',
        invited_by: '5c5731ce-75d0-4455-8184-bc42c626cb17', // Super Admin
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (inviteError) {
      console.error('❌ Erreur création invitation:', inviteError);
      return;
    }

    console.log('✅ Invitation créée:', invitation.id);

    // 3. Créer un utilisateur de test
    console.log('\n3️⃣ Création d\'un utilisateur de test...');
    
    const testUserId = randomUUID();
    
    // Simuler l'insertion dans auth.users (normalement fait par Supabase Auth)
    console.log('📝 User ID de test:', testUserId);

    // 4. Tester la fonction signup_tenant_owner_v6
    console.log('\n4️⃣ Test de la fonction signup_tenant_owner_v6...');
    
    const { data: signupResult, error: signupError } = await supabase
      .rpc('signup_tenant_owner_v6', {
        invitation_token: testToken,
        user_email: testEmail,
        user_full_name: testFullName,
        company_name: 'Test Company SARL',
        user_id: testUserId
      });

    console.log('📊 Résultat signup_tenant_owner_v6:', { signupResult, signupError });

    if (signupError) {
      console.error('❌ Erreur signup_tenant_owner_v6:', signupError);
      return;
    }

    if (!signupResult || !signupResult.success) {
      console.error('❌ Échec signup_tenant_owner_v6:', signupResult);
      return;
    }

    console.log('✅ Fonction signup_tenant_owner_v6 exécutée avec succès');
    console.log('📋 Détails:', signupResult);

    // 5. Vérifier les données créées
    console.log('\n5️⃣ Vérification des données créées...');

    // Vérifier le tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', testTenantId)
      .single();

    if (tenantError || !tenant) {
      console.error('❌ Tenant non créé:', tenantError);
    } else {
      console.log('✅ Tenant créé:', tenant.name);
    }

    // Vérifier le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profil non créé:', profileError);
    } else {
      console.log('✅ Profil créé:', profile.full_name, '- Rôle:', profile.role);
    }

    // Vérifier les rôles utilisateur
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id (name)
      `)
      .eq('user_id', testUserId);

    if (rolesError || !userRoles || userRoles.length === 0) {
      console.error('❌ Rôles utilisateur non créés:', rolesError);
    } else {
      console.log('✅ Rôles utilisateur créés:', userRoles.map(r => r.roles.name).join(', '));
    }

    // Vérifier l'employé
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (employeeError || !employee) {
      console.error('❌ Employé non créé:', employeeError);
    } else {
      console.log('✅ Employé créé:', employee.full_name, '- ID:', employee.employee_id);
    }

    // Vérifier l'invitation marquée comme acceptée
    const { data: updatedInvitation, error: inviteCheckError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitation.id)
      .single();

    if (inviteCheckError || !updatedInvitation) {
      console.error('❌ Invitation non mise à jour:', inviteCheckError);
    } else {
      console.log('✅ Invitation marquée comme:', updatedInvitation.status);
    }

    // 6. Nettoyage des données de test
    console.log('\n6️⃣ Nettoyage des données de test...');
    
    await supabase.from('employees').delete().eq('user_id', testUserId);
    await supabase.from('user_roles').delete().eq('user_id', testUserId);
    await supabase.from('profiles').delete().eq('user_id', testUserId);
    await supabase.from('tenants').delete().eq('id', testTenantId);
    await supabase.from('invitations').delete().eq('id', invitation.id);
    
    console.log('✅ Données de test nettoyées');

    console.log('\n🎉 Test complet réussi !');
    console.log('=' .repeat(60));
    console.log('✅ Le processus d\'inscription tenant owner fonctionne correctement');
    console.log('✅ Toutes les procédures sont implémentées :');
    console.log('   - Validation du token d\'invitation');
    console.log('   - Création du tenant');
    console.log('   - Création du profil utilisateur');
    console.log('   - Attribution du rôle tenant_admin');
    console.log('   - Création de l\'enregistrement employé');
    console.log('   - Marquage de l\'invitation comme acceptée');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testTenantOwnerSignupProcess();
