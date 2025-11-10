-- ================================================================
-- SOLUTION ALTERNATIVE: WEBHOOK AVEC PG_NET
-- ================================================================
-- Utilise pg_net au lieu de stocker la clé dans les paramètres DB
-- ================================================================

-- 1. Activer l'extension pg_net (extension HTTP moderne de Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Créer une table pour les logs
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_name TEXT NOT NULL,
    user_id UUID,
    user_email TEXT,
    invitation_id UUID,
    status TEXT,
    http_status_code INTEGER,
    request_payload JSONB,
    response_body TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON public.webhook_logs(user_id);

-- 3. Fonction trigger avec pg_net
CREATE OR REPLACE FUNCTION public.trigger_email_confirmation_webhook()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    webhook_url TEXT := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation';
    -- ⚠️ REMPLACEZ PAR VOTRE SERVICE ROLE KEY
    service_role_key TEXT := 'VOTRE_SERVICE_ROLE_KEY_ICI';
    payload JSONB;
    request_id BIGINT;
    is_invitation_user BOOLEAN;
    log_id UUID;
    invitation_id_value UUID;
BEGIN
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
        
        -- Extraire l'invitation_id
        BEGIN
            invitation_id_value := (NEW.raw_user_meta_data->>'invitation_id')::UUID;
        EXCEPTION
            WHEN OTHERS THEN
                invitation_id_value := NULL;
        END;
        
        -- Construire le payload
        payload := jsonb_build_object(
            'type', 'UPDATE',
            'table', 'users',
            'schema', 'auth',
            'record', to_jsonb(NEW),
            'old_record', to_jsonb(OLD)
        );
        
        -- Logger le déclenchement
        RAISE NOTICE '🔔 Webhook déclenché pour: % (type: %, invitation: %)', 
            NEW.email,
            NEW.raw_user_meta_data->>'invitation_type',
            invitation_id_value;
        
        -- Créer un log initial
        INSERT INTO public.webhook_logs (
            webhook_name, 
            user_id, 
            user_email,
            invitation_id,
            status, 
            request_payload
        )
        VALUES (
            'email_confirmation',
            NEW.id,
            NEW.email,
            invitation_id_value,
            'triggered',
            payload
        )
        RETURNING id INTO log_id;
        
        -- Appeler l'Edge Function via pg_net
        BEGIN
            SELECT extensions.http_post(
                url := webhook_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || service_role_key
                ),
                body := payload
            ) INTO request_id;
            
            -- Mettre à jour le log avec le request_id
            UPDATE public.webhook_logs
            SET 
                status = 'sent',
                request_payload = request_payload || jsonb_build_object('request_id', request_id)
            WHERE id = log_id;
            
            RAISE NOTICE '✅ Requête HTTP envoyée (request_id: %)', request_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Logger l'erreur
                UPDATE public.webhook_logs
                SET 
                    status = 'error',
                    error_message = SQLERRM
                WHERE id = log_id;
                
                RAISE WARNING '❌ Erreur webhook: %', SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4. Créer le trigger
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (
        NEW.email_confirmed_at IS NOT NULL AND
        (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
    )
    EXECUTE FUNCTION public.trigger_email_confirmation_webhook();

-- 5. Vérification
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_email_confirmed';

-- ================================================================
-- COMMANDES UTILES
-- ================================================================

-- Voir les webhooks récents
-- SELECT * FROM public.webhook_logs ORDER BY created_at DESC LIMIT 10;

-- Voir les webhooks en erreur
-- SELECT * FROM public.webhook_logs WHERE status = 'error' ORDER BY created_at DESC;

-- Voir les webhooks pour un utilisateur spécifique
-- SELECT * FROM public.webhook_logs WHERE user_email = 'wilwaalnabad@gmail.com';

-- Nettoyer les vieux logs (> 30 jours)
-- DELETE FROM public.webhook_logs WHERE created_at < NOW() - INTERVAL '30 days';

-- ================================================================
-- ⚠️ IMPORTANT
-- ================================================================
-- N'OUBLIEZ PAS DE REMPLACER 'VOTRE_SERVICE_ROLE_KEY_ICI' 
-- par votre vraie Service Role Key à la ligne 36 !
-- 
-- Trouvez-la sur:
-- https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/settings/api
-- Section: Project API keys > service_role (secret)
-- ================================================================
