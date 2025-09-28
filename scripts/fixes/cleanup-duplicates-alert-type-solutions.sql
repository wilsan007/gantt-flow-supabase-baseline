-- ==============================================
-- NETTOYAGE DES DOUBLONS: alert_type_solutions
-- ==============================================
-- Supprimer les doublons dans alert_type_solutions après migration

BEGIN;

-- 1. Identifier et compter les doublons
SELECT 
    alert_type_id, 
    solution_id, 
    COUNT(*) as duplicate_count
FROM alert_type_solutions 
GROUP BY alert_type_id, solution_id 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. Créer une table temporaire avec les données uniques (garder le plus ancien ID)
CREATE TEMP TABLE temp_unique_alert_type_solutions AS
SELECT DISTINCT ON (alert_type_id, solution_id)
    id,
    alert_type_id,
    solution_id,
    priority_order,
    context_conditions
FROM alert_type_solutions
ORDER BY alert_type_id, solution_id, id;

-- 3. Supprimer tous les enregistrements de la table
DELETE FROM alert_type_solutions;

-- 4. Réinsérer uniquement les données uniques
INSERT INTO alert_type_solutions (id, alert_type_id, solution_id, priority_order, context_conditions)
SELECT id, alert_type_id, solution_id, priority_order, context_conditions
FROM temp_unique_alert_type_solutions;

-- 5. Vérifier qu'il n'y a plus de doublons
SELECT 
    'Après nettoyage' as status,
    COUNT(*) as total_records,
    COUNT(DISTINCT (alert_type_id, solution_id)) as unique_combinations
FROM alert_type_solutions;

-- 6. S'assurer que la contrainte unique existe
ALTER TABLE alert_type_solutions DROP CONSTRAINT IF EXISTS unique_alert_type_solution;
ALTER TABLE alert_type_solutions ADD CONSTRAINT unique_alert_type_solution UNIQUE (alert_type_id, solution_id);

COMMIT;

-- Vérification finale
SELECT 'alert_type_solutions' as table_name, COUNT(*) as final_count FROM alert_type_solutions;
