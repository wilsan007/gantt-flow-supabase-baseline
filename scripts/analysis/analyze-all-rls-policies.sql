-- Script d'analyse complète des politiques RLS de TOUTES les tables
-- À exécuter via Supabase Dashboard > SQL Editor
-- AUCUNE MODIFICATION - ANALYSE UNIQUEMENT

-- ============================================
-- 1. LISTE DE TOUTES LES TABLES AVEC RLS
-- ============================================
SELECT 
    '=== TABLES AVEC RLS ACTIVÉ ===' as section;

SELECT 
    schemaname as "Schéma",
    tablename as "Table",
    CASE 
        WHEN rowsecurity THEN '✅ RLS Activé'
        ELSE '❌ RLS Désactivé'
    END as "RLS Status"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY 
    CASE WHEN rowsecurity THEN 0 ELSE 1 END,
    tablename;

-- ============================================
-- 2. TOUTES LES POLITIQUES RLS PAR TABLE
-- ============================================
SELECT 
    '=== TOUTES LES POLITIQUES RLS ===' as section;

SELECT 
    schemaname as "Schéma",
    tablename as "Table",
    policyname as "Politique",
    cmd as "Commande",
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN '✅ Permissive'
        ELSE '❌ Restrictive'
    END as "Type",
    array_to_string(roles, ', ') as "Rôles",
    CASE 
        WHEN LENGTH(qual) > 80 THEN LEFT(qual, 77) || '...'
        ELSE qual
    END as "Condition WHERE (extrait)",
    CASE 
        WHEN LENGTH(with_check) > 80 THEN LEFT(with_check, 77) || '...'
        ELSE with_check
    END as "Condition CHECK (extrait)"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ============================================
-- 3. ANALYSE DES CONDITIONS TENANT_ID
-- ============================================
SELECT 
    '=== ANALYSE CONDITIONS TENANT_ID ===' as section;

SELECT 
    tablename as "Table",
    policyname as "Politique",
    cmd as "Commande",
    CASE 
        WHEN qual ILIKE '%tenant_id%' THEN '🏢 Exige tenant_id'
        ELSE '✅ Pas de tenant_id requis'
    END as "Tenant ID",
    CASE 
        WHEN qual ILIKE '%super_admin%' OR qual ILIKE '%is_super_admin%' THEN '👑 Exception super admin'
        ELSE '👤 Utilisateur normal'
    END as "Super Admin",
    CASE 
        WHEN qual ILIKE '%auth.uid()%' THEN '🔐 Vérifie utilisateur connecté'
        ELSE '🌐 Pas de vérification utilisateur'
    END as "Auth Check"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- ============================================
-- 4. TABLES SANS POLITIQUES RLS
-- ============================================
SELECT 
    '=== TABLES SANS POLITIQUES RLS ===' as section;

SELECT 
    t.schemaname as "Schéma",
    t.tablename as "Table",
    CASE 
        WHEN t.rowsecurity THEN '⚠️ RLS activé mais pas de politiques'
        ELSE '✅ RLS désactivé'
    END as "Status"
FROM pg_tables t
LEFT JOIN pg_policies p ON (t.schemaname = p.schemaname AND t.tablename = p.tablename)
WHERE t.schemaname = 'public'
AND p.policyname IS NULL
ORDER BY t.tablename;

-- ============================================
-- 5. STATISTIQUES PAR COMMANDE
-- ============================================
SELECT 
    '=== STATISTIQUES PAR COMMANDE ===' as section;

SELECT 
    cmd as "Commande",
    COUNT(*) as "Nombre de Politiques",
    COUNT(DISTINCT tablename) as "Tables Concernées",
    COUNT(*) FILTER (WHERE qual ILIKE '%tenant_id%') as "Avec tenant_id",
    COUNT(*) FILTER (WHERE qual ILIKE '%super_admin%') as "Avec super_admin"
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY cmd
ORDER BY cmd;

-- ============================================
-- 6. TABLES CRITIQUES POUR TENANT OWNER
-- ============================================
SELECT 
    '=== TABLES CRITIQUES TENANT OWNER ===' as section;

WITH critical_tables AS (
    SELECT unnest(ARRAY['profiles', 'employees', 'user_roles', 'tenants', 'invitations']) as table_name
)
SELECT 
    ct.table_name as "Table",
    CASE 
        WHEN t.rowsecurity THEN '✅ RLS Activé'
        ELSE '❌ RLS Désactivé'
    END as "RLS Status",
    COUNT(p.policyname) as "Nb Politiques",
    COUNT(p.policyname) FILTER (WHERE p.cmd = 'INSERT') as "INSERT",
    COUNT(p.policyname) FILTER (WHERE p.cmd = 'SELECT') as "SELECT",
    COUNT(p.policyname) FILTER (WHERE p.cmd = 'UPDATE') as "UPDATE",
    COUNT(p.policyname) FILTER (WHERE p.cmd = 'DELETE') as "DELETE",
    COUNT(p.policyname) FILTER (WHERE p.qual ILIKE '%tenant_id%') as "Avec tenant_id"
