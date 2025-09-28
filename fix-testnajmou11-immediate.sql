-- Correction immédiate pour testnajmou11@yahoo.com
-- Utilisateur connecté mais profil manquant (HTTP 406)

-- 1. Vérifier l'état actuel de l'utilisateur
SELECT 
  '=== UTILISATEUR TESTNAJMOU11 ===' as section,
  id as user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'testnajmou11@yahoo.com';

-- 2. Vérifier s'il y a une invitation
SELECT 
  '=== INVITATION TESTNAJMOU11 ===' as section,
  id,
  email,
  full_name,
  tenant_id,
  invitation_type,
  status,
  expires_at
FROM public.invitations 
WHERE email = 'testnajmou11@yahoo.com';

-- 3. Vérifier profil existant
SELECT 
  '=== PROFIL EXISTANT ===' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'testnajmou11@yahoo.com') 
    THEN 'OUI - Profil existe'
    ELSE 'NON - Profil manquant'
  END as profil_status;

-- 4. Créer une invitation si elle n'existe pas
INSERT INTO public.invitations (
  email,
  invitation_type,
  status,
  full_name,
  expires_at,
  metadata
) VALUES (
  'testnajmou11@yahoo.com',
  'tenant_owner',
  'pending',
  'Test Najmou User',
  now() + interval '7 days',
  '{"company_name": "Test Najmou Company"}'::jsonb
)
ON CONFLICT (email, invitation_type) DO UPDATE SET
  status = 'pending',
  expires_at = now() + interval '7 days';

-- 5. Exécuter la fonction de réparation
DO $$
DECLARE
  user_record RECORD;
  repair_result TEXT;
BEGIN
  -- Récupérer l'utilisateur
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE email = 'testnajmou11@yahoo.com';
  
  IF user_record.id IS NULL THEN
    RAISE NOTICE 'ERREUR: Utilisateur testnajmou11@yahoo.com non trouvé';
    RETURN;
  END IF;
  
  RAISE NOTICE 'SUCCESS: Utilisateur trouvé: % (ID: %)', user_record.email, user_record.id;
  
  -- Tester si la fonction repair_incomplete_users existe
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'repair_incomplete_users') THEN
    RAISE NOTICE 'INFO: Exécution de repair_incomplete_users()...';
    PERFORM repair_incomplete_users();
    RAISE NOTICE 'SUCCESS: repair_incomplete_users() exécutée';
  ELSE
    RAISE NOTICE 'ATTENTION: repair_incomplete_users() n''existe pas';
    RAISE NOTICE 'INFO: Tentative de création manuelle du profil...';
    
    -- Créer manuellement le profil si la fonction n'existe pas
    INSERT INTO public.profiles (
      user_id,
      email,
      full_name,
      role
    ) VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', 'Test Najmou User'),
      'tenant_owner'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
    
    RAISE NOTICE 'SUCCESS: Profil créé manuellement';
  END IF;
  
END $$;

-- 6. Vérifier les résultats
SELECT pg_sleep(1);

-- 7. Vérification finale
SELECT 
  '=== RÉSULTATS APRÈS RÉPARATION ===' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'testnajmou11@yahoo.com') THEN '✅ Profil créé'
    ELSE '❌ Profil manquant'
  END as profil_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'testnajmou11@yahoo.com') THEN '✅ Employé créé'
    ELSE '❌ Employé manquant'
  END as employee_status;

-- 8. Détails du profil créé
SELECT 
  '=== DÉTAILS PROFIL ===' as section,
  id,
  user_id,
  email,
  full_name,
  tenant_id,
  role,
  created_at
FROM public.profiles 
WHERE email = 'testnajmou11@yahoo.com';

-- 9. Instructions
SELECT 
  '=== INSTRUCTIONS ===' as section,
  'L''utilisateur peut maintenant rafraîchir son navigateur' as message
UNION ALL
SELECT 
  '=== INSTRUCTIONS ===' as section,
  'Le profil devrait être accessible et l''erreur HTTP 406 résolue' as message;
