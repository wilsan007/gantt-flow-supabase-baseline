-- ═══════════════════════════════════════════════════════════════════════════
-- SUPPRESSION DES TRIGGERS OBSOLÈTES
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 20 Novembre 2025
-- Problème: 3 triggers automatiques interfèrent avec AuthCallback.tsx
-- Solution: Les supprimer car AuthCallback gère maintenant tout manuellement
-- ═══════════════════════════════════════════════════════════════════════════

-- ❌ TRIGGER 1: auto-trigger-email-confirmation
-- Appelle handle-email-confirmation qui retourne 401
DROP TRIGGER IF EXISTS "auto-trigger-email-confirmation" ON auth.users;

-- ❌ TRIGGER 2: collaborator-confirmation-webhook  
-- Peut créer des doublons si AuthCallback appelle aussi la fonction
DROP TRIGGER IF EXISTS "collaborator-confirmation-webhook" ON auth.users;

-- ❌ TRIGGER 3: on_auth_user_email_confirmed
-- Ancien système de webhook
DROP TRIGGER IF EXISTS "on_auth_user_email_confirmed" ON auth.users;

-- SUPPRIMER LA FONCTION ASSOCIÉE (si elle existe)
DROP FUNCTION IF EXISTS trigger_email_confirmation_webhook();
DROP FUNCTION IF EXISTS handle_new_user_email_confirmation();

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Résultat attendu: Aucun trigger (liste vide)

-- ═══════════════════════════════════════════════════════════════════════════
-- NOUVELLE ARCHITECTURE (sans triggers automatiques)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- ✅ FLUX TENANT OWNER:
-- 1. User clique sur lien invitation
-- 2. AuthCallback.tsx détecte invitation=tenant_owner (ou invitation=true + vérif DB)
-- 3. AuthCallback.tsx appelle MANUELLEMENT onboard-tenant-owner
-- 4. Edge Function crée: tenant + profile + user_role + employee
-- 5. Redirection vers /dashboard
--
-- ✅ FLUX COLLABORATEUR:
-- 1. User clique sur lien invitation
-- 2. AuthCallback.tsx détecte invitation=collaborator (ou invitation=true + vérif DB)
-- 3. AuthCallback.tsx appelle MANUELLEMENT handle-collaborator-confirmation
-- 4. Edge Function crée: profile + user_role dans tenant existant
-- 5. Redirection vers /dashboard
--
-- ❌ PLUS DE TRIGGERS AUTOMATIQUES:
-- - Pas d'appel automatique sur UPDATE auth.users
-- - Pas de webhooks automatiques
-- - Contrôle total via AuthCallback.tsx
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ✅ Exécutez maintenant ce SQL dans Supabase SQL Editor
