-- Diagnostic des politiques RLS actuelles sur la table profiles (version corrigée)
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
AND (routine_name LIKE '%tenant%' OR routine_name LIKE '%profile%')
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

-- 5. Vérifier si des politiques utilisent des fonctions récursives
SELECT 
    policyname,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
AND (qual LIKE '%get_user_tenant_id%' OR with_check LIKE '%get_user_tenant_id%');

-- 6. Compter le nombre total de politiques sur profiles
SELECT COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';
