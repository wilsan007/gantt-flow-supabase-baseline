#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const supabase = createClient(supabaseUrl, serviceKey);

async function checkTriggersAndFix() {
  console.log('🔍 VÉRIFICATION TRIGGERS ET CORRECTION');
  console.log('=' .repeat(50));

  try {
    // 1. Vérifier si les triggers existent en utilisant une requête directe
    console.log('\n🎯 1. VÉRIFICATION TRIGGERS EXISTANTS...');
    
    const checkQuery = `
      SELECT 
        t.trigger_name,
        t.event_manipulation,
        t.action_timing,
        t.action_statement,
        p.proname as function_name
      FROM information_schema.triggers t
      LEFT JOIN pg_proc p ON p.oid = t.action_statement::regproc
      WHERE t.event_object_schema = 'auth' 
        AND t.event_object_table = 'users'
      ORDER BY t.trigger_name;
    `;

    // Exécuter via une requête SQL directe
    const { data: triggerResult, error: triggerError } = await supabase
      .from('pg_stat_activity')
      .select('*')
      .limit(0); // Juste pour tester la connexion

    console.log('📋 Connexion DB OK, vérifions les triggers...');

    // 2. Vérifier les fonctions existantes
    console.log('\n🔧 2. VÉRIFICATION FONCTIONS...');
    
    const checkFunctionsQuery = `
      SELECT 
        proname as function_name,
        prosrc as function_body
      FROM pg_proc 
      WHERE proname LIKE '%email%' OR proname LIKE '%notification%'
      ORDER BY proname;
    `;

    console.log('ℹ️ Impossible de vérifier directement via l\'API, utilisons SQL...');

  } catch (error) {
    console.log('❌ Erreur vérification:', error.message);
  }

  // 3. Recréer les triggers avec une approche différente
  console.log('\n🛠️ 3. CRÉATION TRIGGER AVEC WEBHOOK HTTP...');
  
  const createTriggerSQL = `
-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS email_confirmation_trigger ON auth.users;
DROP FUNCTION IF EXISTS notify_email_confirmation();

-- Créer une fonction qui appelle l'Edge Function via HTTP
CREATE OR REPLACE FUNCTION notify_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT;
  payload JSON;
  result TEXT;
BEGIN
  -- Vérifier si l'email vient d'être confirmé
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- URL de l'Edge Function
    webhook_url := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation';
    
    -- Construire le payload
    payload := json_build_object(
      'type', 'UPDATE',
      'table', 'users',
      'schema', 'auth',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    );
    
    -- Log pour debug
    RAISE NOTICE 'Email confirmé pour: % (%), déclenchement Edge Function...', NEW.email, NEW.id;
    
    -- Appeler l'Edge Function via HTTP (nécessite l'extension http)
    BEGIN
      SELECT content INTO result
      FROM http((
        'POST',
        webhook_url,
        ARRAY[
          http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'),
          http_header('Content-Type', 'application/json'),
          http_header('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI')
        ],
        'application/json',
        payload::text
      ));
      
      RAISE NOTICE 'Edge Function appelée avec succès: %', result;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erreur appel Edge Function: %', SQLERRM;
      
      -- Fallback: utiliser pg_notify
      PERFORM pg_notify('email_confirmed', payload::text);
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
CREATE TRIGGER email_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_email_confirmation();

-- Vérifier l'installation
SELECT 'Trigger installé avec succès' as status;
  `;

  console.log('📝 SQL à exécuter dans Supabase Dashboard > SQL Editor:');
  console.log('─'.repeat(50));
  console.log(createTriggerSQL);
  console.log('─'.repeat(50));

  // 4. Alternative: utiliser pg_notify + listener
  console.log('\n🔄 4. ALTERNATIVE: SYSTÈME PG_NOTIFY...');
  
  const simpleNotifySQL = `
-- Version simple avec pg_notify
DROP TRIGGER IF EXISTS email_confirmation_trigger ON auth.users;
DROP FUNCTION IF EXISTS notify_email_confirmation();

CREATE OR REPLACE FUNCTION notify_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    RAISE NOTICE 'Email confirmé: % (%)', NEW.email, NEW.id;
    
    PERFORM pg_notify('email_confirmed', json_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'confirmed_at', NEW.email_confirmed_at
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER email_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_email_confirmation();
  `;

  console.log('\n📝 SQL SIMPLE (pg_notify):');
  console.log('─'.repeat(30));
  console.log(simpleNotifySQL);
  console.log('─'.repeat(30));

  console.log('\n🎯 INSTRUCTIONS:');
  console.log('1. Copier l\'un des SQL ci-dessus');
  console.log('2. Aller dans Supabase Dashboard > SQL Editor');
  console.log('3. Coller et exécuter le SQL');
  console.log('4. Tester avec: node test-trigger-after-install.js');
}

checkTriggersAndFix();
