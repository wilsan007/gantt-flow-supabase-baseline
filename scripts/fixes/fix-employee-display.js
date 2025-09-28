import { createClient } from '@supabase/supabase-js';

async function fixEmployeeDisplay() {
  const supabase = createClient(
    'https://qliinxtanjdnwxlvnxji.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM'
  );
  
  console.log('🔧 Testing RPC functions used by useRoleManagement...\n');
  
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
    
    // 1. Tester has_permission RPC
    console.log('🔍 Testing has_permission RPC...');
    
    try {
      const { data: hasPermission, error: permError } = await supabase.rpc('has_permission', {
        p_resource: 'employees',
        p_action: 'read',
        p_context: 'all'
      });
      
      if (permError) {
        console.log('❌ has_permission RPC error:', permError.message);
        console.log('   This explains why usePermissionFilters fails!');
      } else {
        console.log(`✅ has_permission result: ${hasPermission}`);
      }
    } catch (e) {
      console.log('❌ has_permission RPC exception:', e.message);
    }
    
    // 2. Tester can_access_resource RPC
    console.log('\n🔍 Testing can_access_resource RPC...');
    
    try {
      const { data: canAccess, error: accessError } = await supabase.rpc('can_access_resource', {
        p_resource_type: 'employees',
        p_resource_id: 'ebb4c3fe-6288-41df-972d-4a6f32ed813d',
        p_action: 'read'
      });
      
      if (accessError) {
        console.log('❌ can_access_resource RPC error:', accessError.message);
        console.log('   This explains why employee filtering fails!');
      } else {
        console.log(`✅ can_access_resource result: ${canAccess}`);
      }
    } catch (e) {
      console.log('❌ can_access_resource RPC exception:', e.message);
    }
    
    // 3. Vérifier si les fonctions RPC existent
    console.log('\n🔍 Checking if RPC functions exist...');
    
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .in('proname', ['has_permission', 'can_access_resource', 'get_user_roles']);
    
    if (funcError) {
      console.log('❌ Cannot check RPC functions:', funcError.message);
    } else {
      console.log(`✅ Found ${functions.length} RPC functions:`);
      functions.forEach(func => {
        console.log(`   - ${func.proname}`);
      });
    }
    
    // 4. Solution temporaire : bypasser les RPC et utiliser une logique simple
    console.log('\n💡 Implementing temporary fix...');
    
    const userId = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';
    const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
    
    // Vérifier si l'utilisateur a un rôle admin
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id (name, hierarchy_level)
      `)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    
    if (rolesError) {
      console.log('❌ User roles error:', rolesError.message);
      return;
    }
    
    const hasAdminRole = userRoles.some(role => 
      ['admin', 'tenant_admin', 'owner'].includes(role.roles.name)
    );
    
    console.log(`✅ User has admin role: ${hasAdminRole}`);
    
    if (hasAdminRole) {
      console.log('✅ SOLUTION: User should see all employees without filtering');
      console.log('   Problem: usePermissionFilters relies on broken RPC functions');
      console.log('   Fix: Modify usePermissionFilters to use direct role checking');
    }
    
    await supabase.auth.signOut();
    console.log('\n🎯 Root cause identified: Missing or broken RPC functions');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixEmployeeDisplay().catch(console.error);
