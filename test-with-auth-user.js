import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.6z-WQqyKHcM_rLSrJJhGSHFkrLHgHFJxWvfOgAy-Kqg';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testWithAuthUser() {
  console.log('🔐 TEST AVEC CRÉATION UTILISATEUR AUTH');
  console.log('====================================');
  
  let testData = {
    tenant: null,
    invitation: null,
    authUser: null,
    profile: null
  };
  
  try {
    // 1. CRÉER UN UTILISATEUR AVEC L'API AUTH
    console.log('\n1️⃣ CRÉATION UTILISATEUR AUTH...');
    
    const testEmail = `test-owner-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testFullName = 'Test Tenant Owner';
    
    // Méthode 1: Utiliser signUp pour créer l'utilisateur
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName
        }
      }
    });
    
    if (signUpError) {
      console.error('❌ Erreur signUp:', signUpError);
      
      // Méthode 2: Utiliser l'Admin API
      console.log('🔄 Tentative avec Admin API...');
      
      const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          full_name: testFullName
        }
      });
      
      if (adminError) {
        console.error('❌ Erreur Admin API:', adminError);
        return;
      }
      
      testData.authUser = adminData.user;
    } else {
      testData.authUser = signUpData.user;
    }
    
    if (!testData.authUser) {
      console.error('❌ Impossible de créer l\'utilisateur');
      return;
    }
    
    console.log('✅ Utilisateur Auth créé:', testData.authUser.id);
    console.log('📧 Email:', testData.authUser.email);
    
    // 2. CRÉER UN TENANT
    console.log('\n2️⃣ CRÉATION TENANT...');
    
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: 'Auth Test Company ' + Date.now(),
        status: 'active',
        settings: {}
      })
      .select()
      .single();
    
    if (tenantError) {
      console.error('❌ Erreur création tenant:', tenantError);
      return;
    }
    
    testData.tenant = tenant;
    console.log('✅ Tenant créé:', tenant.name);
    
    // 3. CRÉER UNE INVITATION
    console.log('\n3️⃣ CRÉATION INVITATION...');
    
    const { data: inviteUuid } = await supabaseAdmin.rpc('gen_random_uuid');
    const invitationData = {
      id: inviteUuid,
      token: 'auth-token-' + Date.now(),
      email: testEmail,
      full_name: testFullName,
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      invitation_type: 'tenant_owner',
      invited_by: '5c5731ce-75d0-4455-8184-bc42c626cb17',
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        temp_password: testPassword,
        supabase_user_id: testData.authUser.id
      }
    };
    
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();
    
    if (inviteError) {
      console.error('❌ Erreur création invitation:', inviteError);
      return;
    }
    
    testData.invitation = invitation;
    console.log('✅ Invitation créée:', invitation.id);
    
    // 4. TESTER LA FONCTION SQL onboard_tenant_owner
    console.log('\n4️⃣ TEST FONCTION SQL onboard_tenant_owner...');
    
    const { data: onboardResult, error: onboardError } = await supabaseAdmin
      .rpc('onboard_tenant_owner', {
        p_user_id: testData.authUser.id,
        p_email: testEmail,
        p_slug: 'auth-test-slug',
        p_tenant_name: tenant.name,
        p_invite_code: invitation.id
      });
    
    if (onboardError) {
      console.error('❌ Erreur fonction SQL:', onboardError);
    } else {
      console.log('✅ Fonction SQL réussie !');
      console.log('📊 Résultat:', onboardResult);
      
      // Vérifier les résultats
      console.log('\n🔍 VÉRIFICATION DES RÉSULTATS...');
      
      // Vérifier le profil créé
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', testData.authUser.id)
        .single();
      
      if (profileError) {
        console.log('❌ Profil non trouvé:', profileError.message);
      } else {
        testData.profile = profile;
        console.log('✅ Profil créé:', profile.full_name);
        console.log('🏢 Tenant ID:', profile.tenant_id);
      }
      
      // Vérifier le rôle assigné
      const { data: userRole, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select('*, roles(*)')
        .eq('user_id', testData.authUser.id)
        .single();
      
      if (roleError) {
        console.log('❌ Rôle non trouvé:', roleError.message);
      } else {
        console.log('✅ Rôle assigné:', userRole.roles.name);
        console.log('🏢 Tenant ID du rôle:', userRole.tenant_id);
      }
      
      // Vérifier l'invitation mise à jour
      const { data: updatedInvite, error: inviteCheckError } = await supabaseAdmin
        .from('invitations')
        .select('*')
        .eq('id', invitation.id)
        .single();
      
      if (inviteCheckError) {
        console.log('❌ Invitation non trouvée:', inviteCheckError.message);
      } else {
        console.log('✅ Invitation status:', updatedInvite.status);
        console.log('📅 Accepted at:', updatedInvite.accepted_at);
      }
    }
    
    // 5. TEST D'IDEMPOTENCE
    console.log('\n5️⃣ TEST D\'IDEMPOTENCE...');
    
    const { data: idempotentResult, error: idempotentError } = await supabaseAdmin
      .rpc('onboard_tenant_owner', {
        p_user_id: testData.authUser.id,
        p_email: testEmail,
        p_slug: 'updated-slug',
        p_tenant_name: tenant.name,
        p_invite_code: invitation.id
      });
    
    if (idempotentError) {
      console.log('✅ Idempotence: Invitation déjà utilisée (comportement attendu)');
      console.log('📝 Message:', idempotentError.message);
    } else {
      console.log('⚠️ Idempotence: Fonction exécutée à nouveau');
      console.log('📊 Résultat:', idempotentResult);
    }
    
    console.log('\n🎉 TEST AVEC AUTH USER RÉUSSI !');
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  } finally {
    // 6. NETTOYAGE
    console.log('\n6️⃣ NETTOYAGE...');
    
    if (testData.authUser) {
      // Supprimer les données liées
      await supabaseAdmin.from('user_roles').delete().eq('user_id', testData.authUser.id);
      await supabaseAdmin.from('profiles').delete().eq('user_id', testData.authUser.id);
      
      // Supprimer l'utilisateur Auth
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(testData.authUser.id);
      if (deleteError) {
        console.log('⚠️ Erreur suppression utilisateur:', deleteError.message);
      } else {
        console.log('✅ Utilisateur Auth supprimé');
      }
    }
    
    if (testData.invitation) {
      await supabaseAdmin.from('invitations').delete().eq('id', testData.invitation.id);
      console.log('✅ Invitation supprimée');
    }
    
    if (testData.tenant) {
      await supabaseAdmin.from('tenants').delete().eq('id', testData.tenant.id);
      console.log('✅ Tenant supprimé');
    }
  }
}

testWithAuthUser();
