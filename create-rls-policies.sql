-- POLITIQUES RLS BASÉES SUR USER_ROLES
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ===== TENANTS =====
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_by_user_roles ON public.tenants
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = tenants.id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = tenants.id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
);

-- ===== PROFILES =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_by_user_roles ON public.profiles
FOR ALL
USING (
  -- L'utilisateur peut voir son propre profil
  user_id = auth.uid()
  OR
  -- Ou les profils du même tenant
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = profiles.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
)
WITH CHECK (
  -- L'utilisateur peut modifier son propre profil
  user_id = auth.uid()
  OR
  -- Ou les profils du même tenant (si admin)
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.tenant_id = profiles.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.name IN ('tenant_admin', 'hr_manager')
  )
);

-- ===== EMPLOYEES =====
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY employees_by_user_roles ON public.employees
FOR ALL
USING (
  -- L'utilisateur peut voir son propre employé
  user_id = auth.uid()
  OR
  -- Ou les employés du même tenant
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = employees.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
)
WITH CHECK (
  -- L'utilisateur peut modifier son propre employé
  user_id = auth.uid()
  OR
  -- Ou les employés du même tenant (si admin/HR)
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.tenant_id = employees.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.name IN ('tenant_admin', 'hr_manager')
  )
);

-- ===== USER_ROLES =====
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_roles_by_tenant ON public.user_roles
FOR ALL
USING (
  -- L'utilisateur peut voir ses propres rôles
  user_id = auth.uid()
  OR
  -- Ou les rôles du même tenant (si admin)
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.tenant_id = user_roles.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.name IN ('tenant_admin', 'hr_manager')
  )
)
WITH CHECK (
  -- Seuls les admins peuvent modifier les rôles
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.tenant_id = user_roles.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.name IN ('tenant_admin', 'hr_manager')
  )
);

-- ===== INVITATIONS =====
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitations_by_tenant ON public.invitations
FOR ALL
USING (
  -- L'utilisateur peut voir les invitations de son tenant
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = invitations.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
  OR
  -- Ou l'invitation qui lui est destinée
  email = auth.email()
)
WITH CHECK (
  -- Seuls les admins peuvent créer/modifier des invitations
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.tenant_id = invitations.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.name IN ('tenant_admin', 'hr_manager')
  )
);

-- ===== TABLES SYSTÈME (lecture seule pour utilisateurs authentifiés) =====

-- ROLES
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY roles_read_only ON public.roles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- PERMISSIONS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY permissions_read_only ON public.permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ROLE_PERMISSIONS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_permissions_read_only ON public.role_permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ===== EXEMPLE POUR D'AUTRES TABLES (PROJECTS, TASKS, etc.) =====

-- Si vous avez une table projects :
/*
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_by_user_roles ON public.projects
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = projects.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = projects.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
);
*/

-- ===== POLITIQUES AVEC PERMISSIONS FINES (EXEMPLE) =====

-- Exemple pour une table avec permissions granulaires :
/*
CREATE POLICY projects_with_permissions ON public.projects
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.tenant_id = projects.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
      AND p.name IN ('project.read', 'project.write')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.tenant_id = projects.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
      AND p.name = 'project.write'
  )
);
*/

-- ===== FONCTIONS UTILITAIRES =====

-- Fonction pour vérifier si un utilisateur a une permission spécifique
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id uuid,
  p_tenant_id uuid,
  p_permission_name text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND ur.tenant_id = p_tenant_id
      AND ur.is_active = true
      AND p.name = p_permission_name
  );
END;
$$;

-- Fonction pour obtenir les rôles d'un utilisateur dans un tenant
CREATE OR REPLACE FUNCTION public.get_user_roles(
  p_user_id uuid,
  p_tenant_id uuid
) RETURNS TABLE(role_name text, role_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT r.name, r.id
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = p_user_id
    AND ur.tenant_id = p_tenant_id
    AND ur.is_active = true;
END;
$$;
