#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const supabase = createClient(supabaseUrl, serviceKey);

async function setupWebhookAutomatic() {
  console.log('🔗 CONFIGURATION WEBHOOK AUTOMATIQUE');
  console.log('=' .repeat(50));

  try {
    // 1. Vérifier si des webhooks existent
    console.log('\n📊 1. VÉRIFICATION WEBHOOKS EXISTANTS...');
    
    // Note: L'API Supabase ne permet pas de lister les webhooks directement
    // Nous devons utiliser une approche alternative
    
    console.log('⚠️ Les webhooks ne peuvent pas être créés via API');
    console.log('📋 Configuration manuelle requise dans Supabase Dashboard');

    // 2. Alternative: Créer un trigger SQL robuste
    console.log('\n🛠️ 2. CRÉATION TRIGGER SQL ROBUSTE...');
    
    const triggerSQL = `
-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS email_confirmation_webhook_trigger ON auth.users;
DROP FUNCTION IF EXISTS handle_email_confirmation_webhook();

-- Créer une fonction qui utilise pg_notify pour déclencher l'Edge Function
CREATE OR REPLACE FUNCTION handle_email_confirmation_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_payload JSON;
BEGIN
  -- Vérifier si l'email vient d'être confirmé
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Log pour debug
    RAISE NOTICE 'Email confirmé pour: % (%), déclenchement webhook...', NEW.email, NEW.id;
    
    -- Construire le payload
    webhook_payload := json_build_object(
      'type', 'UPDATE',
      'table', 'users', 
      'schema', 'auth',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    );
    
    -- Utiliser pg_notify pour déclencher un processus externe
    PERFORM pg_notify('email_confirmed_webhook', webhook_payload::text);
    
    -- Log de succès
    RAISE NOTICE 'Webhook notification envoyée pour: %', NEW.email;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
CREATE TRIGGER email_confirmation_webhook_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_confirmation_webhook();

-- Vérifier l'installation
SELECT 
  'Trigger webhook installé avec succès' as status,
  'email_confirmation_webhook_trigger' as trigger_name;
    `;

    console.log('📝 SQL à exécuter dans Supabase Dashboard:');
    console.log('─'.repeat(50));
    console.log(triggerSQL);
    console.log('─'.repeat(50));

    // 3. Instructions pour configuration manuelle
    console.log('\n📋 3. INSTRUCTIONS CONFIGURATION MANUELLE...');
    
    console.log('🎯 OPTION A: Webhook HTTP (Recommandé)');
    console.log('1. Aller dans Supabase Dashboard > Database > Webhooks');
    console.log('2. Créer webhook:');
    console.log('   - Table: auth.users');
    console.log('   - Event: UPDATE');
    console.log('   - Condition: email_confirmed_at IS NOT NULL');
    console.log('   - URL: https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation');
    
    console.log('\n🎯 OPTION B: Trigger SQL');
    console.log('1. Copier le SQL ci-dessus');
    console.log('2. Exécuter dans Supabase Dashboard > SQL Editor');

    // 4. Test de validation
    console.log('\n🧪 4. VALIDATION APRÈS CONFIGURATION...');
    console.log('Exécutez: node test-webhook-after-config.js');

    return true;

  } catch (error) {
    console.error('💥 Erreur:', error);
    return false;
  }
}

setupWebhookAutomatic()
  .then(success => {
    if (success) {
      console.log('\n✅ INSTRUCTIONS FOURNIES');
      console.log('Configurez le webhook manuellement puis testez');
    } else {
      console.log('\n❌ ERREUR CONFIGURATION');
    }
  });
