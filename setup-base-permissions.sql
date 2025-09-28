-- ==============================================
-- Configuration des Permissions de Base
-- ==============================================
-- Ce script définit les permissions pour le rôle tenant_admin.
-- À exécuter une seule fois pour initialiser le système de permissions.

DO $$
DECLARE
  admin_role_id UUID;
  perm_id UUID;
  permissions TEXT[] := ARRAY[
    'projects:create',
    'projects:read',
    'projects:update',
    'projects:delete',
    'tasks:create',
    'tasks:read',
    'tasks:update',
    'tasks:delete',
    'team:invite',
    'team:manage',
    'billing:manage'
  ];
  p TEXT;
BEGIN
  -- 1. S'assurer que le rôle tenant_admin existe et récupérer son ID
  RAISE NOTICE 'Vérification/création du rôle tenant_admin...';
  INSERT INTO public.roles (name, display_name, description) 
  VALUES ('tenant_admin', 'Administrateur du Tenant', 'Administrateur du tenant') 
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, display_name = EXCLUDED.display_name;
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'tenant_admin';

  -- 2. Insérer les permissions et les lier au rôle
  RAISE NOTICE 'Assignation des permissions au rôle tenant_admin...';
  FOREACH p IN ARRAY permissions
  LOOP
    -- Insérer la permission si elle n'existe pas
    INSERT INTO public.permissions (name) VALUES (p) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO perm_id FROM public.permissions WHERE name = p;

    -- Lier la permission au rôle
    INSERT INTO public.role_permissions (role_id, permission_id) 
    VALUES (admin_role_id, perm_id) 
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    RAISE NOTICE '  - Permission ''%'' assignée.', p;
  END LOOP;

  RAISE NOTICE 'Configuration des permissions de base terminée.';
END $$;