FROM critical_tables ct
LEFT JOIN pg_tables t ON (t.tablename = ct.table_name AND t.schemaname = 'public')
LEFT JOIN pg_policies p ON (p.tablename = ct.table_name AND p.schemaname = 'public')
GROUP BY ct.table_name, t.rowsecurity
ORDER BY ct.table_name;

-- ============================================
-- 7. FONCTIONS LIÉES AUX POLITIQUES
-- ============================================
SELECT 
    '=== FONCTIONS SYSTÈME ===' as section;

SELECT 
    proname as "Nom Fonction",
    pronargs as "Nb Args",
    prorettype::regtype as "Type Retour",
    CASE 
        WHEN prosecdef THEN '🔐 SECURITY DEFINER'
        ELSE '👤 SECURITY INVOKER'
    END as "Sécurité",
    CASE 
        WHEN proacl IS NULL THEN '🌐 Public'
        ELSE '🔒 Restreint'
    END as "Accès"
FROM pg_proc 
WHERE proname ILIKE '%super_admin%'
   OR proname ILIKE '%tenant%'
   OR proname ILIKE '%profile%'
   OR proname ILIKE '%rls%'
ORDER BY proname;

-- ============================================
-- 8. DIAGNOSTIC COMPLET
-- ============================================
SELECT 
    '=== DIAGNOSTIC COMPLET ===' as section;

WITH table_stats AS (
    SELECT 
        t.tablename,
        t.rowsecurity,
        COUNT(p.policyname) as policy_count,
        COUNT(p.policyname) FILTER (WHERE p.cmd = 'INSERT') as insert_policies,
        COUNT(p.policyname) FILTER (WHERE p.qual ILIKE '%tenant_id%') as tenant_policies
    FROM pg_tables t
    LEFT JOIN pg_policies p ON (t.schemaname = p.schemaname AND t.tablename = p.tablename)
    WHERE t.schemaname = 'public'
    GROUP BY t.tablename, t.rowsecurity
)
SELECT 
    tablename as "Table",
    CASE 
        WHEN rowsecurity THEN '✅ RLS ON'
        ELSE '❌ RLS OFF'
    END as "RLS",
    policy_count as "Politiques",
    insert_policies as "INSERT",
    tenant_policies as "Tenant ID",
    CASE 
        WHEN rowsecurity AND policy_count = 0 THEN '⚠️ RLS sans politiques'
        WHEN rowsecurity AND insert_policies > 0 AND tenant_policies > 0 THEN '🔒 INSERT bloqué par tenant_id'
        WHEN rowsecurity AND policy_count > 0 THEN '✅ RLS configuré'
        WHEN NOT rowsecurity THEN '🌐 Accès libre'
        ELSE '❓ État inconnu'
    END as "Diagnostic"
FROM table_stats
ORDER BY 
    CASE 
        WHEN rowsecurity AND insert_policies > 0 AND tenant_policies > 0 THEN 1
        WHEN rowsecurity AND policy_count = 0 THEN 2
        ELSE 3
    END,
    tablename;

-- ============================================
-- 9. RÉSUMÉ EXÉCUTIF
-- ============================================
SELECT 
    '=== RÉSUMÉ EXÉCUTIF ===' as section;

WITH summary AS (
    SELECT 
        COUNT(DISTINCT t.tablename) as total_tables,
        COUNT(DISTINCT t.tablename) FILTER (WHERE t.rowsecurity) as rls_enabled_tables,
        COUNT(DISTINCT p.tablename) as tables_with_policies,
        COUNT(p.policyname) as total_policies,
        COUNT(p.policyname) FILTER (WHERE p.qual ILIKE '%tenant_id%') as tenant_policies,
        COUNT(p.policyname) FILTER (WHERE p.qual ILIKE '%super_admin%') as admin_policies
    FROM pg_tables t
    LEFT JOIN pg_policies p ON (t.schemaname = p.schemaname AND t.tablename = p.tablename)
    WHERE t.schemaname = 'public'
)
SELECT 
    total_tables as "Total Tables",
    rls_enabled_tables as "Tables RLS ON",
    tables_with_policies as "Tables avec Politiques",
    total_policies as "Total Politiques",
    tenant_policies as "Politiques tenant_id",
    admin_policies as "Politiques super_admin",
    CASE 
        WHEN tenant_policies > 0 THEN '⚠️ Restrictions tenant_id détectées'
        ELSE '✅ Pas de restrictions tenant_id'
    END as "Alerte Tenant"
FROM summary;
