import { createClient } from '@supabase/supabase-js';

// Utiliser les clés locales Supabase
const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.6nw8GVfmMOch5w-6bHMMfaUOq_4NOGhd7V2FwkQpNAI';

async function createTenantAdmin() {
  const supabaseAdmin = createClient('https://qliinxtanjdnwxlvnxji.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.Hn0lZlGqXYLJcONhHBPXLaFUOGYfZKOyqKNYhGnCWBo');
  
  const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
  const email = 'tenantadmin@wadashaqeen.com';
  const password = 'admin123';
  
  console.log('🔧 Creating tenant admin user...');
  
  try {
    // 1. Créer l'utilisateur avec auth.admin
    console.log('1️⃣ Creating auth user...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });
    
    if (authError) {
      console.log('❌ Auth user creation failed:', authError.message);
      return;
    }
    
    console.log('✅ Auth user created:', authUser.user.id);
    
    // 2. Créer le profil
    console.log('2️⃣ Creating profile...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        user_id: authUser.user.id,
        email: email,
        full_name: 'Tenant Admin',
        role: 'admin',
        tenant_id: tenantId,
        job_title: 'Administrateur Tenant',
        hire_date: new Date().toISOString().split('T')[0],
        contract_type: 'CDI'
      })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Profile creation failed:', profileError.message);
      return;
    }
    
    console.log('✅ Profile created:', profile.full_name);
    
    // 3. Créer le membre tenant
    console.log('3️⃣ Creating tenant member...');
    const { data: member, error: memberError } = await supabaseAdmin
      .from('tenant_members')
      .insert({
        tenant_id: tenantId,
        user_id: authUser.user.id,
        role: 'admin',
        status: 'active',
        permissions: {
          admin: true,
          manage_all: true,
          hr_manage: true,
          project_manage: true,
          finance_manage: true
        }
      })
      .select()
      .single();
    
    if (memberError) {
      console.log('❌ Tenant member creation failed:', memberError.message);
      return;
    }
    
    console.log('✅ Tenant member created with admin permissions');
    
    // 4. Créer l'employé
    console.log('4️⃣ Creating employee record...');
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert({
        user_id: authUser.user.id,
        employee_id: 'EMP-ADMIN-001',
        full_name: 'Tenant Admin',
        email: email,
        position: 'Administrateur',
        department: 'Administration',
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active',
        tenant_id: tenantId
      })
      .select()
      .single();
    
    if (employeeError) {
      console.log('❌ Employee creation failed:', employeeError.message);
    } else {
      console.log('✅ Employee record created');
    }
    
    console.log('\n🎉 Tenant admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 User ID:', authUser.user.id);
    console.log('🏢 Tenant ID:', tenantId);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Test de l'authentification
async function testTenantAdminAuth() {
  const supabase = createClient('https://qliinxtanjdnwxlvnxji.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM');
  
  console.log('\n🔐 Testing tenant admin authentication...');
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'tenantadmin@wadashaqeen.com',
    password: 'admin123'
  });
  
  if (authError) {
    console.log('❌ Auth test failed:', authError.message);
    return;
  }
  
  console.log('✅ Authentication successful!');
  console.log('👤 User:', authData.user.email);
  
  // Test d'accès aux données
  const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
  
  const hrQueries = [
    { name: 'profiles', query: supabase.from('profiles').select('*').eq('tenant_id', tenantId) },
    { name: 'leave_requests', query: supabase.from('leave_requests').select('*').eq('tenant_id', tenantId) },
    { name: 'attendances', query: supabase.from('attendances').select('*').eq('tenant_id', tenantId) },
    { name: 'absence_types', query: supabase.from('absence_types').select('*').eq('tenant_id', tenantId) },
    { name: 'leave_balances', query: supabase.from('leave_balances').select('*').eq('tenant_id', tenantId) }
  ];
  
  console.log('\n📊 Testing data access permissions...');
  
  for (const { name, query } of hrQueries) {
    try {
      const { data, error } = await query;
      if (error) {
        console.log(`❌ ${name}: ${error.message}`);
      } else {
        console.log(`✅ ${name}: ${data?.length || 0} records`);
      }
    } catch (e) {
      console.log(`❌ ${name}: ${e.message}`);
    }
  }
  
  await supabase.auth.signOut();
}

async function main() {
  await createTenantAdmin();
  await testTenantAdminAuth();
}

main().catch(console.error);
