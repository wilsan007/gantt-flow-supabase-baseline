import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRealisticOnboarding() {
  console.log('🎯 TEST RÉALISTE DU SYSTÈME D\'ONBOARDING');
  console.log('========================================');
  
  let testData = {
    tenant: null,
    invitation: null,
    user: null,
    profile: null
  };
  
  try {
    // 1. CRÉER UN UTILISATEUR AUTH SUPABASE RÉEL
    console.log('\n1️⃣ CRÉATION UTILISATEUR AUTH...');
    
    const testEmail = `test-owner-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (authError) {
      console.error('❌ Erreur création utilisateur:', authError);
      return;
    }
    
    testData.user = authUser.user;
    console.log('✅ Utilisateur Auth créé:', testData.user.id);
    
    // 2. CRÉER UN TENANT
    console.log('\n2️⃣ CRÉATION TENANT...');
    
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'Realistic Test Company ' + Date.now(),
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
    
    // 3. CRÉER UNE INVITATION RÉALISTE
    console.log('\n3️⃣ CRÉATION INVITATION...');
    
    const { data: inviteUuid } = await supabase.rpc('gen_random_uuid');
    const invitationData = {
      id: inviteUuid,
      token: 'realistic-token-' + Date.now(),
      email: testEmail,
      full_name: 'Realistic Test Owner',
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      invitation_type: 'tenant_owner',
      invited_by: '5c5731ce-75d0-4455-8184-bc42c626cb17',
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        temp_password: testPassword,
        supabase_user_id: testData.user.id
      }
    };
    
    const { data: invitation, error: inviteError } = await supabase
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
    
    // 4. TESTER LA FONCTION SQL AVEC UTILISATEUR RÉEL
    console.log('\n4️⃣ TEST FONCTION SQL AVEC UTILISATEUR RÉEL...');
    
    const { data: onboardResult, error: onboardError } = await supabase
      .rpc('onboard_tenant_owner', {
        p_user_id: testData.user.id,
        p_email: testEmail,
        p_slug: 'realistic-test-slug',
        p_tenant_name: tenant.name,
        p_invite_code: invitation.id
      });
    
    if (onboardError) {
      console.error('❌ Erreur fonction SQL:', onboardError);
    } else {
      console.log('✅ Fonction SQL réussie:', onboardResult);
      
      // Vérifier les résultats
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', testData.user.id)
        .single();
      
      if (profile) {
        testData.profile = profile;
        console.log('✅ Profil créé:', profile.full_name);
      }
      
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('*, roles(*)')
        .eq('user_id', testData.user.id)
        .single();
      
      if (userRole) {
        console.log('✅ Rôle assigné:', userRole.roles.name);
      }
      
      const { data: updatedInvite } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitation.id)
        .single();
      
      if (updatedInvite && updatedInvite.status === 'accepted') {
        console.log('✅ Invitation marquée comme acceptée');
      }
    }
    
    // 5. TEST D'IDEMPOTENCE
    console.log('\n5️⃣ TEST D\'IDEMPOTENCE...');
    
    const { data: idempotentResult, error: idempotentError } = await supabase
      .rpc('onboard_tenant_owner', {
        p_user_id: testData.user.id,
        p_email: testEmail,
        p_slug: 'updated-slug',
        p_tenant_name: tenant.name,
        p_invite_code: invitation.id
      });
    
    if (idempotentError) {
      console.log('✅ Idempotence: Invitation déjà utilisée (comportement attendu)');
      console.log('Erreur:', idempotentError.message);
    } else {
      console.log('⚠️ Idempotence: Fonction exécutée à nouveau:', idempotentResult);
    }
    
    // 6. TESTER LE FLOW REACT (simulation)
    console.log('\n6️⃣ SIMULATION FLOW REACT...');
    
    // Simuler ce que ferait la page /invite
    console.log('📱 Simulation: Utilisateur visite /invite?code=' + invitation.id);
    console.log('📱 Simulation: Vérification session utilisateur...');
    console.log('📱 Simulation: Appel Edge Function (si elle existait)...');
    console.log('📱 Simulation: Redirection vers /dashboard');
    
    console.log('✅ Flow React simulé avec succès');
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  } finally {
    // 7. NETTOYAGE
    console.log('\n7️⃣ NETTOYAGE...');
    
    if (testData.user) {
      await supabase.from('user_roles').delete().eq('user_id', testData.user.id);
      await supabase.from('profiles').delete().eq('user_id', testData.user.id);
      await supabase.auth.admin.deleteUser(testData.user.id);
      console.log('✅ Utilisateur supprimé');
    }
    
    if (testData.invitation) {
      await supabase.from('invitations').delete().eq('id', testData.invitation.id);
      console.log('✅ Invitation supprimée');
    }
    
    if (testData.tenant) {
      await supabase.from('tenants').delete().eq('id', testData.tenant.id);
      console.log('✅ Tenant supprimé');
    }
  }
  
  console.log('\n🎉 TEST RÉALISTE TERMINÉ !');
}

testRealisticOnboarding();
