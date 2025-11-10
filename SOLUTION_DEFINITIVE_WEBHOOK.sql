-- ================================================================
-- SOLUTION DÉFINITIVE: WEBHOOK AUTOMATIQUE POUR INVITATIONS
-- ================================================================
-- 
-- Ce script crée un webhook qui déclenche automatiquement
-- l'Edge Function handle-email-confirmation quand un utilisateur
-- confirme son email via Magic Link
--
-- À EXÉCUTER DANS: Supabase SQL Editor
-- ================================================================

-- 1. Activer l'extension HTTP pour les webhooks
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Créer une table pour stocker les logs du webhook (optionnel mais utile)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_name TEXT NOT NULL,
    user_id UUID,
    status TEXT,
    request_payload JSONB,
    response_payload JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Créer la fonction qui appelle l'Edge Function
CREATE OR REPLACE FUNCTION public.trigger_email_confirmation_webhook()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    webhook_url TEXT := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation';
    service_role_key TEXT;
    payload JSONB;
    http_response extensions.http_response;
    is_invitation_user BOOLEAN;
    log_id UUID;
BEGIN
    -- Récupérer la Service Role Key depuis les settings
    -- IMPORTANT: Vous devez la configurer avec:
    -- ALTER DATABASE postgres SET app.settings.service_role_key = 'votre_clé';
    BEGIN
        service_role_key := current_setting('app.settings.service_role_key', true);
    EXCEPTION
        WHEN OTHERS THEN
            service_role_key := NULL;
    END;

    -- Vérifier si c'est un utilisateur d'invitation
    is_invitation_user := (
        NEW.raw_user_meta_data->>'invitation_type' = 'tenant_owner' OR
        NEW.raw_user_meta_data->>'invitation_type' = 'collaborator'
    );
    
    -- Ne déclencher QUE pour les invitations dont l'email vient d'être confirmé
    IF is_invitation_user AND 
       NEW.email_confirmed_at IS NOT NULL AND 
       (OLD.email_confirmed_at IS NULL OR 
        OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at) THEN
        
        -- Construire le payload
        payload := jsonb_build_object(
            'type', 'UPDATE',
            'table', 'users',
            'schema', 'auth',
            'record', to_jsonb(NEW),
            'old_record', to_jsonb(OLD)
        );
        
        -- Logger le déclenchement
        RAISE NOTICE 'Webhook déclenché pour utilisateur: % (invitation: %)', 
            NEW.email, 
            NEW.raw_user_meta_data->>'invitation_id';
        
        -- Créer un log
        INSERT INTO public.webhook_logs (webhook_name, user_id, status, request_payload)
        VALUES ('email_confirmation', NEW.id, 'triggered', payload)
        RETURNING id INTO log_id;
        
        -- Appeler l'Edge Function via HTTP
        IF service_role_key IS NOT NULL THEN
            BEGIN
                SELECT * INTO http_response
                FROM extensions.http((
                    'POST',
                    webhook_url,
                    ARRAY[
                        extensions.http_header('Content-Type', 'application/json'),
                        extensions.http_header('Authorization', 'Bearer ' || service_role_key)
                    ],
                    'application/json',
                    payload::text
                )::extensions.http_request);
                
                -- Mettre à jour le log avec la réponse
                UPDATE public.webhook_logs
                SET 
                    status = CASE 
                        WHEN http_response.status BETWEEN 200 AND 299 THEN 'success'
                        ELSE 'error'
                    END,
                    response_payload = http_response.content::jsonb
                WHERE id = log_id;
                
                RAISE NOTICE 'Webhook réponse: status=%, content=%', 
                    http_response.status, 
                    http_response.content;
                    
            EXCEPTION
                WHEN OTHERS THEN
                    -- Logger l'erreur
                    UPDATE public.webhook_logs
                    SET 
                        status = 'error',
                        error_message = SQLERRM
                    WHERE id = log_id;
                    
                    RAISE WARNING 'Erreur webhook: %', SQLERRM;
            END;
        ELSE
            -- Service Role Key non configurée
            UPDATE public.webhook_logs
            SET 
                status = 'error',
                error_message = 'Service Role Key non configurée'
            WHERE id = log_id;
            
            RAISE WARNING 'Service Role Key non configurée. Configurez avec: ALTER DATABASE postgres SET app.settings.service_role_key = ''votre_clé'';';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4. Créer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (
        NEW.email_confirmed_at IS NOT NULL AND
        (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
    )
    EXECUTE FUNCTION public.trigger_email_confirmation_webhook();

-- 5. Configurer la Service Role Key
-- IMPORTANT: Remplacez 'VOTRE_SERVICE_ROLE_KEY' par votre vraie clé
-- Vous la trouverez dans: Supabase Dashboard > Settings > API > service_role (secret)
ALTER DATABASE postgres SET app.settings.service_role_key = 'VOTRE_SERVICE_ROLE_KEY';

-- 6. Vérification
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_email_confirmed';

-- ================================================================
-- LOGS ET MONITORING
-- ================================================================

-- Pour voir les logs des webhooks:
-- SELECT * FROM public.webhook_logs ORDER BY created_at DESC LIMIT 10;

-- Pour voir les webhooks qui ont échoué:
-- SELECT * FROM public.webhook_logs WHERE status = 'error' ORDER BY created_at DESC;

-- Pour nettoyer les vieux logs (optionnel):
-- DELETE FROM public.webhook_logs WHERE created_at < NOW() - INTERVAL '30 days';

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================

-- NOTES IMPORTANTES:
-- 1. Vous DEVEZ remplacer 'VOTRE_SERVICE_ROLE_KEY' à l'étape 5
-- 2. Ce webhook se déclenchera automatiquement pour TOUTES les futures invitations
-- 3. Les logs sont stockés dans public.webhook_logs pour le debugging
-- 4. Le trigger ne se déclenche QUE quand email_confirmed_at change (Magic Link cliqué)
