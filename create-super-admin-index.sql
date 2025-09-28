-- Script pour créer l'index unique Super Admin après insertion du rôle
-- À exécuter APRÈS 01_create_invitations_system.sql

-- Récupérer l'UUID du rôle super_admin et créer l'index
DO $$
DECLARE
    super_admin_role_uuid UUID;
BEGIN
    -- Récupérer l'UUID du rôle super_admin
    SELECT id INTO super_admin_role_uuid 
    FROM public.roles 
    WHERE name = 'super_admin';
    
    -- Créer l'index unique avec l'UUID fixe
    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_single_super_admin 
                   ON public.user_roles (role_id) 
                   WHERE role_id = %L', super_admin_role_uuid);
                   
    RAISE NOTICE 'Index unique Super Admin créé avec UUID: %', super_admin_role_uuid;
END $$;
