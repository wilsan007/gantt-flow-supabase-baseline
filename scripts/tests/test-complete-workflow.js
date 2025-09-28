#!/usr/bin/env node

/**
 * Test complet du workflow Edge Function
 * Simule tout le processus de bout en bout avec un nouvel utilisateur
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, serviceKey);

async function testCompleteWorkflow() {
  console.log('🎯 TEST COMPLET DU WORKFLOW EDGE FUNCTION');
  console.log('=' .repeat(50));

  const testEmail = `test-workflow-${Date.now()}@example.com`;
  const testFullName = 'Test Workflow User';
  const testCompanyName = 'Workflow Test Company SARL';
  const testTenantId = randomUUID();
  const testToken = randomUUID();

  try {
    // 1. Créer une invitation
    console.log('\n📧 1. Création de l\'invitation...');
    
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

    // 2. Créer un utilisateur (simuler l'inscription)
    console.log('\n👤 2. Création de l\'utilisateur...');
    
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

    // 3. Simuler la confirmation d'email via l'Edge Function
    console.log('\n🚀 3. Simulation confirmation email via Edge Function...');
    
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

    if (!response.ok || !edgeResult.success) {
      console.error('❌ Edge Function a échoué');
      return;
    }

    console.log('✅ Edge Function exécutée avec succès');

    // 4. Vérifier tous les résultats
    console.log('\n📊 4. Vérification complète des résultats...');
    
    // Attendre un peu pour que tout soit traité
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Vérifier le tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', testTenantId)
      .single();

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

    // Vérifier l'utilisateur auth mis à jour
    const { data: confirmedUser } = await supabase.auth.admin.getUserById(authUser.user.id);

    console.log('\n📋 RÉSULTATS DÉTAILLÉS:');
    console.log('🏢 Tenant créé:', tenant ? `✅ ${tenant.name}` : '❌ NON');
    console.log('👤 Profil créé:', profile ? `✅ ${profile.full_name} (${profile.role})` : '❌ NON');
    console.log('👨‍💼 Employé créé:', employee ? `✅ ${employee.employee_id} - ${employee.job_title}` : '❌ NON');
    console.log('🔐 Rôles assignés:', userRoles?.length > 0 ? `✅ ${userRoles.map(r => r.roles.name).join(', ')}` : '❌ NON');
    console.log('📧 Invitation acceptée:', updatedInvitation?.status === 'accepted' ? '✅ OUI' : '❌ NON');
    console.log('✉️ Email confirmé:', confirmedUser?.user?.email_confirmed_at ? '✅ OUI' : '❌ NON');

    // Score final
    const results = [
      !!tenant,
      !!profile,
      !!employee,
      userRoles?.length > 0,
      updatedInvitation?.status === 'accepted',
      !!confirmedUser?.user?.email_confirmed_at
    ];

    const score = results.filter(Boolean).length;
    console.log(`\n🎯 Score final: ${score}/6`);

    if (score === 6) {
      console.log('🎉 SUCCÈS COMPLET: Workflow Edge Function parfaitement fonctionnel !');
      console.log('\n📋 Résumé de ce qui a été créé:');
      console.log(`   - Tenant: ${tenant.name} (ID: ${tenant.id})`);
      console.log(`   - Profil: ${profile.full_name} avec rôle ${profile.role}`);
      console.log(`   - Employé: ${employee.employee_id} - ${employee.job_title}`);
      console.log(`   - Rôles: ${userRoles.map(r => r.roles.name).join(', ')}`);
      console.log(`   - Email confirmé: ${confirmedUser.user.email_confirmed_at}`);
      console.log(`   - Invitation acceptée le: ${updatedInvitation.accepted_at}`);
    } else {
      console.log('⚠️ SUCCÈS PARTIEL: Certains éléments manquent');
    }

    // 5. Nettoyage
    console.log('\n🧹 5. Nettoyage des données de test...');
    
    await supabase.from('employees').delete().eq('user_id', authUser.user.id);
    await supabase.from('user_roles').delete().eq('user_id', authUser.user.id);
    await supabase.from('profiles').delete().eq('user_id', authUser.user.id);
    await supabase.from('tenants').delete().eq('id', testTenantId);
    await supabase.from('invitations').delete().eq('id', invitation.id);
    await supabase.auth.admin.deleteUser(authUser.user.id);
    
    console.log('✅ Nettoyage terminé');

    return score === 6;

  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', error);
    return false;
  }
}

// Exécuter le test
testCompleteWorkflow()
  .then((success) => {
    if (success) {
      console.log('\n🏆 WORKFLOW EDGE FUNCTION VALIDÉ !');
      console.log('Le système est prêt pour la production.');
    } else {
      console.log('\n⚠️ WORKFLOW INCOMPLET');
      console.log('Vérifiez les erreurs ci-dessus.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
