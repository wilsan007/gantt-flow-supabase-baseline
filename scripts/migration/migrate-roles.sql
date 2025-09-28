-- ==============================================
-- MIGRATION TABLE: roles
-- ==============================================
-- Convertir la table roles de multi-tenant vers globale

BEGIN;

-- 1. Sauvegarder les données uniques
CREATE TEMP TABLE temp_unique_roles AS
SELECT DISTINCT ON (name) 
    id, name, display_name, description, hierarchy_level, is_system_role, created_at, updated_at
FROM roles 
ORDER BY name, created_at;

-- 2. Créer le mapping ancien → nouveau ID
CREATE TEMP TABLE temp_roles_mapping AS
SELECT 
    old_roles.id as old_id,
    new_roles.id as new_id,
    old_roles.name
FROM roles old_roles
JOIN temp_unique_roles new_roles ON old_roles.name = new_roles.name;

-- 3. Mettre à jour les références
UPDATE user_roles 
SET role_id = rm.new_id
FROM temp_roles_mapping rm
WHERE user_roles.role_id = rm.old_id
AND rm.new_id IN (SELECT id FROM roles);

UPDATE profiles 
SET role = rm.name
FROM temp_roles_mapping rm
JOIN roles old_role ON rm.old_id = old_role.id
WHERE profiles.role = old_role.name
AND rm.name IN (SELECT name FROM roles);

-- 4. Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view roles for their tenant" ON roles;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON roles;
DROP POLICY IF EXISTS "roles_admin_only" ON roles;
DROP POLICY IF EXISTS "Users can view tenant roles" ON roles;
DROP POLICY IF EXISTS "Authenticated users can manage roles" ON roles;
DROP POLICY IF EXISTS "Users can view roles" ON roles;
DROP POLICY IF EXISTS "Users can manage roles" ON roles;

-- 5. Supprimer les doublons
DELETE FROM roles WHERE id NOT IN (SELECT id FROM temp_unique_roles);

-- 6. Repeupler avec les données uniques
INSERT INTO roles (id, name, display_name, description, hierarchy_level, is_system_role, created_at, updated_at)
SELECT id, name, display_name, description, hierarchy_level, is_system_role, created_at, updated_at
FROM temp_unique_roles
WHERE id NOT IN (SELECT id FROM roles);

-- 7. Supprimer la colonne tenant_id
ALTER TABLE roles DROP COLUMN IF EXISTS tenant_id;

-- 8. Ajouter contrainte unique
ALTER TABLE roles ADD CONSTRAINT unique_role_name UNIQUE (name);

-- 9. Configurer RLS global
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global read access for roles" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin write access for roles" ON roles FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- Vérification
SELECT 'roles' as table_name, COUNT(*) as count FROM roles;
SELECT column_name FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'tenant_id';
