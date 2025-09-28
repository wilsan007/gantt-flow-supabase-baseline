import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function executeTriggersDirectly() {
  const supabase = createClient(
    'https://qliinxtanjdnwxlvnxji.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM'
  );
  
  const userId = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';
  const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
  
  console.log('🔧 Executing triggers manually for existing user...\n');
  
  try {
    // Se connecter avec l'utilisateur existant
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'zdouce.zz@gmail.com',
      password: 'Test11@@'
    });
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
      return;
    }
    
    console.log('✅ Authenticated successfully\n');
    
    // 1. Vérifier l'état actuel
    console.log('🔍 Current state check...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
      return;
    }
    
    console.log(`✅ Profile found: ${profile.full_name}, Role: ${profile.role}`);
    
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (userRolesError) {
      console.log('❌ User roles error:', userRolesError.message);
    } else {
      console.log(`✅ Current user_roles count: ${userRoles.length}\n`);
    }
    
    // 2. Récupérer le role_id correspondant au rôle 'admin'
    console.log('🔍 Finding role_id for admin role...');
    
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'tenant_admin')
      .eq('tenant_id', tenantId)
      .single();
    
    if (roleError) {
      console.log('❌ Role error:', roleError.message);
      console.log('Trying with "admin" role name...');
      
      const { data: adminRole2, error: roleError2 } = await supabase
        .from('roles')
        .select('*')
        .eq('name', 'admin')
        .eq('tenant_id', tenantId)
        .single();
      
      if (roleError2) {
        console.log('❌ Admin role not found, creating it...');
        
        const { data: newRole, error: createError } = await supabase
          .from('roles')
          .insert({
            name: 'admin',
            display_name: 'Administrateur',
            description: 'Administrateur avec tous les droits',
            hierarchy_level: 0,
            tenant_id: tenantId
          })
          .select()
          .single();
        
        if (createError) {
          console.log('❌ Create role error:', createError.message);
          return;
        }
        
        console.log(`✅ Admin role created: ${newRole.id}`);
        var roleId = newRole.id;
      } else {
        var roleId = adminRole2.id;
        console.log(`✅ Admin role found: ${roleId}`);
      }
    } else {
      var roleId = adminRole.id;
      console.log(`✅ Tenant admin role found: ${roleId}`);
    }
    
    // 3. Mettre à jour le profil avec role_id
    console.log('\n📝 Updating profile with role_id...');
    
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ 
        role_id: roleId,
        role: profile.role || 'admin'
      })
      .eq('user_id', userId);
    
    if (updateProfileError) {
      console.log('❌ Update profile error:', updateProfileError.message);
    } else {
      console.log('✅ Profile updated with role_id');
    }
    
    // 4. Créer l'entrée user_roles manuellement
    console.log('\n📝 Creating user_roles entry...');
    
    const { data: newUserRole, error: userRoleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role_id: roleId,
        context_type: 'global',
        context_id: tenantId,
        tenant_id: tenantId,
        is_active: true
      })
      .select()
      .single();
    
    if (userRoleError) {
      console.log('❌ User role creation error:', userRoleError.message);
    } else {
      console.log('✅ User role created successfully');
    }
    
    // 5. Vérifier le résultat final
    console.log('\n🔍 Final verification...');
    
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
      console.log(`✅ Final user_roles count: ${finalUserRoles.length}`);
      finalUserRoles.forEach(ur => {
        console.log(`   - Role: ${ur.roles?.name} (${ur.roles?.display_name}), Active: ${ur.is_active}`);
      });
    }
    
    // 6. Tester l'accès aux permissions
    console.log('\n🔍 Testing permissions access...');
    
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select(`
        *,
        permissions:permission_id (name, resource, action)
      `)
      .eq('role_id', roleId);
    
    if (permError) {
      console.log('❌ Permissions check error:', permError.message);
    } else {
      console.log(`✅ Role has ${permissions.length} permissions`);
      permissions.slice(0, 3).forEach(p => {
        console.log(`   - ${p.permissions?.name}: ${p.permissions?.resource}:${p.permissions?.action}`);
      });
    }
    
    await supabase.auth.signOut();
    console.log('\n🎉 Manual sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

executeTriggersDirectly().catch(console.error);
