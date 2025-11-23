-- ═══════════════════════════════════════════════════════════════════════════
-- CONFIGURATION WEBHOOK POUR CONFIRMATION EMAIL AUTOMATIQUE
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 22 Novembre 2025
-- Description: Trigger automatique qui appelle handle-email-confirmation
--              quand un utilisateur confirme son email
-- ═══════════════════════════════════════════════════════════════════════════

-- ÉTAPE 1: Créer la fonction helper
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.trigger_handle_email_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Appeler handle-email-confirmation avec les données utilisateur
  PERFORM extensions.net.http_post(
    url := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
    ),
    body := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'users',
      'record', to_jsonb(NEW),
      'old_record', to_jsonb(OLD),
      'schema', 'auth'
    )
  );

  RETURN NEW;
END;
$$;

-- ÉTAPE 2: Créer le trigger
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

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'auto-trigger-email-confirmation';

-- Résultat attendu: 1 trigger configuré
