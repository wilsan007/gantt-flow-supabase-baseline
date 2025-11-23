-- ═══════════════════════════════════════════════════════════════════════════
-- DÉSACTIVATION WEBHOOK OBSOLÈTE handle-email-confirmation
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 20 Novembre 2025
-- Problème: Webhook appelle handle-email-confirmation qui retourne 401
-- Solution: Désactiver ce webhook car AuthCallback.tsx gère maintenant tout
-- ═══════════════════════════════════════════════════════════════════════════

-- 1️⃣ VÉRIFIER LES WEBHOOKS EXISTANTS
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    id,
    name,
    events,
    url,
    enabled
FROM supabase_functions.hooks
WHERE url LIKE '%handle-email-confirmation%'
ORDER BY created_at DESC;

-- 2️⃣ DÉSACTIVER LE WEBHOOK (si trouvé)
-- ═══════════════════════════════════════════════════════════════════════════
-- Remplacer <webhook_id> par l'ID trouvé ci-dessus
-- UPDATE supabase_functions.hooks 
-- SET enabled = false 
-- WHERE url LIKE '%handle-email-confirmation%';

-- 3️⃣ OU SUPPRIMER COMPLÈTEMENT LE WEBHOOK
-- ═══════════════════════════════════════════════════════════════════════════
-- DELETE FROM supabase_functions.hooks 
-- WHERE url LIKE '%handle-email-confirmation%';

-- 4️⃣ VÉRIFIER LES TRIGGERS QUI POURRAIENT APPELER CETTE FONCTION
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%handle_email_confirmation%'
   OR action_statement LIKE '%handle-email-confirmation%';

-- 5️⃣ DÉSACTIVER LES TRIGGERS OBSOLÈTES (si trouvés)
-- ═══════════════════════════════════════════════════════════════════════════
-- Exemples de triggers à désactiver:
-- DROP TRIGGER IF EXISTS trigger_email_confirmation ON auth.users;
-- DROP TRIGGER IF EXISTS on_auth_user_created_trigger ON auth.users;
-- DROP FUNCTION IF EXISTS handle_new_user_email_confirmation();

-- ═══════════════════════════════════════════════════════════════════════════
-- NOUVELLE ARCHITECTURE (pas de webhook automatique)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- ✅ FLUX TENANT OWNER:
-- 1. Clic sur lien invitation
-- 2. AuthCallback.tsx détecte invitation=tenant_owner
-- 3. AuthCallback appelle manuellement onboard-tenant-owner
-- 4. Création tenant + profile + user_role + employee
--
-- ✅ FLUX COLLABORATEUR:
-- 1. Clic sur lien invitation
-- 2. AuthCallback.tsx détecte invitation=collaborator
-- 3. AuthCallback appelle manuellement handle-collaborator-confirmation
-- 4. Création profile + user_role dans tenant existant
--
-- ❌ PLUS BESOIN DE:
-- - Webhook automatique sur confirmation email
-- - handle-email-confirmation (fonction obsolète)
-- - Triggers automatiques
--
-- ═══════════════════════════════════════════════════════════════════════════

-- 6️⃣ VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════════════════════
-- S'assurer qu'aucun webhook n'est actif:
SELECT 
    id,
    name,
    events,
    url,
    enabled,
    created_at
FROM supabase_functions.hooks
WHERE enabled = true
ORDER BY created_at DESC;

-- Résultat attendu: Aucun webhook vers handle-email-confirmation
