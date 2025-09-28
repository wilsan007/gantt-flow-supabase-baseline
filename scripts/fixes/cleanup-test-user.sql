-- Script pour nettoyer les données de test de l'utilisateur imran33@yahoo.com
-- Permet de relancer les tests avec un état propre

-- Nettoyer dans l'ordre inverse des dépendances
DELETE FROM public.employees 
WHERE user_id = 'a61224ce-6066-4eda-a3e2-399b0e2e36c1';

DELETE FROM public.user_roles 
WHERE user_id = 'a61224ce-6066-4eda-a3e2-399b0e2e36c1';

DELETE FROM public.profiles 
WHERE user_id = 'a61224ce-6066-4eda-a3e2-399b0e2e36c1';

DELETE FROM public.tenants 
WHERE id = '73870956-03c5-49a3-b3c3-257bc7e10fc6';

-- Remettre l'invitation en statut pending
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
  AND invitation_type = 'tenant_owner';

-- Vérifier le nettoyage
SELECT 'Données nettoyées pour imran33@yahoo.com' as message;
