-- ============================================
-- DIAGNOSTIC COMPLET UTILISATEUR RLS
-- User ID: 5c5731ce-75d0-4455-8184-bc42c626cb17
-- ============================================

-- 1. Vérifier l'utilisateur dans auth.users
SELECT 
  'AUTH USER' as source,
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE id = '5c5731ce-75d0-4455-8184-bc42c626cb17';

-- 2. Vérifier le profil
SELECT 
  'PROFILE' as source,
  user_id,
  role,
  full_name,
  created_at
FROM public.profiles 
WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17';

-- 3. Vérifier les rôles dans user_roles
SELECT 
  'USER_ROLES' as source,
  ur.user_id,
  ur.role,
  ur.tenant_id,
  r.name as role_name,
  r.description,
  t.name as tenant_name
FROM public.user_roles ur
LEFT JOIN public.roles r ON ur.role = r.name
LEFT JOIN public.tenants t ON ur.tenant_id = t.id
WHERE ur.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17';

-- 4. Vérifier si c'est un employé
SELECT 
  'EMPLOYEE' as source,
  id,
  employee_id,
  user_id,
  tenant_id,
  first_name,
  last_name,
  email,
  status
FROM public.employees 
WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17';

-- 5. Vérifier les invitations
SELECT 
  'INVITATIONS' as source,
  id,
  email,
  tenant_id,
  role,
  status,
  invited_by,
  created_at,
  expires_at
FROM public.invitations 
WHERE email = (SELECT email FROM auth.users WHERE id = '5c5731ce-75d0-4455-8184-bc42c626cb17');

-- 6. Vérifier les tenants associés
SELECT 
  'TENANTS' as source,
  t.id,
  t.name,
  t.slug,
  t.owner_id,
  t.created_at,
  CASE 
    WHEN t.owner_id = '5c5731ce-75d0-4455-8184-bc42c626cb17' THEN 'OWNER'
    ELSE 'MEMBER'
  END as relation
FROM public.tenants t
WHERE t.owner_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'
   OR t.id IN (
     SELECT tenant_id FROM public.user_roles 
     WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'
   );

-- 7. Tester l'accès aux tâches (simulation RLS)
-- Vérifier si l'utilisateur peut voir des tâches
SELECT 
  'TASKS_ACCESS_TEST' as source,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as tasks_with_tenant
FROM public.tasks;

-- 8. Vérifier les policies RLS sur la table tasks
SELECT 
  'TASKS_POLICIES' as source,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'tasks'
ORDER BY policyname;

-- 9. Vérifier si RLS est activé sur tasks
SELECT 
  'RLS_STATUS' as source,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('tasks', 'profiles', 'user_roles', 'employees');

-- 10. Test de la fonction get_current_tenant_id()
SELECT 
  'TENANT_ID_FUNCTION' as source,
  public.get_current_tenant_id() as current_tenant_id;

-- 11. Vérifier si l'utilisateur est super admin
SELECT 
  'SUPER_ADMIN_CHECK' as source,
  EXISTS(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17' 
      AND role = 'super_admin'
  ) as is_super_admin;
