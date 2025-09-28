-- ==============================================
-- MIGRATION TABLE: permissions
-- ==============================================
-- Convertir la table permissions de multi-tenant vers globale

BEGIN;

-- 1. Sauvegarder les données uniques
CREATE TEMP TABLE temp_unique_permissions AS
SELECT DISTINCT ON (name) 
    id, name, display_name, description, resource, action, context, created_at
FROM permissions 
ORDER BY name, created_at;

-- 2. Créer le mapping ancien → nouveau ID
CREATE TEMP TABLE temp_permissions_mapping AS
SELECT 
    old_perms.id as old_id,
    new_perms.id as new_id,
    old_perms.name
FROM permissions old_perms
JOIN temp_unique_permissions new_perms ON old_perms.name = new_perms.name;

-- 3. Mettre à jour les références dans role_permissions
UPDATE role_permissions 
SET permission_id = pm.new_id
FROM temp_permissions_mapping pm
WHERE role_permissions.permission_id = pm.old_id
AND pm.new_id IN (SELECT id FROM permissions);

-- 4. Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view permissions for their tenant" ON permissions;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON permissions;
DROP POLICY IF EXISTS "permissions_admin_only" ON permissions;
DROP POLICY IF EXISTS "Users can view tenant permissions" ON permissions;
DROP POLICY IF EXISTS "Authenticated users can manage permissions" ON permissions;
DROP POLICY IF EXISTS "Users can view permissions" ON permissions;
DROP POLICY IF EXISTS "Users can manage permissions" ON permissions;

-- 5. Supprimer les doublons
DELETE FROM permissions WHERE id NOT IN (SELECT id FROM temp_unique_permissions);

-- 6. Repeupler avec les données uniques
INSERT INTO permissions (id, name, display_name, description, resource, action, context, created_at)
SELECT id, name, display_name, description, resource, action, context, created_at
FROM temp_unique_permissions
WHERE id NOT IN (SELECT id FROM permissions);

-- 7. Supprimer la colonne tenant_id
ALTER TABLE permissions DROP COLUMN IF EXISTS tenant_id;

-- 8. Ajouter contrainte unique
ALTER TABLE permissions ADD CONSTRAINT unique_permission_name UNIQUE (name);

-- 9. Configurer RLS global
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global read access for permissions" ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin write access for permissions" ON permissions FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- Vérification
SELECT 'permissions' as table_name, COUNT(*) as count FROM permissions;
SELECT column_name FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'tenant_id';
