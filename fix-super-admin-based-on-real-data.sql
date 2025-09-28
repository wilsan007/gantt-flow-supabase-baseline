-- Script pour corriger la fonction is_super_admin basé sur les données réelles
-- À exécuter dans Supabase Dashboard > SQL Editor

-- Analyse des données réelles :
-- profiles.tenant_id = "00000000-0000-0000-0000-000000000000" (tenant Super Admin existe)
-- user_roles.tenant_id = null (problème ici)
-- user_roles.role_id = "2cf22462-60f9-49d2-9db6-1ca27dd807f7" (rôle super_admin existe)
-- tenants.slug = "super-admin" (pas "super-admin-tenant")

-- 1. Corriger le tenant_id dans user_roles pour le Super Admin
UPDATE public.user_roles 
SET tenant_id = '00000000-0000-0000-0000-000000000000'::UUID
WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID
  AND role_id = '2cf22462-60f9-49d2-9db6-1ca27dd807f7'::UUID;

-- 2. Recréer la fonction is_super_admin avec la logique correcte basée sur les données réelles
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = COALESCE($1, auth.uid())
      AND r.name = 'super_admin'
      AND ur.is_active = true
      AND ur.tenant_id = '00000000-0000-0000-0000-000000000000'::UUID
  );
$$;

-- 3. Recréer la fonction get_user_tenant_id pour gérer le Super Admin
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT tenant_id 
  FROM public.profiles 
  WHERE user_id = COALESCE($1, auth.uid())
  LIMIT 1;
$$;

-- 4. Recréer la fonction has_global_access
CREATE OR REPLACE FUNCTION public.has_global_access(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.is_super_admin($1);
$$;

-- 5. Test immédiat avec les données réelles
SELECT 
    'TEST AVEC DONNEES REELLES' as test_section,
    public.is_super_admin('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) as should_be_true,
    public.has_global_access('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) as should_also_be_true,
    public.get_user_tenant_id('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) as tenant_id_should_not_be_null;

-- 6. Vérifier que les user_roles sont correctement configurés
SELECT 
    'VERIFICATION USER_ROLES' as verification_section,
    ur.user_id,
    ur.role_id,
    ur.tenant_id,
    ur.is_active,
    r.name as role_name
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
WHERE ur.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;
