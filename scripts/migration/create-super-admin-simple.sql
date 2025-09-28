-- Script simplifié pour créer le Super Admin
-- L'utilisateur 5c5731ce-75d0-4455-8184-bc42c626cb17 existe déjà dans auth.users

-- 1. Désactiver temporairement le trigger
ALTER TABLE public.profiles DISABLE TRIGGER trigger_validate_tenant_or_super_admin;

-- 2. Ajouter dans la table profiles
INSERT INTO public.profiles (
  user_id, 
  full_name, 
  email, 
  tenant_id,
  created_at,
  updated_at
) VALUES (
  '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID,
  'Super Administrateur',
  'awalehnasri@gmail.com',
  NULL, -- Pas de tenant pour Super Admin
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  full_name = 'Super Administrateur',
  email = 'awalehnasri@gmail.com',
  updated_at = now();

-- 3. Ajouter dans la table employees (optionnel pour Super Admin)
INSERT INTO public.employees (
  user_id,
  employee_id,
  full_name,
  email,
  job_title,
  status,
  tenant_id,
  created_at,
  updated_at
) VALUES (
  '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID,
  'SUPER_ADMIN_001',
  'Super Administrateur',
  'awalehnasri@gmail.com',
  'Super Administrateur',
  'active',
  NULL, -- Pas de tenant pour Super Admin
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  full_name = 'Super Administrateur',
  email = 'awalehnasri@gmail.com',
  job_title = 'Super Administrateur',
  updated_at = now();

-- 4. Assigner le rôle super_admin dans user_roles
INSERT INTO public.user_roles (
  user_id,
  role_id,
  context_type,
  context_id,
  tenant_id,
  is_active,
  created_at
) VALUES (
  '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID,
  (SELECT id FROM public.roles WHERE name = 'super_admin'),
  'global',
  NULL,
  NULL, -- Pas de tenant pour Super Admin
  true,
  now()
) ON CONFLICT (user_id, role_id, context_type, context_id) DO UPDATE SET
  is_active = true,
  updated_at = now();

-- 5. Réactiver le trigger
ALTER TABLE public.profiles ENABLE TRIGGER trigger_validate_tenant_or_super_admin;

-- 6. Vérifier la création complète
SELECT 
  'PROFILES' as table_name,
  p.user_id,
  p.full_name,
  p.email,
  p.tenant_id
FROM public.profiles p
WHERE p.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID

UNION ALL

SELECT 
  'EMPLOYEES' as table_name,
  e.user_id,
  e.full_name,
  e.email,
  e.tenant_id
FROM public.employees e
WHERE e.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID

UNION ALL

SELECT 
  'USER_ROLES' as table_name,
  ur.user_id,
  r.name as role_name,
  ur.context_type,
  ur.tenant_id
FROM public.user_roles ur
JOIN public.roles r ON r.id = ur.role_id
WHERE ur.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;
