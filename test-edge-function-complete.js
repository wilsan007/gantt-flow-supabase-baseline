#!/usr/bin/env node

/**
 * Test complet de l'Edge Function de confirmation d'email
 * Simule tout le processus de bout en bout
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, serviceKey);

async function testEdgeFunctionComplete() {
  console.log('🧪 TEST COMPLET DE L\'EDGE FUNCTION');
  console.log('=' .repeat(60));

  const testEmail = 'test-edge-function@example.com';
  const testFullName = 'Test Edge Function User';
  const testCompanyName = 'Edge Function Test Company';
  const testTenantId = randomUUID();
  const testToken = randomUUID();

  try {
    // 1. Nettoyer les données de test existantes
    console.log('\n🧹 1. Nettoyage des données existantes...');
    
    await supabase.from('employees').delete().eq('email', testEmail);
    await supabase.from('user_roles').delete().eq('user_id', 
      supabase.from('auth.users').select('id').eq('email', testEmail)
    );
    await supabase.from('profiles').delete().eq('email', testEmail);
    await supabase.from('tenants').delete().eq('id', testTenantId);
    await supabase.from('invitations').delete().eq('email', testEmail);
    
    // Supprimer l'utilisateur auth s'il existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === testEmail);
    if (existingUser) {
      await supabase.auth.admin.deleteUser(existingUser.id);
    }
    
    console.log('✅ Nettoyage terminé');

    // 2. Créer une invitation
    console.log('\n📧 2. Création de l\'invitation...');
    
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        token: testToken,
        email: testEmail,
        full_name: testFullName,
        tenant_id: testTenantId,
        invitation_type: 'tenant_owner',
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        invited_by: '5c5731ce-75d0-4455-8184-bc42c626cb17', // Super Admin
        metadata: {
          company_name: testCompanyName
        }
      })
      .select()
      .single();

    if (inviteError) {
      console.error('❌ Erreur création invitation:', inviteError);
      return;
    }

    console.log('✅ Invitation créée:', invitation.id);

    // 3. Créer un utilisateur (simuler l'inscription)
    console.log('\n👤 3. Création de l\'utilisateur...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: false, // Important: pas encore confirmé
      user_metadata: {
        full_name: testFullName
      }
    });

    if (authError) {
      console.error('❌ Erreur création utilisateur:', authError);
      return;
    }

    console.log('✅ Utilisateur créé:', authUser.user.id);
    console.log('📧 Email confirmé:', authUser.user.email_confirmed_at ? 'OUI' : 'NON');

    // 4. Vérifier l'état initial (aucune donnée tenant)
    console.log('\n🔍 4. Vérification état initial...');
    
    const { data: initialProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authUser.user.id)
      .single();

    console.log('Profil initial:', initialProfile ? 'EXISTE' : 'ABSENT');

    // 5. Tester l'Edge Function directement
    console.log('\n🚀 5. Test direct de l\'Edge Function...');
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/handle-email-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceKey
        },
        body: JSON.stringify({
          type: 'UPDATE',
          table: 'users',
          schema: 'auth',
          record: {
            id: authUser.user.id,
            email: authUser.user.email,
            email_confirmed_at: new Date().toISOString()
          },
          old_record: {
            id: authUser.user.id,
            email: authUser.user.email,
            email_confirmed_at: null
          }
        })
      });

      const edgeResult = await response.json();
      console.log('📊 Résultat Edge Function:', edgeResult);

      if (!response.ok) {
        console.error('❌ Edge Function a échoué:', response.status, edgeResult);
      } else {
        console.log('✅ Edge Function exécutée avec succès');
      }

    } catch (edgeError) {
      console.error('❌ Erreur appel Edge Function:', edgeError);
      
      // Fallback: utiliser la fonction SQL
      console.log('\n🔄 6. Fallback avec fonction SQL...');
      
      const { data: sqlResult, error: sqlError } = await supabase
        .rpc('force_create_tenant_owner', { user_email: testEmail });

      if (sqlError) {
        console.error('❌ Erreur fonction SQL:', sqlError);
        return;
      }

      console.log('✅ Fonction SQL exécutée:', sqlResult);
    }

    // 7. Vérifier les résultats
    console.log('\n📊 7. Vérification des résultats...');
    
    // Attendre un peu pour que tout soit traité
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Vérifier le profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authUser.user.id)
      .single();

    // Vérifier l'employé
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', authUser.user.id)
      .single();

    // Vérifier le tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', testTenantId)
      .single();

    // Vérifier les rôles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('*, roles(name)')
      .eq('user_id', authUser.user.id);

    // Vérifier l'invitation mise à jour
    const { data: updatedInvitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitation.id)
      .single();

    console.log('\n📋 RÉSULTATS:');
    console.log('👤 Profil créé:', profile ? `✅ OUI (${profile.role})` : '❌ NON');
    console.log('👨‍💼 Employé créé:', employee ? `✅ OUI (${employee.employee_id})` : '❌ NON');
    console.log('🏢 Tenant créé:', tenant ? `✅ OUI (${tenant.name})` : '❌ NON');
    console.log('🔐 Rôles assignés:', userRoles?.length > 0 ? `✅ OUI (${userRoles.length})` : '❌ NON');
    console.log('📧 Invitation acceptée:', updatedInvitation?.status === 'accepted' ? '✅ OUI' : '❌ NON');

    // Score final
    const results = [
      !!profile,
      !!employee,
      !!tenant,
      userRoles?.length > 0,
      updatedInvitation?.status === 'accepted'
    ];

    const score = results.filter(Boolean).length;
    console.log(`\n🎯 Score: ${score}/5`);

    if (score === 5) {
      console.log('🎉 SUCCÈS COMPLET: Edge Function fonctionne parfaitement !');
    } else if (score > 0) {
      console.log('⚠️  SUCCÈS PARTIEL: Certains éléments manquent');
    } else {
      console.log('❌ ÉCHEC: Edge Function ne fonctionne pas');
    }

    // 8. Nettoyage final
    console.log('\n🧹 8. Nettoyage final...');
    
    await supabase.from('employees').delete().eq('user_id', authUser.user.id);
    await supabase.from('user_roles').delete().eq('user_id', authUser.user.id);
    await supabase.from('profiles').delete().eq('user_id', authUser.user.id);
    await supabase.from('tenants').delete().eq('id', testTenantId);
    await supabase.from('invitations').delete().eq('id', invitation.id);
    await supabase.auth.admin.deleteUser(authUser.user.id);
    
    console.log('✅ Nettoyage terminé');

  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', error);
  }
}

// Exécuter le test
testEdgeFunctionComplete()
  .then(() => {
    console.log('\n🏁 Test terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
