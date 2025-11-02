-- ============================================================================
-- SCRIPT SQL À EXÉCUTER DANS SUPABASE DASHBOARD
-- ============================================================================
-- Date: 31 octobre 2025
-- Objectif: Supprimer tous les triggers automatiques sur auth.users
-- Raison: Éviter "Database error creating new user"
-- ============================================================================

-- 1. SUPPRIMER TOUS LES TRIGGERS SUR auth.users
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_updated ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;

-- 2. SUPPRIMER TOUTES LES FONCTIONS DE TRIGGER
-- ============================================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_email_confirmation_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.notify_email_confirmation() CASCADE;
DROP FUNCTION IF EXISTS public.setup_auth_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_handle_new_user() CASCADE;

-- 3. VÉRIFICATION
-- ============================================================================

-- Afficher tous les triggers restants sur auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Si le résultat est vide (0 lignes), c'est bon ✅
-- Si des triggers apparaissent, notez leurs noms et exécutez:
-- DROP TRIGGER IF EXISTS [nom_du_trigger] ON auth.users;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- 
-- Après exécution de ce script:
-- ✅ Aucun trigger sur auth.users
-- ✅ Aucune fonction trigger automatique
-- ✅ Les utilisateurs peuvent être créés sans déclenchement automatique
-- ✅ Plus d'erreur "Database error creating new user"
--
-- ============================================================================
