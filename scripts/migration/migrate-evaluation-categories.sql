-- ==============================================
-- MIGRATION TABLE: evaluation_categories
-- ==============================================
-- Convertir la table evaluation_categories de multi-tenant vers globale

BEGIN;

-- 1. Sauvegarder les données uniques
CREATE TEMP TABLE temp_unique_evaluation_categories AS
SELECT DISTINCT ON (name) 
    id, name, created_at
FROM evaluation_categories 
ORDER BY name, created_at;

-- 2. Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view evaluation_categories for their tenant" ON evaluation_categories;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON evaluation_categories;
DROP POLICY IF EXISTS "evaluation_categories_admin_only" ON evaluation_categories;
DROP POLICY IF EXISTS "Users can view tenant evaluation_categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Authenticated users can manage evaluation_categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Users can view evaluation_categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Users can manage evaluation_categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Users can view evaluation categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Authenticated users can manage evaluation categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Users can view tenant evaluation categories" ON evaluation_categories;
DROP POLICY IF EXISTS "Authenticated users can manage tenant evaluation categories" ON evaluation_categories;
DROP POLICY IF EXISTS "HR can manage tenant evaluation categories" ON evaluation_categories;
DROP POLICY IF EXISTS "HR can manage evaluation categories" ON evaluation_categories;
DROP POLICY IF EXISTS "HR can view evaluation categories" ON evaluation_categories;

-- 3. Supprimer les doublons
DELETE FROM evaluation_categories WHERE id NOT IN (SELECT id FROM temp_unique_evaluation_categories);

-- 4. Repeupler avec les données uniques
INSERT INTO evaluation_categories (id, name, created_at)
SELECT id, name, created_at
FROM temp_unique_evaluation_categories
WHERE id NOT IN (SELECT id FROM evaluation_categories);

-- 5. Supprimer la colonne tenant_id
ALTER TABLE evaluation_categories DROP COLUMN IF EXISTS tenant_id;

-- 6. Ajouter contrainte unique
ALTER TABLE evaluation_categories ADD CONSTRAINT unique_evaluation_category_name UNIQUE (name);

-- 7. Configurer RLS global
ALTER TABLE evaluation_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global read access for evaluation_categories" ON evaluation_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin write access for evaluation_categories" ON evaluation_categories FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- Vérification
SELECT 'evaluation_categories' as table_name, COUNT(*) as count FROM evaluation_categories;
SELECT column_name FROM information_schema.columns WHERE table_name = 'evaluation_categories' AND column_name = 'tenant_id';
