-- Script de test spécifique pour testnagad11@yahoo.com
-- Utilisateur avec compte temporaire et invitation existante

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

-- 4. Vérifier si la table de logs existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trigger_execution_logs') THEN
    RAISE NOTICE 'Table trigger_execution_logs trouvée - système avec logs installé';
  ELSE
    RAISE NOTICE 'Table trigger_execution_logs non trouvée - système de base installé';
  END IF;
END $$;

-- 5. Forcer l'exécution du trigger manuellement si nécessaire
-- (Simuler ce qui se passe quand l'utilisateur confirme son email)
DO $$
DECLARE
  user_record RECORD;
  trigger_exists BOOLEAN;
BEGIN
  -- Vérifier si le trigger existe
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'auto_tenant_creation_trigger_complete_with_logs'
  ) INTO trigger_exists;
  
  IF NOT trigger_exists THEN
    RAISE NOTICE 'ATTENTION: Le trigger avec logs n''est pas installé!';
    RAISE NOTICE 'Veuillez exécuter complete-auto-tenant-system-with-logs.sql d''abord';
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
  
  -- Simuler une mise à jour pour déclencher le trigger
  -- (Le trigger se déclenche sur INSERT, pas UPDATE, donc on teste la fonction directement)
  RAISE NOTICE 'Test de la fonction trigger directement...';
  
  -- Appeler la fonction de réparation pour cet utilisateur
  PERFORM repair_incomplete_users();
  
  RAISE NOTICE 'Fonction de réparation exécutée';
  
END $$;

-- 6. Vérifier les résultats après exécution
SELECT pg_sleep(2);

-- 7. Consulter les nouveaux logs (si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trigger_execution_logs') THEN
    RAISE NOTICE '=== CONSULTATION DES LOGS ===';
    PERFORM * FROM (
      SELECT 
        step_number,
        step_name,
        status,
        message,
        error_details,
        execution_time
      FROM trigger_execution_logs 
      WHERE user_email = 'testnagad11@yahoo.com'
        AND execution_time > now() - interval '5 minutes'
      ORDER BY execution_time DESC, step_number
    ) logs;
  ELSE
    RAISE NOTICE 'Pas de table de logs - utilisation du système de base';
  END IF;
END $$;

-- 8. Vérifier les données créées
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

-- 9. Résumé du statut
SELECT 
  '=== RÉSUMÉ STATUT ===' as section,
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
