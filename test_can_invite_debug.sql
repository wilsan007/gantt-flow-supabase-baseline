-- Script de debug pour can_invite_collaborators
-- Utilisateur test: wilwaalnabad@gmail.com (6ad48f7b-c9db-45d3-9ced-6ba577832b39)

-- 1. Vérifier l'utilisateur dans profiles
SELECT 
  'PROFILES' as source,
  user_id, 
  tenant_id, 
  full_name, 
  email, 
  role as profile_role
FROM public.profiles
WHERE user_id = '6ad48f7b-c9db-45d3-9ced-6ba577832b39';

-- 2. Vérifier dans user_roles
SELECT 
  'USER_ROLES' as source,
  ur.user_id,
  ur.role_id,
  ur.tenant_id,
  ur.is_active,
  r.name as role_name,
  r.display_name
FROM public.user_roles ur
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE ur.user_id = '6ad48f7b-c9db-45d3-9ced-6ba577832b39';

-- 3. Tester la fonction can_invite_collaborators
SELECT 
  'FUNCTION_RESULT' as test,
  public.can_invite_collaborators('6ad48f7b-c9db-45d3-9ced-6ba577832b39') as can_invite;

-- 4. Débug manuel de la logique de la fonction
WITH user_role_check AS (
  SELECT r.name as role_name
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = '6ad48f7b-c9db-45d3-9ced-6ba577832b39'
    AND ur.is_active = TRUE
  LIMIT 1
)
SELECT 
  'MANUAL_CHECK' as test,
  role_name,
  CASE 
    WHEN role_name IN ('tenant_admin', 'manager', 'hr_manager') THEN TRUE
    ELSE FALSE
  END as should_have_permission
FROM user_role_check;

-- 5. Liste de tous les rôles disponibles
SELECT 
  'ALL_ROLES' as info,
  id,
  name,
  display_name
FROM public.roles
ORDER BY name;
