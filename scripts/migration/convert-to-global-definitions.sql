-- ==============================================
-- Conversion vers Tables de Définition Globales
-- ==============================================
-- Ce script convertit l'architecture multi-tenant vers des tables de définition globales
-- partagées par tous les tenants

-- 1. SAUVEGARDER LES POLITIQUES RLS EXISTANTES (pour référence)
-- Les politiques seront supprimées puis recréées

-- 2. NETTOYER ET DÉDUPLIQUER LES DONNÉES
-- Créer des tables temporaires avec les définitions uniques

-- Table temporaire pour les rôles uniques
CREATE TEMP TABLE unique_roles AS
SELECT DISTINCT 
  name,
  display_name,
  description,
  hierarchy_level,
  is_system_role,
  created_at,
  updated_at
FROM public.roles
WHERE name IS NOT NULL;

-- Table temporaire pour les permissions uniques
CREATE TEMP TABLE unique_permissions AS
SELECT DISTINCT 
  name,
  description,
  resource,
  action,
  created_at,
  updated_at
FROM public.permissions
WHERE name IS NOT NULL;

-- 3. SUPPRIMER LES POLITIQUES RLS DÉPENDANTES
DROP POLICY IF EXISTS "Users can view tenant roles" ON public.roles;
DROP POLICY IF EXISTS "Authenticated users can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Users can view tenant permissions" ON public.permissions;
DROP POLICY IF EXISTS "Authenticated users can manage permissions" ON public.permissions;
DROP POLICY IF EXISTS "Users can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated users can manage role permissions" ON public.role_permissions;

-- Supprimer toutes les autres politiques existantes
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 4. VIDER LES TABLES EXISTANTES
TRUNCATE public.role_permissions CASCADE;
TRUNCATE public.roles CASCADE;
TRUNCATE public.permissions CASCADE;

-- 5. SUPPRIMER LES COLONNES TENANT_ID
ALTER TABLE public.roles DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.permissions DROP COLUMN IF EXISTS tenant_id CASCADE;

-- 6. RÉINSÉRER LES DONNÉES UNIQUES SANS TENANT_ID
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role, created_at, updated_at)
SELECT name, display_name, description, hierarchy_level, is_system_role, created_at, updated_at
FROM unique_roles;

INSERT INTO public.permissions (name, description, resource, action, created_at, updated_at)
SELECT name, description, resource, action, created_at, updated_at
FROM unique_permissions;

-- 7. RECRÉER LES LIAISONS ROLE_PERMISSIONS
-- Utiliser les premiers rôles et permissions trouvés pour recréer les liaisons logiques
INSERT INTO public.role_permissions (role_id, permission_id, created_at, updated_at)
SELECT DISTINCT
  r.id as role_id,
  p.id as permission_id,
  now() as created_at,
  now() as updated_at
FROM public.roles r
CROSS JOIN public.permissions p
WHERE 
  -- Logique de base : tenant_admin a toutes les permissions
  (r.name = 'tenant_admin') OR
  -- admin a toutes les permissions
  (r.name = 'admin') OR
  -- project_manager a les permissions projets/tâches
  (r.name = 'project_manager' AND p.resource IN ('projects', 'tasks')) OR
  -- hr_manager a les permissions RH
  (r.name = 'hr_manager' AND p.resource IN ('employees', 'hr')) OR
  -- employee a les permissions de lecture de base
  (r.name = 'employee' AND p.action = 'read');

-- 8. CRÉER LES NOUVELLES POLITIQUES RLS GLOBALES
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

-- Écriture restreinte aux super admins seulement
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

-- 9. AJOUTER DES CONTRAINTES POUR ÉVITER LES DOUBLONS
ALTER TABLE public.roles ADD CONSTRAINT IF NOT EXISTS unique_role_name UNIQUE (name);
ALTER TABLE public.permissions ADD CONSTRAINT IF NOT EXISTS unique_permission_name UNIQUE (name);
ALTER TABLE public.role_permissions ADD CONSTRAINT IF NOT EXISTS unique_role_permission UNIQUE (role_id, permission_id);

-- 10. INSÉRER LES RÔLES DE BASE S'ILS N'EXISTENT PAS
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role)
VALUES 
  ('tenant_admin', 'Administrateur du Tenant', 'Administrateur avec tous les droits sur le tenant', 100, true),
  ('admin', 'Administrateur', 'Administrateur système', 90, true),
  ('project_manager', 'Chef de Projet', 'Gestionnaire de projets et tâches', 70, false),
  ('hr_manager', 'Responsable RH', 'Gestionnaire des ressources humaines', 60, false),
  ('employee', 'Employé', 'Utilisateur standard', 10, false)
ON CONFLICT (name) DO NOTHING;

-- 11. INSÉRER LES PERMISSIONS DE BASE
INSERT INTO public.permissions (name, description, resource, action)
VALUES 
  ('projects:create', 'Créer des projets', 'projects', 'create'),
  ('projects:read', 'Voir les projets', 'projects', 'read'),
  ('projects:update', 'Modifier les projets', 'projects', 'update'),
  ('projects:delete', 'Supprimer les projets', 'projects', 'delete'),
  ('tasks:create', 'Créer des tâches', 'tasks', 'create'),
  ('tasks:read', 'Voir les tâches', 'tasks', 'read'),
  ('tasks:update', 'Modifier les tâches', 'tasks', 'update'),
  ('tasks:delete', 'Supprimer les tâches', 'tasks', 'delete'),
  ('employees:create', 'Créer des employés', 'employees', 'create'),
  ('employees:read', 'Voir les employés', 'employees', 'read'),
  ('employees:update', 'Modifier les employés', 'employees', 'update'),
  ('employees:delete', 'Supprimer les employés', 'employees', 'delete'),
  ('hr:manage', 'Gérer les RH', 'hr', 'manage'),
  ('reports:view', 'Voir les rapports', 'reports', 'read')
ON CONFLICT (name) DO NOTHING;

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
FROM public.role_permissions;
