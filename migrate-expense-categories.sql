-- ==============================================
-- MIGRATION TABLE: expense_categories
-- ==============================================
-- Convertir la table expense_categories de multi-tenant vers globale

BEGIN;

-- 1. Sauvegarder les données uniques
CREATE TEMP TABLE temp_unique_expense_categories AS
SELECT DISTINCT ON (name) 
    id, name, icon, max_amount, requires_receipt, color, created_at
FROM expense_categories 
ORDER BY name, created_at;

-- 2. Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view expense_categories for their tenant" ON expense_categories;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON expense_categories;
DROP POLICY IF EXISTS "expense_categories_admin_only" ON expense_categories;
DROP POLICY IF EXISTS "Users can view tenant expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "Authenticated users can manage expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can view expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can manage expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can view expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Authenticated users can manage expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can view tenant expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Authenticated users can manage tenant expense categories" ON expense_categories;
DROP POLICY IF EXISTS "HR can manage tenant expense categories" ON expense_categories;
DROP POLICY IF EXISTS "HR can manage expense categories" ON expense_categories;
DROP POLICY IF EXISTS "HR can view expense categories" ON expense_categories;

-- 3. Supprimer les doublons
DELETE FROM expense_categories WHERE id NOT IN (SELECT id FROM temp_unique_expense_categories);

-- 4. Repeupler avec les données uniques
INSERT INTO expense_categories (id, name, icon, max_amount, requires_receipt, color, created_at)
SELECT id, name, icon, max_amount, requires_receipt, color, created_at
FROM temp_unique_expense_categories
WHERE id NOT IN (SELECT id FROM expense_categories);

-- 5. Supprimer la colonne tenant_id
ALTER TABLE expense_categories DROP COLUMN IF EXISTS tenant_id;

-- 6. Ajouter contrainte unique
ALTER TABLE expense_categories ADD CONSTRAINT unique_expense_category_name UNIQUE (name);

-- 7. Configurer RLS global
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global read access for expense_categories" ON expense_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin write access for expense_categories" ON expense_categories FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- Vérification
SELECT 'expense_categories' as table_name, COUNT(*) as count FROM expense_categories;
SELECT column_name FROM information_schema.columns WHERE table_name = 'expense_categories' AND column_name = 'tenant_id';
