-- Script de diagnostic pour vérifier la structure de la table profiles
-- À exécuter via Supabase Dashboard > SQL Editor

-- 1. Vérifier la structure complète de la table profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les politiques RLS sur la table profiles
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
WHERE tablename = 'profiles';

-- 3. Vérifier si RLS est activé sur la table
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 4. Test d'insertion simple pour identifier le problème exact
-- (Remplacer les UUIDs par des valeurs réelles)
INSERT INTO public.profiles (
    user_id,
    tenant_id,
    full_name,
    email,
    role
) VALUES (
    'test-user-id-123',
    'test-tenant-id-456',
    'Test User',
    'test@example.com',
    'tenant_admin'
);

-- 5. Si l'insertion échoue, essayer sans tenant_id pour confirmer
INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    role
) VALUES (
    'test-user-id-789',
    'Test User 2',
    'test2@example.com',
    'tenant_admin'
);
