-- =====================================================
-- CONFIGURATION DES TRIGGERS ET WEBHOOKS
-- À exécuter dans Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. TRIGGER POUR NETTOYER LES INVITATIONS EXPIRÉES
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_invitations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Nettoyer les invitations expirées à chaque insertion
  PERFORM cleanup_expired_invitations();
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS cleanup_expired_invitations_trigger ON invitations;
CREATE TRIGGER cleanup_expired_invitations_trigger
  AFTER INSERT ON invitations
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_expired_invitations();

-- 2. TRIGGER POUR LOGGER LES ÉVÉNEMENTS D'ONBOARDING
-- =====================================================
CREATE TABLE IF NOT EXISTS onboarding_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  invitation_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_onboarding_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Logger les changements de statut d'invitation
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO onboarding_logs (
      invitation_id,
      user_id,
      event_type,
      event_data
    ) VALUES (
      NEW.id,
      (NEW.metadata->>'supabase_user_id')::uuid,
      'invitation_status_changed',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'email', NEW.email,
        'tenant_name', NEW.tenant_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS log_invitation_changes_trigger ON invitations;
CREATE TRIGGER log_invitation_changes_trigger
  AFTER UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION log_onboarding_event();

-- 3. FONCTION POUR CONFIGURER LE WEBHOOK AUTH
-- =====================================================
CREATE OR REPLACE FUNCTION setup_auth_webhook()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cette fonction retourne les instructions pour configurer le webhook
  RETURN 'Configurez le webhook Auth dans Supabase Dashboard:
  
1. Allez dans Authentication > Settings > Webhooks
2. Ajoutez un nouveau webhook avec:
   - URL: https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/webhook-auth-handler
   - Events: user.created, user.updated
   - Secret: [générez un secret sécurisé]
   
3. Ou utilisez la commande CLI:
   supabase secrets set WEBHOOK_SECRET="votre-secret-ici"
   
4. Testez avec:
   curl -X POST https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/webhook-auth-handler \
     -H "Content-Type: application/json" \
     -d "{\"type\":\"user.created\",\"record\":{\"id\":\"test\",\"email\":\"test@example.com\"}}"';
END;
$$;

-- 4. VUES POUR MONITORING
-- =====================================================

-- Vue pour surveiller les invitations
CREATE OR REPLACE VIEW invitation_status_summary AS
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7_days
FROM invitations
GROUP BY status;

-- Vue pour surveiller l'onboarding
CREATE OR REPLACE VIEW onboarding_metrics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_invitations,
  COUNT(*) FILTER (WHERE status = 'accepted') as successful_onboardings,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_invitations,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_onboardings,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'accepted') * 100.0 / NULLIF(COUNT(*), 0), 
    2
  ) as success_rate_percent
FROM invitations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 5. FONCTION DE DIAGNOSTIC
-- =====================================================
CREATE OR REPLACE FUNCTION diagnose_onboarding_system()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_functions_count integer;
  v_triggers_count integer;
  v_recent_invitations integer;
  v_pending_invitations integer;
BEGIN
  -- Compter les fonctions
  SELECT COUNT(*) INTO v_functions_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN ('is_super_admin', 'onboard_tenant_owner', 'validate_invitation');
  
  -- Compter les triggers
  SELECT COUNT(*) INTO v_triggers_count
  FROM pg_trigger
  WHERE tgname IN ('cleanup_expired_invitations_trigger', 'log_invitation_changes_trigger');
  
  -- Compter les invitations récentes
  SELECT COUNT(*) INTO v_recent_invitations
  FROM invitations
  WHERE created_at > NOW() - INTERVAL '24 hours';
  
  -- Compter les invitations en attente
  SELECT COUNT(*) INTO v_pending_invitations
  FROM invitations
  WHERE status = 'pending' AND expires_at > NOW();
  
  v_result := json_build_object(
    'system_health', json_build_object(
      'functions_installed', v_functions_count,
      'triggers_active', v_triggers_count,
      'recent_invitations_24h', v_recent_invitations,
      'pending_invitations', v_pending_invitations
    ),
    'recommendations', CASE 
      WHEN v_functions_count < 3 THEN 'Exécutez create-complete-sql-functions.sql'
      WHEN v_triggers_count < 2 THEN 'Exécutez setup-webhooks-and-triggers.sql'
      ELSE 'Système opérationnel'
    END,
    'next_steps', ARRAY[
      'Déployez webhook-auth-handler: supabase functions deploy webhook-auth-handler',
      'Configurez le webhook Auth dans Supabase Dashboard',
      'Testez avec test-complete-workflow.js'
    ]
  );
  
  RETURN v_result;
END;
$$;

-- 6. PERMISSIONS
-- =====================================================
GRANT SELECT ON invitation_status_summary TO authenticated;
GRANT SELECT ON onboarding_metrics TO authenticated;
GRANT SELECT ON onboarding_logs TO authenticated;
GRANT EXECUTE ON FUNCTION setup_auth_webhook() TO authenticated;
GRANT EXECUTE ON FUNCTION diagnose_onboarding_system() TO authenticated;

-- =====================================================
-- INSTRUCTIONS DE DÉPLOIEMENT
-- =====================================================

-- Exécutez cette requête pour voir le statut du système:
-- SELECT diagnose_onboarding_system();

-- Exécutez cette requête pour voir les instructions webhook:
-- SELECT setup_auth_webhook();

-- =====================================================
-- FIN DE LA CONFIGURATION
-- =====================================================
