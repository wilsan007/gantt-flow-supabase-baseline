/**
 * 🧪 TEST VERSION MINIMALE - Données Fraîches
 * 
 * Test complet de la version minimale avec validation des 10 éléments
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testMinimalVersion() {
  console.log('🧪 ===== TEST VERSION MINIMALE AVEC DONNÉES FRAÎCHES =====');
  console.log('🎯 Validation complète des 10 éléments + Processus complet');
  console.log('');

  const timestamp = Date.now();
  const testEmail = `test-minimal-${timestamp}@example.com`;
  const testName = `Test Minimal ${timestamp}`;
  const testCompany = `Company ${timestamp}`;
  // Générer un UUID valide pour tenant_id
  const testTenantId = crypto.randomUUID();

  let createdUserId = null;
  let createdInvitationId = null;

  try {
    // ÉTAPE 1: Créer une invitation complète avec métadonnées
    console.log('🔍 ÉTAPE 1: Création invitation avec 10 éléments...');
    
    const invitationData = {
      email: testEmail,
      full_name: testName,
      tenant_id: testTenantId,
      invitation_type: 'tenant_owner',
      invited_by: '5c5731ce-75d0-4455-8184-bc42c626cb17', // ID existant
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
      metadata: {
        validation_elements: {
          full_name: testName,
          temp_user: true,
          tenant_id: testTenantId,
          company_name: testCompany,
          invitation_id: `inv-${timestamp}`,
          temp_password: 'TempPass123!',
          invitation_type: 'tenant_owner',
          invited_by_type: 'super_admin',
          validation_code: `code${timestamp}`,
          created_timestamp: new Date().toISOString()
        },
        config: {
          locale: 'fr-FR',
          timezone: 'Europe/Paris',
          auto_confirm: true
        }
      }
    };

    const { data: invitation, error: invError } = await supabaseAdmin
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (invError) {
      console.error('❌ Erreur création invitation:', invError);
      return;
    }

    createdInvitationId = invitation.id;
    console.log('✅ Invitation créée:');
    console.log('   - ID:', invitation.id);
    console.log('   - Email:', invitation.email);
    console.log('   - 10 éléments présents:', !!invitation.metadata.validation_elements);
    console.log('');

    // ÉTAPE 2: Créer utilisateur avec métadonnées complètes
    console.log('🔍 ÉTAPE 2: Création utilisateur avec métadonnées...');
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: false,
      user_metadata: {
        full_name: testName,
        temp_user: true,
        tenant_id: testTenantId,
        company_name: testCompany,
        invitation_id: `inv-${timestamp}`,
        temp_password: 'TempPass123!',
        invitation_type: 'tenant_owner',
        invited_by_type: 'super_admin',
        validation_code: `code${timestamp}`,
        created_timestamp: new Date().toISOString()
      }
    });

    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError);
      return;
    }

    createdUserId = userData.user.id;
    console.log('✅ Utilisateur créé:');
    console.log('   - ID:', userData.user.id);
    console.log('   - Email confirmé:', userData.user.email_confirmed_at ? 'OUI' : 'NON');
    console.log('   - Métadonnées présentes:', !!userData.user.raw_user_meta_data);
    console.log('');

    // ÉTAPE 3: Tester la version minimale via webhook
    console.log('🔍 ÉTAPE 3: Test webhook version minimale...');
    
    const webhookPayload = {
      type: 'UPDATE',
      table: 'users',
      record: {
        id: userData.user.id,
        email: testEmail,
        email_confirmed_at: null,
        created_at: userData.user.created_at,
        raw_user_meta_data: userData.user.raw_user_meta_data
      },
      schema: 'auth',
      old_record: null
    };

    // Utiliser la version minimale (remplacer par l'URL correcte si déployée)
    const webhookUrl = `${SUPABASE_URL}/functions/v1/handle-email-confirmation`;
    
    const startTime = Date.now();
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify(webhookPayload)
    });
    const endTime = Date.now();

    console.log('📊 Réponse webhook version minimale:');
    console.log('   - Status:', response.status);
    console.log('   - Durée:', endTime - startTime, 'ms');

    if (response.ok) {
      const responseData = await response.json();
      console.log('   - Réponse:', JSON.stringify(responseData, null, 2));
      
      if (responseData.success) {
        console.log('');
        console.log('🎉 SUCCÈS TOTAL !');
        console.log('✅ Version minimale fonctionne parfaitement');
        console.log('📊 Données créées:');
        console.log('   - Tenant ID:', responseData.data.tenant_id);
        console.log('   - Tenant Name:', responseData.data.tenant_name);
        console.log('   - Employee ID:', responseData.data.employee_id);
        console.log('   - Éléments validés:', responseData.data.validated_elements);
        
        // ÉTAPE 4: Vérification des données créées
        console.log('');
        console.log('🔍 ÉTAPE 4: Vérification données créées...');
        
        // Vérifier tenant
        const { data: tenant } = await supabaseAdmin
          .from('tenants')
          .select('*')
          .eq('id', testTenantId)
          .single();
        
        // Vérifier profil
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('user_id', userData.user.id)
          .single();
        
        // Vérifier employé
        const { data: employee } = await supabaseAdmin
          .from('employees')
          .select('*')
          .eq('user_id', userData.user.id)
          .single();
        
        // Vérifier rôle
        const { data: userRole } = await supabaseAdmin
          .from('user_roles')
          .select('*, roles(*)')
          .eq('user_id', userData.user.id)
          .single();
        
        console.log('📊 Vérification complète:');
        console.log('   - Tenant créé:', !!tenant);
        console.log('   - Profil créé:', !!profile);
        console.log('   - Employé créé:', !!employee);
        console.log('   - Rôle assigné:', userRole?.roles?.name || 'AUCUN');
        console.log('   - Invitation acceptée:', responseData.success);
        
        if (tenant && profile && employee && userRole) {
          console.log('');
          console.log('🏆 VALIDATION COMPLÈTE RÉUSSIE !');
          console.log('💡 La version minimale (206 lignes) fonctionne parfaitement');
          console.log('🚀 Prête pour remplacer la version de 1292 lignes');
        }
        
      } else {
        console.log('⚠️ Succès partiel - analyser la réponse');
      }
    } else {
      const errorText = await response.text();
      console.log('   - Erreur:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.missing) {
          console.log('');
          console.log('❌ ÉLÉMENTS MANQUANTS:');
          errorJson.missing.forEach(element => {
            console.log(`   - ${element}`);
          });
          console.log('💡 Vérifier les métadonnées utilisateur et invitation');
        }
      } catch (parseError) {
        console.log('   - Erreur non-JSON');
      }
    }

  } catch (error) {
    console.error('🚨 ERREUR DURANT LE TEST:', error);
  } finally {
    // NETTOYAGE
    console.log('');
    console.log('🧹 NETTOYAGE...');
    
    try {
      if (createdUserId) {
        // Supprimer les données créées
        await supabaseAdmin.from('employees').delete().eq('user_id', createdUserId);
        await supabaseAdmin.from('user_roles').delete().eq('user_id', createdUserId);
        await supabaseAdmin.from('profiles').delete().eq('user_id', createdUserId);
        await supabaseAdmin.from('tenants').delete().eq('id', testTenantId);
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        console.log('✅ Utilisateur et données supprimés');
      }
      
      if (createdInvitationId) {
        await supabaseAdmin.from('invitations').delete().eq('id', createdInvitationId);
        console.log('✅ Invitation supprimée');
      }
    } catch (cleanupError) {
      console.error('⚠️ Erreur nettoyage:', cleanupError.message);
    }
  }
}

testMinimalVersion().then(() => {
  console.log('');
  console.log('🏁 Test version minimale terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
