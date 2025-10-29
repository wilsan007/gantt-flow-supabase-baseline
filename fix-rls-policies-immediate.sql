-- CORRIGER LES POLITIQUES RLS IMMÉDIATEMENT
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Supprimer les anciennes politiques qui posent problème
DROP POLICY IF EXISTS projects_by_user_roles ON public.projects;
DROP POLICY IF EXISTS tasks_by_user_roles ON public.tasks;
DROP POLICY IF EXISTS projects_by_tenant ON public.projects;
DROP POLICY IF EXISTS tasks_by_tenant ON public.tasks;

-- 2. Créer des politiques RLS plus permissives pour le Super Admin
CREATE POLICY projects_super_admin_access ON public.projects
FOR ALL
USING (
  -- Super Admin a accès à tout
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'super_admin'
  )
  OR
  -- Utilisateurs normaux : accès par tenant via user_roles
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = projects.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
)
WITH CHECK (
  -- Super Admin peut tout modifier
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'super_admin'
  )
  OR
  -- Utilisateurs normaux : modification par tenant
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = projects.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
);

CREATE POLICY tasks_super_admin_access ON public.tasks
FOR ALL
USING (
  -- Super Admin a accès à tout
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'super_admin'
  )
  OR
  -- Utilisateurs normaux : accès par tenant via user_roles
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = tasks.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
)
WITH CHECK (
  -- Super Admin peut tout modifier
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'super_admin'
  )
  OR
  -- Utilisateurs normaux : modification par tenant
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = tasks.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
);

-- 3. Politiques pour departments
DROP POLICY IF EXISTS departments_by_tenant ON public.departments;

CREATE POLICY departments_super_admin_access ON public.departments
FOR ALL
USING (
  -- Super Admin a accès à tout
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'super_admin'
  )
  OR
  -- Utilisateurs normaux : accès par tenant
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = departments.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
);

-- 4. S'assurer que RLS est activé
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 5. Test des politiques
SELECT 'Politiques RLS mises à jour avec accès Super Admin' as status;
