-- ==============================================
-- Conversion Complète vers Tables de Définition Globales
-- ==============================================
-- Basé sur l'analyse complète de la base de données

-- 1. SAUVEGARDER LES DONNÉES UNIQUES
-- Créer des tables temporaires avec les définitions uniques

CREATE TEMP TABLE unique_roles AS
SELECT DISTINCT 
  name,
  display_name,
  description,
  hierarchy_level,
  is_system_role,
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at
FROM public.roles
WHERE name IS NOT NULL
GROUP BY name, display_name, description, hierarchy_level, is_system_role;

CREATE TEMP TABLE unique_permissions AS
SELECT DISTINCT 
  name,
  display_name,
  description,
  resource,
  action,
  context,
  MIN(created_at) as created_at
FROM public.permissions
WHERE name IS NOT NULL
GROUP BY name, display_name, description, resource, action, context;

-- 2. SUPPRIMER LES POLITIQUES RLS DÉPENDANTES
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('roles', 'permissions', 'role_permissions')
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 3. CRÉER UNE TABLE DE MAPPING POUR LES ANCIENNES RÉFÉRENCES
CREATE TEMP TABLE role_id_mapping AS
SELECT 
  old_roles.id as old_id,
  new_roles.id as new_id,
  old_roles.name,
  old_roles.tenant_id as old_tenant_id
FROM public.roles old_roles
JOIN unique_roles ur ON (
  old_roles.name = ur.name AND
  COALESCE(old_roles.display_name, '') = COALESCE(ur.display_name, '') AND
  COALESCE(old_roles.description, '') = COALESCE(ur.description, '')
)
JOIN public.roles new_roles ON (
  new_roles.name = ur.name AND
  COALESCE(new_roles.display_name, '') = COALESCE(ur.display_name, '') AND
  COALESCE(new_roles.description, '') = COALESCE(ur.description, '')
)
WHERE new_roles.ctid = (
  SELECT MIN(ctid) 
  FROM public.roles 
  WHERE name = ur.name 
  AND COALESCE(display_name, '') = COALESCE(ur.display_name, '')
  AND COALESCE(description, '') = COALESCE(ur.description, '')
);

CREATE TEMP TABLE permission_id_mapping AS
SELECT 
  old_perms.id as old_id,
  new_perms.id as new_id,
  old_perms.name,
  old_perms.tenant_id as old_tenant_id
FROM public.permissions old_perms
JOIN unique_permissions up ON (
  old_perms.name = up.name AND
  COALESCE(old_perms.resource, '') = COALESCE(up.resource, '') AND
  COALESCE(old_perms.action, '') = COALESCE(up.action, '')
)
JOIN public.permissions new_perms ON (
  new_perms.name = up.name AND
  COALESCE(new_perms.resource, '') = COALESCE(up.resource, '') AND
  COALESCE(new_perms.action, '') = COALESCE(up.action, '')
)
WHERE new_perms.ctid = (
  SELECT MIN(ctid) 
  FROM public.permissions 
  WHERE name = up.name 
  AND COALESCE(resource, '') = COALESCE(up.resource, '')
  AND COALESCE(action, '') = COALESCE(up.action, '')
);

-- 4. METTRE À JOUR LES RÉFÉRENCES DANS user_roles
UPDATE public.user_roles 
SET role_id = rim.new_id
FROM role_id_mapping rim 
WHERE user_roles.role_id = rim.old_id;

-- 5. METTRE À JOUR LES RÉFÉRENCES DANS role_permissions
UPDATE public.role_permissions 
SET 
  role_id = COALESCE(rim.new_id, role_permissions.role_id),
  permission_id = COALESCE(pim.new_id, role_permissions.permission_id)
FROM role_id_mapping rim 
FULL OUTER JOIN permission_id_mapping pim ON (
  role_permissions.role_id = rim.old_id AND 
  role_permissions.permission_id = pim.old_id
)
WHERE role_permissions.role_id = rim.old_id OR role_permissions.permission_id = pim.old_id;

-- 6. SUPPRIMER LES DOUBLONS DANS role_permissions
DELETE FROM public.role_permissions 
WHERE ctid NOT IN (
  SELECT MIN(ctid) 
  FROM public.role_permissions 
  GROUP BY role_id, permission_id
);

-- 7. SUPPRIMER LES DOUBLONS DANS permissions
DELETE FROM public.permissions 
WHERE ctid NOT IN (
  SELECT MIN(ctid) 
  FROM public.permissions 
  GROUP BY name, COALESCE(resource, ''), COALESCE(action, '')
);

-- 8. SUPPRIMER LES DOUBLONS DANS roles
DELETE FROM public.roles 
WHERE ctid NOT IN (
  SELECT MIN(ctid) 
  FROM public.roles 
  GROUP BY name, COALESCE(display_name, ''), COALESCE(description, '')
);

-- 9. SUPPRIMER LES COLONNES tenant_id DES TABLES DE DÉFINITION
ALTER TABLE public.roles DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.permissions DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.role_permissions DROP COLUMN IF EXISTS tenant_id CASCADE;

