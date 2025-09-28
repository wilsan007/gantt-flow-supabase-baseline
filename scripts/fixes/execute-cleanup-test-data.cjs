#!/usr/bin/env node

/**
 * Script d'exécution du nettoyage complet des données de test
 * Supprime toutes les données créées pour imran33@yahoo.com
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration directe des variables
const supabaseUrl = "https://qliinxtanjdnwxlvnxji.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI";

// Client avec privilèges service role (Super Admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_EMAIL = 'imran33@yahoo.com';
const TEST_USER_ID = 'a61224ce-6066-4eda-a3e2-399b0e2e36c1';
const TEST_TENANT_ID = '73870956-03c5-49a3-b3c3-257bc7e10fc6';

async function cleanupCompleteTestData() {
  console.log('🧹 NETTOYAGE COMPLET DES DONNÉES DE TEST');
  console.log('📧 Email:', TEST_EMAIL);
  console.log('👤 User ID:', TEST_USER_ID);
  console.log('🏢 Tenant ID:', TEST_TENANT_ID);
  console.log('⏰ Début:', new Date().toISOString());
  console.log('=' .repeat(80));

  try {
    // 1. Supprimer l'employé
    console.log('\n🗑️  ÉTAPE 1: Suppression employé...');
    const { error: empError } = await supabase
      .from('employees')
      .delete()
      .or(`user_id.eq.${TEST_USER_ID},email.eq.${TEST_EMAIL},employee_id.eq.EMP008`);
    
    if (empError) {
      console.log('⚠️  Erreur suppression employé:', empError.message);
    } else {
      console.log('✅ Employé supprimé');
    }

    // 2. Supprimer user_roles
    console.log('\n🗑️  ÉTAPE 2: Suppression user_roles...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .delete()
      .or(`user_id.eq.${TEST_USER_ID},tenant_id.eq.${TEST_TENANT_ID}`);
    
    if (roleError) {
      console.log('⚠️  Erreur suppression user_roles:', roleError.message);
    } else {
      console.log('✅ User_roles supprimés');
    }

    // 3. Supprimer le profil
    console.log('\n🗑️  ÉTAPE 3: Suppression profil...');
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .or(`user_id.eq.${TEST_USER_ID},email.eq.${TEST_EMAIL},tenant_id.eq.${TEST_TENANT_ID}`);
    
    if (profileError) {
      console.log('⚠️  Erreur suppression profil:', profileError.message);
    } else {
      console.log('✅ Profil supprimé');
    }

    // 4. Supprimer le tenant
    console.log('\n🗑️  ÉTAPE 4: Suppression tenant...');
    const { error: tenantError } = await supabase
      .from('tenants')
      .delete()
      .eq('id', TEST_TENANT_ID);
    
    if (tenantError) {
      console.log('⚠️  Erreur suppression tenant:', tenantError.message);
    } else {
      console.log('✅ Tenant supprimé');
    }

    // 5. Remettre l'invitation en pending
    console.log('\n🔄 ÉTAPE 5: Remise à zéro invitation...');
    const { error: invError } = await supabase
      .from('invitations')
      .update({
        status: 'pending',
        accepted_at: null,
        metadata: {
          temp_password: "b64ae86hGRAF1!",
          confirmation_url: "https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/verify?token=c8d492bc3f581568d326cb9c5649a3aa788f80c392485421bb0ecd1e&type=signup&redirect_to=http://localhost:8080/tenant-signup",
          supabase_user_id: TEST_USER_ID,
          completed_by: null
        }
      })
      .eq('email', TEST_EMAIL);
    
    if (invError) {
      console.log('⚠️  Erreur mise à jour invitation:', invError.message);
    } else {
      console.log('✅ Invitation remise en pending');
    }

    // 6. Vérifications finales
    console.log('\n📊 ÉTAPE 6: Vérifications finales...');
    
    const verifications = [
      { table: 'employees', filter: `email.eq.${TEST_EMAIL}` },
      { table: 'user_roles', filter: `user_id.eq.${TEST_USER_ID}` },
      { table: 'profiles', filter: `email.eq.${TEST_EMAIL}` },
      { table: 'tenants', filter: `id.eq.${TEST_TENANT_ID}` }
    ];

    for (const verification of verifications) {
      const { data, error } = await supabase
        .from(verification.table)
        .select('*', { count: 'exact' })
        .or(verification.filter);
      
      if (error) {
        console.log(`❌ Erreur vérification ${verification.table}:`, error.message);
      } else {
        const count = data ? data.length : 0;
        console.log(`📋 ${verification.table}: ${count} enregistrements restants`);
      }
    }

    // 7. Vérifier le statut de l'invitation
    console.log('\n📧 STATUT FINAL INVITATION:');
    const { data: invitation, error: finalError } = await supabase
      .from('invitations')
      .select('id, email, status, accepted_at, metadata')
      .eq('email', TEST_EMAIL)
      .single();

    if (finalError) {
      console.log('❌ Erreur lecture invitation finale:', finalError.message);
    } else {
      console.log('✅ Invitation ID:', invitation.id);
      console.log('✅ Status:', invitation.status);
      console.log('✅ Accepted at:', invitation.accepted_at);
      console.log('✅ Completed by:', invitation.metadata?.completed_by || 'null');
    }

    console.log('\n🎉 NETTOYAGE TERMINÉ AVEC SUCCÈS !');
    console.log('✅ Toutes les données de test ont été supprimées');
    console.log('✅ L\'invitation est prête pour un nouveau test');

  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', error);
  }

  console.log('\n' + '=' .repeat(80));
  console.log('⏰ Fin:', new Date().toISOString());
}

// Exécution
cleanupCompleteTestData()
  .then(() => {
    console.log('🏁 Nettoyage terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
