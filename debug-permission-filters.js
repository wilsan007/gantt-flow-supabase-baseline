import { createClient } from '@supabase/supabase-js';

async function debugPermissionFilters() {
  const supabase = createClient(
    'https://qliinxtanjdnwxlvnxji.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM'
  );
  
  console.log('🔍 Debugging permission filters for employees...\n');
  
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
    
    const userId = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';
    const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
    
    // 1. Vérifier les permissions de l'utilisateur
    console.log('🔐 Checking user permissions...');
    
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id (
          name,
          display_name
        )
      `)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    
    if (rolesError) {
      console.log('❌ User roles error:', rolesError.message);
      return;
    }
    
    console.log(`✅ User roles: ${userRoles.length}`);
    userRoles.forEach(role => {
      console.log(`   - ${role.roles.name} (${role.roles.display_name})`);
    });
    
    // 2. Vérifier les permissions spécifiques pour les employés
    console.log('\n🔍 Checking specific permissions...');
    
    // Simuler checkUserPermission('employees', 'read', 'all')
    const hasAdminRole = userRoles.some(role => 
      ['admin', 'tenant_admin', 'owner'].includes(role.roles.name)
    );
    
    console.log(`✅ Has admin role: ${hasAdminRole}`);
    console.log(`✅ Can view all employees: ${hasAdminRole}`);
    
    // 3. Récupérer les employés et simuler le filtre
    console.log('\n📊 Simulating employee filtering...');
    
    const { data: employees, error: employeesError } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    
    if (employeesError) {
      console.log('❌ Employees error:', employeesError.message);
      return;
    }
    
    console.log(`✅ Total employees before filtering: ${employees.length}`);
    
    // Simuler filterEmployeesByPermissions
    let filteredEmployees;
    
    if (hasAdminRole) {
      // canViewAllEmployees = true, donc retourne tous les employés
      filteredEmployees = employees;
      console.log('✅ Admin role detected - returning all employees');
    } else {
      // Filtrer employé par employé
      filteredEmployees = [];
      console.log('⚠️ No admin role - filtering individual employees...');
      
      for (const employee of employees) {
        // Simuler canAccessResource('employees', employee.user_id, 'read')
        // Pour un admin, cela devrait toujours retourner true
        console.log(`   Checking access for ${employee.full_name} (user_id: ${employee.user_id})`);
        filteredEmployees.push(employee);
      }
    }
    
    console.log(`✅ Employees after filtering: ${filteredEmployees.length}`);
    
    // 4. Vérifier si le problème vient du hook useRoleManagement
    console.log('\n🔧 Testing useRoleManagement functions...');
    
    // Simuler la logique de useRoleManagement
    const primaryRole = userRoles.length > 0 
      ? userRoles.reduce((prev, current) => 
          (prev.roles.hierarchy_level < current.roles.hierarchy_level) ? prev : current
        )
      : null;
    
    console.log(`✅ Primary role: ${primaryRole?.roles.name}`);
    
    // Test de checkUserPermission
    const canReadAllEmployees = ['admin', 'tenant_admin', 'owner'].includes(primaryRole?.roles.name);
    console.log(`✅ checkUserPermission('employees', 'read', 'all'): ${canReadAllEmployees}`);
    
    // 5. Diagnostiquer le problème potentiel
    console.log('\n🚨 Potential issues:');
    
    if (filteredEmployees.length === 0 && employees.length > 0) {
      console.log('❌ PROBLEM: All employees filtered out despite having data');
      console.log('   - Check useRoleManagement implementation');
      console.log('   - Check canAccessResource function');
    } else if (filteredEmployees.length === employees.length) {
      console.log('✅ No filtering issue - all employees passed through');
      console.log('   - Problem might be in React state management');
      console.log('   - Check if setEmployees is being called correctly');
    }
    
    // 6. Tester une requête directe sans filtre
    console.log('\n🔄 Testing direct query without filters...');
    
    const { data: directEmployees, error: directError } = await supabase
      .from('profiles')
      .select('id, full_name, contract_type, hire_date')
      .eq('tenant_id', tenantId);
    
    if (directError) {
      console.log('❌ Direct query error:', directError.message);
    } else {
      console.log(`✅ Direct query result: ${directEmployees.length} employees`);
      console.log('   Sample data:');
      directEmployees.slice(0, 3).forEach(emp => {
        console.log(`     - ${emp.full_name}: ${emp.contract_type}`);
      });
    }
    
    await supabase.auth.signOut();
    console.log('\n🎉 Permission filter debug completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugPermissionFilters().catch(console.error);
