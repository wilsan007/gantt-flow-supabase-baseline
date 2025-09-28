-- Script de test pour vérifier les logs du trigger
-- À exécuter après avoir installé complete-auto-tenant-system-with-logs.sql

-- 1. Créer un utilisateur de test pour déclencher le trigger
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Simuler l'insertion d'un nouvel utilisateur (comme le ferait Supabase Auth)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin
  ) VALUES (
    gen_random_uuid(),
    'testlogs@yahoo.com',
    'encrypted_password_placeholder',
    now(),
    now(),
    now(),
    '{"full_name": "Test Logs User"}'::jsonb,
    false
  ) RETURNING id INTO test_user_id;
  
  RAISE NOTICE 'Utilisateur de test créé: %', test_user_id;
END $$;

-- 2. Créer une invitation pour le test
INSERT INTO public.invitations (
  email,
  invitation_type,
  status,
  full_name,
  expires_at,
  metadata
) VALUES (
  'testlogs@yahoo.com',
  'tenant_owner',
  'pending',
  'Test Logs User',
  now() + interval '7 days',
  '{"company_name": "Test Logs Company"}'::jsonb
)
ON CONFLICT (email, invitation_type) DO UPDATE SET
  status = 'pending',
  expires_at = now() + interval '7 days';

-- 3. Attendre un moment puis consulter les logs
SELECT pg_sleep(2);

-- 4. Consulter tous les logs du trigger
SELECT 
  '=== LOGS DU TRIGGER ===' as section,
  step_number,
  step_name,
  status,
  message,
  error_details,
  execution_time
FROM get_trigger_logs('testlogs@yahoo.com')
ORDER BY execution_time, step_number;

-- 5. Résumé des étapes
SELECT 
  '=== RÉSUMÉ PAR STATUT ===' as section,
  status,
  count(*) as nombre_etapes
FROM get_trigger_logs('testlogs@yahoo.com')
GROUP BY status
ORDER BY status;

-- 6. Vérifier les données créées
SELECT 
  '=== VÉRIFICATION DONNÉES CRÉÉES ===' as section,
  'profiles' as table_name,
  count(*) as count
FROM public.profiles 
WHERE email = 'testlogs@yahoo.com'

UNION ALL

SELECT 
  '=== VÉRIFICATION DONNÉES CRÉÉES ===' as section,
  'tenants' as table_name,
  count(*) as count
FROM public.tenants t
JOIN public.profiles p ON t.id = p.tenant_id
WHERE p.email = 'testlogs@yahoo.com'

UNION ALL

SELECT 
  '=== VÉRIFICATION DONNÉES CRÉÉES ===' as section,
  'employees' as table_name,
  count(*) as count
FROM public.employees 
WHERE email = 'testlogs@yahoo.com';

-- 7. Nettoyer les données de test
DELETE FROM public.employees WHERE email = 'testlogs@yahoo.com';
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'testlogs@yahoo.com');
DELETE FROM public.profiles WHERE email = 'testlogs@yahoo.com';
DELETE FROM public.tenants WHERE id IN (SELECT tenant_id FROM public.invitations WHERE email = 'testlogs@yahoo.com');
DELETE FROM public.invitations WHERE email = 'testlogs@yahoo.com';
DELETE FROM auth.users WHERE email = 'testlogs@yahoo.com';

SELECT '=== TEST TERMINÉ - DONNÉES NETTOYÉES ===' as final_message;
