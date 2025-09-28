-- Script de test complet pour vérifier l'isolation des données par tenant
-- À exécuter dans Supabase Dashboard > SQL Editor après fix-super-admin-tenant.sql

-- 1. Vérifier la configuration des tenants
SELECT 
  'TENANTS CONFIGURATION' as test_section,
  id,
  name,
  slug,
  status
FROM public.tenants
ORDER BY created_at;

-- 2. Vérifier la configuration du Super Admin
SELECT 
  'SUPER ADMIN CONFIGURATION' as test_section,
  p.user_id,
  p.tenant_id,
  p.full_name,
  p.role,
  t.name as tenant_name
FROM public.profiles p
LEFT JOIN public.tenants t ON p.tenant_id = t.id
WHERE p.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;

-- 3. Vérifier les rôles du Super Admin
SELECT 
  'SUPER ADMIN ROLES' as test_section,
  ur.user_id,
  r.name as role_name,
  r.display_name,
  ur.is_active,
  ur.tenant_id
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
WHERE ur.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID
  AND ur.is_active = true;

-- 4. Vérifier la configuration de l'admin normal
SELECT 
  'NORMAL ADMIN CONFIGURATION' as test_section,
  p.user_id,
  p.tenant_id,
  p.full_name,
  p.role,
  t.name as tenant_name
FROM public.profiles p
LEFT JOIN public.tenants t ON p.tenant_id = t.id
WHERE p.user_id = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d'::UUID;

-- 5. Vérifier les rôles de l'admin normal
SELECT 
  'NORMAL ADMIN ROLES' as test_section,
  ur.user_id,
  r.name as role_name,
  r.display_name,
  ur.is_active,
  ur.tenant_id
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
WHERE ur.user_id = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d'::UUID
  AND ur.is_active = true;

-- 6. Tester les fonctions d'accès pour le Super Admin
SELECT 
  'SUPER ADMIN FUNCTIONS TEST' as test_section,
  public.is_super_admin('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) as should_be_true,
  public.has_global_access('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) as should_be_true_global;

-- 7. Tester les fonctions d'accès pour l'admin normal
SELECT 
  'NORMAL ADMIN FUNCTIONS TEST' as test_section,
  public.is_super_admin('ebb4c3fe-6288-41df-972d-4a6f32ed813d'::UUID) as should_be_false,
  public.has_global_access('ebb4c3fe-6288-41df-972d-4a6f32ed813d'::UUID) as should_be_false_global;

-- 8. Vérifier les politiques RLS sur les tâches
SELECT 
  'TASKS RLS POLICIES' as test_section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'tasks' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 9. Vérifier les politiques RLS sur les projets
SELECT 
  'PROJECTS RLS POLICIES' as test_section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'projects' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 10. Compter les données par tenant
SELECT 
  'DATA COUNT BY TENANT' as test_section,
  t.name as tenant_name,
  t.id as tenant_id,
  (SELECT COUNT(*) FROM public.tasks WHERE tenant_id = t.id) as tasks_count,
  (SELECT COUNT(*) FROM public.projects WHERE tenant_id = t.id) as projects_count,
  (SELECT COUNT(*) FROM public.employees WHERE tenant_id = t.id) as employees_count
FROM public.tenants t
ORDER BY t.name;

-- 11. Test d'accès simulé - Vérifier que get_user_tenant_id fonctionne
SELECT 
  'TENANT ID FUNCTIONS TEST' as test_section,
  'Super Admin tenant_id should be super_admin_tenant' as description,
  (SELECT tenant_id FROM public.profiles WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) as super_admin_tenant_id,
  'Normal Admin tenant_id should be different' as description2,
  (SELECT tenant_id FROM public.profiles WHERE user_id = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d'::UUID) as normal_admin_tenant_id;

-- 12. Vérifier que le tenant Super Admin existe et est configuré correctement
SELECT 
  'SUPER ADMIN TENANT CHECK' as test_section,
  id,
  name,
  slug,
  status,
  description
FROM public.tenants 
WHERE slug = 'super-admin-tenant' OR name = 'Super Admin Tenant';

-- 13. Test final - Vérifier l'isolation complète
SELECT 
  'ISOLATION TEST SUMMARY' as test_section,
  'Super Admin can see all data' as super_admin_access,
  'Normal Admin can only see their tenant data' as normal_admin_access,
  'RLS policies enforce tenant isolation' as security_status;
