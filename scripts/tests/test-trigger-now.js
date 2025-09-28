#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const supabase = createClient(supabaseUrl, serviceKey);

const TEST_EMAIL = 'test0071@yahoo.com';

async function testTrigger() {
  console.log('🧪 TEST TRIGGER');
  
  try {
    // 1. Vérifier utilisateur
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users.users.find(u => u.email === TEST_EMAIL);
    
    if (!testUser) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log(`✅ Utilisateur: ${testUser.id}`);

    // 2. Nettoyer
    await supabase.from('employees').delete().eq('user_id', testUser.id);
    await supabase.from('user_roles').delete().eq('user_id', testUser.id);
    await supabase.from('profiles').delete().eq('user_id', testUser.id);
    console.log('✅ Nettoyé');

    // 3. Tester Edge Function directement
    console.log('🚀 Test Edge Function...');
    const response = await fetch(`${supabaseUrl}/functions/v1/handle-email-confirmation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify({
        type: 'UPDATE',
        table: 'users',
        schema: 'auth',
        record: {
          id: testUser.id,
          email: testUser.email,
          email_confirmed_at: new Date().toISOString()
        },
        old_record: {
          id: testUser.id,
          email: testUser.email,
          email_confirmed_at: null
        }
      })
    });

    const result = await response.json();
    console.log('📊 Résultat:', result.success ? 'SUCCÈS' : 'ÉCHEC');

    if (result.success) {
      // 4. Vérifier création
      await new Promise(r => setTimeout(r, 2000));
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', testUser.id).single();
      const { data: employee } = await supabase.from('employees').select('*').eq('user_id', testUser.id).single();
      
      console.log(`👤 Profil: ${profile ? '✅' : '❌'}`);
      console.log(`👨‍💼 Employé: ${employee ? '✅ ' + employee.employee_id : '❌'}`);
      
      if (profile && employee) {
        console.log('🎉 SUCCÈS COMPLET!');
        console.log('✅ Edge Function opérationnelle');
        console.log('🔧 Pour automatiser: configurer webhook dans Supabase Dashboard');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testTrigger();
