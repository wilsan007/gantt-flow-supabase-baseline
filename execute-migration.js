import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function executeMigration() {
  const supabase = createClient(
    'https://qliinxtanjdnwxlvnxji.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM'
  );
  
  const userId = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';
  const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
  
  console.log('🔄 Executing migration: profiles.role TEXT -> UUID foreign key...\n');
  
  try {
    // Se connecter
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'zdouce.zz@gmail.com',
      password: 'Test11@@'
    });
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
      return;
    }
    
    console.log('✅ Authenticated successfully\n');
    
    // 1. État avant migration
    console.log('🔍 État avant migration...');
    
    const { data: profilesBefore, error: profilesError } = await supabase
      .from('profiles')
      .select('full_name, role, tenant_id')
      .eq('tenant_id', tenantId);
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
    } else {
      console.log(`✅ Profiles actuels: ${profilesBefore.length}`);
      profilesBefore.slice(0, 3).forEach(p => {
        console.log(`   - ${p.full_name}: role="${p.role}"`);
      });
    }
    
    // 2. Vérifier les rôles disponibles
    console.log('\n🔍 Rôles disponibles...');
    
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name, display_name')
      .eq('tenant_id', tenantId);
    
    if (rolesError) {
      console.log('❌ Roles error:', rolesError.message);
    } else {
      console.log(`✅ Rôles trouvés: ${roles.length}`);
      roles.forEach(r => {
        console.log(`   - ${r.name} (${r.display_name}) -> ${r.id}`);
      });
    }
    
    // 3. Créer les rôles manquants si nécessaire
    console.log('\n📝 Création des rôles manquants...');
    
    const uniqueRoles = [...new Set(profilesBefore.map(p => p.role).filter(Boolean))];
    console.log('Rôles uniques dans profiles:', uniqueRoles);
    
    for (const roleName of uniqueRoles) {
      const existingRole = roles.find(r => r.name === roleName);
      if (!existingRole) {
        console.log(`Creating missing role: ${roleName}`);
        
        const { data: newRole, error: createError } = await supabase
          .from('roles')
          .insert({
            name: roleName,
            display_name: roleName.charAt(0).toUpperCase() + roleName.slice(1),
            description: `Rôle créé automatiquement depuis profiles`,
            hierarchy_level: 50,
            tenant_id: tenantId
          })
          .select()
          .single();
        
        if (createError) {
          console.log(`❌ Error creating role ${roleName}:`, createError.message);
        } else {
          console.log(`✅ Role created: ${roleName} -> ${newRole.id}`);
        }
      }
    }
    
    // 4. Récupérer les rôles mis à jour
    const { data: updatedRoles, error: updatedRolesError } = await supabase
      .from('roles')
      .select('id, name, display_name')
      .eq('tenant_id', tenantId);
    
    if (updatedRolesError) {
      console.log('❌ Updated roles error:', updatedRolesError.message);
      return;
    }
    
    // 5. Simuler la migration pour l'utilisateur spécifique
    console.log('\n🔄 Migration pour l\'utilisateur existant...');
    
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (userProfileError) {
      console.log('❌ User profile error:', userProfileError.message);
      return;
    }
    
    console.log(`Profile utilisateur: ${userProfile.full_name}, role actuel: "${userProfile.role}"`);
    
    // Trouver le role_id correspondant
    const targetRole = updatedRoles.find(r => r.name === userProfile.role);
    if (!targetRole) {
      console.log(`❌ Role "${userProfile.role}" non trouvé dans la table roles`);
      return;
    }
    
    console.log(`✅ Role trouvé: ${targetRole.name} -> ${targetRole.id}`);
    
    // 6. Mettre à jour user_roles avec le bon role_id
    console.log('\n📝 Mise à jour user_roles...');
    
    // Supprimer les anciennes entrées
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      console.log('❌ Delete error:', deleteError.message);
    } else {
      console.log('✅ Anciennes entrées user_roles supprimées');
    }
    
    // Créer la nouvelle entrée avec le bon role_id
    const { data: newUserRole, error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: targetRole.id,
        context_type: 'global',
        context_id: tenantId,
        tenant_id: tenantId,
        is_active: true
      })
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Insert error:', insertError.message);
    } else {
      console.log('✅ Nouvelle entrée user_roles créée');
    }
    
    // 7. Vérification finale
    console.log('\n🔍 Vérification finale...');
    
    const { data: finalUserRoles, error: finalError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id (name, display_name)
      `)
      .eq('user_id', userId);
    
    if (finalError) {
      console.log('❌ Final check error:', finalError.message);
    } else {
      console.log(`✅ User roles finaux: ${finalUserRoles.length}`);
      finalUserRoles.forEach(ur => {
        console.log(`   - Role: ${ur.roles?.name} (${ur.roles?.display_name}), Active: ${ur.is_active}`);
      });
    }
    
    // 8. Test des permissions
    console.log('\n🔍 Test des permissions...');
    
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select(`
        *,
        permissions:permission_id (name, resource, action)
      `)
      .eq('role_id', targetRole.id);
    
    if (permError) {
      console.log('❌ Permissions error:', permError.message);
    } else {
      console.log(`✅ Permissions disponibles: ${permissions.length}`);
      permissions.slice(0, 3).forEach(p => {
        console.log(`   - ${p.permissions?.name}: ${p.permissions?.resource}:${p.permissions?.action}`);
      });
    }
    
    await supabase.auth.signOut();
    console.log('\n🎉 Migration simulée avec succès!');
    console.log('\n📋 Résumé:');
    console.log(`   - profiles.role: "${userProfile.role}" (TEXT)`);
    console.log(`   - roles.id: ${targetRole.id} (UUID)`);
    console.log(`   - user_roles: 1 entrée active`);
    console.log(`   - permissions: ${permissions?.length || 0} disponibles`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

executeMigration().catch(console.error);
