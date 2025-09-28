-- ==============================================
-- MIGRATION TABLE: role_permissions
-- ==============================================
-- Convertir la table role_permissions de multi-tenant vers globale

BEGIN;

-- 1. Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view role_permissions for their tenant" ON role_permissions;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_admin_only" ON role_permissions;
DROP POLICY IF EXISTS "Users can view tenant role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Authenticated users can manage role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users can view role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users can manage role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Authenticated users can manage role permissions" ON role_permissions;

-- 2. Créer une table temporaire avec les données uniques
CREATE TEMP TABLE temp_unique_role_permissions AS
SELECT DISTINCT ON (role_id, permission_id)
    id, role_id, permission_id, created_at
FROM role_permissions
ORDER BY role_id, permission_id, created_at;

-- 3. Supprimer les doublons
DELETE FROM role_permissions WHERE id NOT IN (SELECT id FROM temp_unique_role_permissions);

-- 4. Repeupler avec les données uniques
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT id, role_id, permission_id, created_at
FROM temp_unique_role_permissions
WHERE id NOT IN (SELECT id FROM role_permissions);

-- 5. Supprimer la colonne tenant_id
ALTER TABLE role_permissions DROP COLUMN IF EXISTS tenant_id;

-- 6. Ajouter contrainte unique
ALTER TABLE role_permissions ADD CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id);

-- 7. Configurer RLS global
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global read access for role_permissions" ON role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin write access for role_permissions" ON role_permissions FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

COMMIT;

-- Vérification
SELECT 'role_permissions' as table_name, COUNT(*) as count FROM role_permissions;
SELECT column_name FROM information_schema.columns WHERE table_name = 'role_permissions' AND column_name = 'tenant_id';
