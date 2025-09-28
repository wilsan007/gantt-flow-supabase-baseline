-- Migration 02: Création du premier utilisateur Super Admin
-- IMPORTANT: Désactiver temporairement le trigger avant d'exécuter ce script

-- 1. Désactiver le trigger temporairement
ALTER TABLE public.profiles DISABLE TRIGGER trigger_validate_tenant_or_super_admin;
-- À exécuter après 01_create_invitations_system.sql

-- IMPORTANT: Remplacer 'SUPER_ADMIN_USER_ID' par l'UUID réel de l'utilisateur créé dans Supabase Auth

-- 1. Créer le profil Super Admin (sans tenant)
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

-- 2. Assigner le rôle Super Admin
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

-- 3. Vérification que le Super Admin a été créé correctement
SELECT 
  p.user_id,
  p.full_name,
  p.email,
  p.tenant_id,
  r.name as role_name,
  ur.is_active
FROM public.profiles p
JOIN public.user_roles ur ON p.user_id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'super_admin';

-- 4. Fonction pour créer un Super Admin (à utiliser via script Node.js)
CREATE OR REPLACE FUNCTION create_super_admin(
  admin_user_id UUID,
  admin_full_name TEXT,
  admin_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  super_admin_role_id UUID;
BEGIN
  -- Récupérer l'ID du rôle super_admin
  SELECT id INTO super_admin_role_id 
  FROM public.roles 
  WHERE name = 'super_admin';
  
  IF super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role not found';
  END IF;
  
  -- Créer le profil
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    tenant_id,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'Super Administrateur',
    'awalehnasri@gmail.com',
    NULL,
    now(),
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    full_name = 'Super Administrateur',
    email = 'awalehnasri@gmail.com',
    updated_at = now();
  
  -- Assigner le rôle
  INSERT INTO public.user_roles (
    user_id,
    role_id,
    context_type,
    context_id,
    tenant_id,
    is_active,
    created_at
  ) VALUES (
    admin_user_id,
    super_admin_role_id,
    'global',
    NULL,
    NULL,
    true,
    now()
  ) ON CONFLICT (user_id, role_id, context_type, context_id) DO UPDATE SET
    is_active = true,
    updated_at = now();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Réactiver le trigger après la création
ALTER TABLE public.profiles ENABLE TRIGGER trigger_validate_tenant_or_super_admin;

-- 5. Créer le Super Admin avec l'UUID réel
SELECT create_super_admin_user('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID);

-- 6. Vérifier la création
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
