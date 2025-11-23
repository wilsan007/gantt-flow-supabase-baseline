-- ============================================================================
-- RESTAURATION DU WEBHOOK DE CONFIRMATION D'EMAIL
-- ============================================================================
-- Date: 23 novembre 2025
-- Raison: Restaurer le trigger automatique pour les invitations tenant_owner
-- Ce trigger appelle la Edge Function handle-email-confirmation lors de la
-- confirmation d'email, ce qui permet de créer automatiquement le tenant et
-- le profil pour les tenant owners.
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: CRÉER LA FONCTION DE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_email_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT;
  payload JSON;
  http_result RECORD;
  service_role_key TEXT;
BEGIN
  -- Vérifier si l'email vient d'être confirmé
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Log pour debug
    RAISE NOTICE '✅ Email confirmé pour: % (%), déclenchement Edge Function...', NEW.email, NEW.id;
    
    -- Construire l'URL du webhook (local ou production)
    -- Pour local (Docker interne): http://kong:8000/functions/v1/handle-email-confirmation
    -- Pour production: https://[PROJECT_REF].supabase.co/functions/v1/handle-email-confirmation
    webhook_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/handle-email-confirmation';
    
    -- Si la variable n'est pas définie ou semble locale, utiliser l'URL interne Docker
    IF webhook_url IS NULL OR webhook_url = '/functions/v1/handle-email-confirmation' OR webhook_url LIKE '%localhost%' THEN
      -- Utiliser le nom de service interne 'kong' qui est standard dans Supabase Docker
      webhook_url := 'http://kong:8000/functions/v1/handle-email-confirmation';
    END IF;
    
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
        
        -- Récupérer la clé service_role depuis les paramètres
        service_role_key := current_setting('app.settings.service_role_key', true);
        
        -- Clé par défaut pour le développement local
        -- ATTENTION : Ne jamais commiter de vraies clés ici.
        -- En local, assurez-vous que app.settings.service_role_key est défini dans postgresql.conf ou via ALTER SYSTEM
        -- Sinon, le header Authorization sera vide ou incorrect, ce qui est préférable à une fuite de secret.
        IF service_role_key IS NULL THEN
          service_role_key := 'SERVICE_ROLE_KEY_NOT_SET'; 
        END IF;
        
        SELECT * INTO http_result
        FROM http((
          'POST',
          webhook_url,
          ARRAY[
            http_header('Authorization', 'Bearer ' || service_role_key),
            http_header('Content-Type', 'application/json'),
            http_header('apikey', service_role_key)
          ],
          'application/json',
          payload::text
        ));
        
        RAISE NOTICE '📡 Edge Function appelée via HTTP, status: %', http_result.status;
        
        -- Vérifier le statut de la réponse
        IF http_result.status >= 400 THEN
          RAISE WARNING '⚠️ Erreur HTTP lors de l''appel à la Edge Function: status %, body: %', 
            http_result.status, http_result.content;
        END IF;
        
      ELSE
        -- Fallback: utiliser pg_notify si l'extension HTTP n'est pas disponible
        RAISE NOTICE '⚠️ Extension HTTP non disponible, utilisation de pg_notify';
        PERFORM pg_notify('email_confirmed', payload::text);
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- En cas d'erreur, logger mais ne pas faire échouer la transaction
      RAISE WARNING '❌ Erreur lors de l''appel au webhook: %', SQLERRM;
      -- Essayer pg_notify en fallback
      BEGIN
        PERFORM pg_notify('email_confirmed', payload::text);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '❌ Impossible d''envoyer la notification: %', SQLERRM;
      END;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- ÉTAPE 2: AJOUTER UN COMMENTAIRE À LA FONCTION
-- ============================================================================

COMMENT ON FUNCTION public.notify_email_confirmation() IS 
'Trigger function qui appelle la Edge Function handle-email-confirmation 
lorsqu''un utilisateur confirme son email. Utilisé pour créer automatiquement
les tenants et profils pour les invitations tenant_owner.';

-- ============================================================================
-- ÉTAPE 3: CRÉER LE TRIGGER SUR auth.users
-- ============================================================================

-- Supprimer le trigger s'il existe déjà (idempotence)
DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;

-- Créer le nouveau trigger
CREATE TRIGGER handle_email_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.notify_email_confirmation();

-- ============================================================================
-- ÉTAPE 4: ACCORDER LES PERMISSIONS
-- ============================================================================

-- Permissions sur la fonction
GRANT EXECUTE ON FUNCTION public.notify_email_confirmation() TO postgres;
GRANT EXECUTE ON FUNCTION public.notify_email_confirmation() TO service_role;

-- ============================================================================
-- ÉTAPE 5: VÉRIFICATION
-- ============================================================================

DO $$
DECLARE
  trigger_count INTEGER := 0;
  function_exists BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'VÉRIFICATION DE LA CONFIGURATION';
  RAISE NOTICE '================================================';
  
  -- Vérifier que la fonction existe
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'notify_email_confirmation'
  ) INTO function_exists;
  
  IF function_exists THEN
    RAISE NOTICE '✅ Fonction notify_email_confirmation() créée avec succès';
  ELSE
    RAISE WARNING '❌ La fonction notify_email_confirmation() n''existe pas';
  END IF;
  
  -- Vérifier que le trigger existe
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_schema = 'auth'
    AND event_object_table = 'users'
    AND trigger_name = 'handle_email_confirmation_trigger';
  
  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ Trigger handle_email_confirmation_trigger créé avec succès';
    RAISE NOTICE '   - Table: auth.users';
    RAISE NOTICE '   - Event: AFTER UPDATE';
    RAISE NOTICE '   - Condition: email_confirmed_at change de NULL à une date';
  ELSE
    RAISE WARNING '❌ Le trigger handle_email_confirmation_trigger n''existe pas';
  END IF;
  
  -- Afficher l'extension HTTP
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
    RAISE NOTICE '✅ Extension HTTP disponible pour les appels webhook';
  ELSE
    RAISE NOTICE '⚠️ Extension HTTP non disponible (utilisation de pg_notify en fallback)';
  END IF;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Configuration terminée !';
  RAISE NOTICE '================================================';
END $$;

-- ============================================================================
-- NOTES D'UTILISATION
-- ============================================================================

/*
IMPORTANT: Configuration requise pour la production
----------------------------------------------------

1. Définir les variables de configuration dans Supabase Dashboard:
   - app.settings.supabase_url = https://[PROJECT_REF].supabase.co
   - app.settings.service_role_key = [VOTRE_SERVICE_ROLE_KEY]

2. Installer l'extension HTTP (si pas déjà fait):
   CREATE EXTENSION IF NOT EXISTS http;

3. Tester le webhook:
   - Créer une invitation tenant_owner
   - Accepter l'invitation et confirmer l'email
   - Vérifier les logs dans Supabase Dashboard > Database > Logs
   - Vérifier que le tenant et le profil sont créés

4. Pour développement local:
   Le script utilise http://127.0.0.1:8081 par défaut pour Supabase local

5. Dépannage:
   - Vérifier les logs Postgres: Dashboard > Database > Logs
   - Vérifier les logs Edge Function: supabase functions logs handle-email-confirmation
   - Vérifier que la table invitations contient l'invitation avec invitation_type='tenant_owner'
*/
