#!/usr/bin/env node

/**
 * Vérifier les permissions et l'accès au schéma auth
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://qliinxtanjdnwxlvnxji.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTriggerPermissions() {
  console.log('🔐 VÉRIFICATION: Permissions et accès schéma auth');
  console.log('⏰ Début:', new Date().toISOString());
  console.log('=' .repeat(60));

  try {
    // 1. Vérifier le rôle actuel
    console.log('\n👤 ÉTAPE 1: Rôle actuel...');
    
    try {
      const { data: currentRole } = await supabase.rpc('exec_sql', { 
        sql: `SELECT current_user, current_role, session_user;`
      });
      
      if (currentRole && currentRole.length > 0) {
        console.log('Utilisateur:', currentRole[0].current_user);
        console.log('Rôle:', currentRole[0].current_role);
        console.log('Session:', currentRole[0].session_user);
      }
    } catch (error) {
      console.log('❌ Erreur rôle:', error.message);
    }

    // 2. Vérifier l'accès au schéma auth
    console.log('\n🔍 ÉTAPE 2: Accès schéma auth...');
    
    try {
      const { data: authAccess } = await supabase.rpc('exec_sql', { 
        sql: `SELECT has_schema_privilege('auth', 'USAGE') as can_use_auth,
                     has_table_privilege('auth.users', 'SELECT') as can_select_users,
                     has_table_privilege('auth.users', 'UPDATE') as can_update_users;`
      });
      
      if (authAccess && authAccess.length > 0) {
        const access = authAccess[0];
        console.log('Accès schéma auth:', access.can_use_auth ? '✅' : '❌');
        console.log('Lecture auth.users:', access.can_select_users ? '✅' : '❌');
        console.log('Modification auth.users:', access.can_update_users ? '✅' : '❌');
      }
    } catch (error) {
      console.log('❌ Erreur accès auth:', error.message);
    }

    // 3. Vérifier les triggers existants dans tous les schémas
    console.log('\n📋 ÉTAPE 3: Tous les triggers...');
    
    try {
      const { data: allTriggers } = await supabase.rpc('exec_sql', { 
        sql: `SELECT event_object_schema, event_object_table, trigger_name, 
                     event_manipulation, action_timing, action_statement
              FROM information_schema.triggers 
              ORDER BY event_object_schema, event_object_table, trigger_name;`
      });
      
      console.log('Total triggers trouvés:', allTriggers?.length || 0);
      
      if (allTriggers && allTriggers.length > 0) {
        const authTriggers = allTriggers.filter(t => t.event_object_schema === 'auth');
        console.log('Triggers sur auth:', authTriggers.length);
        
        authTriggers.forEach(t => {
          console.log(`  - ${t.trigger_name} sur ${t.event_object_table} (${t.event_manipulation})`);
        });
        
        // Chercher nos triggers spécifiques
        const ourTriggers = allTriggers.filter(t => 
          t.trigger_name.includes('tenant') || 
          t.trigger_name.includes('confirmation')
        );
        
        console.log('\nNos triggers trouvés:', ourTriggers.length);
        ourTriggers.forEach(t => {
          console.log(`  ✅ ${t.trigger_name} sur ${t.event_object_schema}.${t.event_object_table}`);
        });
      }
    } catch (error) {
      console.log('❌ Erreur lecture triggers:', error.message);
    }

    // 4. Essayer de créer un trigger simple sur public
    console.log('\n🧪 ÉTAPE 4: Test trigger sur public...');
    
    try {
      // Créer une fonction de test
      await supabase.rpc('exec_sql', { 
        sql: `
CREATE OR REPLACE FUNCTION test_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`
      });
      console.log('✅ Fonction test créée');

      // Créer un trigger de test sur profiles
      await supabase.rpc('exec_sql', { 
        sql: `
DROP TRIGGER IF EXISTS test_trigger ON public.profiles;
CREATE TRIGGER test_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION test_trigger_function();`
      });
      console.log('✅ Trigger test créé sur public.profiles');

      // Vérifier qu'il existe
      const { data: testTrigger } = await supabase.rpc('exec_sql', { 
        sql: `SELECT trigger_name FROM information_schema.triggers 
              WHERE trigger_name = 'test_trigger';`
      });
      
      if (testTrigger && testTrigger.length > 0) {
        console.log('✅ Trigger test visible dans information_schema');
      } else {
        console.log('❌ Trigger test invisible dans information_schema');
      }

      // Nettoyer
      await supabase.rpc('exec_sql', { 
        sql: `DROP TRIGGER IF EXISTS test_trigger ON public.profiles;`
      });
      console.log('✅ Trigger test supprimé');

    } catch (error) {
      console.log('❌ Erreur test trigger:', error.message);
    }

    // 5. Essayer de créer directement sur auth.users
    console.log('\n🎯 ÉTAPE 5: Test direct sur auth.users...');
    
    try {
      // Créer fonction spécifique
      await supabase.rpc('exec_sql', { 
        sql: `
CREATE OR REPLACE FUNCTION test_auth_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne rien faire, juste retourner
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`
      });
      console.log('✅ Fonction auth test créée');

      // Essayer de créer trigger sur auth.users
      await supabase.rpc('exec_sql', { 
        sql: `
DROP TRIGGER IF EXISTS test_auth_trigger ON auth.users;
CREATE TRIGGER test_auth_trigger
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION test_auth_trigger();`
      });
      console.log('✅ Trigger auth test créé');

      // Vérifier
      const { data: authTrigger } = await supabase.rpc('exec_sql', { 
        sql: `SELECT trigger_name FROM information_schema.triggers 
              WHERE trigger_name = 'test_auth_trigger' 
              AND event_object_schema = 'auth';`
      });
      
      if (authTrigger && authTrigger.length > 0) {
        console.log('✅ Trigger auth test visible');
      } else {
        console.log('❌ Trigger auth test invisible');
      }

      // Nettoyer
      await supabase.rpc('exec_sql', { 
        sql: `DROP TRIGGER IF EXISTS test_auth_trigger ON auth.users;`
      });
      console.log('✅ Trigger auth test supprimé');

    } catch (error) {
      console.log('❌ Erreur trigger auth:', error.message);
      
      // Analyser l'erreur
      if (error.message.includes('permission denied')) {
        console.log('🚫 PROBLÈME: Pas de permission pour créer triggers sur auth.users');
      } else if (error.message.includes('does not exist')) {
        console.log('🚫 PROBLÈME: Table auth.users inaccessible');
      }
    }

    // 6. Vérifier les extensions
    console.log('\n🔌 ÉTAPE 6: Extensions...');
    
    try {
      const { data: extensions } = await supabase.rpc('exec_sql', { 
        sql: `SELECT extname, extversion FROM pg_extension ORDER BY extname;`
      });
      
      console.log('Extensions installées:', extensions?.length || 0);
      if (extensions && extensions.length > 0) {
        extensions.forEach(ext => {
          console.log(`  - ${ext.extname} v${ext.extversion}`);
        });
      }
    } catch (error) {
      console.log('❌ Erreur extensions:', error.message);
    }

    console.log('\n🎯 CONCLUSION:');
    console.log('Le problème semble être lié aux permissions sur le schéma auth.');
    console.log('Même avec service_role, il peut y avoir des restrictions sur auth.users.');
    console.log('Solution: Utiliser les hooks Supabase ou Edge Functions au lieu de triggers SQL.');

  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', error);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('⏰ Fin:', new Date().toISOString());
}

checkTriggerPermissions()
  .then(() => {
    console.log('🏁 Vérification terminée');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
