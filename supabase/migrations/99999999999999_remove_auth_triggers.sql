-- Migration: Suppression complète des triggers automatiques sur auth.users
-- Date: 31 octobre 2025
-- Raison: Les utilisateurs temporaires doivent être traités manuellement par AuthCallback

-- ============================================================================
-- SUPPRESSION DES TRIGGERS SUR auth.users
-- ============================================================================

-- Supprimer tous les triggers possibles sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_updated ON auth.users;

-- ============================================================================
-- SUPPRESSION DES FONCTIONS DE TRIGGER
-- ============================================================================

-- Supprimer toutes les fonctions de trigger associées
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_email_confirmation_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.notify_email_confirmation() CASCADE;
DROP FUNCTION IF EXISTS public.setup_auth_webhook() CASCADE;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Afficher tous les triggers restants sur auth.users (devrait être vide)
DO $$
DECLARE
  trigger_record RECORD;
  trigger_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'VÉRIFICATION DES TRIGGERS SUR auth.users';
  RAISE NOTICE '=================================================';
  
  FOR trigger_record IN 
    SELECT 
      trigger_name,
      event_manipulation,
      action_statement
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth'
      AND event_object_table = 'users'
  LOOP
    trigger_count := trigger_count + 1;
    RAISE WARNING 'TRIGGER TROUVÉ: % - Event: % - Action: %', 
      trigger_record.trigger_name, 
      trigger_record.event_manipulation,
      trigger_record.action_statement;
  END LOOP;
  
  IF trigger_count = 0 THEN
    RAISE NOTICE '✅ Aucun trigger trouvé sur auth.users';
    RAISE NOTICE '✅ Les utilisateurs peuvent être créés sans déclenchement automatique';
  ELSE
    RAISE WARNING '⚠️ % trigger(s) encore présent(s) sur auth.users', trigger_count;
  END IF;
  
  RAISE NOTICE '=================================================';
END $$;

-- ============================================================================
-- COMMENTAIRE DE MIGRATION
-- ============================================================================

COMMENT ON SCHEMA public IS 
'Triggers automatiques sur auth.users supprimés le 31 octobre 2025.
Les utilisateurs temporaires (temp_user: true) sont maintenant traités 
manuellement par AuthCallback après clic sur Magic Link.
Aucun webhook ou trigger automatique n''est nécessaire.';
