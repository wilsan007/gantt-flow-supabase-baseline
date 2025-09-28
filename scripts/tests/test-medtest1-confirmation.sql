-- Test de confirmation pour medtest1@yahoo.com
-- Simuler ce qui se passe quand l'utilisateur clique sur le lien de confirmation

-- 1. Vérifier l'état actuel de l'utilisateur
SELECT 
  '=== ÉTAT AVANT CONFIRMATION ===' as section,
  id as user_id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'medtest1@yahoo.com';

-- 2. Vérifier l'invitation existante
SELECT 
  '=== INVITATION EXISTANTE ===' as section,
  id,
  email,
  full_name,
  tenant_id,
  invitation_type,
  status,
  expires_at,
  metadata
FROM public.invitations 
WHERE email = 'medtest1@yahoo.com';

-- 3. Simuler la confirmation d'email (UPDATE email_confirmed_at)
-- Ceci devrait déclencher notre nouveau trigger
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'medtest1@yahoo.com' 
  AND email_confirmed_at IS NULL;

-- 4. Attendre un moment pour que le trigger s'exécute
SELECT pg_sleep(2);

-- 5. Vérifier si le profil a été créé
SELECT 
  '=== PROFIL APRÈS CONFIRMATION ===' as section,
  id,
  user_id,
  email,
  full_name,
  tenant_id,
  role,
  created_at
FROM public.profiles 
WHERE email = 'medtest1@yahoo.com';

-- 6. Vérifier si l'employé a été créé
SELECT 
  '=== EMPLOYÉ APRÈS CONFIRMATION ===' as section,
  id,
  employee_id,
  email,
  full_name,
  user_id,
  tenant_id,
  created_at
FROM public.employees 
WHERE email = 'medtest1@yahoo.com';

-- 7. Vérifier si le tenant a été créé/mis à jour
SELECT 
  '=== TENANT APRÈS CONFIRMATION ===' as section,
  t.id,
  t.name,
  t.created_by,
  t.created_at
FROM public.tenants t
JOIN public.invitations i ON i.tenant_id = t.id
WHERE i.email = 'medtest1@yahoo.com';

-- 8. Vérifier si l'invitation a été mise à jour
SELECT 
  '=== INVITATION APRÈS CONFIRMATION ===' as section,
  id,
  email,
  status,
  accepted_at,
  metadata
FROM public.invitations 
WHERE email = 'medtest1@yahoo.com';

-- 9. Vérifier les rôles utilisateur
SELECT 
  '=== RÔLES UTILISATEUR ===' as section,
  ur.id,
  ur.user_id,
  ur.role_id,
  r.name as role_name,
  r.description,
  ur.created_at
FROM public.user_roles ur
JOIN public.roles r ON r.id = ur.role_id
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'medtest1@yahoo.com';

-- 10. Résumé final
SELECT 
  '=== RÉSUMÉ FINAL ===' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'medtest1@yahoo.com') THEN '✅ Profil créé'
    ELSE '❌ Profil manquant'
  END as profil_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'medtest1@yahoo.com') THEN '✅ Employé créé'
    ELSE '❌ Employé manquant'
  END as employee_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.invitations WHERE email = 'medtest1@yahoo.com' AND status = 'accepted') THEN '✅ Invitation acceptée'
    ELSE '❌ Invitation non acceptée'
  END as invitation_status;
