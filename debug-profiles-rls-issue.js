import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function debugProfilesRLSIssue() {
  console.log('🔍 DEBUG: RÉCURSION INFINIE POLITIQUES RLS PROFILES');
  console.log('==================================================\n');

  try {
    // 1. Vérifier les politiques actuelles sur profiles
    console.log('1️⃣ Vérification des politiques RLS actuelles...');
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        ORDER BY policyname;
      `
    });

    if (policiesError) {
      console.error('❌ Erreur récupération politiques:', policiesError);
    } else {
      console.log(`📋 Politiques trouvées: ${policies.length}`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.qual})`);
      });
    }

    // 2. Tester l'accès direct avec service role
    console.log('\n2️⃣ Test accès avec service role...');
    const { data: profilesServiceRole, error: serviceError } = await supabase
      .from('profiles')
      .select('id, user_id, email, full_name, tenant_id')
      .limit(5);

    if (serviceError) {
      console.error('❌ Erreur service role:', serviceError);
    } else {
      console.log(`✅ Service role OK: ${profilesServiceRole.length} profils`);
    }

    // 3. Identifier la source de la récursion
    console.log('\n3️⃣ Analyse de la récursion...');
    console.log('La récursion vient probablement de:');
    console.log('   - Politique qui référence profiles dans sa condition');
    console.log('   - Fonction qui appelle profiles depuis une politique sur profiles');
    console.log('   - get_user_tenant_id() qui SELECT sur profiles depuis une politique profiles');

    // 4. Proposer la correction
    console.log('\n4️⃣ Application de la correction...');
    console.log('Exécution du script fix-profiles-rls-recursion.sql...');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le debug
debugProfilesRLSIssue();
