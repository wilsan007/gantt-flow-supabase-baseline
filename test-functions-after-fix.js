import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFunctionsAfterFix() {
  console.log('🔧 TEST DES FONCTIONS APRÈS CORRECTION');
  console.log('====================================');
  
  const results = {
    diagnosis: false,
    is_super_admin: false,
    validate_invitation: false,
    cleanup_expired: false,
    send_invitation: false
  };
  
  try {
    // 1. Test diagnostic système
    console.log('\n1️⃣ TEST DIAGNOSTIC SYSTÈME...');
    
    const { data: diagnosis, error: diagError } = await supabase
      .rpc('diagnose_onboarding_system');
    
    if (diagError) {
      console.error('❌ Erreur diagnostic:', diagError.message);
    } else {
      console.log('✅ Diagnostic réussi:');
      console.log(JSON.stringify(diagnosis, null, 2));
      results.diagnosis = true;
    }
    
    // 2. Test is_super_admin
    console.log('\n2️⃣ TEST is_super_admin...');
    
    const { data: superAdminResult, error: superAdminError } = await supabase
      .rpc('is_super_admin', { user_id: '5c5731ce-75d0-4455-8184-bc42c626cb17' });
    
    if (superAdminError) {
      console.error('❌ Erreur is_super_admin:', superAdminError.message);
    } else {
      console.log('✅ is_super_admin:', superAdminResult);
      results.is_super_admin = true;
    }
    
    // 3. Test validate_invitation
    console.log('\n3️⃣ TEST validate_invitation...');
    
    const { data: validationResult, error: validationError } = await supabase
      .rpc('validate_invitation', { invite_code: '00000000-0000-0000-0000-000000000000' });
    
    if (validationError) {
      console.error('❌ Erreur validate_invitation:', validationError.message);
    } else {
      console.log('✅ validate_invitation:', validationResult);
      results.validate_invitation = validationResult.valid === false; // Expected result for fake UUID
    }
    
    // 4. Test cleanup_expired_invitations
    console.log('\n4️⃣ TEST cleanup_expired_invitations...');
    
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_expired_invitations');
    
    if (cleanupError) {
      console.error('❌ Erreur cleanup_expired_invitations:', cleanupError.message);
    } else {
      console.log('✅ cleanup_expired_invitations:', cleanupResult, 'invitations expirées nettoyées');
      results.cleanup_expired = true;
    }
    
    // 5. Test Edge Function send-invitation
    console.log('\n5️⃣ TEST EDGE FUNCTION send-invitation...');
    
    try {
      const invitationResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: `test-functions-${Date.now()}@example.com`,
            fullName: 'Test Functions User',
            invitationType: 'tenant_owner',
            siteUrl: 'http://localhost:8080'
          }),
        }
      );
      
      if (invitationResponse.ok) {
        const inviteResult = await invitationResponse.json();
        console.log('✅ send-invitation réussie:', inviteResult.success ? 'SUCCESS' : 'FAILED');
        results.send_invitation = inviteResult.success;
        
        // Nettoyer l'invitation de test
        if (inviteResult.invitation_id) {
          await supabase
            .from('invitations')
            .delete()
            .eq('id', inviteResult.invitation_id);
          console.log('🧹 Invitation de test nettoyée');
        }
      } else {
        const error = await invitationResponse.text();
        console.error('❌ Erreur send-invitation:', error);
      }
    } catch (err) {
      console.error('❌ Exception send-invitation:', err.message);
    }
    
    // 6. Test complet avec vraie invitation
    console.log('\n6️⃣ TEST COMPLET AVEC VRAIE INVITATION...');
    
    const testEmail = `test-complete-${Date.now()}@example.com`;
    
    try {
      // Créer une invitation via l'Edge Function
      const createResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testEmail,
            fullName: 'Test Complete User',
            invitationType: 'tenant_owner',
            siteUrl: 'http://localhost:8080'
          }),
        }
      );
      
      if (createResponse.ok) {
        const createResult = await createResponse.json();
        console.log('✅ Invitation créée:', createResult.invitation_id);
        
        // Récupérer l'invitation
        const { data: invitation } = await supabase
          .from('invitations')
          .select('*')
          .eq('email', testEmail)
          .single();
        
        if (invitation) {
          // Tester la validation
          const { data: validation } = await supabase
            .rpc('validate_invitation', { invite_code: invitation.id });
          
          console.log('✅ Validation invitation:', validation?.valid ? 'VALID' : 'INVALID');
          
          // Tester l'onboarding avec un utilisateur fictif
          const testUserId = crypto.randomUUID();
          
          const { data: onboardResult, error: onboardError } = await supabase
            .rpc('onboard_tenant_owner', {
              p_user_id: testUserId,
              p_email: testEmail,
              p_slug: 'test-tenant-slug',
              p_tenant_name: 'Test Tenant Company',
              p_invite_code: invitation.id
            });
          
          if (onboardError) {
            console.log('⚠️ Erreur onboarding (attendue sans vrai utilisateur Auth):', onboardError.message);
          } else {
            console.log('✅ Onboarding réussi:', onboardResult);
          }
          
          // Nettoyer
          await supabase.from('user_roles').delete().eq('user_id', testUserId);
          await supabase.from('profiles').delete().eq('user_id', testUserId);
          await supabase.from('invitations').delete().eq('id', invitation.id);
          
          if (onboardResult?.tenant_id) {
            await supabase.from('tenants').delete().eq('id', onboardResult.tenant_id);
          }
          
          console.log('🧹 Données de test nettoyées');
        }
      }
    } catch (err) {
      console.error('❌ Erreur test complet:', err.message);
    }
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
  
  // Résumé final
  console.log('\n📊 RÉSUMÉ DES TESTS');
  console.log('==================');
  
  const tests = [
    { name: 'Diagnostic système', status: results.diagnosis },
    { name: 'is_super_admin', status: results.is_super_admin },
    { name: 'validate_invitation', status: results.validate_invitation },
    { name: 'cleanup_expired_invitations', status: results.cleanup_expired },
    { name: 'send-invitation Edge Function', status: results.send_invitation }
  ];
  
  tests.forEach(test => {
    console.log(`${test.status ? '✅' : '❌'} ${test.name}`);
  });
  
  const successRate = tests.filter(t => t.status).length / tests.length * 100;
  console.log(`\n🎯 Taux de réussite: ${successRate.toFixed(1)}%`);
  
  if (successRate === 100) {
    console.log('🎉 TOUTES LES FONCTIONS SONT OPÉRATIONNELLES !');
    console.log('\n🚀 PROCHAINES ÉTAPES:');
    console.log('1. Déployez webhook-auth-handler: supabase functions deploy webhook-auth-handler');
    console.log('2. Configurez le webhook Auth dans Supabase Dashboard');
    console.log('3. Testez le flow complet avec de vrais utilisateurs');
  } else if (successRate >= 80) {
    console.log('✅ Système majoritairement fonctionnel');
  } else {
    console.log('⚠️ Corrections nécessaires - Vérifiez que fix-sql-functions.sql a été exécuté');
  }
}

testFunctionsAfterFix();
