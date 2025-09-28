-- Debug complet pour medtest1@yahoo.com
-- Vérification étape par étape

-- 1. D'abord, vérifier si le trigger existe
SELECT 
  '=== TRIGGERS EXISTANTS ===' as section,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 2. Vérifier l'état actuel de medtest1@yahoo.com
SELECT 
  '=== UTILISATEUR MEDTEST1 ===' as section,
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'medtest1@yahoo.com';

-- 3. Vérifier l'invitation
SELECT 
  '=== INVITATION MEDTEST1 ===' as section,
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

-- 4. Vérifier si profil existe déjà
SELECT 
  '=== PROFIL EXISTANT ===' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'medtest1@yahoo.com') 
    THEN 'PROFIL EXISTE DÉJÀ'
    ELSE 'AUCUN PROFIL'
  END as status;

-- 5. Installer le trigger s'il n'existe pas
\i fix-trigger-on-email-confirmation.sql

-- 6. Vérifier que le trigger est maintenant installé
SELECT 
  '=== TRIGGER APRÈS INSTALLATION ===' as section,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name LIKE '%confirmation%';

-- 7. Maintenant tester la confirmation d'email
-- Simuler ce qui se passe quand l'utilisateur clique sur le lien
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'medtest1@yahoo.com';

-- 8. Attendre que le trigger s'exécute
SELECT pg_sleep(3);

-- 9. Vérifier les résultats après trigger
SELECT 
  '=== RÉSULTATS APRÈS TRIGGER ===' as section,
  'Profil créé: ' || CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'medtest1@yahoo.com') 
    THEN 'OUI ✅'
    ELSE 'NON ❌'
  END as profil_status,
  'Employé créé: ' || CASE 
    WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'medtest1@yahoo.com') 
    THEN 'OUI ✅'
    ELSE 'NON ❌'
  END as employee_status,
  'Invitation acceptée: ' || CASE 
    WHEN EXISTS (SELECT 1 FROM public.invitations WHERE email = 'medtest1@yahoo.com' AND status = 'accepted') 
    THEN 'OUI ✅'
    ELSE 'NON ❌'
  END as invitation_status;

-- 10. Si le trigger n'a pas fonctionné, exécuter manuellement
DO $$
DECLARE
  user_record auth.users%ROWTYPE;
BEGIN
  -- Récupérer l'utilisateur
  SELECT * INTO user_record FROM auth.users WHERE email = 'medtest1@yahoo.com';
  
  IF user_record.id IS NOT NULL THEN
    RAISE NOTICE 'Exécution manuelle pour user_id: %', user_record.id;
    
    -- Appeler directement la fonction du trigger
    PERFORM global_auto_create_tenant_owner_on_confirmation() 
    FROM (SELECT 
      user_record.id as id,
      user_record.email as email,
      user_record.email_confirmed_at as email_confirmed_at,
      user_record.raw_user_meta_data as raw_user_meta_data
    ) as NEW;
  END IF;
END $$;

-- 11. Vérification finale complète
SELECT 
  '=== VÉRIFICATION FINALE ===' as section;

SELECT 
  'PROFIL:' as type,
  p.id,
  p.email,
  p.full_name,
  p.tenant_id,
  p.role,
  p.created_at
FROM public.profiles p
WHERE p.email = 'medtest1@yahoo.com'
UNION ALL
SELECT 
  'EMPLOYÉ:' as type,
  e.id::text,
  e.email,
  e.full_name,
  e.tenant_id::text,
  e.employee_id,
  e.created_at
FROM public.employees e
WHERE e.email = 'medtest1@yahoo.com'
UNION ALL
SELECT 
  'INVITATION:' as type,
  i.id::text,
  i.email,
  i.full_name,
  i.tenant_id::text,
  i.status,
  i.created_at
FROM public.invitations i
WHERE i.email = 'medtest1@yahoo.com';

-- 12. Vérifier les rôles
SELECT 
  '=== RÔLES UTILISATEUR ===' as section,
  ur.id,
  r.name as role_name,
  r.description,
  ur.created_at
FROM public.user_roles ur
JOIN public.roles r ON r.id = ur.role_id
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'medtest1@yahoo.com';
