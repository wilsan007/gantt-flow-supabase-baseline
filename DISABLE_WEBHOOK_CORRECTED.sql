-- ═══════════════════════════════════════════════════════════════════════════
-- DÉSACTIVATION WEBHOOK OBSOLÈTE - VERSION CORRIGÉE
-- ═══════════════════════════════════════════════════════════════════════════

-- 1️⃣ VÉRIFIER LES WEBHOOKS EXISTANTS (requête corrigée)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    id,
    hook_table_id,
    hook_name,
    events,
    url,
    inserted_at
FROM supabase_functions.hooks
WHERE url LIKE '%handle-email-confirmation%'
ORDER BY inserted_at DESC;

-- 2️⃣ ALTERNATIVE: Voir TOUS les webhooks actifs
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    id,
    hook_table_id,
    hook_name,
    events,
    url,
    inserted_at
FROM supabase_functions.hooks
ORDER BY inserted_at DESC;

-- 3️⃣ SUPPRIMER LE WEBHOOK OBSOLÈTE
-- ═══════════════════════════════════════════════════════════════════════════
-- Après avoir identifié le webhook, le supprimer:
DELETE FROM supabase_functions.hooks 
WHERE url LIKE '%handle-email-confirmation%';

-- 4️⃣ VÉRIFIER LES TRIGGERS (Database Webhooks)
-- ═══════════════════════════════════════════════════════════════════════════
-- Alternative: Vérifier dans l'interface Supabase Dashboard
-- Database > Webhooks

-- Si vous voyez un webhook "Email Confirmation Handler" ou similaire, supprimez-le via:
-- Dashboard > Database > Webhooks > [Sélectionner le webhook] > Delete
