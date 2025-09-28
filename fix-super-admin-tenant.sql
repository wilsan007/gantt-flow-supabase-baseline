-- Script pour créer un tenant spécial pour le Super Admin et corriger l'isolation des données
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Créer un tenant spécial pour le Super Admin
INSERT INTO public.tenants (
  id,
  name,
  slug,
  description,
  status,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000'::UUID,
  'Super Admin Tenant',
  'super-admin',
  'Tenant spécial pour le Super Admin avec accès global',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = 'Super Admin Tenant',
  slug = 'super-admin',
  description = 'Tenant spécial pour le Super Admin avec accès global',
  status = 'active',
  updated_at = NOW();

-- 2. Assigner le tenant Super Admin au profil Super Admin
UPDATE public.profiles 
SET tenant_id = '00000000-0000-0000-0000-000000000000'::UUID
WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;

-- 3. Créer un rôle spécial "global_admin" avec tous les droits
INSERT INTO public.roles (
  id,
  name,
  display_name,
  description,
  tenant_id,
  is_system_role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'global_admin',
  'Super Administrateur',
  'Administrateur global avec accès à tous les tenants',
  '00000000-0000-0000-0000-000000000000'::UUID,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = 'global_admin',
  display_name = 'Super Administrateur',
  description = 'Administrateur global avec accès à tous les tenants',
  tenant_id = '00000000-0000-0000-0000-000000000000'::UUID,
  is_system_role = true,
  updated_at = NOW();

-- 4. Assigner le rôle global_admin au Super Admin
INSERT INTO public.user_roles (
  user_id,
  role_id,
  context_type,
  context_id,
  tenant_id,
  assigned_by,
  assigned_at,
  is_active
) VALUES (
  '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID,
  '00000000-0000-0000-0000-000000000001'::UUID,
  'global',
  NULL,
  '00000000-0000-0000-0000-000000000000'::UUID,
  '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID,
  NOW(),
  true
) ON CONFLICT (user_id, role_id, context_type, context_id) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- 5. Modifier la fonction get_user_tenant_id pour gérer le Super Admin
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      -- Si c'est le Super Admin, retourner son tenant spécial
      WHEN auth.uid() = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID THEN 
        '00000000-0000-0000-0000-000000000000'::UUID
      -- Sinon, retourner le tenant normal du profil
      ELSE 
        (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
    END;
$$;

-- 6. Modifier la fonction is_super_admin pour utiliser le tenant
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.user_roles ur ON p.user_id = ur.user_id
    JOIN public.roles r ON ur.role_id = r.id
    WHERE p.user_id = $1
      AND p.tenant_id = '00000000-0000-0000-0000-000000000000'::UUID
      AND r.name = 'global_admin'
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
$$;

-- 7. Créer une fonction pour vérifier si un utilisateur a accès global
CREATE OR REPLACE FUNCTION public.has_global_access(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.is_super_admin($1);
$$;

-- 8. Modifier les politiques RLS pour respecter l'isolation par tenant
-- Supprimer TOUTES les politiques existantes
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_tenant_isolation_select" ON tasks;
DROP POLICY IF EXISTS "tasks_tenant_isolation_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_tenant_isolation_update" ON tasks;
DROP POLICY IF EXISTS "tasks_tenant_isolation_delete" ON tasks;

DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;
DROP POLICY IF EXISTS "projects_tenant_isolation_select" ON projects;
DROP POLICY IF EXISTS "projects_tenant_isolation_insert" ON projects;
DROP POLICY IF EXISTS "projects_tenant_isolation_update" ON projects;
DROP POLICY IF EXISTS "projects_tenant_isolation_delete" ON projects;

-- Créer des politiques strictes par tenant avec exception pour Super Admin
CREATE POLICY "tasks_tenant_isolation_select" ON tasks 
FOR SELECT 
USING (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "tasks_tenant_isolation_insert" ON tasks 
FOR INSERT 
WITH CHECK (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "tasks_tenant_isolation_update" ON tasks 
FOR UPDATE 
USING (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "tasks_tenant_isolation_delete" ON tasks 
FOR DELETE 
USING (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "projects_tenant_isolation_select" ON projects 
FOR SELECT 
USING (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "projects_tenant_isolation_insert" ON projects 
FOR INSERT 
WITH CHECK (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "projects_tenant_isolation_update" ON projects 
FOR UPDATE 
USING (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "projects_tenant_isolation_delete" ON projects 
FOR DELETE 
USING (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

-- 9. Appliquer les mêmes politiques aux autres tables importantes
DROP POLICY IF EXISTS "employees_select_policy" ON employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON employees;
DROP POLICY IF EXISTS "employees_update_policy" ON employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON employees;
DROP POLICY IF EXISTS "employees_tenant_isolation_select" ON employees;
DROP POLICY IF EXISTS "employees_tenant_isolation_insert" ON employees;
DROP POLICY IF EXISTS "employees_tenant_isolation_update" ON employees;
DROP POLICY IF EXISTS "employees_tenant_isolation_delete" ON employees;

CREATE POLICY "employees_tenant_isolation_select" ON employees 
FOR SELECT 
USING (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "employees_tenant_isolation_insert" ON employees 
FOR INSERT 
WITH CHECK (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "employees_tenant_isolation_update" ON employees 
FOR UPDATE 
USING (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "employees_tenant_isolation_delete" ON employees 
FOR DELETE 
USING (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

-- 10. Politiques pour les départements
DROP POLICY IF EXISTS "departments_select_policy" ON departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON departments;
DROP POLICY IF EXISTS "departments_update_policy" ON departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON departments;
DROP POLICY IF EXISTS "departments_tenant_isolation_select" ON departments;
DROP POLICY IF EXISTS "departments_tenant_isolation_insert" ON departments;
DROP POLICY IF EXISTS "departments_tenant_isolation_update" ON departments;
DROP POLICY IF EXISTS "departments_tenant_isolation_delete" ON departments;

CREATE POLICY "departments_tenant_isolation_select" ON departments 
FOR SELECT 
USING (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "departments_tenant_isolation_insert" ON departments 
FOR INSERT 
WITH CHECK (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "departments_tenant_isolation_update" ON departments 
FOR UPDATE 
USING (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

CREATE POLICY "departments_tenant_isolation_delete" ON departments 
FOR DELETE 
USING (
  tenant_id = public.get_user_tenant_id() 
  OR public.has_global_access()
);

-- 11. Politiques spéciales pour la navigation Super Admin
-- Le Super Admin doit pouvoir accéder au module Super Admin uniquement
DROP POLICY IF EXISTS "super_admin_module_access" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

CREATE POLICY "super_admin_module_access" ON profiles 
FOR SELECT 
USING (
  -- Tout le monde peut voir son propre profil
  user_id = auth.uid()
  -- Le Super Admin peut voir tous les profils
  OR public.has_global_access()
);

-- 12. Vérifications finales
SELECT 
  'Super Admin Tenant Created' as status,
  id,
  name,
  slug
FROM public.tenants 
WHERE id = '00000000-0000-0000-0000-000000000000'::UUID;

SELECT 
  'Super Admin Profile Updated' as status,
  user_id,
  tenant_id,
  full_name
FROM public.profiles 
WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;

SELECT 
  'Super Admin Role Assignment' as status,
  ur.user_id,
  ur.tenant_id,
  r.name as role_name
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
WHERE ur.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;

-- 13. Test des fonctions
SELECT 
  'Function Tests' as test_category,
  public.get_user_tenant_id() as current_tenant,
  public.is_super_admin() as is_super_admin_result,
  public.has_global_access() as has_global_access_result;
