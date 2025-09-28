-- Configuration du webhook pour déclencher l'Edge Function sur confirmation email
-- À exécuter dans le SQL Editor de Supabase

-- Active l'extension pg_net si elle ne l'est pas déjà
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Créer une fonction qui appelle l'Edge Function via HTTP

CREATE OR REPLACE FUNCTION notify_email_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
BEGIN
  -- Vérifier que c'est une confirmation d'email
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- URL de l'Edge Function
    webhook_url := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation';
    
    -- Payload à envoyer
    payload := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'email_confirmed_at', NEW.email_confirmed_at
      )
    );
    
    -- Appel HTTP asynchrone (nécessite l'extension pg_net)
    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
      ),
      body := payload
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS email_confirmation_webhook_trigger ON auth.users;
CREATE TRIGGER email_confirmation_webhook_trigger
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_email_confirmation();

-- Vérifier que l'extension pg_net est activée
-- Si pas activée, l'activer avec : CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT 'Webhook configuré pour déclencher Edge Function sur confirmation email' as status;
