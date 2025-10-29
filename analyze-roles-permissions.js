import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeRolesPermissions() {
  console.log('🔍 ANALYSE COMPLÈTE RÔLES ET PERMISSIONS');
  console.log('======================================');
  
  const superAdminId = '5c5731ce-75d0-4455-8184-bc42c626cb17';
  
  try {
    // 1. ANALYSER user_roles POUR CET UTILISATEUR
    console.log('\n1️⃣ ANALYSE user_roles...');
    console.log(`Utilisateur: ${superAdminId}`);
    
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', superAdminId);
    
    if (userRolesError) {
      console.error('❌ Erreur user_roles:', userRolesError);
      return;
    }
    
    console.log(`📋 Rôles assignés (${userRoles.length}):`);
    if (userRoles.length === 0) {
      console.log('   - Aucun rôle assigné');
      
      // Chercher tous les utilisateurs avec des rôles pour comprendre la structure
      console.log('\n🔍 Exemples d\'autres utilisateurs avec rôles...');
      const { data: sampleUserRoles } = await supabase
        .from('user_roles')
        .select('*')
        .limit(5);
      
      if (sampleUserRoles && sampleUserRoles.length > 0) {
        console.log('📋 Exemples d\'assignations:');
        sampleUserRoles.forEach(ur => {
          console.log(`   - User: ${ur.user_id}, Role: ${ur.role_id}, Actif: ${ur.is_active}`);
        });
      }
    } else {
      userRoles.forEach(ur => {
        console.log(`   - Role ID: ${ur.role_id}, Actif: ${ur.is_active}, Tenant: ${ur.tenant_id || 'Global'}`);
      });
    }
    
    // 2. ANALYSER LA TABLE roles
    console.log('\n2️⃣ ANALYSE TABLE roles...');
    
    const { data: allRoles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('name');
    
    if (rolesError) {
      console.error('❌ Erreur roles:', rolesError);
      return;
    }
    
    console.log(`📋 Tous les rôles (${allRoles.length}):`);
    allRoles.forEach(role => {
      console.log(`   - ${role.name} (ID: ${role.id})`);
    });
    
    // Chercher les rôles admin/super admin
    const adminRoles = allRoles.filter(r => 
      r.name.toLowerCase().includes('admin') || 
      r.name.toLowerCase().includes('super')
    );
    
    console.log('\n🔑 Rôles administratifs:');
    adminRoles.forEach(role => {
      console.log(`   - ${role.name} (ID: ${role.id})`);
    });
    
    // 3. ANALYSER role_permissions POUR LES RÔLES ADMIN
    console.log('\n3️⃣ ANALYSE role_permissions...');
    
    for (const role of adminRoles) {
      console.log(`\n🔍 Permissions pour "${role.name}" (${role.id}):`);
      
      const { data: rolePermissions, error: rolePermError } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', role.id);
      
      if (rolePermError) {
        console.error(`❌ Erreur role_permissions pour ${role.name}:`, rolePermError);
        continue;
      }
      
      if (rolePermissions.length === 0) {
        console.log('   - Aucune permission assignée');
      } else {
        console.log(`   - ${rolePermissions.length} permissions assignées:`);
        rolePermissions.forEach(rp => {
          console.log(`     * Permission ID: ${rp.permission_id}`);
        });
      }
    }
    
    // 4. ANALYSER LA TABLE permissions
    console.log('\n4️⃣ ANALYSE TABLE permissions...');
    
    const { data: allPermissions, error: permError } = await supabase
      .from('permissions')
      .select('*')
      .order('name');
    
    if (permError) {
      console.error('❌ Erreur permissions:', permError);
      return;
    }
    
    console.log(`📋 Toutes les permissions (${allPermissions.length}):`);
    allPermissions.forEach(perm => {
      console.log(`   - ${perm.name} (ID: ${perm.id}) - ${perm.description || 'Pas de description'}`);
    });
    
    // 5. MAPPER LES PERMISSIONS DES RÔLES ADMIN
    console.log('\n5️⃣ MAPPING COMPLET RÔLES → PERMISSIONS...');
    
    for (const role of adminRoles) {
      console.log(`\n🔑 RÔLE: ${role.name}`);
      
      const { data: rolePermissions } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', role.id);
      
      if (rolePermissions && rolePermissions.length > 0) {
        const permissionIds = rolePermissions.map(rp => rp.permission_id);
        
        const { data: permissions } = await supabase
          .from('permissions')
          .select('*')
          .in('id', permissionIds);
        
        if (permissions && permissions.length > 0) {
          console.log('   📋 Permissions:');
          permissions.forEach(perm => {
            console.log(`     ✅ ${perm.name} - ${perm.description || 'Pas de description'}`);
          });
        } else {
          console.log('   ❌ Aucune permission trouvée');
        }
      } else {
        console.log('   ❌ Aucune permission assignée');
      }
    }
    
    // 6. RECOMMANDATIONS
    console.log('\n6️⃣ RECOMMANDATIONS...');
    
    if (userRoles.length === 0) {
      console.log('🔧 ACTIONS NÉCESSAIRES:');
      console.log('1. Assigner un rôle admin à l\'utilisateur');
      
      // Trouver le meilleur rôle admin
      const bestAdminRole = adminRoles.find(r => r.name.toLowerCase().includes('super')) || 
                           adminRoles.find(r => r.name.toLowerCase().includes('admin')) ||
                           adminRoles[0];
      
      if (bestAdminRole) {
        console.log(`2. Rôle recommandé: "${bestAdminRole.name}" (${bestAdminRole.id})`);
        console.log('3. Commande SQL à exécuter:');
        console.log(`
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by, assigned_at, is_active)
VALUES (
  '${superAdminId}',
  '${bestAdminRole.id}',
  NULL,
  '${superAdminId}',
  NOW(),
  true
);`);
      }
    } else {
      console.log('✅ Utilisateur a des rôles assignés');
      
      // Vérifier si la fonction is_super_admin doit être corrigée
      const userRoleIds = userRoles.map(ur => ur.role_id);
      const userRoleNames = allRoles.filter(r => userRoleIds.includes(r.id)).map(r => r.name);
      
      console.log('🔍 Noms des rôles de l\'utilisateur:', userRoleNames);
      
      if (!userRoleNames.some(name => name.toLowerCase().includes('super') || name.toLowerCase().includes('admin'))) {
        console.log('⚠️ L\'utilisateur n\'a pas de rôle admin');
      } else {
        console.log('✅ L\'utilisateur a un rôle admin');
        console.log('🔧 Vérifier la fonction is_super_admin - elle cherche peut-être le mauvais nom de rôle');
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

analyzeRolesPermissions();
