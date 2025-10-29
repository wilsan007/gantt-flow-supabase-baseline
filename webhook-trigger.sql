-- 🔧 TRIGGER SQL POUR HANDLE-EMAIL-CONFIRMATION
-- Exécuter ce SQL dans le Dashboard Supabase > SQL Editor

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;
DROP FUNCTION IF EXISTS handle_email_confirmation_webhook();

-- Créer la fonction trigger (version corrigée)
CREATE OR REPLACE FUNCTION handle_email_confirmation_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation';
  payload JSON;
  http_request_id uuid;
BEGIN
  -- Construire le payload avec les bonnes variables
  payload := json_build_object(
    'type', 'UPDATE',
    'table', 'users',
    'schema', 'auth',
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD)
  );

  -- Appeler la fonction Edge via HTTP (version async pour éviter les blocages)
  SELECT INTO http_request_id net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
    ),
    body := payload::text
  );

  -- Log pour debug (optionnel)
  RAISE LOG 'Webhook triggered for user: %, request_id: %', NEW.email, http_request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger (version simplifiée)
CREATE TRIGGER handle_email_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    -- Déclencher seulement si email_confirmed_at change OU si raw_user_meta_data change
    OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at OR
    OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
  )
  EXECUTE FUNCTION handle_email_confirmation_webhook();
