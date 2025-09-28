import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qliinxtanjdnwxlvnxji.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
);

async function analyzeRLSPolicies() {
  console.log('🔍 Analyse des politiques RLS pour la table profiles...\n');
  
  try {
    // Requête pour récupérer toutes les politiques RLS de la table profiles
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles')
      .eq('schemaname', 'public');
    
    if (error) {
      console.log('❌ Erreur récupération politiques:', error.message);
      
      // Essayer une approche alternative avec une requête SQL directe
      console.log('\n🔄 Tentative avec requête SQL directe...');
      
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        query: `
          SELECT 
            policyname,
            cmd,
            permissive,
            roles,
            qual,
            with_check
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'profiles'
          ORDER BY policyname;
        `
      });
      
      if (sqlError) {
        console.log('❌ Erreur SQL:', sqlError.message);
        
        // Dernière tentative avec une fonction personnalisée
        await analyzeWithCustomFunction();
      } else {
        console.log('✅ Politiques RLS trouvées via SQL:', sqlResult);
        displayPolicies(sqlResult);
      }
    } else {
      console.log('✅ Politiques RLS trouvées:', policies);
      displayPolicies(policies);
    }
    
    // Analyser aussi les contraintes et triggers
    await analyzeConstraintsAndTriggers();
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

async function analyzeWithCustomFunction() {
  console.log('\n🔧 Création fonction d\'analyse temporaire...');
  
  try {
    // Créer une fonction temporaire pour analyser les politiques
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION analyze_profiles_rls()
      RETURNS TABLE(
        policy_name text,
        command text,
        permissive text,
        roles text[],
        expression text,
        check_expression text
      )
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        SELECT 
          policyname::text,
          cmd::text,
          permissive::text,
          roles,
          qual::text,
          with_check::text
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
        ORDER BY policyname;
      $$;
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: createFunctionSQL
    });
    
    if (createError) {
      console.log('❌ Erreur création fonction:', createError.message);
    } else {
      console.log('✅ Fonction créée, exécution...');
      
      const { data: functionResult, error: functionError } = await supabase.rpc('analyze_profiles_rls');
      
      if (functionError) {
        console.log('❌ Erreur exécution fonction:', functionError.message);
      } else {
        console.log('✅ Résultat fonction:', functionResult);
        displayPolicies(functionResult);
      }
    }
  } catch (error) {
    console.log('❌ Erreur fonction personnalisée:', error.message);
  }
}

function displayPolicies(policies) {
  if (!policies || policies.length === 0) {
    console.log('❌ Aucune politique RLS trouvée');
    return;
  }
  
  console.log('\n📋 POLITIQUES RLS DÉTAILLÉES:');
  console.log('=====================================');
  
  policies.forEach((policy, index) => {
    console.log(`\n${index + 1}. ${policy.policyname || policy.policy_name}`);
    console.log(`   Commande: ${policy.cmd || policy.command}`);
    console.log(`   Permissive: ${policy.permissive}`);
    console.log(`   Rôles: ${Array.isArray(policy.roles) ? policy.roles.join(', ') : policy.roles}`);
    console.log(`   Condition: ${policy.qual || policy.expression || 'N/A'}`);
    console.log(`   Vérification: ${policy.with_check || policy.check_expression || 'N/A'}`);
  });
  
  // Analyser les conditions problématiques
  console.log('\n🔍 ANALYSE DES CONDITIONS:');
  console.log('=====================================');
  
  policies.forEach(policy => {
    const condition = policy.qual || policy.expression;
    const policyName = policy.policyname || policy.policy_name;
    
    if (condition && condition.includes('tenant_id')) {
      console.log(`⚠️  ${policyName}: Exige tenant_id`);
      console.log(`   Condition: ${condition}`);
    }
    
    if (condition && condition.includes('super_admin')) {
      console.log(`🔑 ${policyName}: Exception super admin`);
      console.log(`   Condition: ${condition}`);
    }
  });
}

async function analyzeConstraintsAndTriggers() {
  console.log('\n🔗 ANALYSE DES CONTRAINTES ET TRIGGERS:');
  console.log('=====================================');
  
  try {
    // Vérifier les contraintes de clé étrangère
    const { data: constraints } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          conname as constraint_name,
          contype as constraint_type,
          pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'public.profiles'::regclass
        ORDER BY conname;
      `
    });
    
    if (constraints) {
      console.log('Contraintes:');
      constraints.forEach(constraint => {
        console.log(`  • ${constraint.constraint_name} (${constraint.constraint_type})`);
        console.log(`    ${constraint.definition}`);
      });
    }
    
    // Vérifier les triggers
    const { data: triggers } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_timing,
          action_statement
        FROM information_schema.triggers 
        WHERE event_object_table = 'profiles'
        AND event_object_schema = 'public'
        ORDER BY trigger_name;
      `
    });
    
    if (triggers) {
      console.log('\nTriggers:');
      triggers.forEach(trigger => {
        console.log(`  • ${trigger.trigger_name} (${trigger.event_manipulation} ${trigger.action_timing})`);
        console.log(`    ${trigger.action_statement}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Erreur analyse contraintes/triggers:', error.message);
  }
}

analyzeRLSPolicies();
