-- ==============================================
-- NETTOYAGE CIBLÉ DES DOUBLONS
-- ==============================================
-- Nettoyer les doublons spécifiques dans solution_id et permission_id

BEGIN;

-- ==============================================
-- 1. DIAGNOSTIC DES DOUBLONS
-- ==============================================

-- Analyser les doublons dans alert_type_solutions (colonne solution_id)
SELECT 
    'DIAGNOSTIC alert_type_solutions' as status,
    solution_id,
    COUNT(*) as duplicate_count,
    array_agg(DISTINCT alert_type_id) as different_alert_types
FROM alert_type_solutions 
GROUP BY solution_id 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- Analyser les doublons dans role_permissions (colonne permission_id)
SELECT 
    'DIAGNOSTIC role_permissions' as status,
    permission_id,
    COUNT(*) as duplicate_count,
    array_agg(DISTINCT role_id) as different_roles
FROM role_permissions 
GROUP BY permission_id 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- ==============================================
-- 2. NETTOYAGE alert_type_solutions
-- ==============================================

-- Créer table temporaire avec UN SEUL enregistrement par (alert_type_id, solution_id)
CREATE TEMP TABLE temp_clean_alert_type_solutions AS
SELECT DISTINCT ON (alert_type_id, solution_id)
    gen_random_uuid() as new_id,
    alert_type_id,
    solution_id,
    COALESCE(priority_order, 1) as priority_order,
    context_conditions
FROM alert_type_solutions
WHERE alert_type_id IS NOT NULL 
AND solution_id IS NOT NULL
ORDER BY alert_type_id, solution_id;

-- Vider complètement la table
TRUNCATE TABLE alert_type_solutions CASCADE;

-- Réinsérer les données nettoyées
INSERT INTO alert_type_solutions (id, alert_type_id, solution_id, priority_order, context_conditions)
SELECT new_id, alert_type_id, solution_id, priority_order, context_conditions
FROM temp_clean_alert_type_solutions;

-- ==============================================
-- 3. NETTOYAGE role_permissions
-- ==============================================

-- Créer table temporaire avec UN SEUL enregistrement par (role_id, permission_id)
CREATE TEMP TABLE temp_clean_role_permissions AS
SELECT DISTINCT ON (role_id, permission_id)
    gen_random_uuid() as new_id,
    role_id,
    permission_id,
    COALESCE(created_at, NOW()) as created_at
FROM role_permissions
WHERE role_id IS NOT NULL 
AND permission_id IS NOT NULL
ORDER BY role_id, permission_id;

-- Vider complètement la table
TRUNCATE TABLE role_permissions CASCADE;

-- Réinsérer les données nettoyées
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT new_id, role_id, permission_id, created_at
FROM temp_clean_role_permissions;

-- ==============================================
-- 4. CONTRAINTES UNIQUES STRICTES
-- ==============================================

-- Supprimer toutes les contraintes existantes
ALTER TABLE alert_type_solutions DROP CONSTRAINT IF EXISTS alert_type_solutions_pkey CASCADE;
ALTER TABLE alert_type_solutions DROP CONSTRAINT IF EXISTS unique_alert_type_solution;
ALTER TABLE alert_type_solutions DROP CONSTRAINT IF EXISTS alert_type_solutions_alert_type_id_solution_id_key;

ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey CASCADE;
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS unique_role_permission;
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_id_permission_id_key;

-- Ajouter les contraintes uniques strictes
ALTER TABLE alert_type_solutions ADD CONSTRAINT unique_alert_type_solution UNIQUE (alert_type_id, solution_id);
ALTER TABLE role_permissions ADD CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id);

-- ==============================================
-- 5. VÉRIFICATION FINALE
-- ==============================================

-- Vérifier alert_type_solutions
SELECT 
    'alert_type_solutions FINAL' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT solution_id) as unique_solutions,
    COUNT(DISTINCT (alert_type_id, solution_id)) as unique_combinations,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT (alert_type_id, solution_id)) 
        THEN '✅ AUCUN DOUBLON' 
        ELSE '❌ DOUBLONS RESTANTS: ' || (COUNT(*) - COUNT(DISTINCT (alert_type_id, solution_id)))::text
    END as status
FROM alert_type_solutions;

-- Vérifier role_permissions
SELECT 
    'role_permissions FINAL' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT permission_id) as unique_permissions,
    COUNT(DISTINCT (role_id, permission_id)) as unique_combinations,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT (role_id, permission_id)) 
        THEN '✅ AUCUN DOUBLON' 
        ELSE '❌ DOUBLONS RESTANTS: ' || (COUNT(*) - COUNT(DISTINCT (role_id, permission_id)))::text
    END as status
FROM role_permissions;

-- Vérifier qu'il n'y a plus de doublons sur solution_id dans alert_type_solutions
SELECT 
    'Doublons solution_id restants' as check_name,
    COUNT(*) as duplicate_groups
FROM (
    SELECT solution_id, COUNT(*) as cnt
    FROM alert_type_solutions 
    GROUP BY solution_id 
    HAVING COUNT(*) > 1
) duplicates;

-- Vérifier qu'il n'y a plus de doublons sur permission_id dans role_permissions
SELECT 
    'Doublons permission_id restants' as check_name,
    COUNT(*) as duplicate_groups
FROM (
    SELECT permission_id, COUNT(*) as cnt
    FROM role_permissions 
    GROUP BY permission_id 
    HAVING COUNT(*) > 1
) duplicates;

COMMIT;

-- Message final
SELECT 
    'NETTOYAGE CIBLÉ TERMINÉ' as message, 
    NOW() as timestamp,
    'Doublons solution_id et permission_id supprimés' as details;
