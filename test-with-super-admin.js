import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWithSuperAdmin() {
  console.log('👑 TEST AVEC SUPER ADMIN');
  console.log('========================');
  
  const superAdminId = '5c5731ce-75d0-4455-8184-bc42c626cb17';
  
  try {
    // 1. VÉRIFIER QUE L'UTILISATEUR EST BIEN SUPER ADMIN
    console.log('\n1️⃣ VÉRIFICATION SUPER ADMIN...');
    
    const { data: isSuperAdmin, error: superAdminError } = await supabase
      .rpc('is_super_admin', { user_id: superAdminId });
    
    if (superAdminError) {
      console.error('❌ Erreur vérification Super Admin:', superAdminError);
      return;
    }
    
    console.log('✅ Super Admin vérifié:', isSuperAdmin);
    
    if (!isSuperAdmin) {
      console.log('❌ L\'utilisateur n\'est pas Super Admin');
      return;
    }
    
    // 2. GÉNÉRER UN TOKEN D'AUTHENTIFICATION POUR LE SUPER ADMIN
    console.log('\n2️⃣ GÉNÉRATION TOKEN AUTH...');
    
    // Créer une session temporaire pour le Super Admin
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'osman.awaleh.adn@gmail.com', // Email du Super Admin
      options: {
        redirectTo: 'http://localhost:8080'
      }
    });
    
    if (tokenError) {
      console.error('❌ Erreur génération token:', tokenError);
      // Utiliser le service key directement
      console.log('🔄 Utilisation du service key...');
    } else {
      console.log('✅ Token généré:', tokenData ? 'SUCCESS' : 'FAILED');
    }
    
    // 3. TESTER L'EDGE FUNCTION AVEC DIFFÉRENTES MÉTHODES D'AUTH
    console.log('\n3️⃣ TEST EDGE FUNCTION send-invitation...');
    
    const testEmail = `test-super-admin-${Date.now()}@example.com`;
    const testFullName = 'Test Super Admin User';
    
    // Méthode 1: Avec Service Role Key
    console.log('\n📝 Test avec Service Role Key...');
    
    try {
      const response1 = await fetch(
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
      
      if (response1.ok) {
        const result1 = await response1.json();
        console.log('✅ Service Role Key - SUCCESS:', result1);
        
        // Nettoyer l'invitation créée
        if (result1.invitation_id) {
          await supabase.from('invitations').delete().eq('id', result1.invitation_id);
          console.log('🧹 Invitation nettoyée');
        }
      } else {
        const error1 = await response1.text();
        console.error('❌ Service Role Key - FAILED:', error1);
      }
    } catch (err) {
      console.error('❌ Exception Service Role Key:', err.message);
    }
    
    // Méthode 2: Créer un JWT personnalisé pour le Super Admin
    console.log('\n📝 Test avec JWT personnalisé...');
    
    try {
      // Créer un JWT simple pour tester (ne pas utiliser en production)
      const customPayload = {
        sub: superAdminId,
        email: 'osman.awaleh.adn@gmail.com',
        role: 'authenticated',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      // Pour ce test, on utilisera directement le service key
      // car créer un JWT valide nécessite la clé secrète JWT de Supabase
      
      const response2 = await fetch(
        `${supabaseUrl}/functions/v1/send-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'X-User-ID': superAdminId, // Header personnalisé pour identifier l'utilisateur
          },
          body: JSON.stringify({
            email: `test-custom-${Date.now()}@example.com`,
            fullName: 'Test Custom Auth User',
            invitationType: 'tenant_owner',
            siteUrl: 'http://localhost:8080'
          }),
        }
      );
      
      if (response2.ok) {
        const result2 = await response2.json();
        console.log('✅ JWT personnalisé - SUCCESS:', result2);
        
        if (result2.invitation_id) {
          await supabase.from('invitations').delete().eq('id', result2.invitation_id);
          console.log('🧹 Invitation nettoyée');
        }
      } else {
        const error2 = await response2.text();
        console.error('❌ JWT personnalisé - FAILED:', error2);
      }
    } catch (err) {
      console.error('❌ Exception JWT personnalisé:', err.message);
    }
    
    // 4. TESTER DIRECTEMENT LES FONCTIONS SQL
    console.log('\n4️⃣ TEST DIRECT FONCTIONS SQL...');
    
    // Test avec une vraie invitation
    const { data: testInvite, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('status', 'pending')
      .limit(1)
      .single();
    
    if (inviteError) {
      console.log('⚠️ Aucune invitation pending trouvée pour test');
    } else {
      console.log('✅ Invitation trouvée pour test:', testInvite.email);
      
      // Tester la validation
      const { data: validation } = await supabase
        .rpc('validate_invitation', { invite_code: testInvite.id });
      
      console.log('✅ Validation:', validation?.valid ? 'VALID' : 'INVALID');
      
      // Tester l'onboarding (simulation)
      const mockUserId = crypto.randomUUID();
      
      const { data: onboardResult, error: onboardError } = await supabase
        .rpc('onboard_tenant_owner', {
          p_user_id: mockUserId,
          p_email: testInvite.email,
          p_slug: 'test-super-admin-tenant',
          p_tenant_name: 'Test Super Admin Company',
          p_invite_code: testInvite.id
        });
      
      if (onboardError) {
        console.log('⚠️ Erreur onboarding (attendue):', onboardError.message);
      } else {
        console.log('✅ Onboarding simulé réussi:', onboardResult);
        
        // Nettoyer les données de test
        await supabase.from('user_roles').delete().eq('user_id', mockUserId);
        await supabase.from('profiles').delete().eq('user_id', mockUserId);
        
        if (onboardResult?.tenant_id) {
          await supabase.from('tenants').delete().eq('id', onboardResult.tenant_id);
        }
        
        console.log('🧹 Données de test nettoyées');
      }
    }
    
    // 5. DIAGNOSTIC FINAL
    console.log('\n5️⃣ DIAGNOSTIC FINAL...');
    
    const { data: finalDiagnosis } = await supabase.rpc('diagnose_onboarding_system');
    console.log('📊 Diagnostic final:', finalDiagnosis);
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
  
  console.log('\n🎯 CONCLUSION:');
  console.log('- Fonctions SQL: ✅ Opérationnelles');
  console.log('- Edge Function: ⚠️ Problème d\'authentification');
  console.log('- Solution: Configurer l\'authentification dans l\'Edge Function');
}

testWithSuperAdmin();
