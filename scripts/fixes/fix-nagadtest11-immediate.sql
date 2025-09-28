-- Correction immédiate pour nagadtest11@yahoo.com
-- Utilise la même logique que debug_tenant_creation

-- 1. Créer une invitation si elle n'existe pas
INSERT INTO public.invitations (
  email,
  invitation_type,
  status,
  full_name,
  expires_at,
  metadata
) VALUES (
  'nagadtest11@yahoo.com',
  'tenant_owner',
  'pending',
  'Nagad Test User',
  now() + interval '7 days',
  '{"company_name": "Nagad Test Company"}'::jsonb
)
ON CONFLICT (email, invitation_type) DO UPDATE SET
  status = 'pending',
  expires_at = now() + interval '7 days';

-- 2. Exécuter la fonction de création complète
SELECT debug_tenant_creation('nagadtest11@yahoo.com');

-- 3. Vérifier le résultat
SELECT 
  'Vérification finale' as etape,
  p.user_id,
  p.tenant_id,
  p.full_name,
  p.role,
  t.name as tenant_name,
  e.employee_id
FROM public.profiles p
LEFT JOIN public.tenants t ON p.tenant_id = t.id
LEFT JOIN public.employees e ON p.user_id = e.user_id
WHERE p.email = 'nagadtest11@yahoo.com';
