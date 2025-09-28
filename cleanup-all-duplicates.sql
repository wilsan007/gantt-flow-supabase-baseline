-- ==============================================
-- NETTOYAGE COMPLET DES DOUBLONS
-- ==============================================
-- Script combiné pour nettoyer tous les doublons après migration

BEGIN;

-- ==============================================
-- 1. NETTOYAGE alert_type_solutions
-- ==============================================

-- Identifier les doublons dans alert_type_solutions
SELECT 
    'alert_type_solutions AVANT' as table_status,
    alert_type_id, 
    solution_id, 
    COUNT(*) as duplicate_count
FROM alert_type_solutions 
GROUP BY alert_type_id, solution_id 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Créer table temporaire avec données uniques
CREATE TEMP TABLE temp_unique_alert_type_solutions AS
SELECT DISTINCT ON (alert_type_id, solution_id)
    id,
    alert_type_id,
    solution_id,
    priority_order,
    context_conditions
FROM alert_type_solutions
ORDER BY alert_type_id, solution_id, id;

-- Nettoyer et réinsérer
DELETE FROM alert_type_solutions;
INSERT INTO alert_type_solutions (id, alert_type_id, solution_id, priority_order, context_conditions)
SELECT id, alert_type_id, solution_id, priority_order, context_conditions
FROM temp_unique_alert_type_solutions;

-- Contrainte unique
ALTER TABLE alert_type_solutions DROP CONSTRAINT IF EXISTS unique_alert_type_solution;
ALTER TABLE alert_type_solutions ADD CONSTRAINT unique_alert_type_solution UNIQUE (alert_type_id, solution_id);

-- ==============================================
-- 2. NETTOYAGE role_permissions
-- ==============================================

-- Identifier les doublons dans role_permissions
SELECT 
    'role_permissions AVANT' as table_status,
    role_id, 
    permission_id, 
    COUNT(*) as duplicate_count
FROM role_permissions 
GROUP BY role_id, permission_id 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Créer table temporaire avec données uniques
CREATE TEMP TABLE temp_unique_role_permissions AS
SELECT DISTINCT ON (role_id, permission_id)
    id,
    role_id,
    permission_id,
    created_at
FROM role_permissions
ORDER BY role_id, permission_id, created_at;

-- Nettoyer et réinsérer
DELETE FROM role_permissions;
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT id, role_id, permission_id, created_at
FROM temp_unique_role_permissions;

-- Contrainte unique
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS unique_role_permission;
ALTER TABLE role_permissions ADD CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id);

-- ==============================================
-- 3. VÉRIFICATION FINALE
-- ==============================================

-- Vérifier alert_type_solutions
SELECT 
    'alert_type_solutions APRÈS' as table_status,
    COUNT(*) as total_records,
    COUNT(DISTINCT (alert_type_id, solution_id)) as unique_combinations,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT (alert_type_id, solution_id)) 
        THEN '✅ AUCUN DOUBLON' 
        ELSE '❌ DOUBLONS RESTANTS' 
    END as status
FROM alert_type_solutions;

-- Vérifier role_permissions
SELECT 
    'role_permissions APRÈS' as table_status,
    COUNT(*) as total_records,
    COUNT(DISTINCT (role_id, permission_id)) as unique_combinations,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT (role_id, permission_id)) 
        THEN '✅ AUCUN DOUBLON' 
        ELSE '❌ DOUBLONS RESTANTS' 
    END as status
FROM role_permissions;

-- Vérifier toutes les contraintes uniques
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('alert_type_solutions', 'role_permissions') 
AND constraint_type = 'UNIQUE'
ORDER BY table_name;

COMMIT;

-- Résumé final
SELECT 'NETTOYAGE TERMINÉ' as message, NOW() as timestamp;
