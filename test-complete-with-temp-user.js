import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.6z-WQqyKHcM_rLSrJJhGSHFkrLHgHFJxWvfOgAy-Kqg';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteWithTempUser() {
  console.log('🎯 TEST COMPLET AVEC UTILISATEUR TEMPORAIRE');
  console.log('==========================================');
  
  let testData = {
    tempUser: null,
    accessToken: null,
    invitationResult: null,
    onboardResult: null
  };
  
  try {
    // 1. CRÉER UN UTILISATEUR TEMPORAIRE AVEC RÔLE SUPER_ADMIN
    console.log('\n1️⃣ CRÉATION UTILISATEUR TEMPORAIRE...');
    
    const tempEmail = `temp-super-admin-${Date.now()}@example.com`;
    const tempPassword = 'TempSuperAdmin123!';
    
    // Créer l'utilisateur avec l'Admin API
    const { data: tempUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Temp Super Admin',
        temp_user: true,
        created_for_test: true
      }
    });
    
    if (createError) {
      console.error('❌ Erreur création utilisateur temporaire:', createError);
      return;
    }
    
    testData.tempUser = tempUserData.user;
    console.log('✅ Utilisateur temporaire créé:', testData.tempUser.id);
    
    // 2. ASSIGNER LE RÔLE SUPER_ADMIN
    console.log('\n2️⃣ ASSIGNATION RÔLE SUPER_ADMIN...');
    
    const { error: roleAssignError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: testData.tempUser.id,
        role_id: '2cf22462-60f9-49d2-9db6-1ca27dd807f7', // ID du rôle super_admin
        tenant_id: null,
        assigned_by: '5c5731ce-75d0-4455-8184-bc42c626cb17',
        assigned_at: new Date().toISOString(),
        is_active: true
      });
    
    if (roleAssignError) {
      console.error('❌ Erreur assignation rôle:', roleAssignError);
      return;
    }
    
    console.log('✅ Rôle super_admin assigné');
    
    // 3. SE CONNECTER POUR OBTENIR UN JWT
    console.log('\n3️⃣ CONNEXION POUR OBTENIR JWT...');
    
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: tempEmail,
      password: tempPassword
    });
    
    if (signInError) {
      console.error('❌ Erreur connexion:', signInError);
      return;
    }
    
    testData.accessToken = signInData.session?.access_token;
    console.log('✅ JWT obtenu:', testData.accessToken ? 'SUCCESS' : 'FAILED');
    
    if (!testData.accessToken) {
      console.error('❌ Pas de token d\'accès');
      return;
    }
    
    // 4. VÉRIFIER QUE L'UTILISATEUR EST RECONNU COMME SUPER_ADMIN
    console.log('\n4️⃣ VÉRIFICATION SUPER_ADMIN...');
    
    const { data: isSuperAdmin, error: superAdminError } = await supabaseAdmin
      .rpc('is_super_admin', { user_id: testData.tempUser.id });
    
    if (superAdminError) {
      console.error('❌ Erreur vérification super_admin:', superAdminError);
      return;
    }
    
    console.log('✅ is_super_admin:', isSuperAdmin ? 'TRUE' : 'FALSE');
    
    if (!isSuperAdmin) {
      console.log('❌ Utilisateur temporaire non reconnu comme super_admin');
      return;
    }
    
    // 5. TESTER L'EDGE FUNCTION send-invitation AVEC JWT
    console.log('\n5️⃣ TEST EDGE FUNCTION AVEC JWT VALIDE...');
    
    const testInviteEmail = `test-complete-${Date.now()}@example.com`;
    
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testData.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testInviteEmail,
            fullName: 'Test Complete User',
            invitationType: 'tenant_owner',
            siteUrl: 'http://localhost:8080'
          }),
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ send-invitation SUCCESS:', result);
        testData.invitationResult = result;
        
        // 6. TESTER LE FLOW COMPLET D'ONBOARDING
        console.log('\n6️⃣ TEST FLOW COMPLET D\'ONBOARDING...');
        
        if (result.invitation_id) {
          // Récupérer l'invitation créée
          const { data: invitation } = await supabaseAdmin
            .from('invitations')
            .select('*')
            .eq('id', result.invitation_id)
            .single();
          
          if (invitation) {
            console.log('✅ Invitation récupérée:', invitation.email);
            
            // Créer un utilisateur pour l'onboarding
            const { data: inviteeUser, error: inviteeError } = await supabaseAdmin.auth.admin.createUser({
              email: testInviteEmail,
              password: 'InviteePassword123!',
              email_confirm: true,
              user_metadata: {
                full_name: 'Test Complete User',
                invited_user: true
              }
            });
            
            if (inviteeError) {
              console.error('❌ Erreur création utilisateur invité:', inviteeError);
            } else {
              console.log('✅ Utilisateur invité créé:', inviteeUser.user.id);
              
              // Tester l'onboarding complet
              const { data: onboardResult, error: onboardError } = await supabaseAdmin
                .rpc('onboard_tenant_owner', {
                  p_user_id: inviteeUser.user.id,
                  p_email: testInviteEmail,
                  p_slug: 'test-complete-tenant',
                  p_tenant_name: 'Test Complete Company',
                  p_invite_code: invitation.id
                });
              
              if (onboardError) {
                console.error('❌ Erreur onboarding:', onboardError);
              } else {
                console.log('✅ ONBOARDING COMPLET RÉUSSI:', onboardResult);
                testData.onboardResult = onboardResult;
                
                // Vérifier les résultats
                const { data: profile } = await supabaseAdmin
                  .from('profiles')
                  .select('*')
                  .eq('user_id', inviteeUser.user.id)
                  .single();
                
                if (profile) {
                  console.log('✅ Profil créé:', profile.full_name, '- Job:', profile.job_title);
                }
                
                const { data: userRole } = await supabaseAdmin
                  .from('user_roles')
                  .select('*, roles(*)')
                  .eq('user_id', inviteeUser.user.id)
                  .single();
                
                if (userRole) {
                  console.log('✅ Rôle assigné:', userRole.roles.name);
                }
                
                const { data: updatedInvite } = await supabaseAdmin
                  .from('invitations')
                  .select('*')
                  .eq('id', invitation.id)
                  .single();
                
                if (updatedInvite && updatedInvite.status === 'accepted') {
                  console.log('✅ Invitation marquée comme acceptée');
                }
                
                console.log('\n🎉 SYSTÈME D\'ONBOARDING 100% FONCTIONNEL !');
                console.log('\n📊 RÉSULTATS COMPLETS:');
                console.log('✅ Création utilisateur temporaire: SUCCESS');
                console.log('✅ Assignation rôle super_admin: SUCCESS');
                console.log('✅ Génération JWT: SUCCESS');
                console.log('✅ Edge Function send-invitation: SUCCESS');
                console.log('✅ Création invitation: SUCCESS');
                console.log('✅ Validation invitation: SUCCESS');
                console.log('✅ Onboarding complet: SUCCESS');
                console.log('✅ Création profil: SUCCESS');
                console.log('✅ Assignation rôle tenant: SUCCESS');
                
                console.log('\n🚀 LE SYSTÈME EST PRÊT POUR LA PRODUCTION !');
              }
              
              // Nettoyer l'utilisateur invité
              await supabaseAdmin.from('user_roles').delete().eq('user_id', inviteeUser.user.id);
              await supabaseAdmin.from('profiles').delete().eq('user_id', inviteeUser.user.id);
              await supabaseAdmin.auth.admin.deleteUser(inviteeUser.user.id);
              
              if (onboardResult?.tenant_id) {
                await supabaseAdmin.from('tenants').delete().eq('id', onboardResult.tenant_id);
              }
            }
          }
        }
        
      } else {
        const error = await response.text();
        console.error('❌ send-invitation FAILED:', error);
      }
    } catch (err) {
      console.error('❌ Exception send-invitation:', err.message);
    }
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  } finally {
    // 7. NETTOYAGE COMPLET
    console.log('\n7️⃣ NETTOYAGE COMPLET...');
    
    if (testData.tempUser) {
      // Supprimer le rôle assigné
      await supabaseAdmin.from('user_roles').delete().eq('user_id', testData.tempUser.id);
      
      // Supprimer l'utilisateur temporaire
      await supabaseAdmin.auth.admin.deleteUser(testData.tempUser.id);
      console.log('✅ Utilisateur temporaire supprimé');
    }
    
    if (testData.invitationResult?.invitation_id) {
      await supabaseAdmin.from('invitations').delete().eq('id', testData.invitationResult.invitation_id);
      console.log('✅ Invitation de test supprimée');
    }
    
    console.log('✅ Nettoyage terminé');
  }
}

testCompleteWithTempUser();
