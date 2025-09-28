import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qliinxtanjdnwxlvnxji.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
);

async function debugProfilesRLS() {
  const userId = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
  const tenantId = '115d5fa0-006a-4978-8776-c19b4157731a';
  
  console.log('🔍 Debug des permissions RLS sur profiles...\n');
  
  try {
    // Test 1: Insertion simple sans tenant_id
    console.log('1️⃣ Test insertion sans tenant_id...');
    const { error: error1 } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        full_name: 'Test Simple',
        email: 'test@simple.com'
      });
    
    if (error1) {
      console.log('❌ Erreur sans tenant_id:', error1.message);
    } else {
      console.log('✅ Insertion sans tenant_id réussie');
      await supabase.from('profiles').delete().eq('user_id', userId);
    }
    
    // Test 2: Insertion avec tenant_id via upsert
    console.log('\n2️⃣ Test upsert avec tenant_id...');
    const { error: error2 } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        tenant_id: tenantId,
        full_name: 'Test Upsert',
        email: 'test@upsert.com'
      });
    
    if (error2) {
      console.log('❌ Erreur upsert:', error2.message);
    } else {
      console.log('✅ Upsert réussi');
      await supabase.from('profiles').delete().eq('user_id', userId);
    }
    
    // Test 3: Insertion via SQL direct
    console.log('\n3️⃣ Test SQL direct...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO public.profiles (user_id, tenant_id, full_name, email, role)
        VALUES ('${userId}', '${tenantId}', 'Test SQL', 'test@sql.com', 'tenant_admin')
        ON CONFLICT (user_id) DO NOTHING;
      `
    });
    
    if (error3) {
      console.log('❌ Erreur SQL direct:', error3.message);
    } else {
      console.log('✅ SQL direct réussi');
    }
    
    // Test 4: Vérifier si le profil existe maintenant
    console.log('\n4️⃣ Vérification profil créé...');
    const { data: profile, error: error4 } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error4) {
      console.log('❌ Profil non trouvé:', error4.message);
    } else {
      console.log('✅ Profil trouvé:', profile);
    }
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

debugProfilesRLS();
