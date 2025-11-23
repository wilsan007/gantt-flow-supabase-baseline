-- ═══════════════════════════════════════════════════════════════════════════
-- RESTAURATION DES TRIGGERS AUTOMATIQUES
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 20 Novembre 2025, 20:45
-- Objectif: Revenir au système automatique qui fonctionnait
-- ═══════════════════════════════════════════════════════════════════════════

-- TRIGGER 1: Auto-trigger pour confirmation email (TENANT OWNER)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE TRIGGER "auto-trigger-email-confirmation"
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS NULL AND 
    NEW.email_confirmed_at IS NOT NULL
  )
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI"}',
    '{}',
    '5000'
  );

-- TRIGGER 2: Auto-trigger pour confirmation email (COLLABORATEUR)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE TRIGGER "collaborator-confirmation-webhook"
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS NULL AND 
    NEW.email_confirmed_at IS NOT NULL
  )
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-collaborator-confirmation',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI"}',
    '{}',
    '5000'
  );

-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Résultat attendu: 2 triggers actifs
