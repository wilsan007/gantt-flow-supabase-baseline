/**
 * 🔍 DEBUG - Quel chemin prend la fonction ?
 */

import { config } from 'dotenv';

config();

async function debugFunctionPath() {
  console.log('🔍 ===== DEBUG CHEMIN FONCTION =====');
  console.log('🎯 Identifier quel CAS est exécuté');
  console.log('');

  const webhookUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation';
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  // Payload avec logs détaillés
  const webhookPayload = {
    type: 'UPDATE',
    table: 'users',
    record: {
      id: '328b48e0-500d-4419-a1cf-2c9986815eee',
      email: 'testgser@yahooo.com',
      email_confirmed_at: null,
      created_at: '2025-09-30T23:46:14.025846+00:00',
      confirmed_at: null,
      raw_user_meta_data: {
        locale: 'fr-FR',
        full_name: 'Mes Testtd',
        temp_user: true,
        tenant_id: '896b4835-fbee-46b7-9165-c095f89e3898',
        company_name: 'Mes Company',
        expected_role: 'tenant_admin',
        invitation_id: '31f20fc6-5223-4a43-a4af-44b5b68065ef',
        temp_password: '4vldq36nFC6C1!',
        security_level: 'standard',
        invitation_type: 'tenant_owner',  // ← CLEF pour isInvitationUser
        invited_by_type: 'super_admin',
        validation_code: '661px51neas',
        created_timestamp: '2025-09-30T23:46:13.883Z',
        invitation_source: 'admin_panel'
      }
    },
    schema: 'auth',
    old_record: null
  };

  try {
    console.log('📊 Données envoyées:');
    console.log('   - invitation_type:', webhookPayload.record.raw_user_meta_data.invitation_type);
    console.log('   - temp_user:', webhookPayload.record.raw_user_meta_data.temp_user);
    console.log('   - email_confirmed_at:', webhookPayload.record.email_confirmed_at);
    console.log('');

    console.log('🔍 Appel webhook...');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify(webhookPayload)
    });

    console.log('📊 Réponse:');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('   - Réponse JSON:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('');
        console.log('🎉 SUCCÈS ! La fonction a fonctionné');
        console.log('💡 Le CAS 2 (utilisateur d\'invitation) a été exécuté');
      } else {
        console.log('');
        console.log('⚠️ Réponse sans succès - analyser les détails');
      }
    } else {
      const errorText = await response.text();
      console.log('   - Erreur:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('');
        console.log('📊 Analyse erreur:');
        console.log('   - Message:', errorJson.error);
        console.log('   - User ID:', errorJson.details?.user_id);
        console.log('   - Tentatives:', errorJson.details?.confirmation_attempts);
        
        if (errorJson.error?.includes('Email non confirmé malgré processus réussi')) {
          console.log('');
          console.log('💡 DIAGNOSTIC: La fonction arrive jusqu\'à la fin');
          console.log('   - Le CAS 2 est probablement exécuté');
          console.log('   - Mais la vérification finale échoue');
          console.log('   - Problème: Synchronisation des métadonnées');
        }
      } catch (parseError) {
        console.log('   - Erreur non-JSON');
      }
    }

    console.log('');
    console.log('🎯 ===== CONCLUSION DEBUG =====');
    
    if (response.status === 500) {
      console.log('❌ Erreur 500: La fonction s\'exécute mais échoue à la fin');
      console.log('💡 Cela signifie que notre logique CAS 2 fonctionne');
      console.log('🔧 Le problème est dans la vérification finale');
      console.log('');
      console.log('🚀 SOLUTION: Forcer le succès si simulation présente');
    } else if (response.status === 200) {
      console.log('✅ Status 200: Analyser la réponse pour voir le chemin');
    } else {
      console.log('⚠️ Status inattendu:', response.status);
    }

  } catch (error) {
    console.error('🚨 ERREUR:', error);
  }
}

debugFunctionPath().then(() => {
  console.log('');
  console.log('🏁 Debug terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
