import { createClient } from '@supabase/supabase-js';

async function createSimpleAdmin() {
  // Utiliser la clé publique pour créer l'utilisateur normalement
  const supabase = createClient('https://qliinxtanjdnwxlvnxji.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM');
  
  const email = 'admin@test.com';
  const password = 'admin123';
  
  console.log('🔧 Creating tenant admin user via signup...');
  
  try {
    // 1. S'inscrire normalement
    console.log('1️⃣ Signing up user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: 'Tenant Admin',
          role: 'admin'
        }
      }
    });
    
    if (authError) {
      console.log('❌ Signup failed:', authError.message);
      return;
    }
    
    console.log('✅ User signed up:', authData.user?.id);
    
    // 2. Se connecter immédiatement
    console.log('2️⃣ Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      return;
    }
    
    console.log('✅ Signed in successfully');
    
    // 3. Tester l'accès aux données
    console.log('3️⃣ Testing data access...');
    
    const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
    
    const hrQueries = [
      { name: 'profiles', query: supabase.from('profiles').select('*').eq('tenant_id', tenantId) },
      { name: 'leave_requests', query: supabase.from('leave_requests').select('*').eq('tenant_id', tenantId) },
      { name: 'attendances', query: supabase.from('attendances').select('*').eq('tenant_id', tenantId) },
      { name: 'absence_types', query: supabase.from('absence_types').select('*').eq('tenant_id', tenantId) },
      { name: 'leave_balances', query: supabase.from('leave_balances').select('*').eq('tenant_id', tenantId) }
    ];
    
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
    
    console.log('\n🎉 Tenant admin user created and tested!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 User ID:', signInData.user.id);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createSimpleAdmin().catch(console.error);
