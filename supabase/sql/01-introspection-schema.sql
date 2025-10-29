-- =====================================================
-- Script d'Introspection du Schéma Existant
-- Module: Tâches Récurrentes & Opérations
-- =====================================================

-- 1. Vérifier la structure de la table tasks
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes de la table tasks
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'tasks';

-- 3. Vérifier les index de la table tasks
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'tasks';

-- 4. Vérifier si task_actions existe (pour la checklist)
SELECT 
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'task_actions'
    ) AS task_actions_exists;

-- 5. Si task_actions existe, voir sa structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'task_actions'
ORDER BY ordinal_position;

-- 6. Vérifier les colonnes tenant_id pour RLS
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name = 'tenant_id'
ORDER BY table_name;

-- 7. Vérifier si les colonnes activity_id et is_operational existent déjà
SELECT 
    column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
  AND column_name IN ('activity_id', 'is_operational');

-- 8. Lister toutes les tables existantes
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 9. Vérifier les policies RLS existantes sur tasks
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
  AND tablename = 'tasks';

-- 10. Vérifier les fonctions RPC existantes
SELECT 
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%task%'
ORDER BY routine_name;
