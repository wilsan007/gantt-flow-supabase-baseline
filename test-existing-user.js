import { createClient } from '@supabase/supabase-js';

async function testExistingUser() {
  const supabase = createClient('https://qliinxtanjdnwxlvnxji.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM');
  
  const userId = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';
  const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
  const email = 'zdouce.zz@gmail.com';
  const password = 'Test11@@';
  
  console.log('🔍 Testing existing user:', userId);
  console.log('📧 Email:', email);
  console.log('🏢 Tenant:', tenantId);
  
  try {
    // 1. Tenter de se connecter avec l'utilisateur existant
    console.log('\n1️⃣ Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (authError) {
      console.log('❌ Auth failed:', authError.message);
      
      // Tester avec différents mots de passe possibles
      const passwords = ['admin123', 'password', 'Admin123', 'admin', '123456'];
      console.log('🔄 Trying different passwords...');
      
      for (const pwd of passwords) {
        const { data: testAuth, error: testError } = await supabase.auth.signInWithPassword({
          email: email,
          password: pwd
        });
        
        if (!testError && testAuth.user) {
          console.log('✅ Authentication successful with password:', pwd);
          break;
        }
      }
      return;
    }
    
    console.log('✅ Authentication successful!');
    console.log('👤 User ID:', authData.user.id);
    console.log('📧 Email verified:', authData.user.email_confirmed_at ? 'Yes' : 'No');
    
    // 2. Vérifier le profil utilisateur
    console.log('\n2️⃣ Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
    } else {
      console.log('✅ Profile found:');
      console.log('   Name:', profile.full_name);
      console.log('   Role:', profile.role);
      console.log('   Tenant ID:', profile.tenant_id);
      console.log('   Job Title:', profile.job_title);
    }
    
    // 3. Vérifier les permissions tenant
    console.log('\n3️⃣ Checking tenant membership...');
    const { data: membership, error: memberError } = await supabase
      .from('tenant_members')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('tenant_id', tenantId)
      .single();
    
    if (memberError) {
      console.log('❌ Membership error:', memberError.message);
    } else {
      console.log('✅ Tenant membership found:');
      console.log('   Role:', membership.role);
      console.log('   Status:', membership.status);
      console.log('   Permissions:', JSON.stringify(membership.permissions, null, 2));
    }
    
    // 4. Tester l'accès aux données HR
    console.log('\n4️⃣ Testing HR data access...');
    
    const hrQueries = [
      { name: 'profiles', query: supabase.from('profiles').select('*').eq('tenant_id', tenantId) },
      { name: 'leave_requests', query: supabase.from('leave_requests').select('*').eq('tenant_id', tenantId) },
      { name: 'attendances', query: supabase.from('attendances').select('*').eq('tenant_id', tenantId) },
      { name: 'absence_types', query: supabase.from('absence_types').select('*').eq('tenant_id', tenantId) },
      { name: 'leave_balances', query: supabase.from('leave_balances').select('*').eq('tenant_id', tenantId) },
      { name: 'employees', query: supabase.from('employees').select('*').eq('tenant_id', tenantId) }
    ];
    
    for (const { name, query } of hrQueries) {
      try {
        const { data, error } = await query;
        if (error) {
          console.log(`❌ ${name}: ${error.message}`);
        } else {
          console.log(`✅ ${name}: ${data?.length || 0} records`);
          if (data && data.length > 0 && name === 'profiles') {
            console.log('   Sample profiles:', data.map(p => `${p.full_name} (${p.user_id})`));
          }
        }
      } catch (e) {
        console.log(`❌ ${name}: ${e.message}`);
      }
    }
    
    // 5. Tester les fonctions RLS
    console.log('\n5️⃣ Testing RLS functions...');
    const { data: tenantFunc, error: tenantFuncError } = await supabase.rpc('get_user_tenant_id');
    if (tenantFuncError) {
      console.log('❌ get_user_tenant_id error:', tenantFuncError.message);
    } else {
      console.log('✅ get_user_tenant_id result:', tenantFunc);
    }
    
    console.log('\n📊 Summary:');
    console.log('- User exists and can authenticate:', !authError ? '✅' : '❌');
    console.log('- Profile exists:', !profileError ? '✅' : '❌');
    console.log('- Tenant membership exists:', !memberError ? '✅' : '❌');
    console.log('- Has admin permissions:', membership?.permissions?.admin ? '✅' : '❌');
    
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testExistingUser().catch(console.error);
