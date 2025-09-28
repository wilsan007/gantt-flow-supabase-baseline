-- Script de nettoyage complet pour supprimer toutes les données de test
-- Utilisateur: imran33@yahoo.com
-- Tenant ID: 73870956-03c5-49a3-b3c3-257bc7e10fc6
-- User ID: a61224ce-6066-4eda-a3e2-399b0e2e36c1

-- ATTENTION: Ce script supprime TOUTES les données créées lors du test
-- Exécuter avec privilèges service_role dans Supabase Dashboard

BEGIN;

-- 1. Supprimer l'employé créé
DELETE FROM public.employees 
WHERE user_id = 'a61224ce-6066-4eda-a3e2-399b0e2e36c1'
   OR email = 'imran33@yahoo.com'
   OR employee_id = 'EMP008';

-- 2. Supprimer les user_roles
DELETE FROM public.user_roles 
WHERE user_id = 'a61224ce-6066-4eda-a3e2-399b0e2e36c1'
   OR tenant_id = '73870956-03c5-49a3-b3c3-257bc7e10fc6';

-- 3. Supprimer le profil
DELETE FROM public.profiles 
WHERE user_id = 'a61224ce-6066-4eda-a3e2-399b0e2e36c1'
   OR email = 'imran33@yahoo.com'
   OR tenant_id = '73870956-03c5-49a3-b3c3-257bc7e10fc6';

-- 4. Supprimer le tenant créé
DELETE FROM public.tenants 
WHERE id = '73870956-03c5-49a3-b3c3-257bc7e10fc6'
   OR name LIKE '%Imran Osman%';

-- 5. Remettre l'invitation en statut pending pour pouvoir retester
UPDATE public.invitations 
SET 
  status = 'pending',
  accepted_at = NULL,
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{completed_by}',
    'null'::jsonb
  )
WHERE email = 'imran33@yahoo.com'
   OR id = '2319533a-23c1-436c-a1ee-e36c879bae39';

-- 6. Optionnel: Supprimer l'utilisateur auth (ATTENTION: irréversible)
-- Décommentez seulement si vous voulez supprimer complètement l'utilisateur
-- DELETE FROM auth.users WHERE email = 'imran33@yahoo.com';

COMMIT;

-- Vérifications post-nettoyage
SELECT 'Employés restants' as table_name, count(*) as count FROM public.employees WHERE email = 'imran33@yahoo.com'
UNION ALL
SELECT 'User_roles restants', count(*) FROM public.user_roles WHERE user_id = 'a61224ce-6066-4eda-a3e2-399b0e2e36c1'
UNION ALL
SELECT 'Profils restants', count(*) FROM public.profiles WHERE email = 'imran33@yahoo.com'
UNION ALL
SELECT 'Tenants restants', count(*) FROM public.tenants WHERE id = '73870956-03c5-49a3-b3c3-257bc7e10fc6'
UNION ALL
SELECT 'Invitations pending', count(*) FROM public.invitations WHERE email = 'imran33@yahoo.com' AND status = 'pending';

-- Afficher le statut final de l'invitation
SELECT 
  id,
  email,
  status,
  accepted_at,
  metadata->>'completed_by' as completed_by
FROM public.invitations 
WHERE email = 'imran33@yahoo.com';
