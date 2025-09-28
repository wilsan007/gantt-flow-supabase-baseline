-- ==============================================
-- MIGRATION TABLE: alert_solutions
-- ==============================================
-- Convertir la table alert_solutions de multi-tenant vers globale

BEGIN;

-- 1. Sauvegarder les données uniques
CREATE TEMP TABLE temp_unique_alert_solutions AS
SELECT DISTINCT ON (title, category) 
    id, title, description, action_steps, effectiveness_score, implementation_time, required_roles, cost_level, category, created_at
FROM alert_solutions 
ORDER BY title, category, created_at;

-- 2. Créer le mapping ancien → nouveau ID
CREATE TEMP TABLE temp_alert_solutions_mapping AS
SELECT 
    old_as.id as old_id,
    new_as.id as new_id,
    old_as.title
FROM alert_solutions old_as
JOIN temp_unique_alert_solutions new_as ON old_as.title = new_as.title AND old_as.category = new_as.category;

-- 3. Mettre à jour les références dans alert_type_solutions
UPDATE alert_type_solutions 
SET solution_id = asm.new_id
FROM temp_alert_solutions_mapping asm
WHERE alert_type_solutions.solution_id = asm.old_id
AND asm.new_id IN (SELECT id FROM alert_solutions);

-- 4. Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view alert_solutions for their tenant" ON alert_solutions;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON alert_solutions;
DROP POLICY IF EXISTS "alert_solutions_admin_only" ON alert_solutions;
DROP POLICY IF EXISTS "Users can view tenant alert_solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Authenticated users can manage alert_solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Users can view alert_solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Users can manage alert_solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Users can view alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Authenticated users can manage alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Users can view tenant alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Users can manage tenant alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "Authenticated users can manage tenant alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "HR can manage tenant alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "HR can manage alert solutions" ON alert_solutions;
DROP POLICY IF EXISTS "HR can view alert solutions" ON alert_solutions;

-- 5. Supprimer les doublons
DELETE FROM alert_solutions WHERE id NOT IN (SELECT id FROM temp_unique_alert_solutions);

-- 6. Repeupler avec les données uniques
INSERT INTO alert_solutions (id, title, description, action_steps, effectiveness_score, implementation_time, required_roles, cost_level, category, created_at)
SELECT id, title, description, action_steps, effectiveness_score, implementation_time, required_roles, cost_level, category, created_at
FROM temp_unique_alert_solutions
WHERE id NOT IN (SELECT id FROM alert_solutions);

-- 7. Supprimer la colonne tenant_id
ALTER TABLE alert_solutions DROP COLUMN IF EXISTS tenant_id;

-- 8. Ajouter contrainte unique
ALTER TABLE alert_solutions ADD CONSTRAINT unique_alert_solution_title_category UNIQUE (title, category);

-- 9. Configurer RLS global
ALTER TABLE alert_solutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global read access for alert_solutions" ON alert_solutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin write access for alert_solutions" ON alert_solutions FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- Vérification
SELECT 'alert_solutions' as table_name, COUNT(*) as count FROM alert_solutions;
SELECT column_name FROM information_schema.columns WHERE table_name = 'alert_solutions' AND column_name = 'tenant_id';
