-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFIER LA STRUCTURE DES WEBHOOKS
-- ═══════════════════════════════════════════════════════════════════════════

-- 1️⃣ VOIR LA STRUCTURE DE LA TABLE
-- ═══════════════════════════════════════════════════════════════════════════
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'supabase_functions' 
  AND table_name = 'hooks';

-- 2️⃣ VOIR TOUS LES HOOKS (sans filtrer par colonnes)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT * 
FROM supabase_functions.hooks 
LIMIT 10;

-- 3️⃣ ALTERNATIVE: Utiliser l'interface Supabase Dashboard
-- ═══════════════════════════════════════════════════════════════════════════
-- Dashboard > Database > Webhooks
-- Vous y verrez tous les webhooks configurés avec une interface visuelle

-- 4️⃣ VÉRIFIER LES TRIGGERS SUR auth.users
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 5️⃣ SUPPRIMER TRIGGERS OBSOLÈTES (si nécessaire)
-- ═══════════════════════════════════════════════════════════════════════════
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS trigger_email_confirmation ON auth.users;
-- DROP FUNCTION IF EXISTS handle_new_user_email_confirmation();
-- DROP FUNCTION IF EXISTS notify_email_confirmation();
