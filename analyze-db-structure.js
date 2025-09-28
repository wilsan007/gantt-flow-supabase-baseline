import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzePermissionsTables() {
  console.log('=== ANALYSE DES TABLES DE PERMISSIONS ===\n');

  try {
    // 1. Analyser la structure et le contenu de la table roles
    console.log('1. TABLE ROLES:');
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*');
    
    if (rolesError) {
      console.error('Erreur roles:', rolesError);
    } else {
      console.log('Nombre de rôles:', roles.length);
      console.log('Contenu:', JSON.stringify(roles, null, 2));
    }

    // 2. Analyser la structure et le contenu de la table permissions
    console.log('\n2. TABLE PERMISSIONS:');
    const { data: permissions, error: permissionsError } = await supabase
      .from('permissions')
      .select('*');
    
    if (permissionsError) {
      console.error('Erreur permissions:', permissionsError);
    } else {
      console.log('Nombre de permissions:', permissions.length);
      console.log('Contenu:', JSON.stringify(permissions, null, 2));
    }

    // 3. Analyser la structure et le contenu de la table role_permissions
    console.log('\n3. TABLE ROLE_PERMISSIONS:');
    const { data: rolePermissions, error: rolePermissionsError } = await supabase
      .from('role_permissions')
      .select('*');
    
    if (rolePermissionsError) {
      console.error('Erreur role_permissions:', rolePermissionsError);
    } else {
      console.log('Nombre de liaisons rôle-permission:', rolePermissions.length);
      console.log('Contenu:', JSON.stringify(rolePermissions, null, 2));
    }

    // 4. Analyser les utilisateurs et leurs rôles
    console.log('\n4. TABLE USER_ROLES:');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    if (userRolesError) {
      console.error('Erreur user_roles:', userRolesError);
    } else {
      console.log('Nombre d\'assignations utilisateur-rôle:', userRoles.length);
      console.log('Contenu:', JSON.stringify(userRoles, null, 2));
    }

    // 5. Analyser les employés
    console.log('\n5. TABLE EMPLOYEES:');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*');
    
    if (employeesError) {
      console.error('Erreur employees:', employeesError);
    } else {
      console.log('Nombre d\'employés:', employees.length);
      console.log('Contenu:', JSON.stringify(employees, null, 2));
    }

  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

analyzePermissionsTables();
