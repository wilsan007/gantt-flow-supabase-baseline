-- Migration: Webhook pour handle-collaborator-confirmation
-- Date: 2025-11-10
-- Description: Trigger automatique pour appeler handle-collaborator-confirmation quand un collaborateur confirme son email

-- ============================================================================
-- FONCTION WEBHOOK: Appelle handle-collaborator-confirmation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_collaborator_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_url TEXT := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-collaborator-confirmation';
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODA5OTMyOSwiZXhwIjoyMDQzNjc1MzI5fQ.vfVFd-wPEjh6n5EjstZ6fKKoTM_5aCPITbhZ7n4Xkx0';
  payload JSONB;
  http_request_id BIGINT;
BEGIN
  -- Log
  RAISE NOTICE '🚀 Webhook collaborator-confirmation: user_id=%, email=%', NEW.id, NEW.email;
  
  -- Construire le payload
  payload := jsonb_build_object(
    'type', 'UPDATE',
    'table', 'users',
    'schema', 'auth',
    'record', row_to_json(NEW)::jsonb,
    'old_record', row_to_json(OLD)::jsonb
  );
  
  -- Appeler le webhook via pg_net
  SELECT INTO http_request_id net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := payload::text
  );
  
  RAISE NOTICE '✅ Webhook envoyé, request_id=%', http_request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Ne pas bloquer la transaction si le webhook échoue
    RAISE WARNING '⚠️ Erreur webhook collaborator-confirmation: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- TRIGGER: Déclenche sur confirmation email collaborateur
-- ============================================================================

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_collaborator_email_confirmed ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_collaborator_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    -- email_confirmed_at vient d'être défini
    OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at
    AND NEW.email_confirmed_at IS NOT NULL
    -- C'est un collaborateur
    AND NEW.raw_user_meta_data->>'invitation_type' = 'collaborator'
    -- Pas encore traité
    AND (NEW.raw_user_meta_data->>'collaborator_confirmed_automatically' IS NULL 
         OR NEW.raw_user_meta_data->>'collaborator_confirmed_automatically' = 'false')
  )
  EXECUTE FUNCTION public.trigger_collaborator_confirmation();

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

-- Commentaires
COMMENT ON FUNCTION public.trigger_collaborator_confirmation() IS 
'Appelle automatiquement handle-collaborator-confirmation quand un collaborateur confirme son email via Magic Link';

COMMENT ON TRIGGER on_collaborator_email_confirmed ON auth.users IS
'Déclenche la création du profil et employé pour les collaborateurs après confirmation email';
