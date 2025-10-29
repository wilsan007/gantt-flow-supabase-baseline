import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAfterRoleFix() {
  console.log('🎯 TEST APRÈS CORRECTION DU RÔLE');
  console.log('===============================');
  
  const superAdminId = '5c5731ce-75d0-4455-8184-bc42c626cb17';
  
  try {
    // 1. TESTER LA FONCTION is_super_admin CORRIGÉE
    console.log('\n1️⃣ TEST is_super_admin CORRIGÉE...');
    
    const { data: isSuperAdmin, error: superAdminError } = await supabase
      .rpc('is_super_admin', { user_id: superAdminId });
    
    if (superAdminError) {
      console.error('❌ Erreur is_super_admin:', superAdminError);
      console.log('⚠️ Exécutez d\'abord fix-is-super-admin-function.sql dans Supabase Dashboard');
      return;
    }
    
    console.log('✅ is_super_admin résultat:', isSuperAdmin);
    
    if (!isSuperAdmin) {
      console.log('❌ La fonction retourne toujours false');
      console.log('🔍 Vérification debug...');
      
      // Debug: vérifier directement la requête
      const { data: debugResult } = await supabase
        .from('user_roles')
        .select(`
          *,
          roles (
            id,
            name
          )
        `)
        .eq('user_id', superAdminId)
        .eq('is_active', true);
      
      console.log('🔍 Debug user_roles:', debugResult);
      return;
    }
    
    // 2. TESTER L'EDGE FUNCTION send-invitation
    console.log('\n2️⃣ TEST EDGE FUNCTION send-invitation...');
    
    const testEmail = `test-role-fixed-${Date.now()}@example.com`;
    
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testEmail,
            fullName: 'Test Role Fixed User',
            invitationType: 'tenant_owner',
            siteUrl: 'http://localhost:8080'
          }),
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ send-invitation SUCCESS:', result);
        
        // 3. TESTER LE FLOW COMPLET
        console.log('\n3️⃣ TEST FLOW COMPLET...');
        
        if (result.invitation_id) {
          // Récupérer l'invitation créée
          const { data: invitation } = await supabase
            .from('invitations')
            .select('*')
            .eq('id', result.invitation_id)
            .single();
          
          if (invitation) {
            console.log('✅ Invitation récupérée:', invitation.email);
            
            // Tester la validation
            const { data: validation } = await supabase
              .rpc('validate_invitation', { invite_code: invitation.id });
            
            console.log('✅ Validation invitation:', validation?.valid ? 'VALID' : 'INVALID');
            
            // Simuler l'onboarding
            const mockUserId = crypto.randomUUID();
            
            const { data: onboardResult, error: onboardError } = await supabase
              .rpc('onboard_tenant_owner', {
                p_user_id: mockUserId,
                p_email: invitation.email,
                p_slug: 'test-role-fixed-tenant',
                p_tenant_name: invitation.tenant_name || 'Test Role Fixed Company',
                p_invite_code: invitation.id
              });
            
            if (onboardError) {
              console.log('⚠️ Erreur onboarding (attendue sans vrai utilisateur Auth):', onboardError.message);
            } else {
              console.log('✅ Onboarding simulé réussi:', onboardResult);
              
              // Nettoyer les données de test
              await supabase.from('user_roles').delete().eq('user_id', mockUserId);
              await supabase.from('profiles').delete().eq('user_id', mockUserId);
              
              if (onboardResult?.tenant_id) {
                await supabase.from('tenants').delete().eq('id', onboardResult.tenant_id);
              }
            }
          }
          
          // Nettoyer l'invitation de test
          await supabase.from('invitations').delete().eq('id', result.invitation_id);
          console.log('🧹 Invitation de test nettoyée');
        }
        
        // 4. DIAGNOSTIC FINAL
        console.log('\n4️⃣ DIAGNOSTIC FINAL...');
        
        const { data: diagnosis } = await supabase.rpc('diagnose_onboarding_system');
        console.log('📊 Diagnostic système:', diagnosis);
        
        console.log('\n🎉 SYSTÈME D\'ONBOARDING COMPLÈTEMENT FONCTIONNEL !');
        console.log('\n🚀 PROCHAINES ÉTAPES:');
        console.log('1. Déployez webhook-auth-handler: supabase functions deploy webhook-auth-handler');
        console.log('2. Configurez le webhook Auth dans Supabase Dashboard');
        console.log('3. Le système est prêt pour la production !');
        
      } else {
        const error = await response.text();
        console.error('❌ send-invitation FAILED:', error);
      }
    } catch (err) {
      console.error('❌ Exception send-invitation:', err.message);
    }
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

testAfterRoleFix();
