-- Script d'analyse des politiques RLS (LECTURE SEULE)
-- À exécuter via Supabase Dashboard > SQL Editor
-- AUCUNE MODIFICATION - ANALYSE UNIQUEMENT

-- ============================================
-- 1. POLITIQUES RLS DE LA TABLE PROFILES
-- ============================================
SELECT 
    '=== POLITIQUES RLS PROFILES ===' as section;

SELECT 
    policyname as "Nom Politique",
    cmd as "Commande",
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN '✅ Permissive'
        ELSE '❌ Restrictive'
    END as "Type",
    array_to_string(roles, ', ') as "Rôles",
    qual as "Condition WHERE",
    with_check as "Condition CHECK"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================
-- 2. ÉTAT RLS DE LA TABLE
-- ============================================
SELECT 
    '=== ÉTAT RLS ===' as section;

SELECT 
    schemaname as "Schéma",
    tablename as "Table",
    CASE 
        WHEN rowsecurity THEN '✅ RLS Activé'
        ELSE '❌ RLS Désactivé'
    END as "RLS Status"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- ============================================
-- 3. FONCTIONS LIÉES AUX POLITIQUES
-- ============================================
SELECT 
    '=== FONCTIONS SYSTÈME ===' as section;

SELECT 
    proname as "Nom Fonction",
    pronargs as "Nb Arguments",
    prorettype::regtype as "Type Retour",
    CASE 
        WHEN prosecdef THEN '🔐 SECURITY DEFINER'
        ELSE '👤 SECURITY INVOKER'
    END as "Sécurité"
FROM pg_proc 
WHERE proname ILIKE '%super_admin%'
   OR proname ILIKE '%tenant%'
   OR proname ILIKE '%profile%'
ORDER BY proname;

-- ============================================
-- 4. CONTRAINTES DE LA TABLE PROFILES
-- ============================================
SELECT 
    '=== CONTRAINTES PROFILES ===' as section;

SELECT 
    conname as "Nom Contrainte",
    CASE contype
        WHEN 'p' THEN '🔑 PRIMARY KEY'
        WHEN 'f' THEN '🔗 FOREIGN KEY'
        WHEN 'u' THEN '⚡ UNIQUE'
        WHEN 'c' THEN '✅ CHECK'
        ELSE contype::text
    END as "Type",
    pg_get_constraintdef(oid) as "Définition"
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
ORDER BY contype, conname;

-- ============================================
-- 5. STRUCTURE DE LA TABLE PROFILES
-- ============================================
SELECT 
    '=== STRUCTURE PROFILES ===' as section;

SELECT 
    ordinal_position as "Pos",
    column_name as "Colonne",
    data_type as "Type",
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ Nullable'
        ELSE '❌ NOT NULL'
    END as "Nullable",
    column_default as "Défaut"
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 6. TRIGGERS SUR LA TABLE PROFILES
-- ============================================
SELECT 
    '=== TRIGGERS PROFILES ===' as section;

SELECT 
    trigger_name as "Nom Trigger",
    event_manipulation as "Événement",
    action_timing as "Timing",
    SUBSTRING(action_statement, 1, 100) || '...' as "Action (extrait)"
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- ============================================
-- 7. ANALYSE DES CONDITIONS RLS
-- ============================================
SELECT 
    '=== ANALYSE CONDITIONS RLS ===' as section;

WITH policy_analysis AS (
    SELECT 
        policyname,
        cmd,
        qual,
        CASE 
            WHEN qual ILIKE '%tenant_id%' THEN '🏢 Exige tenant_id'
            ELSE '✅ Pas de tenant_id requis'
        END as tenant_requirement,
        CASE 
            WHEN qual ILIKE '%super_admin%' THEN '👑 Exception super admin'
            ELSE '👤 Utilisateur normal'
        END as admin_exception,
        CASE 
            WHEN qual ILIKE '%auth.uid()%' THEN '🔐 Vérifie utilisateur connecté'
            ELSE '🌐 Pas de vérification utilisateur'
        END as user_check
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
)
SELECT 
    policyname as "Politique",
    cmd as "Commande",
    tenant_requirement as "Tenant ID",
    admin_exception as "Super Admin",
    user_check as "Auth Check"
FROM policy_analysis
ORDER BY cmd, policyname;

-- ============================================
-- 8. CONTEXTE ACTUEL
-- ============================================
SELECT 
    '=== CONTEXTE ACTUEL ===' as section;

SELECT 
    current_user as "Utilisateur DB",
    current_setting('role') as "Rôle Actuel",
    session_user as "Session User",
    CASE 
        WHEN current_setting('request.jwt.claims', true) IS NOT NULL 
        THEN '✅ JWT présent'
        ELSE '❌ Pas de JWT'
    END as "JWT Status";

-- ============================================
-- 9. RÉSUMÉ DES PROBLÈMES POTENTIELS
-- ============================================
SELECT 
    '=== DIAGNOSTIC ===' as section;

WITH diagnostic AS (
    SELECT 
        COUNT(*) as total_policies,
        COUNT(*) FILTER (WHERE qual ILIKE '%tenant_id%') as policies_requiring_tenant,
        COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
        COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles'
)
SELECT 
    total_policies as "Total Politiques",
    policies_requiring_tenant as "Politiques Exigeant tenant_id",
    insert_policies as "Politiques INSERT",
    select_policies as "Politiques SELECT",
    CASE 
        WHEN policies_requiring_tenant > 0 AND insert_policies > 0 
        THEN '⚠️ PROBLÈME: INSERT bloqué par tenant_id'
        ELSE '✅ Pas de conflit détecté'
    END as "Diagnostic"
FROM diagnostic;
