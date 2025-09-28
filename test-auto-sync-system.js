import { createClient } from '@supabase/supabase-js';

async function testAutoSyncSystem() {
  // Lire la vraie clé service depuis les variables d'environnement
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.lNBKqCdGJFXKGzEGGfJJNDKGzEGGfJJNDKGzEGGfJJND';
  
  const supabaseService = createClient(
    'https://qliinxtanjdnwxlvnxji.supabase.co',
    serviceKey
  );
  
  // Client normal pour les tests
  const supabase = createClient(
    'https://qliinxtanjdnwxlvnxji.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM'
  );
  
  const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
  const testEmail = 'test.sync@wadashaqeen.com';
  const testPassword = 'TestSync123!';
  
  console.log('🔧 Testing Auto-Sync System...\n');
  
  try {
    // 1. Exécuter le script de création des triggers
    console.log('📝 Executing auto-sync triggers script...');
    
    const fs = await import('fs');
    const sqlScript = fs.readFileSync('./create-auto-sync-triggers.sql', 'utf8');
    
    const { data: scriptResult, error: scriptError } = await supabaseService.rpc('exec_sql', {
      sql_query: sqlScript
    });
    
    if (scriptError) {
      console.log('❌ Script execution error:', scriptError.message);
    } else {
      console.log('✅ Auto-sync triggers created successfully\n');
    }
    
    // 2. Vérifier l'état initial
    console.log('🔍 Checking initial state...');
    
    const { data: initialUserRoles, error: initialError } = await supabaseService
      .from('user_roles')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (initialError) {
      console.log('❌ Error checking initial state:', initialError.message);
    } else {
      console.log(`✅ Initial user_roles count: ${initialUserRoles.length}\n`);
    }
    
    // 3. Créer un utilisateur test pour vérifier la synchronisation
    console.log('👤 Creating test user...');
    
    // Supprimer l'utilisateur test s'il existe déjà
    await supabaseService.auth.admin.deleteUser('test-sync-user-id');
    
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (authError) {
      console.log('❌ User creation error:', authError.message);
      return;
    }
    
    const testUserId = authData.user.id;
    console.log(`✅ Test user created: ${testUserId}`);
    
    // 4. Créer un profil avec un rôle - ceci devrait déclencher la synchronisation
    console.log('📋 Creating profile with role...');
    
    const { data: profileData, error: profileError } = await supabaseService
      .from('profiles')
      .insert({
        user_id: testUserId,
        full_name: 'Test Sync User',
        role: 'hr_manager',
        tenant_id: tenantId
      })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Profile creation error:', profileError.message);
      return;
    }
    
    console.log('✅ Profile created with role: hr_manager');
    
    // 5. Vérifier que user_roles a été automatiquement peuplé
    console.log('🔍 Checking auto-populated user_roles...');
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
    
    const { data: userRoles, error: userRolesError } = await supabaseService
      .from('user_roles')
      .select(`
        *,
        roles:role_id (name, display_name)
      `)
      .eq('user_id', testUserId);
    
    if (userRolesError) {
      console.log('❌ Error checking user_roles:', userRolesError.message);
    } else {
      console.log(`✅ User roles found: ${userRoles.length}`);
      userRoles.forEach(ur => {
        console.log(`   - Role: ${ur.roles?.name} (${ur.roles?.display_name}), Active: ${ur.is_active}`);
      });
    }
    
    // 6. Tester la modification du rôle
    console.log('\n🔄 Testing role update...');
    
    const { error: updateError } = await supabaseService
      .from('profiles')
      .update({ role: 'project_manager' })
      .eq('user_id', testUserId);
    
    if (updateError) {
      console.log('❌ Profile update error:', updateError.message);
    } else {
      console.log('✅ Profile role updated to: project_manager');
    }
    
    // Vérifier la synchronisation après modification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: updatedUserRoles, error: updatedError } = await supabaseService
      .from('user_roles')
      .select(`
        *,
        roles:role_id (name, display_name)
      `)
      .eq('user_id', testUserId);
    
    if (updatedError) {
      console.log('❌ Error checking updated user_roles:', updatedError.message);
    } else {
      console.log(`✅ Updated user roles: ${updatedUserRoles.length}`);
      updatedUserRoles.forEach(ur => {
        console.log(`   - Role: ${ur.roles?.name} (${ur.roles?.display_name}), Active: ${ur.is_active}`);
      });
    }
    
    // 7. Tester avec l'utilisateur existant
    console.log('\n👤 Testing with existing user...');
    
    const existingUserId = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';
    
    const { data: existingUserRoles, error: existingError } = await supabaseService
      .from('user_roles')
      .select(`
        *,
        roles:role_id (name, display_name)
      `)
      .eq('user_id', existingUserId);
    
    if (existingError) {
      console.log('❌ Error checking existing user roles:', existingError.message);
    } else {
      console.log(`✅ Existing user roles: ${existingUserRoles.length}`);
      existingUserRoles.forEach(ur => {
        console.log(`   - Role: ${ur.roles?.name} (${ur.roles?.display_name}), Active: ${ur.is_active}`);
      });
    }
    
    // 8. Nettoyer les données de test
    console.log('\n🧹 Cleaning up test data...');
    
    await supabaseService
      .from('profiles')
      .delete()
      .eq('user_id', testUserId);
    
    await supabaseService.auth.admin.deleteUser(testUserId);
    
    console.log('✅ Test data cleaned up');
    
    // 9. Vérifier l'authentification avec l'utilisateur existant
    console.log('\n🔐 Testing authentication with existing user...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'zdouce.zz@gmail.com',
      password: 'Test11@@'
    });
    
    if (signInError) {
      console.log('❌ Sign in error:', signInError.message);
    } else {
      console.log('✅ Successfully signed in');
      
      // Vérifier l'accès aux user_roles
      const { data: currentUserRoles, error: currentError } = await supabase
        .from('user_roles')
        .select(`
          *,
          roles:role_id (name, display_name)
        `);
      
      if (currentError) {
        console.log('❌ Error accessing user_roles:', currentError.message);
      } else {
        console.log(`✅ Current user can access ${currentUserRoles.length} role assignments`);
      }
      
      await supabase.auth.signOut();
    }
    
    console.log('\n🎉 Auto-sync system test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAutoSyncSystem().catch(console.error);
