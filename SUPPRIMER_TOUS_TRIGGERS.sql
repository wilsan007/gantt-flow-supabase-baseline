-- ============================================================================
-- SUPPRESSION COMPLÈTE DES 6 TRIGGERS TROUVÉS SUR auth.users
-- ============================================================================
-- Date: 31 octobre 2025 16:57
-- Problème: 6 triggers automatiques causent "Database error creating new user"
-- Solution: Supprimer TOUS les triggers
-- ============================================================================

-- 1. SUPPRIMER LES 6 TRIGGERS IDENTIFIÉS
-- ============================================================================

-- Trigger 1: auto_tenant_creation_on_email_confirmation
DROP TRIGGER IF EXISTS auto_tenant_creation_on_email_confirmation ON auth.users;

-- Trigger 2: email-confirmation-handler
DROP TRIGGER IF EXISTS "email-confirmation-handler" ON auth.users;

-- Trigger 3: global_auto_tenant_creation_on_email_confirmation
DROP TRIGGER IF EXISTS global_auto_tenant_creation_on_email_confirmation ON auth.users;

-- Trigger 4, 5, 6: webhook-auth-handler (3 fois: INSERT, DELETE, UPDATE)
DROP TRIGGER IF EXISTS "webhook-auth-handler" ON auth.users;

-- ============================================================================
-- 2. SUPPRIMER LES FONCTIONS ASSOCIÉES
-- ============================================================================

-- Fonction 1: auto_create_complete_tenant_owner
DROP FUNCTION IF EXISTS public.auto_create_complete_tenant_owner() CASCADE;

-- Fonction 2: auto_create_tenant_owner
DROP FUNCTION IF EXISTS public.auto_create_tenant_owner() CASCADE;

-- Fonctions supplémentaires possibles
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_email_confirmation_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.notify_email_confirmation() CASCADE;
DROP FUNCTION IF EXISTS public.setup_auth_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_handle_new_user() CASCADE;

-- ============================================================================
-- 3. VÉRIFICATION FINALE
-- ============================================================================

-- Afficher tous les triggers restants (DOIT RETOURNER 0 LIGNES)
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Si ce SELECT retourne 0 lignes → ✅ SUCCÈS !
-- Si des triggers apparaissent encore, copiez leurs noms et exécutez:
-- DROP TRIGGER IF EXISTS "[nom_exact_du_trigger]" ON auth.users;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- 
-- Après exécution:
-- ✅ Tous les triggers supprimés
-- ✅ Toutes les fonctions supprimées
-- ✅ Plus d'erreur "Database error creating new user"
-- ✅ Invitations collaborateurs fonctionnent
-- 
-- ============================================================================

-- Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ SCRIPT EXÉCUTÉ AVEC SUCCÈS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
  RAISE NOTICE '1. Vérifiez que le SELECT ci-dessus retourne 0 lignes';
  RAISE NOTICE '2. Retestez invitation collaborateur';
  RAISE NOTICE '3. Vérifiez email reçu et Magic Link fonctionne';
  RAISE NOTICE '';
  RAISE NOTICE 'Si le problème persiste:';
  RAISE NOTICE '- Vérifiez Database → Webhooks dans le Dashboard';
  RAISE NOTICE '- Désactivez tout webhook sur auth.users';
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
END $$;
