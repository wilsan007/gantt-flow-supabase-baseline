import { createClient } from '@supabase/supabase-js';

async function debugProfilesStructure() {
  const supabase = createClient(
    'https://qliinxtanjdnwxlvnxji.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM'
  );
  
  const userId = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';
  const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
  
  console.log('🔍 Debugging profiles table structure and constraints...\n');
  
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
    
    // 1. Vérifier la structure actuelle de profiles
    console.log('🔍 Structure actuelle de profiles...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
      return;
    }
    
    console.log('Profile structure:', Object.keys(profile));
    console.log('Current role value:', profile.role);
    console.log('Role type:', typeof profile.role);
    
    // 2. Vérifier si la colonne role est TEXT ou UUID
    console.log('\n🔍 Vérification du type de données...');
    
    // Essayer de parser comme UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.role);
    console.log('Role is UUID format:', isUUID);
    
    if (isUUID) {
      // Vérifier si ce UUID existe dans roles
      const { data: roleExists, error: roleCheckError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', profile.role)
        .single();
      
      if (roleCheckError) {
        console.log('❌ Role UUID not found in roles table:', roleCheckError.message);
        console.log('This explains the foreign key constraint violation');
      } else {
        console.log('✅ Role found:', roleExists.name, roleExists.display_name);
      }
    } else {
      console.log('Role is text format, need to convert to UUID');
    }
    
    // 3. Lister tous les rôles disponibles
    console.log('\n🔍 Rôles disponibles dans la table roles...');
    
    const { data: allRoles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name, display_name')
      .eq('tenant_id', tenantId);
    
    if (rolesError) {
      console.log('❌ Roles error:', rolesError.message);
    } else {
      console.log(`Total roles: ${allRoles.length}`);
      allRoles.forEach(r => {
        console.log(`   - ${r.name} (${r.display_name}) -> ${r.id}`);
      });
    }
    
    // 4. Trouver le bon rôle pour cet utilisateur
    console.log('\n🔍 Recherche du bon rôle...');
    
    // Chercher un rôle admin ou tenant_admin
    const adminRole = allRoles.find(r => r.name === 'admin' || r.name === 'tenant_admin');
    
    if (adminRole) {
      console.log(`✅ Rôle admin trouvé: ${adminRole.name} -> ${adminRole.id}`);
      
      // 5. Essayer de mettre à jour avec le bon UUID
      console.log('\n🔄 Tentative de mise à jour avec le bon UUID...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: adminRole.id })
        .eq('user_id', userId);
      
      if (updateError) {
        console.log('❌ Update still failed:', updateError.message);
        console.log('This suggests the foreign key constraint is incorrectly configured');
      } else {
        console.log('✅ Update successful!');
        
        // Vérifier le résultat
        const { data: updatedProfile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (checkError) {
          console.log('❌ Check error:', checkError.message);
        } else {
          console.log('✅ Updated profile role:', updatedProfile.role);
        }
      }
    } else {
      console.log('❌ No admin role found');
    }
    
    // 6. Vérifier les user_roles après
    console.log('\n🔍 Vérification user_roles...');
    
    const { data: userRoles, error: userRolesError } = await supabase
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
      console.log(`✅ Active user roles: ${userRoles.length}`);
      userRoles.forEach(ur => {
        console.log(`   - ${ur.roles?.name} (${ur.roles?.display_name})`);
      });
    }
    
    await supabase.auth.signOut();
    console.log('\n🎉 Debug terminé!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugProfilesStructure().catch(console.error);
