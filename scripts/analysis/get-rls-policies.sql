-- Script pour analyser les politiques RLS de la table profiles
-- À exécuter via Supabase Dashboard > SQL Editor

-- 1. Afficher toutes les politiques RLS pour la table profiles
SELECT 
    policyname as "Nom de la politique",
    cmd as "Commande",
    permissive as "Type",
    roles as "Rôles",
    qual as "Condition WHERE",
    with_check as "Condition CHECK"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- 2. Afficher les détails de la table profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS activé",
    forcerowsecurity as "RLS forcé"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 4. Afficher les contraintes de la table
SELECT 
    conname as "Nom contrainte",
    contype as "Type",
    pg_get_constraintdef(oid) as "Définition"
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
ORDER BY conname;

-- 5. Afficher les triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- 6. Tester l'accès avec différents contextes
-- Test 1: Vérifier le contexte actuel
SELECT 
    current_user as "Utilisateur actuel",
    current_setting('role') as "Rôle actuel",
    current_setting('request.jwt.claims', true) as "JWT claims";

-- Test 2: Compter les profils visibles
SELECT COUNT(*) as "Nombre de profils visibles" FROM public.profiles;

-- Test 3: Essayer d'insérer un profil test (sera rollback)
BEGIN;
INSERT INTO public.profiles (user_id, full_name, email, role) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Test RLS', 'test@rls.com', 'test');
ROLLBACK;

-- 7. Analyser les fonctions is_super_admin si elle existe
SELECT 
    proname as "Nom fonction",
    prosrc as "Code source"
FROM pg_proc 
WHERE proname LIKE '%super_admin%'
OR proname LIKE '%tenant%';
