-- Script pour corriger la fonction is_super_admin
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Recréer la fonction is_super_admin avec une logique plus robuste
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- Vérifier si l'utilisateur a le rôle super_admin ET est dans le tenant super-admin
  SELECT EXISTS(
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.profiles p ON ur.user_id = p.user_id
    JOIN public.tenants t ON p.tenant_id = t.id
    WHERE ur.user_id = $1
      AND r.name = 'super_admin'
      AND ur.is_active = true
      AND t.slug = 'super-admin-tenant'
      AND t.status = 'active'
  );
$$;

-- 2. Vérifier que le tenant super-admin existe
INSERT INTO public.tenants (id, name, slug, description, status, subscription_plan, max_users, max_projects)
VALUES (
  'super-admin-tenant-id'::UUID,
  'Super Admin Tenant',
  'super-admin-tenant',
  'Tenant spécial pour le Super Admin avec accès global',
  'active',
  'enterprise',
  999999,
  999999
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = 'active';

-- 3. S'assurer que le Super Admin est dans le bon tenant
UPDATE public.profiles 
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'super-admin-tenant')
WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;

-- 4. S'assurer que le rôle super_admin existe
INSERT INTO public.roles (id, name, display_name, description, permissions)
VALUES (
  'super-admin-role-id'::UUID,
  'super_admin',
  'Super Administrateur',
  'Accès complet à toutes les fonctionnalités et tous les tenants',
  '["*"]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- 5. Assigner le rôle super_admin à l'utilisateur Super Admin
INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, assigned_by, assigned_at)
VALUES (
  '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID,
  (SELECT id FROM public.roles WHERE name = 'super_admin'),
  (SELECT id FROM public.tenants WHERE slug = 'super-admin-tenant'),
  true,
  '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID,
  NOW()
)
ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
  is_active = true,
  assigned_at = NOW();

-- 6. Mettre à jour le rôle dans profiles pour la synchronisation
UPDATE public.profiles 
SET role = 'super_admin'
WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;

-- 7. Recréer la fonction has_global_access
CREATE OR REPLACE FUNCTION public.has_global_access(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.is_super_admin($1);
$$;

-- 8. Test de vérification
SELECT 
  'VERIFICATION TEST' as test_section,
  public.is_super_admin('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) as should_be_true,
  public.has_global_access('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) as should_also_be_true;
