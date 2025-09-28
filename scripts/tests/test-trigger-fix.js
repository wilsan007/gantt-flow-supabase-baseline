import { createClient } from '@supabase/supabase-js';

async function testTriggerFix() {
  const supabase = createClient(
    'https://qliinxtanjdnwxlvnxji.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM'
  );
  
  const userId = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';
  const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
  
  console.log('🔧 Testing trigger fix for automatic user_roles sync...\n');
  
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
    
    // 1. État initial
    console.log('🔍 État initial...');
    
    const { data: initialProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
      return;
    }
    
    console.log(`Profile actuel: ${initialProfile.full_name}`);
    console.log(`Role actuel: ${initialProfile.role}`);
    
    const { data: initialUserRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id (name, display_name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (userRolesError) {
      console.log('❌ User roles error:', userRolesError.message);
    } else {
      console.log(`User roles actifs: ${initialUserRoles.length}`);
      initialUserRoles.forEach(ur => {
        console.log(`   - ${ur.roles?.name} (${ur.roles?.display_name})`);
      });
    }
    
    // 2. Récupérer les rôles disponibles
    console.log('\n🔍 Rôles disponibles...');
    
    const { data: availableRoles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name, display_name')
      .eq('tenant_id', tenantId)
      .order('hierarchy_level');
    
    if (rolesError) {
      console.log('❌ Roles error:', rolesError.message);
      return;
    }
    
    console.log(`Rôles disponibles: ${availableRoles.length}`);
    availableRoles.slice(0, 5).forEach(r => {
      console.log(`   - ${r.name} (${r.display_name}) -> ${r.id}`);
    });
    
    // 3. Test 1: Changer le rôle vers hr_manager
    console.log('\n🔄 Test 1: Changement vers hr_manager...');
    
    const hrManagerRole = availableRoles.find(r => r.name === 'hr_manager');
    if (!hrManagerRole) {
      console.log('❌ hr_manager role not found');
      return;
    }
    
    const { error: updateError1 } = await supabase
      .from('profiles')
      .update({ role: hrManagerRole.id })
      .eq('user_id', userId);
    
    if (updateError1) {
      console.log('❌ Update error:', updateError1.message);
    } else {
      console.log('✅ Profile updated to hr_manager');
    }
    
    // Attendre et vérifier
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: afterUpdate1, error: check1Error } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id (name, display_name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (check1Error) {
      console.log('❌ Check error:', check1Error.message);
    } else {
      console.log(`✅ User roles après changement: ${afterUpdate1.length}`);
      afterUpdate1.forEach(ur => {
        console.log(`   - ${ur.roles?.name} (${ur.roles?.display_name}), Updated: ${ur.updated_at}`);
      });
    }
    
    // 4. Test 2: Changer vers project_manager
    console.log('\n🔄 Test 2: Changement vers project_manager...');
    
    const projectManagerRole = availableRoles.find(r => r.name === 'project_manager');
    if (!projectManagerRole) {
      console.log('❌ project_manager role not found');
      return;
    }
    
    const { error: updateError2 } = await supabase
      .from('profiles')
      .update({ role: projectManagerRole.id })
      .eq('user_id', userId);
    
    if (updateError2) {
      console.log('❌ Update error:', updateError2.message);
    } else {
      console.log('✅ Profile updated to project_manager');
    }
    
    // Attendre et vérifier
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: afterUpdate2, error: check2Error } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id (name, display_name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (check2Error) {
      console.log('❌ Check error:', check2Error.message);
    } else {
      console.log(`✅ User roles après 2e changement: ${afterUpdate2.length}`);
      afterUpdate2.forEach(ur => {
        console.log(`   - ${ur.roles?.name} (${ur.roles?.display_name}), Updated: ${ur.updated_at}`);
      });
    }
    
    // 5. Remettre le rôle admin original
    console.log('\n🔄 Remise du rôle admin original...');
    
    const adminRole = availableRoles.find(r => r.name === 'admin');
    if (!adminRole) {
      console.log('❌ admin role not found');
      return;
    }
    
    const { error: updateError3 } = await supabase
      .from('profiles')
      .update({ role: adminRole.id })
      .eq('user_id', userId);
    
    if (updateError3) {
      console.log('❌ Update error:', updateError3.message);
    } else {
      console.log('✅ Profile restored to admin');
    }
    
    // Attendre et vérifier
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id (name, display_name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (finalError) {
      console.log('❌ Final check error:', finalError.message);
    } else {
      console.log(`✅ User roles finaux: ${finalCheck.length}`);
      finalCheck.forEach(ur => {
        console.log(`   - ${ur.roles?.name} (${ur.roles?.display_name}), Updated: ${ur.updated_at}`);
      });
    }
    
    // 6. Vérifier les permissions
    console.log('\n🔍 Vérification des permissions...');
    
    if (finalCheck.length > 0) {
      const { data: permissions, error: permError } = await supabase
        .from('role_permissions')
        .select(`
          *,
          permissions:permission_id (name, resource, action)
        `)
        .eq('role_id', finalCheck[0].role_id);
      
      if (permError) {
        console.log('❌ Permissions error:', permError.message);
      } else {
        console.log(`✅ Permissions disponibles: ${permissions.length}`);
        permissions.slice(0, 3).forEach(p => {
          console.log(`   - ${p.permissions?.name}: ${p.permissions?.resource}:${p.permissions?.action}`);
        });
      }
    }
    
    await supabase.auth.signOut();
    console.log('\n🎉 Test du trigger terminé avec succès!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testTriggerFix().catch(console.error);
