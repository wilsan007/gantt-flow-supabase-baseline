-- ==============================================
-- MIGRATION TABLE: alert_type_solutions
-- ==============================================
-- Convertir la table alert_type_solutions de multi-tenant vers globale

BEGIN;

-- 1. Sauvegarder les données uniques
CREATE TEMP TABLE temp_unique_alert_type_solutions AS
SELECT DISTINCT ON (alert_type_id, solution_id) 
    id, alert_type_id, solution_id, priority_order, context_conditions
FROM alert_type_solutions 
ORDER BY alert_type_id, solution_id;

-- 2. Supprimer les politiques RLS existantes
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

-- 3. Supprimer toutes les contraintes existantes pour éviter les conflits
ALTER TABLE alert_type_solutions DROP CONSTRAINT IF EXISTS alert_type_solutions_alert_type_id_solution_id_key;
ALTER TABLE alert_type_solutions DROP CONSTRAINT IF EXISTS unique_alert_type_solution;
ALTER TABLE alert_type_solutions DROP CONSTRAINT IF EXISTS alert_type_solutions_pkey CASCADE;

-- 4. Vider complètement la table et la repeupler avec des données uniques
TRUNCATE TABLE alert_type_solutions;

-- 5. Repeupler avec les données uniques et de nouveaux IDs
INSERT INTO alert_type_solutions (id, alert_type_id, solution_id, priority_order, context_conditions)
SELECT 
    gen_random_uuid() as new_id,
    alert_type_id, 
    solution_id, 
    priority_order, 
    context_conditions
FROM temp_unique_alert_type_solutions
WHERE alert_type_id IN (SELECT id FROM alert_types)
AND solution_id IN (SELECT id FROM alert_solutions);

-- 6. Supprimer la colonne tenant_id
ALTER TABLE alert_type_solutions DROP COLUMN IF EXISTS tenant_id;

-- 7. Ajouter la contrainte unique proprement
ALTER TABLE alert_type_solutions ADD CONSTRAINT unique_alert_type_solution UNIQUE (alert_type_id, solution_id);

-- 7. Configurer RLS global
ALTER TABLE alert_type_solutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global read access for alert_type_solutions" ON alert_type_solutions;
DROP POLICY IF EXISTS "Super admin write access for alert_type_solutions" ON alert_type_solutions;
CREATE POLICY "Global read access for alert_type_solutions" ON alert_type_solutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin write access for alert_type_solutions" ON alert_type_solutions FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- Vérification
SELECT 'alert_type_solutions' as table_name, COUNT(*) as count FROM alert_type_solutions;
SELECT column_name FROM information_schema.columns WHERE table_name = 'alert_type_solutions' AND column_name = 'tenant_id';
