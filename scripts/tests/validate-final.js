#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const supabase = createClient(supabaseUrl, serviceKey);

const TEST_EMAIL = 'test0071@yahoo.com';

async function validateSystem() {
  console.log('🔍 VALIDATION EDGE FUNCTION');
  console.log(`📧 Test: ${TEST_EMAIL}`);

  try {
    // 1. Vérifier utilisateur
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users.users.find(u => u.email === TEST_EMAIL);
    
    if (!testUser) {
      console.log('❌ Utilisateur non trouvé');
      return false;
    }

    console.log(`✅ Utilisateur: ${testUser.id}`);
    console.log(`📧 Confirmé: ${testUser.email_confirmed_at ? 'OUI' : 'NON'}`);

    // 2. Confirmer email si nécessaire
    if (!testUser.email_confirmed_at) {
      console.log('🔐 Confirmation email...');
      await supabase.auth.admin.updateUserById(testUser.id, { email_confirm: true });
      console.log('⏳ Attente 5s...');
      await new Promise(r => setTimeout(r, 5000));
    }

    // 3. Vérifier résultats
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', testUser.id).single();
    const { data: employee } = await supabase.from('employees').select('*').eq('user_id', testUser.id).single();
    const { data: roles } = await supabase.from('user_roles').select('*').eq('user_id', testUser.id);

    console.log(`👤 Profil: ${profile ? '✅' : '❌'}`);
    console.log(`👨‍💼 Employé: ${employee ? '✅ ' + employee.employee_id : '❌'}`);
    console.log(`🔐 Rôles: ${roles?.length > 0 ? '✅' : '❌'}`);

    const score = [!!profile, !!employee, roles?.length > 0].filter(Boolean).length;
    console.log(`🎯 Score: ${score}/3`);

    if (score === 3) {
      console.log('🎉 SUCCÈS COMPLET!');
      console.log('🚀 Système prêt pour production');
      return true;
    } else {
      console.log('⚠️ Système incomplet');
      return false;
    }

  } catch (error) {
    console.error('💥 Erreur:', error.message);
    return false;
  }
}

validateSystem().then(success => {
  process.exit(success ? 0 : 1);
});
