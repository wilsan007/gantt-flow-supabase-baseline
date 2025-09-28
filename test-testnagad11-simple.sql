-- Script de test simplifié pour testnagad11@yahoo.com
-- Fonctionne avec le système de base (sans logs)

-- 1. Vérifier l'état actuel de l'utilisateur
SELECT 
  '=== ÉTAT ACTUEL UTILISATEUR ===' as section,
  id as user_id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'testnagad11@yahoo.com';

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
WHERE email = 'testnagad11@yahoo.com';

-- 3. Vérifier si des données tenant existent déjà
SELECT 
  '=== PROFIL EXISTANT ===' as section,
  id,
  email,
  full_name,
  tenant_id,
  created_at
FROM public.profiles 
WHERE email = 'testnagad11@yahoo.com';

SELECT 
  '=== TENANT EXISTANT ===' as section,
  t.id,
  t.name,
  t.created_at
FROM public.tenants t
JOIN public.invitations i ON t.id = i.tenant_id
WHERE i.email = 'testnagad11@yahoo.com';

-- 4. Vérifier quel système est installé
SELECT 
  '=== TRIGGERS INSTALLÉS ===' as section,
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname LIKE '%auto_tenant%'
ORDER BY tgname;

-- 5. Exécuter la fonction de réparation pour créer les données manquantes
DO $$
DECLARE
  user_record RECORD;
  repair_function_exists BOOLEAN;
BEGIN
  -- Vérifier si la fonction de réparation existe
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'repair_incomplete_users'
  ) INTO repair_function_exists;
  
  IF NOT repair_function_exists THEN
    RAISE NOTICE 'ATTENTION: La fonction repair_incomplete_users n''existe pas!';
    RAISE NOTICE 'Veuillez exécuter complete-auto-tenant-system.sql d''abord';
    RETURN;
  END IF;
  
  -- Récupérer l'utilisateur
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE email = 'testnagad11@yahoo.com';
  
  IF user_record.id IS NULL THEN
    RAISE NOTICE 'Utilisateur testnagad11@yahoo.com non trouvé dans auth.users';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Utilisateur trouvé: % (ID: %)', user_record.email, user_record.id;
  RAISE NOTICE 'Exécution de la fonction de réparation...';
  
  -- Appeler la fonction de réparation
  PERFORM repair_incomplete_users();
  
  RAISE NOTICE 'Fonction de réparation terminée';
  
END $$;

-- 6. Attendre un moment puis vérifier les résultats
SELECT pg_sleep(1);

-- 7. Vérifier les données créées après réparation
SELECT 
  '=== VÉRIFICATION FINALE - PROFIL ===' as section,
  id,
  email,
  full_name,
  tenant_id,
  role,
  created_at
FROM public.profiles 
WHERE email = 'testnagad11@yahoo.com';

SELECT 
  '=== VÉRIFICATION FINALE - EMPLOYÉ ===' as section,
  employee_id,
  email,
  full_name,
  user_id,
  tenant_id,
  created_at
FROM public.employees 
WHERE email = 'testnagad11@yahoo.com';

SELECT 
  '=== VÉRIFICATION FINALE - USER_ROLES ===' as section,
  ur.id,
  ur.user_id,
  ur.role_id,
  r.name as role_name,
  ur.created_at
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'testnagad11@yahoo.com';

SELECT 
  '=== VÉRIFICATION FINALE - INVITATION ===' as section,
  status,
  accepted_at,
  created_at
FROM public.invitations 
WHERE email = 'testnagad11@yahoo.com';

-- 8. Résumé du statut final
SELECT 
  '=== RÉSUMÉ STATUT FINAL ===' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'testnagad11@yahoo.com') THEN '✅ Profil créé'
    ELSE '❌ Profil manquant'
  END as profil_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'testnagad11@yahoo.com') THEN '✅ Employé créé'
    ELSE '❌ Employé manquant'
  END as employee_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur 
      JOIN auth.users u ON ur.user_id = u.id 
      WHERE u.email = 'testnagad11@yahoo.com'
    ) THEN '✅ Rôles assignés'
    ELSE '❌ Rôles manquants'
  END as roles_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.invitations 
      WHERE email = 'testnagad11@yahoo.com' AND status = 'accepted'
    ) THEN '✅ Invitation acceptée'
    ELSE '❌ Invitation non acceptée'
  END as invitation_status;

-- 9. Instructions pour la suite
SELECT 
  '=== INSTRUCTIONS ===' as section,
  'Si tous les statuts sont ✅, l''utilisateur peut se connecter' as message
UNION ALL
SELECT 
  '=== INSTRUCTIONS ===' as section,
  'Si des statuts sont ❌, vérifiez les erreurs dans les NOTICES ci-dessus' as message
UNION ALL
SELECT 
  '=== INSTRUCTIONS ===' as section,
  'Pour installer le système avec logs: exécutez complete-auto-tenant-system-with-logs.sql' as message;
