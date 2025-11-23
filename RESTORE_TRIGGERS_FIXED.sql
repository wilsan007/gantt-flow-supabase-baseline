-- ═══════════════════════════════════════════════════════════════════════════
-- RESTAURATION DES TRIGGERS - VERSION CORRIGÉE
-- ═══════════════════════════════════════════════════════════════════════════

-- Supprimer les anciens triggers et fonctions
DROP TRIGGER IF EXISTS "auto-trigger-email-confirmation" ON auth.users;
DROP TRIGGER IF EXISTS "collaborator-confirmation-webhook" ON auth.users;
DROP FUNCTION IF EXISTS public.trigger_handle_email_confirmation();
DROP FUNCTION IF EXISTS public.trigger_handle_collaborator_confirmation();

-- FONCTION 1 : Trigger pour tenant owner
CREATE OR REPLACE FUNCTION public.trigger_handle_email_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  v_payload text;
BEGIN
  -- Construire le payload JSON
  v_payload := json_build_object(
    'type', 'UPDATE',
    'table', 'users',
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD),
    'schema', 'auth'
  )::text;

  -- Appeler la fonction Edge
  PERFORM net.http_post(
    url := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
    ),
    body := v_payload::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FONCTION 2 : Trigger pour collaborateur
CREATE OR REPLACE FUNCTION public.trigger_handle_collaborator_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  v_payload text;
BEGIN
  v_payload := json_build_object(
    'type', 'UPDATE',
    'table', 'users',
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD),
    'schema', 'auth'
  )::text;

  PERFORM net.http_post(
    url := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-collaborator-confirmation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
    ),
    body := v_payload::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRÉER TRIGGER 1 : Tenant Owner
CREATE TRIGGER "auto-trigger-email-confirmation"
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.trigger_handle_email_confirmation();

-- CRÉER TRIGGER 2 : Collaborateur
CREATE TRIGGER "collaborator-confirmation-webhook"
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.trigger_handle_collaborator_confirmation();

-- VÉRIFICATION
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Résultat attendu: 2 lignes
