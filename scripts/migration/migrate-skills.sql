-- ==============================================
-- MIGRATION TABLE: skills
-- ==============================================
-- Convertir la table skills de multi-tenant vers globale

BEGIN;

-- 1. Sauvegarder les données uniques
CREATE TEMP TABLE temp_unique_skills AS
SELECT DISTINCT ON (name, category) 
    id, name, category, description, created_at
FROM skills 
ORDER BY name, category, created_at;

-- 2. Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view skills for their tenant" ON skills;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON skills;
DROP POLICY IF EXISTS "skills_admin_only" ON skills;
DROP POLICY IF EXISTS "Users can view tenant skills" ON skills;
DROP POLICY IF EXISTS "Authenticated users can manage skills" ON skills;
DROP POLICY IF EXISTS "Users can view skills" ON skills;
DROP POLICY IF EXISTS "Users can manage skills" ON skills;
DROP POLICY IF EXISTS "Users can view tenant skills" ON skills;
DROP POLICY IF EXISTS "Users can manage tenant skills" ON skills;
DROP POLICY IF EXISTS "Authenticated users can manage tenant skills" ON skills;
DROP POLICY IF EXISTS "HR can manage tenant skills" ON skills;
DROP POLICY IF EXISTS "HR can manage skills" ON skills;
DROP POLICY IF EXISTS "HR can view skills" ON skills;

-- 3. Supprimer les doublons
DELETE FROM skills WHERE id NOT IN (SELECT id FROM temp_unique_skills);

-- 4. Repeupler avec les données uniques
INSERT INTO skills (id, name, category, description, created_at)
SELECT id, name, category, description, created_at
FROM temp_unique_skills
WHERE id NOT IN (SELECT id FROM skills);

-- 5. Supprimer la colonne tenant_id
ALTER TABLE skills DROP COLUMN IF EXISTS tenant_id;

-- 6. Ajouter contrainte unique
ALTER TABLE skills ADD CONSTRAINT unique_skill_name_category UNIQUE (name, category);

-- 7. Configurer RLS global
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global read access for skills" ON skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin write access for skills" ON skills FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- Vérification
SELECT 'skills' as table_name, COUNT(*) as count FROM skills;
SELECT column_name FROM information_schema.columns WHERE table_name = 'skills' AND column_name = 'tenant_id';
