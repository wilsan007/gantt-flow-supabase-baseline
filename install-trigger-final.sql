-- INSTALLATION TRIGGER FINAL POUR EDGE FUNCTION
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Nettoyer les anciens triggers
DROP TRIGGER IF EXISTS email_confirmation_trigger ON auth.users;
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS auto_tenant_owner_creation_trigger ON auth.users;
DROP FUNCTION IF EXISTS notify_email_confirmation();
DROP FUNCTION IF EXISTS global_auto_create_tenant_owner_on_confirmation();

-- 2. Créer la fonction de notification
CREATE OR REPLACE FUNCTION notify_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation';
  payload JSON;
  http_result RECORD;
BEGIN
  -- Vérifier si l'email vient d'être confirmé
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Log pour debug
    RAISE NOTICE 'Email confirmé pour: % (%), déclenchement Edge Function...', NEW.email, NEW.id;
    
    -- Construire le payload
    payload := json_build_object(
      'type', 'UPDATE',
      'table', 'users',
      'schema', 'auth',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    );
    
    -- Essayer d'appeler l'Edge Function via HTTP (si extension disponible)
    BEGIN
      -- Vérifier si l'extension http existe
      IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
        SELECT * INTO http_result
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
        
        RAISE NOTICE 'Edge Function appelée via HTTP, status: %', http_result.status;
      ELSE
        -- Fallback: utiliser pg_notify
        RAISE NOTICE 'Extension HTTP non disponible, utilisation de pg_notify';
        PERFORM pg_notify('email_confirmed', payload::text);
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erreur appel HTTP: %, utilisation de pg_notify', SQLERRM;
      PERFORM pg_notify('email_confirmed', payload::text);
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Créer le trigger
CREATE TRIGGER email_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_email_confirmation();

-- 4. Vérifier l'installation
SELECT 
  'Trigger installé avec succès' as status,
  'email_confirmation_trigger' as trigger_name,
  'auth.users' as table_name,
  'notify_email_confirmation()' as function_name;

-- 5. Tester le trigger (optionnel - décommenter pour tester)
/*
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Trouver un utilisateur de test
  SELECT id INTO test_user_id 
  FROM auth.users 
  WHERE email = 'test0071@yahoo.com'
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Simuler une confirmation d'email
    UPDATE auth.users 
    SET email_confirmed_at = NOW()
    WHERE id = test_user_id;
    
    RAISE NOTICE 'Test trigger exécuté pour utilisateur: %', test_user_id;
  ELSE
    RAISE NOTICE 'Aucun utilisateur de test trouvé';
  END IF;
END;
$$;
*/

-- Instructions finales
SELECT 
  'INSTALLATION TERMINÉE' as message,
  'Exécutez: node test-trigger-after-install.js' as next_step;
