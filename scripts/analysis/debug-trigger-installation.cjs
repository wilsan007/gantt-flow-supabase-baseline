#!/usr/bin/env node

/**
 * Debug: Vérifier pourquoi le trigger ne s'installe pas correctement
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

async function debugTriggerInstallation() {
  console.log('🔍 DEBUG: Installation et vérification trigger');
  console.log('⏰ Début:', new Date().toISOString());
  console.log('=' .repeat(60));

  try {
    // 1. Vérifier triggers existants AVANT installation
    console.log('\n📋 ÉTAPE 1: Triggers existants...');
    
    try {
      const { data: existingTriggers } = await supabase.rpc('exec_sql', { 
        sql: `SELECT trigger_name, event_manipulation, action_timing, action_statement 
              FROM information_schema.triggers 
              WHERE event_object_schema = 'auth' 
              AND event_object_table = 'users' 
              ORDER BY trigger_name;`
      });
      
      console.log('Triggers trouvés:', existingTriggers?.length || 0);
      if (existingTriggers && existingTriggers.length > 0) {
        existingTriggers.forEach(t => {
          console.log(`  - ${t.trigger_name} (${t.event_manipulation} ${t.action_timing})`);
        });
      }
    } catch (error) {
      console.log('❌ Erreur lecture triggers:', error.message);
    }

    // 2. Vérifier si la fonction trigger existe
    console.log('\n🔧 ÉTAPE 2: Fonction trigger...');
    
    try {
      const { data: functions } = await supabase.rpc('exec_sql', { 
        sql: `SELECT routine_name, routine_type 
              FROM information_schema.routines 
              WHERE routine_schema = 'public' 
              AND routine_name LIKE '%confirmation%' 
              ORDER BY routine_name;`
      });
      
      console.log('Fonctions trouvées:', functions?.length || 0);
      if (functions && functions.length > 0) {
        functions.forEach(f => {
          console.log(`  - ${f.routine_name} (${f.routine_type})`);
        });
      }
    } catch (error) {
      console.log('❌ Erreur lecture fonctions:', error.message);
    }

    // 3. Installer le trigger étape par étape
    console.log('\n🚀 ÉTAPE 3: Installation étape par étape...');
    
    const fs = require('fs');
    const triggerScript = fs.readFileSync('./fix-trigger-on-email-confirmation.sql', 'utf8');
    
    // Diviser en sections
    const sections = triggerScript.split('--').filter(section => section.trim().length > 0);
    
    console.log(`Script divisé en ${sections.length} sections`);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (section.length > 0) {
        console.log(`\n📝 Section ${i + 1}:`);
        console.log(section.substring(0, 100) + '...');
        
        try {
          await supabase.rpc('exec_sql', { sql: section });
          console.log('✅ Section exécutée');
        } catch (error) {
          console.log('❌ Erreur section:', error.message);
          
          // Essayer d'exécuter chaque commande individuellement
          const commands = section.split(';').filter(cmd => cmd.trim().length > 0);
          for (const command of commands) {
            if (command.trim()) {
              try {
                await supabase.rpc('exec_sql', { sql: command.trim() + ';' });
                console.log('  ✅ Commande OK');
              } catch (cmdError) {
                console.log('  ❌ Commande échouée:', cmdError.message.substring(0, 100));
              }
            }
          }
        }
      }
    }

    // 4. Vérifier triggers APRÈS installation
    console.log('\n📊 ÉTAPE 4: Vérification post-installation...');
    
    try {
      const { data: newTriggers } = await supabase.rpc('exec_sql', { 
        sql: `SELECT trigger_name, event_manipulation, action_timing 
              FROM information_schema.triggers 
              WHERE event_object_schema = 'auth' 
              AND event_object_table = 'users' 
              AND trigger_name LIKE '%confirmation%'
              ORDER BY trigger_name;`
      });
      
      console.log('Triggers confirmation trouvés:', newTriggers?.length || 0);
      if (newTriggers && newTriggers.length > 0) {
        newTriggers.forEach(t => {
          console.log(`  ✅ ${t.trigger_name} (${t.event_manipulation} ${t.action_timing})`);
        });
      } else {
        console.log('❌ Aucun trigger de confirmation trouvé');
      }
    } catch (error) {
      console.log('❌ Erreur vérification:', error.message);
    }

    // 5. Vérifier la fonction spécifique
    console.log('\n🔍 ÉTAPE 5: Fonction spécifique...');
    
    try {
      const { data: specificFunction } = await supabase.rpc('exec_sql', { 
        sql: `SELECT routine_name, routine_definition 
              FROM information_schema.routines 
              WHERE routine_schema = 'public' 
              AND routine_name = 'global_auto_create_tenant_owner_on_confirmation';`
      });
      
      if (specificFunction && specificFunction.length > 0) {
        console.log('✅ Fonction global_auto_create_tenant_owner_on_confirmation trouvée');
      } else {
        console.log('❌ Fonction global_auto_create_tenant_owner_on_confirmation manquante');
        
        // Essayer de créer juste la fonction
        console.log('\n🔧 Création fonction seule...');
        try {
          const functionSQL = `
CREATE OR REPLACE FUNCTION global_auto_create_tenant_owner_on_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  new_tenant_id UUID;
  new_employee_id TEXT;
BEGIN
  -- Vérifier invitation
  SELECT * INTO invitation_data 
  FROM public.invitations 
  WHERE email = NEW.email 
    AND invitation_type = 'tenant_owner' 
    AND status = 'pending';
    
  IF invitation_data.id IS NOT NULL THEN
    -- Créer profil
    INSERT INTO public.profiles (user_id, email, full_name, tenant_id, role, created_at)
    VALUES (NEW.id, NEW.email, invitation_data.full_name, invitation_data.tenant_id, 'tenant_admin', now());
    
    -- Créer employé
    INSERT INTO public.employees (user_id, email, full_name, tenant_id, employee_id, job_title, created_at)
    VALUES (NEW.id, NEW.email, invitation_data.full_name, invitation_data.tenant_id, 'EMP' || LPAD(nextval('employee_id_seq')::text, 3, '0'), 'Tenant Administrateur', now());
    
    -- Mettre à jour invitation
    UPDATE public.invitations 
    SET status = 'accepted', accepted_at = now() 
    WHERE id = invitation_data.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`;

          await supabase.rpc('exec_sql', { sql: functionSQL });
          console.log('✅ Fonction créée');
          
          // Créer le trigger
          const triggerSQL = `
DROP TRIGGER IF EXISTS global_auto_tenant_creation_trigger_on_confirmation ON auth.users;
CREATE TRIGGER global_auto_tenant_creation_trigger_on_confirmation
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION global_auto_create_tenant_owner_on_confirmation();`;
  
          await supabase.rpc('exec_sql', { sql: triggerSQL });
          console.log('✅ Trigger créé');
          
        } catch (createError) {
          console.log('❌ Erreur création:', createError.message);
        }
      }
    } catch (error) {
      console.log('❌ Erreur fonction:', error.message);
    }

    // 6. Test final
    console.log('\n🎯 ÉTAPE 6: Test final...');
    
    try {
      const { data: finalCheck } = await supabase.rpc('exec_sql', { 
        sql: `SELECT COUNT(*) as trigger_count 
              FROM information_schema.triggers 
              WHERE event_object_schema = 'auth' 
              AND event_object_table = 'users' 
              AND trigger_name LIKE '%confirmation%';`
      });
      
      const triggerCount = finalCheck?.[0]?.trigger_count || 0;
      console.log(`Triggers de confirmation installés: ${triggerCount}`);
      
      if (triggerCount > 0) {
        console.log('🎉 TRIGGER INSTALLÉ AVEC SUCCÈS !');
      } else {
        console.log('❌ ÉCHEC INSTALLATION TRIGGER');
      }
      
    } catch (error) {
      console.log('❌ Erreur test final:', error.message);
    }

  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', error);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('⏰ Fin:', new Date().toISOString());
}

debugTriggerInstallation()
  .then(() => {
    console.log('🏁 Debug terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
