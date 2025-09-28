-- Diagnostic des politiques RLS actuelles sur la table profiles
-- Pour comprendre pourquoi la récursion persiste

-- 1. Vérifier les politiques RLS actuellement actives sur profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- 2. Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 3. Vérifier les fonctions qui pourraient causer la récursion
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%tenant%'
OR routine_name LIKE '%profile%'
ORDER BY routine_name;

-- 4. Vérifier les triggers sur auth.users qui pourraient interférer
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
ORDER BY trigger_name;

-- 5. Vérifier les dépendances des fonctions
SELECT DISTINCT
    p.proname as function_name,
    d.refobjid::regclass as depends_on
FROM pg_proc p
JOIN pg_depend d ON d.objid = p.oid
WHERE p.proname IN ('get_user_tenant_id', 'get_user_tenant_id_safe', 'is_tenant_admin_for_profile')
AND d.refobjid::regclass::text LIKE '%profiles%';
