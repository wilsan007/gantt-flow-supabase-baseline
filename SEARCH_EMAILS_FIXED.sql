-- ═══════════════════════════════════════════════════════════════════════════
-- RECHERCHE D'EMAILS - VERSION CORRIGÉE
-- ═══════════════════════════════════════════════════════════════════════════

-- 1️⃣ auth.users
SELECT 
  'auth.users' as table_name,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- 2️⃣ profiles
SELECT 
  'profiles' as table_name,
  id,
  user_id,
  email,
  full_name,
  tenant_id,
  created_at
FROM public.profiles
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- 3️⃣ invitations
SELECT 
  'invitations' as table_name,
  id,
  email,
  full_name,
  invitation_type,
  status,
  tenant_id,
  invited_by,
  created_at,
  expires_at
FROM public.invitations
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com')
ORDER BY created_at DESC;

-- 4️⃣ employees
SELECT 
  'employees' as table_name,
  id,
  user_id,
  email,
  full_name,
  tenant_id,
  status,
  created_at
FROM public.employees
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- 5️⃣ user_roles
SELECT 
  'user_roles' as table_name,
  ur.id,
  ur.user_id,
  ur.role_id,
  ur.tenant_id,
  p.email,
  r.name as role_name,
  ur.created_at
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
LEFT JOIN public.roles r ON r.id = ur.role_id
WHERE p.email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- 6️⃣ tenants (chercher via profiles)
SELECT 
  'tenants' as table_name,
  t.id,
  t.name,
  t.created_at
FROM public.tenants t
WHERE t.id IN (
  SELECT DISTINCT tenant_id 
  FROM public.profiles 
  WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com')
    AND tenant_id IS NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════════════
-- RÉSUMÉ
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com')
UNION ALL
SELECT 
  'profiles',
  COUNT(*)
FROM public.profiles
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com')
UNION ALL
SELECT 
  'invitations',
  COUNT(*)
FROM public.invitations
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com')
UNION ALL
SELECT 
  'employees',
  COUNT(*)
FROM public.employees
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');
