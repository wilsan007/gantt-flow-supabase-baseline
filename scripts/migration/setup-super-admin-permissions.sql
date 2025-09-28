-- Script pour configurer toutes les permissions du Super Admin
-- Le super_admin n'a pas de tenant (tenant_id = NULL)

-- 1. Créer les permissions spéciales Super Admin
INSERT INTO public.permissions (name, display_name, description, resource, action, context) VALUES
('super_admin_invitations', 'Gérer Invitations', 'Gérer les invitations tenant owners', 'invitations', 'manage', 'global'),
('super_admin_tenants', 'Superviser Tenants', 'Superviser tous les tenants', 'tenants', 'supervise', 'global'),
('super_admin_system', 'Configuration Système', 'Accès configuration système', 'system', 'configure', 'global')
ON CONFLICT (name) DO NOTHING;

-- 2. Assigner TOUTES les permissions au rôle super_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'super_admin'),
  p.id
FROM public.permissions p
WHERE p.name IN (
  -- Permissions Système & Administration
  'admin_all',
  'roles_manage',
  'user_roles_assign',
  
  -- Permissions RH Complètes
  'hr_employees_manage',
  'hr_leave_manage',
  'hr_expense_manage',
  'hr_payroll_manage',
  
  -- Permissions Projets & Tâches
  'projects_create',
  'projects_view_all',
  'tasks_create',
  'tasks_manage_project',
  
  -- Permissions Documents & Communication
  'documents_manage',
  'comments_add',
  'comments_view',
  
  -- Permissions Spéciales Super Admin
  'super_admin_invitations',
  'super_admin_tenants',
  'super_admin_system'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. Vérifier les permissions assignées au Super Admin
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.display_name,
  p.description,
  p.resource,
  p.action,
  p.context
FROM public.roles r
JOIN public.role_permissions rp ON rp.role_id = r.id
JOIN public.permissions p ON p.id = rp.permission_id
WHERE r.name = 'super_admin'
ORDER BY p.resource, p.action;

-- 4. Vérifier que l'utilisateur Super Admin a bien toutes ces permissions
SELECT 
  'SUPER_ADMIN_PERMISSIONS' as verification,
  COUNT(*) as total_permissions,
  COUNT(CASE WHEN p.context = 'global' THEN 1 END) as global_permissions,
  COUNT(CASE WHEN p.context = 'all' THEN 1 END) as all_permissions
FROM public.user_roles ur
JOIN public.roles r ON r.id = ur.role_id
JOIN public.role_permissions rp ON rp.role_id = r.id
JOIN public.permissions p ON p.id = rp.permission_id
WHERE ur.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID
  AND r.name = 'super_admin'
  AND ur.is_active = true;
