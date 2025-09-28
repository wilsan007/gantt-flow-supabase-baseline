import { createClient } from '@supabase/supabase-js';

async function analyzePermissionsTables() {
  const supabase = createClient('https://qliinxtanjdnwxlvnxji.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM');
  
  const userId = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';
  const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
  const email = 'zdouce.zz@gmail.com';
  const password = 'Test11@@';
  
  console.log('🔍 Analyzing all permission-related tables...');
  
  try {
    // Se connecter
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (authError) {
      console.log('❌ Auth failed:', authError.message);
      return;
    }
    
    console.log('✅ Authenticated successfully\n');
    
    // Tables liées aux permissions
    const permissionTables = [
      'roles',
      'permissions', 
      'role_permissions',
      'user_roles',
      'tenant_members',
      'profiles',
      'employees'
    ];
    
    console.log('📊 Analyzing permission-related tables:\n');
    
    for (const tableName of permissionTables) {
      console.log(`🔍 Table: ${tableName}`);
      
      try {
        // Compter les enregistrements
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId);
        
        if (countError && !countError.message.includes('column "tenant_id" does not exist')) {
          console.log(`   ❌ Error: ${countError.message}`);
        } else if (countError && countError.message.includes('column "tenant_id" does not exist')) {
          // Table sans tenant_id, essayer sans filtre
          const { count: globalCount, error: globalError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (globalError) {
            console.log(`   ❌ Error: ${globalError.message}`);
          } else {
            console.log(`   ✅ Records (global): ${globalCount || 0}`);
          }
        } else {
          console.log(`   ✅ Records (tenant): ${count || 0}`);
        }
        
        // Essayer de récupérer quelques exemples
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(3);
        
        if (!sampleError && sampleData && sampleData.length > 0) {
          console.log(`   📋 Sample structure:`, Object.keys(sampleData[0]));
          
          // Afficher les données spécifiques selon la table
          if (tableName === 'roles' && sampleData.length > 0) {
            console.log(`   📝 Roles:`, sampleData.map(r => `${r.name} (${r.display_name})`));
          }
          if (tableName === 'permissions' && sampleData.length > 0) {
            console.log(`   📝 Permissions:`, sampleData.map(p => `${p.name} (${p.resource}:${p.action})`));
          }
          if (tableName === 'user_roles' && sampleData.length > 0) {
            console.log(`   📝 User roles:`, sampleData.map(ur => `User: ${ur.user_id}, Role: ${ur.role_id}`));
          }
        }
        
      } catch (e) {
        console.log(`   ❌ Exception: ${e.message}`);
      }
      
      console.log('');
    }
    
    // Vérifier les relations spécifiques à l'utilisateur
    console.log('👤 User-specific permission analysis:\n');
    
    // Rôles de l'utilisateur
    console.log('🔍 User roles:');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id (name, display_name, hierarchy_level)
      `)
      .eq('user_id', userId);
    
    if (userRolesError) {
      console.log('   ❌ Error:', userRolesError.message);
    } else {
      console.log('   ✅ Found:', userRoles?.length || 0, 'role assignments');
      userRoles?.forEach(ur => {
        console.log(`   - Role: ${ur.roles?.name} (${ur.roles?.display_name}), Context: ${ur.context_type}, Active: ${ur.is_active}`);
      });
    }
    
    console.log('');
    
    // Permissions via rôles
    console.log('🔍 Permissions via roles:');
    const { data: rolePermissions, error: rolePermError } = await supabase
      .from('role_permissions')
      .select(`
        *,
        permissions:permission_id (name, display_name, resource, action, context)
      `);
    
    if (rolePermError) {
      console.log('   ❌ Error:', rolePermError.message);
    } else {
      console.log('   ✅ Found:', rolePermissions?.length || 0, 'role-permission mappings');
      rolePermissions?.slice(0, 5).forEach(rp => {
        console.log(`   - Permission: ${rp.permissions?.name} (${rp.permissions?.resource}:${rp.permissions?.action})`);
      });
    }
    
    console.log('');
    
    // Profil utilisateur
    console.log('🔍 User profile:');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError) {
      console.log('   ❌ Error:', profileError.message);
    } else {
      console.log('   ✅ Profile found:');
      console.log(`   - Name: ${profile.full_name}`);
      console.log(`   - Role: ${profile.role}`);
      console.log(`   - Tenant: ${profile.tenant_id}`);
    }
    
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

analyzePermissionsTables().catch(console.error);
