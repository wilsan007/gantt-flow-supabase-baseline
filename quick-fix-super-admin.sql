-- Script rapide pour corriger immédiatement le problème is_super_admin
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Vérifier et créer le tenant super-admin si nécessaire
DO $$
DECLARE
    super_tenant_id UUID;
BEGIN
    -- Vérifier si le tenant super-admin existe
    SELECT id INTO super_tenant_id 
    FROM public.tenants 
    WHERE slug = 'super-admin-tenant' 
    LIMIT 1;
    
    -- Si pas trouvé, le créer
    IF super_tenant_id IS NULL THEN
        super_tenant_id := gen_random_uuid();
        INSERT INTO public.tenants (id, name, slug, description, status, subscription_plan, max_users, max_projects)
        VALUES (
            super_tenant_id,
            'Super Admin Tenant',
            'super-admin-tenant',
            'Tenant spécial pour le Super Admin avec accès global',
            'active',
            'enterprise',
            999999,
            999999
        );
        RAISE NOTICE 'Tenant super-admin créé avec ID: %', super_tenant_id;
    ELSE
        RAISE NOTICE 'Tenant super-admin existe déjà avec ID: %', super_tenant_id;
    END IF;
    
    -- Mettre à jour le profil du Super Admin
    UPDATE public.profiles 
    SET tenant_id = super_tenant_id,
        role = 'super_admin'
    WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;
    
    RAISE NOTICE 'Profil Super Admin mis à jour';
END $$;

-- 2. Vérifier et créer le rôle super_admin si nécessaire
DO $$
DECLARE
    super_role_id UUID;
BEGIN
    -- Vérifier si le rôle super_admin existe
    SELECT id INTO super_role_id 
    FROM public.roles 
    WHERE name = 'super_admin' 
    LIMIT 1;
    
    -- Si pas trouvé, le créer
    IF super_role_id IS NULL THEN
        super_role_id := gen_random_uuid();
        INSERT INTO public.roles (id, name, display_name, description, permissions)
        VALUES (
            super_role_id,
            'super_admin',
            'Super Administrateur',
            'Accès complet à toutes les fonctionnalités et tous les tenants',
            '["*"]'::jsonb
        );
        RAISE NOTICE 'Rôle super_admin créé avec ID: %', super_role_id;
    ELSE
        RAISE NOTICE 'Rôle super_admin existe déjà avec ID: %', super_role_id;
    END IF;
    
    -- Assigner le rôle au Super Admin
    INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, assigned_by, assigned_at)
    VALUES (
        '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID,
        super_role_id,
        (SELECT id FROM public.tenants WHERE slug = 'super-admin-tenant'),
        true,
        '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID,
        NOW()
    )
    ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
        is_active = true,
        assigned_at = NOW();
    
    RAISE NOTICE 'Rôle super_admin assigné au Super Admin';
END $$;

-- 3. Recréer la fonction is_super_admin avec logique simplifiée
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = COALESCE($1, auth.uid())
      AND r.name = 'super_admin'
      AND ur.is_active = true
  );
$$;

-- 4. Test immédiat
SELECT 
    'IMMEDIATE TEST' as test_section,
    public.is_super_admin('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) as should_be_true,
    public.has_global_access('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) as should_also_be_true;
