#!/usr/bin/env node

/**
 * Script pour nettoyer les données de l'utilisateur de test
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, serviceKey);

async function cleanupTestUser() {
  console.log('🧹 NETTOYAGE UTILISATEUR DE TEST');
  console.log('=' .repeat(40));

  const testEmail = 'test0071@yahoo.com';

  try {
    // 1. Trouver l'utilisateur
    console.log('\n🔍 1. Recherche utilisateur...');
    
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users.users.find(u => u.email === testEmail);
    
    if (!testUser) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:', testUser.id);

    // 2. Trouver l'invitation pour récupérer le tenant_id
    console.log('\n📧 2. Recherche invitation...');
    
    const { data: invitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (invitation) {
      console.log('✅ Invitation trouvée, tenant_id:', invitation.tenant_id);
    } else {
      console.log('⚠️ Invitation non trouvée');
    }

    // 3. Supprimer dans l'ordre (contraintes de clés étrangères)
    console.log('\n🗑️ 3. Suppression des données...');
    
    // Supprimer employé
    const { error: empError } = await supabase
      .from('employees')
      .delete()
      .eq('user_id', testUser.id);
    
    if (empError) {
      console.log('⚠️ Erreur suppression employé:', empError.message);
    } else {
      console.log('✅ Employé supprimé');
    }

    // Supprimer user_roles
    const { error: roleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', testUser.id);
    
    if (roleError) {
      console.log('⚠️ Erreur suppression rôles:', roleError.message);
    } else {
      console.log('✅ Rôles utilisateur supprimés');
    }

    // Supprimer profil
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', testUser.id);
    
    if (profileError) {
      console.log('⚠️ Erreur suppression profil:', profileError.message);
    } else {
      console.log('✅ Profil supprimé');
    }

    // Supprimer tenant si trouvé
    if (invitation?.tenant_id) {
      const { error: tenantError } = await supabase
        .from('tenants')
        .delete()
        .eq('id', invitation.tenant_id);
      
      if (tenantError) {
        console.log('⚠️ Erreur suppression tenant:', tenantError.message);
      } else {
        console.log('✅ Tenant supprimé');
      }
    }

    // Remettre l'invitation en pending
    if (invitation) {
      const { error: inviteError } = await supabase
        .from('invitations')
        .update({ 
          status: 'pending',
          accepted_at: null,
          metadata: invitation.metadata ? { ...invitation.metadata, completed_by: null } : null
        })
        .eq('id', invitation.id);
      
      if (inviteError) {
        console.log('⚠️ Erreur reset invitation:', inviteError.message);
      } else {
        console.log('✅ Invitation remise en pending');
      }
    }

    // Remettre l'email comme non confirmé
    const { error: emailError } = await supabase.auth.admin.updateUserById(
      testUser.id,
      { email_confirm: false }
    );
    
    if (emailError) {
      console.log('⚠️ Erreur reset email:', emailError.message);
    } else {
      console.log('✅ Email remis comme non confirmé');
    }

    console.log('\n🎉 NETTOYAGE TERMINÉ');
    console.log('L\'utilisateur est prêt pour un nouveau test');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

cleanupTestUser();
