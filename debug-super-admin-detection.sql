-- Script de diagnostic pour comprendre pourquoi is_super_admin retourne false
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Vérifier la structure actuelle de la fonction is_super_admin
SELECT 
  'FUNCTION DEFINITION' as debug_section,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'is_super_admin' AND n.nspname = 'public';

-- 2. Vérifier les données du Super Admin
SELECT 
  'SUPER ADMIN DATA CHECK' as debug_section,
  user_id,
  tenant_id,
  full_name,
  role,
  email
FROM public.profiles 
WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;

-- 3. Vérifier le tenant Super Admin
SELECT 
  'SUPER ADMIN TENANT CHECK' as debug_section,
  id,
  name,
  slug,
  status
FROM public.tenants 
WHERE slug = 'super-admin-tenant' OR name ILIKE '%super%admin%';

-- 4. Vérifier les rôles du Super Admin
SELECT 
  'SUPER ADMIN ROLES CHECK' as debug_section,
  ur.user_id,
  r.name as role_name,
  r.display_name,
  ur.is_active,
  ur.tenant_id,
  t.name as tenant_name
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.tenants t ON ur.tenant_id = t.id
WHERE ur.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;

-- 5. Test direct de la logique is_super_admin
SELECT 
  'DIRECT LOGIC TEST' as debug_section,
  EXISTS(
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID
      AND r.name = 'super_admin'
      AND ur.is_active = true
  ) as has_super_admin_role,
  EXISTS(
    SELECT 1 
    FROM public.profiles p
    JOIN public.tenants t ON p.tenant_id = t.id
    WHERE p.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID
      AND t.slug = 'super-admin-tenant'
  ) as has_super_admin_tenant;

-- 6. Vérifier tous les rôles disponibles
SELECT 
  'ALL ROLES CHECK' as debug_section,
  id,
  name,
  display_name,
  description
FROM public.roles
ORDER BY name;

-- 7. Test de la fonction avec l'utilisateur actuel (auth.uid())
SELECT 
  'CURRENT USER TEST' as debug_section,
  auth.uid() as current_user_id,
  public.is_super_admin() as is_super_admin_current,
  public.is_super_admin('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) as is_super_admin_specific;

-- 8. Vérifier la session actuelle
SELECT 
  'SESSION CHECK' as debug_section,
  auth.uid() as current_session_user,
  auth.role() as current_session_role;
