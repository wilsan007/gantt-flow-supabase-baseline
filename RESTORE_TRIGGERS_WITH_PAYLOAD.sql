-- ═══════════════════════════════════════════════════════════════════════════
-- RESTAURATION DES TRIGGERS AVEC PAYLOAD COMPLET
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 20 Novembre 2025, 21:52
-- Fix: Envoyer les données utilisateur dans le payload
-- ═══════════════════════════════════════════════════════════════════════════

-- FONCTION HELPER : Construire le payload pour handle-email-confirmation
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.trigger_handle_email_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Construire le payload au format attendu par handle-email-confirmation
  payload := jsonb_build_object(
    'type', 'UPDATE',
    'table', 'users',
    'record', to_jsonb(NEW),
    'old_record', to_jsonb(OLD),
    'schema', 'auth'
  );

  -- Appeler la fonction Edge avec le payload complet
  PERFORM supabase_functions.http_request(
    'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI"}',
    payload::text,
    '5000'
  );

  RETURN NEW;
END;
$$;

-- FONCTION HELPER : Construire le payload pour handle-collaborator-confirmation
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.trigger_handle_collaborator_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Construire le payload au format attendu
  payload := jsonb_build_object(
    'type', 'UPDATE',
    'table', 'users',
    'record', to_jsonb(NEW),
    'old_record', to_jsonb(OLD),
    'schema', 'auth'
  );

  -- Appeler la fonction Edge avec le payload complet
  PERFORM supabase_functions.http_request(
    'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-collaborator-confirmation',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI"}',
    payload::text,
    '5000'
  );

  RETURN NEW;
END;
$$;

-- TRIGGER 1: TENANT OWNER
-- ═══════════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS "auto-trigger-email-confirmation" ON auth.users;

CREATE TRIGGER "auto-trigger-email-confirmation"
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS NULL AND 
    NEW.email_confirmed_at IS NOT NULL
  )
  EXECUTE FUNCTION public.trigger_handle_email_confirmation();

-- TRIGGER 2: COLLABORATEUR
-- ═══════════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS "collaborator-confirmation-webhook" ON auth.users;

CREATE TRIGGER "collaborator-confirmation-webhook"
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS NULL AND 
    NEW.email_confirmed_at IS NOT NULL
  )
  EXECUTE FUNCTION public.trigger_handle_collaborator_confirmation();

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Résultat attendu: 2 triggers utilisant les fonctions helper
