import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.6z-WQqyKHcM_rLSrJJhGSHFkrLHgHFJxWvfOgAy-Kqg';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteOnboardingSystem() {
  console.log('🎯 TEST COMPLET DU SYSTÈME D\'ONBOARDING');
  console.log('======================================');
  
  const testResults = {
    systemDiagnosis: false,
    sendInvitation: false,
    validateInvitation: false,
    webhookHandler: false,
    onboardingFunction: false,
    cleanup: false
  };
  
  let testData = {
    invitation: null,
    user: null,
    tenant: null
  };
  
  try {
    // 1. DIAGNOSTIC DU SYSTÈME
    console.log('\n1️⃣ DIAGNOSTIC DU SYSTÈME...');
    
    const { data: diagnosis, error: diagError } = await supabaseAdmin
      .rpc('diagnose_onboarding_system');
    
    if (diagError) {
      console.error('❌ Erreur diagnostic:', diagError);
    } else {
      console.log('✅ Diagnostic système:');
      console.log(JSON.stringify(diagnosis, null, 2));
      testResults.systemDiagnosis = true;
    }
    
    // 2. TESTER L'EDGE FUNCTION send-invitation
    console.log('\n2️⃣ TEST EDGE FUNCTION send-invitation...');
    
    const testEmail = `test-complete-${Date.now()}@example.com`;
    const testFullName = 'Test Complete Owner';
    
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
            email: testEmail,
            fullName: testFullName,
            invitationType: 'tenant_owner',
            siteUrl: 'http://localhost:8080'
          }),
        }
      );
      
      if (invitationResponse.ok) {
        const inviteResult = await invitationResponse.json();
        console.log('✅ Invitation envoyée:', inviteResult);
        testResults.sendInvitation = true;
        
        // Récupérer l'invitation créée
        const { data: invitation } = await supabaseAdmin
          .from('invitations')
          .select('*')
          .eq('email', testEmail)
          .eq('status', 'pending')
          .single();
        
        testData.invitation = invitation;
        console.log('📧 Invitation récupérée:', invitation?.id);
      } else {
        const error = await invitationResponse.text();
        console.error('❌ Erreur send-invitation:', error);
      }
    } catch (err) {
      console.error('❌ Exception send-invitation:', err.message);
    }
    
    // 3. TESTER LA VALIDATION D'INVITATION
    console.log('\n3️⃣ TEST VALIDATION INVITATION...');
    
    if (testData.invitation) {
      const { data: validation, error: validError } = await supabaseClient
        .rpc('validate_invitation', { invite_code: testData.invitation.id });
      
      if (validError) {
        console.error('❌ Erreur validation:', validError);
      } else {
        console.log('✅ Validation invitation:', validation);
        testResults.validateInvitation = validation.valid;
      }
    }
    
    // 4. SIMULER LA CRÉATION D'UTILISATEUR ET WEBHOOK
    console.log('\n4️⃣ SIMULATION WEBHOOK AUTH...');
    
    if (testData.invitation) {
      // Simuler un utilisateur créé
      const mockUserId = crypto.randomUUID();
      
      try {
        const webhookResponse = await fetch(
          `${supabaseUrl}/functions/v1/webhook-auth-handler`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'INSERT',
              record: {
                table: 'users',
                id: mockUserId,
                email: testEmail,
                email_confirmed_at: new Date().toISOString()
              }
            }),
          }
        );
        
        if (webhookResponse.ok) {
          const webhookResult = await webhookResponse.json();
          console.log('✅ Webhook traité:', webhookResult);
          testResults.webhookHandler = webhookResult.success;
        } else {
          const error = await webhookResponse.text();
          console.error('❌ Erreur webhook:', error);
        }
      } catch (err) {
        console.error('❌ Exception webhook:', err.message);
      }
    }
    
    // 5. TESTER DIRECTEMENT LA FONCTION ONBOARDING
    console.log('\n5️⃣ TEST DIRECT FONCTION ONBOARDING...');
    
    if (testData.invitation) {
      const directUserId = crypto.randomUUID();
      
      const { data: onboardResult, error: onboardError } = await supabaseAdmin
        .rpc('onboard_tenant_owner', {
          p_user_id: directUserId,
          p_email: testEmail,
          p_slug: 'test-complete-tenant',
          p_tenant_name: 'Test Complete Company',
          p_invite_code: testData.invitation.id
        });
      
      if (onboardError) {
        console.error('❌ Erreur onboarding direct:', onboardError);
      } else {
        console.log('✅ Onboarding direct réussi:', onboardResult);
        testResults.onboardingFunction = onboardResult.success;
        
        // Vérifier les résultats
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('user_id', directUserId)
          .single();
        
        if (profile) {
          console.log('✅ Profil créé:', profile.full_name);
          testData.user = { id: directUserId };
          testData.tenant = { id: profile.tenant_id };
        }
      }
    }
    
    // 6. VÉRIFIER LES MÉTRIQUES
    console.log('\n6️⃣ VÉRIFICATION MÉTRIQUES...');
    
    const { data: metrics } = await supabaseAdmin
      .from('onboarding_metrics')
      .select('*')
      .limit(5);
    
    if (metrics && metrics.length > 0) {
      console.log('📊 Métriques d\'onboarding:');
      metrics.forEach(metric => {
        console.log(`   ${metric.date}: ${metric.successful_onboardings}/${metric.total_invitations} (${metric.success_rate_percent}%)`);
      });
    }
    
    const { data: statusSummary } = await supabaseAdmin
      .from('invitation_status_summary')
      .select('*');
    
    if (statusSummary) {
      console.log('📈 Résumé des statuts:');
      statusSummary.forEach(status => {
        console.log(`   ${status.status}: ${status.count} total, ${status.last_24h} dernières 24h`);
      });
    }
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  } finally {
    // 7. NETTOYAGE
    console.log('\n7️⃣ NETTOYAGE...');
    
    if (testData.user) {
      await supabaseAdmin.from('user_roles').delete().eq('user_id', testData.user.id);
      await supabaseAdmin.from('profiles').delete().eq('user_id', testData.user.id);
      console.log('✅ Profil utilisateur supprimé');
    }
    
    if (testData.invitation) {
      await supabaseAdmin.from('invitations').delete().eq('id', testData.invitation.id);
      console.log('✅ Invitation supprimée');
    }
    
    if (testData.tenant) {
      await supabaseAdmin.from('tenants').delete().eq('id', testData.tenant.id);
      console.log('✅ Tenant supprimé');
    }
    
    testResults.cleanup = true;
  }
  
  // 8. RÉSUMÉ FINAL
  console.log('\n📊 RÉSUMÉ COMPLET DES TESTS');
  console.log('===========================');
  
  const tests = [
    { name: 'Diagnostic système', status: testResults.systemDiagnosis },
    { name: 'Edge Function send-invitation', status: testResults.sendInvitation },
    { name: 'Validation invitation', status: testResults.validateInvitation },
    { name: 'Webhook handler', status: testResults.webhookHandler },
    { name: 'Fonction onboarding', status: testResults.onboardingFunction },
    { name: 'Nettoyage', status: testResults.cleanup }
  ];
  
  tests.forEach(test => {
    console.log(`${test.status ? '✅' : '❌'} ${test.name}`);
  });
  
  const successRate = tests.filter(t => t.status).length / tests.length * 100;
  console.log(`\n🎯 Taux de réussite: ${successRate.toFixed(1)}%`);
  
  if (successRate === 100) {
    console.log('🎉 SYSTÈME D\'ONBOARDING PARFAITEMENT FONCTIONNEL !');
    console.log('\n🚀 PROCHAINES ÉTAPES:');
    console.log('1. Déployez webhook-auth-handler: supabase functions deploy webhook-auth-handler');
    console.log('2. Configurez le webhook Auth dans Supabase Dashboard');
    console.log('3. Testez avec de vrais utilisateurs');
  } else if (successRate >= 80) {
    console.log('✅ Système majoritairement fonctionnel');
    console.log('⚠️ Quelques ajustements nécessaires');
  } else {
    console.log('⚠️ Système nécessite des corrections importantes');
  }
  
  return testResults;
}

// Exécuter le test complet
testCompleteOnboardingSystem().catch(console.error);
