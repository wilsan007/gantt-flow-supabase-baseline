-- ==============================================
-- NETTOYAGE DES DOUBLONS: role_permissions
-- ==============================================
-- Supprimer les doublons dans role_permissions après migration

BEGIN;

-- 1. Identifier et compter les doublons
SELECT 
    role_id, 
    permission_id, 
    COUNT(*) as duplicate_count
FROM role_permissions 
GROUP BY role_id, permission_id 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. Créer une table temporaire avec les données uniques (garder le plus ancien)
CREATE TEMP TABLE temp_unique_role_permissions AS
SELECT DISTINCT ON (role_id, permission_id)
    id,
    role_id,
    permission_id,
    created_at
FROM role_permissions
ORDER BY role_id, permission_id, created_at;

-- 3. Supprimer tous les enregistrements de la table
DELETE FROM role_permissions;

-- 4. Réinsérer uniquement les données uniques
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT id, role_id, permission_id, created_at
FROM temp_unique_role_permissions;

-- 5. Vérifier qu'il n'y a plus de doublons
SELECT 
    'Après nettoyage' as status,
    COUNT(*) as total_records,
    COUNT(DISTINCT (role_id, permission_id)) as unique_combinations
FROM role_permissions;

-- 6. S'assurer que la contrainte unique existe
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS unique_role_permission;
ALTER TABLE role_permissions ADD CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id);

COMMIT;

-- Vérification finale
SELECT 'role_permissions' as table_name, COUNT(*) as final_count FROM role_permissions;
