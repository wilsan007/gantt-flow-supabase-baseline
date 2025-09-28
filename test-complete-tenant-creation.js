#!/usr/bin/env node

/**
 * Test script pour la fonction complète de création de tenant avec permissions
 * Teste: tenants, profiles, roles, permissions, role_permissions, user_roles, employees, invitations
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Lire le fichier .env manuellement
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Client avec privilèges service role (Super Admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_EMAIL = 'imran44@yahoo.com';

async function testCompleteTenantCreation() {
  console.log('🧪 TEST: Création complète tenant avec permissions');
  console.log('📧 Email de test:', TEST_EMAIL);
  console.log('⏰ Début:', new Date().toISOString());
  console.log('=' .repeat(80));

  try {
    // 1. Nettoyer les données de test existantes
    console.log('\n🧹 ÉTAPE 1: Nettoyage données existantes...');
    
    const cleanupQueries = [
      `DELETE FROM public.employees WHERE email = '${TEST_EMAIL}'`,
      `DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = '${TEST_EMAIL}')`,
      `DELETE FROM public.profiles WHERE email = '${TEST_EMAIL}'`,
      `DELETE FROM public.tenants WHERE id IN (SELECT tenant_id FROM public.invitations WHERE email = '${TEST_EMAIL}')`,
      `UPDATE public.invitations SET status = 'pending' WHERE email = '${TEST_EMAIL}'`
    ];

    for (const query of cleanupQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`⚠️  Nettoyage (ignoré): ${error.message}`);
      }
    }
    console.log('✅ Nettoyage terminé');

    // 2. Vérifier l'invitation existante
    console.log('\n🔍 ÉTAPE 2: Vérification invitation...');
    
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', TEST_EMAIL)
      .eq('invitation_type', 'tenant_owner');

    if (invError) {
      console.error('❌ Erreur lecture invitations:', invError);
      return;
    }

    if (!invitations || invitations.length === 0) {
      console.log('⚠️  Aucune invitation trouvée, création...');
      
      const { data: newInvitation, error: createError } = await supabase
        .from('invitations')
        .insert({
          email: TEST_EMAIL,
          invitation_type: 'tenant_owner',
          status: 'pending',
          full_name: 'Imran Test Complete',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            company_name: 'Test Company Complete Permissions'
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur création invitation:', createError);
        return;
      }
      console.log('✅ Invitation créée:', newInvitation.id);
    } else {
      console.log('✅ Invitation existante:', invitations[0].id);
    }

    // 3. Vérifier l'utilisateur auth
    console.log('\n👤 ÉTAPE 3: Vérification utilisateur auth...');
    
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('❌ Erreur lecture utilisateurs:', userError);
      return;
    }

    const testUser = users.users.find(u => u.email === TEST_EMAIL);
    if (!testUser) {
      console.log('⚠️  Utilisateur non trouvé, création...');
      
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: 'TempPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Imran Test Complete'
        }
      });

      if (createUserError) {
        console.error('❌ Erreur création utilisateur:', createUserError);
        return;
      }
      console.log('✅ Utilisateur créé:', newUser.user.id);
    } else {
      console.log('✅ Utilisateur existant:', testUser.id);
    }

    // 4. Exécuter la fonction complète de création
    console.log('\n🚀 ÉTAPE 4: Exécution fonction complète...');
    
    const { data: result, error: execError } = await supabase
      .rpc('debug_tenant_creation', { user_email: TEST_EMAIL });

    if (execError) {
      console.error('❌ Erreur exécution fonction:', execError);
      return;
    }

    console.log('\n📊 RÉSULTAT FONCTION:');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    if (result.error) {
      console.log('Erreur:', result.error);
    }
    
    if (result.debug_log) {
      console.log('\n📝 DEBUG LOG:');
      console.log(result.debug_log);
    }

    // 5. Vérifications détaillées post-création
    if (result.success) {
      console.log('\n✅ ÉTAPE 5: Vérifications post-création...');
      
      // Vérifier tenant
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', result.tenant_id)
        .single();
      console.log('🏢 Tenant:', tenant ? '✅ Créé' : '❌ Manquant');

      // Vérifier profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', result.user_id)
        .single();
      console.log('👤 Profile:', profile ? `✅ Créé (${profile.role})` : '❌ Manquant');

      // Vérifier rôle tenant_admin
      const { data: role } = await supabase
        .from('roles')
        .select('*')
        .eq('id', result.role_id)
        .single();
      console.log('🎭 Rôle:', role ? `✅ ${role.name}` : '❌ Manquant');

      // Vérifier user_roles
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('*, roles(name)')
        .eq('user_id', result.user_id)
        .eq('role_id', result.role_id)
        .single();
      console.log('🔗 User_roles:', userRole ? `✅ ${userRole.roles.name}` : '❌ Manquant');

      // Vérifier permissions du rôle
      const { data: rolePermissions } = await supabase
        .from('role_permissions')
        .select('*, permissions(name)')
        .eq('role_id', result.role_id);
      console.log('🔐 Role_permissions:', rolePermissions ? `✅ ${rolePermissions.length} permissions` : '❌ Manquant');

      if (rolePermissions && rolePermissions.length > 0) {
        console.log('   Permissions assignées:');
        rolePermissions.forEach(rp => {
          console.log(`   - ${rp.permissions.name}`);
        });
      }

      // Vérifier employé
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', result.user_id)
        .single();
      console.log('👨‍💼 Employee:', employee ? `✅ ${employee.employee_id} (${employee.job_title})` : '❌ Manquant');

      // Vérifier invitation mise à jour
      const { data: updatedInvitation } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', TEST_EMAIL)
        .single();
      console.log('💌 Invitation:', updatedInvitation ? `✅ Status: ${updatedInvitation.status}` : '❌ Manquant');

      // Résumé final
      console.log('\n🎉 RÉSUMÉ FINAL:');
      console.log(`✅ Tenant ID: ${result.tenant_id}`);
      console.log(`✅ User ID: ${result.user_id}`);
      console.log(`✅ Role ID: ${result.role_id}`);
      console.log(`✅ Employee ID: ${result.employee_id}`);
      console.log(`✅ Employee Record ID: ${result.employee_record_id}`);
      console.log(`✅ Permissions: ${rolePermissions ? rolePermissions.length : 0} assignées`);
    }

  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', error);
  }

  console.log('\n' + '=' .repeat(80));
  console.log('⏰ Fin:', new Date().toISOString());
}

// Exécution
testCompleteTenantCreation()
  .then(() => {
    console.log('🏁 Test terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