-- 10. CRÉER LES NOUVELLES POLITIQUES RLS GLOBALES
-- Lecture libre pour tous les utilisateurs authentifiés
CREATE POLICY "Global read access for roles" 
ON public.roles FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Global read access for permissions" 
ON public.permissions FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Global read access for role_permissions" 
ON public.role_permissions FOR SELECT 
TO authenticated
USING (true);

-- Écriture restreinte (seuls les super admins peuvent modifier via service_role)
CREATE POLICY "Restrict write access for roles" 
ON public.roles FOR ALL 
TO authenticated
USING (false) 
WITH CHECK (false);

CREATE POLICY "Restrict write access for permissions" 
ON public.permissions FOR ALL 
TO authenticated
USING (false) 
WITH CHECK (false);

CREATE POLICY "Restrict write access for role_permissions" 
ON public.role_permissions FOR ALL 
TO authenticated
USING (false) 
WITH CHECK (false);

-- 11. AJOUTER DES CONTRAINTES POUR ÉVITER LES DOUBLONS
ALTER TABLE public.roles 
ADD CONSTRAINT IF NOT EXISTS unique_role_name 
UNIQUE (name);

ALTER TABLE public.permissions 
ADD CONSTRAINT IF NOT EXISTS unique_permission_name_resource_action 
UNIQUE (name, resource, action);

ALTER TABLE public.role_permissions 
ADD CONSTRAINT IF NOT EXISTS unique_role_permission 
UNIQUE (role_id, permission_id);

-- 12. INSÉRER LES RÔLES DE BASE S'ILS MANQUENT
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role)
VALUES 
  ('tenant_admin', 'Administrateur du Tenant', 'Administrateur avec tous les droits sur le tenant', 100, true),
  ('admin', 'Administrateur', 'Administrateur système', 90, true),
  ('project_manager', 'Chef de Projet', 'Gestionnaire de projets et tâches', 70, false),
  ('hr_manager', 'Responsable RH', 'Gestionnaire des ressources humaines', 60, false),
  ('employee', 'Employé', 'Utilisateur standard', 10, false)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  hierarchy_level = EXCLUDED.hierarchy_level,
  is_system_role = EXCLUDED.is_system_role;

-- 13. INSÉRER LES PERMISSIONS DE BASE S'ILS MANQUENT
INSERT INTO public.permissions (name, display_name, description, resource, action, context)
VALUES 
  ('projects:create', 'Créer des projets', 'Créer de nouveaux projets', 'projects', 'create', 'all'),
  ('projects:read', 'Voir les projets', 'Consulter les projets', 'projects', 'read', 'all'),
  ('projects:update', 'Modifier les projets', 'Modifier les projets existants', 'projects', 'update', 'all'),
  ('projects:delete', 'Supprimer les projets', 'Supprimer des projets', 'projects', 'delete', 'all'),
  ('tasks:create', 'Créer des tâches', 'Créer de nouvelles tâches', 'tasks', 'create', 'all'),
  ('tasks:read', 'Voir les tâches', 'Consulter les tâches', 'tasks', 'read', 'all'),
  ('tasks:update', 'Modifier les tâches', 'Modifier les tâches existantes', 'tasks', 'update', 'all'),
  ('tasks:delete', 'Supprimer les tâches', 'Supprimer des tâches', 'tasks', 'delete', 'all'),
  ('employees:create', 'Créer des employés', 'Ajouter de nouveaux employés', 'employees', 'create', 'all'),
  ('employees:read', 'Voir les employés', 'Consulter les employés', 'employees', 'read', 'all'),
  ('employees:update', 'Modifier les employés', 'Modifier les données employés', 'employees', 'update', 'all'),
  ('employees:delete', 'Supprimer des employés', 'Supprimer des employés', 'employees', 'delete', 'all'),
  ('admin_all', 'Administration Complète', 'Accès administrateur complet', 'all', 'manage', 'all')
ON CONFLICT (name, resource, action) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  context = EXCLUDED.context;

-- 14. RECRÉER LES LIAISONS role_permissions DE BASE
INSERT INTO public.role_permissions (role_id, permission_id, created_at)
SELECT DISTINCT
  r.id as role_id,
  p.id as permission_id,
  now() as created_at
FROM public.roles r
CROSS JOIN public.permissions p
WHERE 
  -- tenant_admin et admin ont toutes les permissions
  (r.name IN ('tenant_admin', 'admin')) OR
  -- project_manager a les permissions projets/tâches
  (r.name = 'project_manager' AND p.resource IN ('projects', 'tasks')) OR
  -- hr_manager a les permissions RH
  (r.name = 'hr_manager' AND p.resource IN ('employees')) OR
  -- employee a les permissions de lecture
  (r.name = 'employee' AND p.action = 'read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

SELECT 'Conversion vers tables de définition globales terminée avec succès.' as status;

-- Afficher un résumé des données finales
SELECT 
  'roles' as table_name,
  COUNT(*) as total_records
FROM public.roles
UNION ALL
SELECT 
  'permissions' as table_name,
  COUNT(*) as total_records  
FROM public.permissions
UNION ALL
SELECT 
  'role_permissions' as table_name,
  COUNT(*) as total_records
FROM public.role_permissions
UNION ALL
SELECT 
  'user_roles' as table_name,
  COUNT(*) as total_records
FROM public.user_roles;
