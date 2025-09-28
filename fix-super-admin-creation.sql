-- Script pour corriger la création du Super Admin
-- Désactiver temporairement le trigger pour permettre la création

-- 1. Désactiver le trigger temporairement
ALTER TABLE public.profiles DISABLE TRIGGER trigger_validate_tenant_or_super_admin;

-- 2. Créer ou mettre à jour le profil Super Admin
INSERT INTO public.profiles (
  user_id,
  tenant_id,
  full_name,
  email,
  created_at,
  updated_at
) VALUES (
  '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID,
  NULL,
  'Super Admin',
  'admin@wadashaqeen.com',
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  tenant_id = NULL,
  full_name = 'Super Admin',
  email = 'admin@wadashaqeen.com',
  updated_at = now();

-- 3. Assigner le rôle super_admin
INSERT INTO public.user_roles (
  user_id,
  role_id,
  tenant_id,
  is_active,
  created_at
) VALUES (
  '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID,
  (SELECT id FROM public.roles WHERE name = 'super_admin'),
  NULL,
  true,
  now()
) ON CONFLICT (user_id, role_id) DO UPDATE SET
  is_active = true,
  updated_at = now();

-- 4. Réactiver le trigger
ALTER TABLE public.profiles ENABLE TRIGGER trigger_validate_tenant_or_super_admin;

-- 5. Vérifier la création
SELECT 
  p.user_id,
  p.full_name,
  p.email,
  p.tenant_id,
  r.name as role_name,
  ur.is_active
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.user_id
JOIN public.roles r ON r.id = ur.role_id
WHERE p.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;
