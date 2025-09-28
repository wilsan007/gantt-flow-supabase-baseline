-- Test final pour medtest1@yahoo.com avec psql
-- Ce script teste directement le trigger de confirmation

-- 1. Installer le trigger d'abord
\echo '=== INSTALLATION DU TRIGGER ==='
\i fix-trigger-on-email-confirmation.sql

-- 2. Vérifier l'état initial
\echo '=== ÉTAT INITIAL ==='
SELECT 
  'UTILISATEUR:' as type,
  id::text,
  email,
  email_confirmed_at::text,
  created_at::text
FROM auth.users 
WHERE email = 'medtest1@yahoo.com'
UNION ALL
SELECT 
  'INVITATION:' as type,
  id::text,
  email,
  status,
  tenant_id::text
FROM public.invitations 
WHERE email = 'medtest1@yahoo.com';

-- 3. Vérifier les triggers installés
\echo '=== TRIGGERS INSTALLÉS ==='
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name LIKE '%confirmation%';

-- 4. Simuler la confirmation d'email
\echo '=== SIMULATION CONFIRMATION ==='
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'medtest1@yahoo.com';

-- 5. Attendre que le trigger s'exécute
SELECT pg_sleep(3);

-- 6. Vérifier les résultats
\echo '=== RÉSULTATS APRÈS TRIGGER ==='

-- Profil
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'medtest1@yahoo.com') 
    THEN '✅ PROFIL CRÉÉ'
    ELSE '❌ PROFIL MANQUANT'
  END as profil_status;

-- Employé
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'medtest1@yahoo.com') 
    THEN '✅ EMPLOYÉ CRÉÉ'
    ELSE '❌ EMPLOYÉ MANQUANT'
  END as employee_status;

-- Invitation
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.invitations WHERE email = 'medtest1@yahoo.com' AND status = 'accepted') 
    THEN '✅ INVITATION ACCEPTÉE'
    ELSE '❌ INVITATION NON ACCEPTÉE'
  END as invitation_status;

-- Rôles
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN auth.users u ON u.id = ur.user_id
      WHERE u.email = 'medtest1@yahoo.com'
    ) 
    THEN '✅ RÔLES CRÉÉS'
    ELSE '❌ RÔLES MANQUANTS'
  END as roles_status;

-- 7. Détails complets si créé
\echo '=== DÉTAILS COMPLETS ==='
SELECT 
  'PROFIL' as table_name,
  p.id::text,
  p.email,
  p.full_name,
  p.tenant_id::text,
  p.role,
  p.created_at::text
FROM public.profiles p
WHERE p.email = 'medtest1@yahoo.com'
UNION ALL
SELECT 
  'EMPLOYÉ' as table_name,
  e.id::text,
  e.email,
  e.full_name,
  e.tenant_id::text,
  e.employee_id,
  e.created_at::text
FROM public.employees e
WHERE e.email = 'medtest1@yahoo.com'
UNION ALL
SELECT 
  'INVITATION' as table_name,
  i.id::text,
  i.email,
  i.full_name,
  i.tenant_id::text,
  i.status,
  i.created_at::text
FROM public.invitations i
WHERE i.email = 'medtest1@yahoo.com';

-- 8. Score final
\echo '=== SCORE FINAL ==='
SELECT 
  'RÉSUMÉ:' as type,
  (
    CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'medtest1@yahoo.com') THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'medtest1@yahoo.com') THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM public.invitations WHERE email = 'medtest1@yahoo.com' AND status = 'accepted') THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN auth.users u ON u.id = ur.user_id
      WHERE u.email = 'medtest1@yahoo.com'
    ) THEN 1 ELSE 0 END
  )::text || '/4' as score,
  CASE 
    WHEN (
      CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'medtest1@yahoo.com') THEN 1 ELSE 0 END +
      CASE WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'medtest1@yahoo.com') THEN 1 ELSE 0 END +
      CASE WHEN EXISTS (SELECT 1 FROM public.invitations WHERE email = 'medtest1@yahoo.com' AND status = 'accepted') THEN 1 ELSE 0 END +
      CASE WHEN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN auth.users u ON u.id = ur.user_id
        WHERE u.email = 'medtest1@yahoo.com'
      ) THEN 1 ELSE 0 END
    ) = 4 THEN '🎉 TRIGGER PARFAIT!'
    ELSE '⚠️ TRIGGER INCOMPLET'
  END as status,
  '' as empty1,
  '' as empty2;
