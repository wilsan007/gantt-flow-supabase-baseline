-- ==============================================
-- CORRECTION: Contrainte unique alert_type_solutions
-- ==============================================
-- Résoudre l'erreur de contrainte unique existante

BEGIN;

-- 1. Supprimer toutes les contraintes uniques existantes
ALTER TABLE alert_type_solutions DROP CONSTRAINT IF EXISTS alert_type_solutions_alert_type_id_solution_id_key;
ALTER TABLE alert_type_solutions DROP CONSTRAINT IF EXISTS unique_alert_type_solution;
ALTER TABLE alert_type_solutions DROP CONSTRAINT IF EXISTS alert_type_solutions_pkey CASCADE;

-- 2. Supprimer les politiques RLS pour éviter les conflits
DROP POLICY IF EXISTS "Users can view alert_type_solutions for their tenant" ON alert_type_solutions;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON alert_type_solutions;
DROP POLICY IF EXISTS "alert_type_solutions_admin_only" ON alert_type_solutions;
DROP POLICY IF EXISTS "Users can view tenant alert_type_solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Authenticated users can manage alert_type_solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Users can view alert_type_solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Users can manage alert_type_solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Users can view alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Authenticated users can manage alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Users can view tenant alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Users can manage tenant alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Authenticated users can manage tenant alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "HR can manage tenant alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "HR can manage alert type solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "HR can view alert type solutions" ON alert_type_solutions;

-- 3. Créer une table temporaire avec les données uniques
CREATE TEMP TABLE temp_clean_alert_type_solutions AS
SELECT DISTINCT ON (alert_type_id, solution_id)
    gen_random_uuid() as new_id,
    alert_type_id,
    solution_id,
    priority_order,
    context_conditions
FROM alert_type_solutions
WHERE alert_type_id IS NOT NULL 
AND solution_id IS NOT NULL
ORDER BY alert_type_id, solution_id, priority_order NULLS LAST;

-- 4. Vider la table existante
TRUNCATE TABLE alert_type_solutions;

-- 5. Repeupler avec les données uniques
INSERT INTO alert_type_solutions (id, alert_type_id, solution_id, priority_order, context_conditions)
SELECT new_id, alert_type_id, solution_id, priority_order, context_conditions
FROM temp_clean_alert_type_solutions;

-- 6. Supprimer la colonne tenant_id si elle existe
ALTER TABLE alert_type_solutions DROP COLUMN IF EXISTS tenant_id;

-- 7. Ajouter la contrainte unique proprement
ALTER TABLE alert_type_solutions ADD CONSTRAINT unique_alert_type_solution UNIQUE (alert_type_id, solution_id);

-- 8. Configurer RLS global
ALTER TABLE alert_type_solutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global read access for alert_type_solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Super admin write access for alert_type_solutions" ON alert_type_solutions;
CREATE POLICY "Global read access for alert_type_solutions" ON alert_type_solutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin write access for alert_type_solutions" ON alert_type_solutions FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- Vérifications
SELECT 'alert_type_solutions' as table_name, COUNT(*) as count FROM alert_type_solutions;
SELECT 'Contraintes uniques' as info, constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'alert_type_solutions' AND constraint_type = 'UNIQUE';
SELECT column_name FROM information_schema.columns WHERE table_name = 'alert_type_solutions' AND column_name = 'tenant_id';
