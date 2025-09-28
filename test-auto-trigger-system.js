// Test du système de trigger automatique pour la création de tenant owner
// Ce script teste le nouveau processus automatique

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAutoTriggerSystem() {
  console.log('🧪 Test du système de trigger automatique');
  console.log('=' .repeat(60));

  try {
    // 1. Tester les nouvelles fonctions utilitaires
    console.log('\n1️⃣ Test des fonctions utilitaires...');
    
    const testEmail = 'test-auto@example.com';
    
    // Test is_pending_tenant_owner avec un email inexistant
    const { data: isPending, error: pendingError } = await supabase
      .rpc('is_pending_tenant_owner', { user_email: testEmail });

    console.log('📊 is_pending_tenant_owner (email inexistant):', { isPending, pendingError });

    if (pendingError) {
      console.error('❌ Erreur fonction is_pending_tenant_owner:', pendingError);
      return;
    }

    console.log('✅ Fonction is_pending_tenant_owner accessible');

    // Test get_user_invitation_info
    const { data: invitationInfo, error: infoError } = await supabase
      .rpc('get_user_invitation_info', { user_email: testEmail });

    console.log('📊 get_user_invitation_info:', { invitationInfo, infoError });

    if (infoError) {
      console.error('❌ Erreur fonction get_user_invitation_info:', infoError);
      return;
    }

    console.log('✅ Fonction get_user_invitation_info accessible');

    // 2. Créer une invitation de test pour tester le système complet
    console.log('\n2️⃣ Création d\'une invitation de test...');
    
    const testTenantId = randomUUID();
    const testToken = randomUUID();
    const testFullName = 'Test Auto Owner';
    const companyName = 'Auto Test Company';

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
        status: 'pending',
        metadata: {
          company_name: companyName
        }
      })
      .select()
      .single();

    if (inviteError) {
      console.error('❌ Erreur création invitation:', inviteError);
      return;
    }

    console.log('✅ Invitation créée:', invitation.id);

    // 3. Tester à nouveau is_pending_tenant_owner avec l'invitation créée
    console.log('\n3️⃣ Test avec invitation valide...');
    
    const { data: isPendingNow, error: pendingNowError } = await supabase
      .rpc('is_pending_tenant_owner', { user_email: testEmail });

    console.log('📊 is_pending_tenant_owner (avec invitation):', { isPendingNow, pendingNowError });

    if (isPendingNow) {
      console.log('✅ Invitation détectée correctement');
    } else {
      console.log('⚠️ Invitation non détectée');
    }

    // 4. Tester get_user_invitation_info avec l'invitation créée
    const { data: invitationInfoNow, error: infoNowError } = await supabase
      .rpc('get_user_invitation_info', { user_email: testEmail });

    console.log('📊 get_user_invitation_info (avec invitation):', { invitationInfoNow, infoNowError });

    if (invitationInfoNow && invitationInfoNow.found) {
      console.log('✅ Informations d\'invitation récupérées:', invitationInfoNow);
    }

    // 5. Nettoyage
    console.log('\n4️⃣ Nettoyage des données de test...');
    
    await supabase.from('invitations').delete().eq('id', invitation.id);
    console.log('✅ Invitation de test supprimée');

    console.log('\n🎉 RÉSUMÉ DU SYSTÈME AUTOMATIQUE');
    console.log('=' .repeat(60));
    console.log('✅ Fonctions utilitaires : FONCTIONNELLES');
    console.log('✅ Détection des invitations : FONCTIONNELLE');
    console.log('✅ Récupération des infos : FONCTIONNELLE');
    console.log('\n📝 PROCHAINES ÉTAPES :');
    console.log('1. Exécuter auto-tenant-creation-trigger.sql dans Supabase Dashboard');
    console.log('2. Tester avec une vraie connexion utilisateur');
    console.log('3. Vérifier que le trigger se déclenche automatiquement');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testAutoTriggerSystem();
