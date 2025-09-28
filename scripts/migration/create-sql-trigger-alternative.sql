-- SOLUTION ALTERNATIVE: TRIGGER SQL AU LIEU DE WEBHOOK HTTP
-- À exécuter dans Supabase Dashboard > SQL Editor si le webhook HTTP ne fonctionne pas

-- 1. Activer l'extension http pour faire des requêtes
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Créer la fonction trigger
CREATE OR REPLACE FUNCTION handle_email_confirmation_sql_trigger()
RETURNS TRIGGER AS $$
DECLARE
  response_status INTEGER;
  response_content TEXT;
BEGIN
  -- Vérifier si email vient d'être confirmé
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    RAISE NOTICE 'Email confirmé pour: % (%), déclenchement Edge Function...', NEW.email, NEW.id;
    
    -- Appeler l'Edge Function via HTTP
    SELECT status, content INTO response_status, response_content
    FROM http_post(
      'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation',
      jsonb_build_object(
        'type', 'UPDATE',
        'table', 'users',
        'schema', 'auth',
        'record', jsonb_build_object(
          'id', NEW.id,
          'email', NEW.email,
          'email_confirmed_at', NEW.email_confirmed_at,
          'created_at', NEW.created_at
        ),
        'old_record', jsonb_build_object(
          'id', OLD.id,
          'email', OLD.email,
          'email_confirmed_at', OLD.email_confirmed_at,
          'created_at', OLD.created_at
        )
      ),
      'application/json',
      jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
      )
    );
    
    RAISE NOTICE 'Edge Function appelée - Status: %, Response: %', response_status, response_content;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS email_confirmation_sql_trigger ON auth.users;

-- 4. Créer le nouveau trigger
CREATE TRIGGER email_confirmation_sql_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_confirmation_sql_trigger();

-- 5. Test du trigger
SELECT 'Trigger SQL créé avec succès - Alternative au webhook HTTP' as status;
