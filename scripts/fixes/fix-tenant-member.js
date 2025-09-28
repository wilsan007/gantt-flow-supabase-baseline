import { createClient } from '@supabase/supabase-js';

async function fixTenantMember() {
  const supabase = createClient('https://qliinxtanjdnwxlvnxji.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM');
  
  const userId = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';
  const tenantId = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';
  const email = 'zdouce.zz@gmail.com';
  const password = 'Test11@@';
  
  console.log('🔧 Fixing tenant member for user:', userId);
  
  try {
    // 1. Se connecter avec l'utilisateur
    console.log('1️⃣ Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (authError) {
      console.log('❌ Auth failed:', authError.message);
      return;
    }
    
    console.log('✅ Authenticated successfully');
    
    // 2. Créer l'entrée tenant_members directement via INSERT
    console.log('2️⃣ Creating tenant member entry...');
    
    // Utiliser une requête SQL directe pour éviter la récursion RLS
    const { data: memberData, error: memberError } = await supabase
      .from('tenant_members')
      .insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        user_id: userId,
        role: 'admin',
        status: 'active',
        permissions: {
          admin: true,
          manage_all: true,
          hr_manage: true,
          project_manage: true,
          finance_manage: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (memberError) {
      console.log('❌ Tenant member creation failed:', memberError.message);
      
      // Essayer une approche alternative avec upsert
      console.log('🔄 Trying upsert approach...');
      const { data: upsertData, error: upsertError } = await supabase
        .from('tenant_members')
        .upsert({
          tenant_id: tenantId,
          user_id: userId,
          role: 'admin',
          status: 'active',
          permissions: {
            admin: true,
            manage_all: true,
            hr_manage: true,
            project_manage: true,
            finance_manage: true
          }
        }, {
          onConflict: 'tenant_id,user_id'
        })
        .select()
        .single();
      
      if (upsertError) {
        console.log('❌ Upsert also failed:', upsertError.message);
      } else {
        console.log('✅ Tenant member created via upsert');
      }
    } else {
      console.log('✅ Tenant member created successfully');
    }
    
    // 3. Vérifier que l'entrée existe maintenant
    console.log('3️⃣ Verifying tenant membership...');
    const { data: verifyMember, error: verifyError } = await supabase
      .from('tenant_members')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();
    
    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Tenant membership verified:');
      console.log('   Role:', verifyMember.role);
      console.log('   Status:', verifyMember.status);
      console.log('   Permissions:', JSON.stringify(verifyMember.permissions, null, 2));
    }
    
    // 4. Tester à nouveau l'accès aux données
    console.log('4️⃣ Testing data access after fix...');
    
    const hrQueries = [
      { name: 'leave_requests', query: supabase.from('leave_requests').select('count').eq('tenant_id', tenantId) },
      { name: 'attendances', query: supabase.from('attendances').select('count').eq('tenant_id', tenantId) },
      { name: 'absence_types', query: supabase.from('absence_types').select('count').eq('tenant_id', tenantId) },
      { name: 'employees', query: supabase.from('employees').select('count').eq('tenant_id', tenantId) }
    ];
    
    for (const { name, query } of hrQueries) {
      try {
        const { count, error } = await query;
        if (error) {
          console.log(`❌ ${name}: ${error.message}`);
        } else {
          console.log(`✅ ${name}: ${count} records accessible`);
        }
      } catch (e) {
        console.log(`❌ ${name}: ${e.message}`);
      }
    }
    
    console.log('\n🎉 User should now have full tenant admin access!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 User ID:', userId);
    console.log('🏢 Tenant ID:', tenantId);
    
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixTenantMember().catch(console.error);
