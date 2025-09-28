-- Script de test final pour testnagad11@yahoo.com
-- Version corrigée sans colonnes inexistantes

-- 1. Vérifier l'état actuel de l'utilisateur
SELECT 
  '=== ÉTAT ACTUEL UTILISATEUR ===' as section,
  id as user_id,
  email,
  email_confirmed_at,
  created_at
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
  expires_at
FROM public.invitations 
WHERE email = 'testnagad11@yahoo.com';

-- 3. Vérifier si des données tenant existent déjà
SELECT 
  '=== PROFIL EXISTANT ===' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'testnagad11@yahoo.com') 
    THEN 'OUI - Profil existe déjà'
    ELSE 'NON - Profil manquant'
  END as profil_status;

SELECT 
  '=== EMPLOYÉ EXISTANT ===' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'testnagad11@yahoo.com') 
    THEN 'OUI - Employé existe déjà'
    ELSE 'NON - Employé manquant'
  END as employee_status;

-- 4. Exécuter la fonction de réparation
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
    RAISE NOTICE 'ERREUR: La fonction repair_incomplete_users n''existe pas!';
    RAISE NOTICE 'Veuillez exécuter complete-auto-tenant-system.sql d''abord';
    RETURN;
  END IF;
  
  -- Récupérer l'utilisateur
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE email = 'testnagad11@yahoo.com';
  
  IF user_record.id IS NULL THEN
    RAISE NOTICE 'ERREUR: Utilisateur testnagad11@yahoo.com non trouvé dans auth.users';
    RETURN;
  END IF;
  
  RAISE NOTICE 'SUCCESS: Utilisateur trouvé: % (ID: %)', user_record.email, user_record.id;
  RAISE NOTICE 'INFO: Exécution de la fonction de réparation...';
  
  -- Appeler la fonction de réparation
  PERFORM repair_incomplete_users();
  
  RAISE NOTICE 'SUCCESS: Fonction de réparation terminée';
  
END $$;

-- 5. Attendre et vérifier les résultats
SELECT pg_sleep(1);

-- 6. Vérification finale des données créées
SELECT 
  '=== RÉSULTATS APRÈS RÉPARATION ===' as section,
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
    ELSE '❌ Invitation en attente'
  END as invitation_status;

-- 7. Détails des données créées (si elles existent)
SELECT 
  '=== DÉTAILS PROFIL ===' as section,
  id,
  email,
  full_name,
  tenant_id,
  role
FROM public.profiles 
WHERE email = 'testnagad11@yahoo.com';

SELECT 
  '=== DÉTAILS EMPLOYÉ ===' as section,
  employee_id,
  email,
  full_name,
  user_id,
  tenant_id
FROM public.employees 
WHERE email = 'testnagad11@yahoo.com';

-- 8. Instructions finales
SELECT 
  '=== INSTRUCTIONS ===' as section,
  'Si tous les statuts sont ✅, l''utilisateur peut se connecter normalement' as message
UNION ALL
SELECT 
  '=== INSTRUCTIONS ===' as section,
  'Si des statuts sont ❌, vérifiez les messages d''erreur dans les NOTICES ci-dessus' as message;
