-- ==============================================
-- MIGRATION TABLE: positions
-- ==============================================
-- Convertir la table positions de multi-tenant vers globale

BEGIN;

-- 1. Sauvegarder les données uniques
CREATE TEMP TABLE temp_unique_positions AS
SELECT DISTINCT ON (title) 
    id, title, description, requirements, salary_range_min, salary_range_max, created_at, updated_at
FROM positions 
ORDER BY title, created_at;

-- 2. Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view positions for their tenant" ON positions;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON positions;
DROP POLICY IF EXISTS "positions_admin_only" ON positions;
DROP POLICY IF EXISTS "Users can view tenant positions" ON positions;
DROP POLICY IF EXISTS "Authenticated users can manage positions" ON positions;
DROP POLICY IF EXISTS "Users can view positions" ON positions;
DROP POLICY IF EXISTS "Users can manage positions" ON positions;
DROP POLICY IF EXISTS "Users can view tenant positions" ON positions;
DROP POLICY IF EXISTS "Users can manage tenant positions" ON positions;
DROP POLICY IF EXISTS "Authenticated users can manage tenant positions" ON positions;
DROP POLICY IF EXISTS "HR can manage tenant positions" ON positions;
DROP POLICY IF EXISTS "HR can manage positions" ON positions;
DROP POLICY IF EXISTS "HR can view positions" ON positions;

-- 3. Supprimer les doublons
DELETE FROM positions WHERE id NOT IN (SELECT id FROM temp_unique_positions);

-- 4. Repeupler avec les données uniques
INSERT INTO positions (id, title, description, requirements, salary_range_min, salary_range_max, created_at, updated_at)
SELECT id, title, description, requirements, salary_range_min, salary_range_max, created_at, updated_at
FROM temp_unique_positions
WHERE id NOT IN (SELECT id FROM positions);

-- 5. Supprimer la colonne tenant_id
ALTER TABLE positions DROP COLUMN IF EXISTS tenant_id;

-- 6. Ajouter contrainte unique
ALTER TABLE positions ADD CONSTRAINT unique_position_title UNIQUE (title);

-- 7. Configurer RLS global
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global read access for positions" ON positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin write access for positions" ON positions FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- Vérification
SELECT 'positions' as table_name, COUNT(*) as count FROM positions;
SELECT column_name FROM information_schema.columns WHERE table_name = 'positions' AND column_name = 'tenant_id';
