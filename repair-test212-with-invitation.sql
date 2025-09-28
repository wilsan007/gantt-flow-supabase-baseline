-- Réparation avec les données exactes de l'invitation
-- Token: 758ac777fb6d8ae23436bd1802c890ef9300b1dafb4559661337f990
-- Tenant ID: 115d5fa0-006a-4978-8776-c19b4157731a

DO $$
DECLARE
    user_id_var UUID := '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
    email_var TEXT := 'test212@yahoo.com';
    tenant_uuid UUID := '115d5fa0-006a-4978-8776-c19b4157731a';
    full_name_var TEXT := 'Med Osman';
    role_uuid UUID;
    employee_id_var TEXT := 'EMP001';
BEGIN
    RAISE NOTICE 'Début réparation avec invitation - User: %, Tenant: %', email_var, tenant_uuid;
    
    -- 1. Créer le tenant avec l'ID exact de l'invitation
    RAISE NOTICE 'Création tenant: %', tenant_uuid;
    INSERT INTO public.tenants (id, name, status, created_at, updated_at)
    VALUES (tenant_uuid, 'Entreprise Med Osman', 'active', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();
    
    -- 2. Créer le profil utilisateur
    RAISE NOTICE 'Création profil utilisateur';
    INSERT INTO public.profiles (
        user_id, 
        tenant_id, 
        full_name, 
        email, 
        role,
        created_at,
        updated_at
    )
    VALUES (
        user_id_var,
        tenant_uuid,
        full_name_var,
        email_var,
        'tenant_admin',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        updated_at = NOW();
    
    -- 3. Récupérer le rôle tenant_admin
    SELECT id INTO role_uuid
    FROM public.roles
    WHERE name = 'tenant_admin'
    LIMIT 1;
    
    IF role_uuid IS NULL THEN
        RAISE EXCEPTION 'Rôle tenant_admin introuvable';
    END IF;
    
    RAISE NOTICE 'Rôle tenant_admin trouvé: %', role_uuid;
    
    -- 4. Créer user_roles
    RAISE NOTICE 'Attribution rôle tenant_admin';
    INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, created_at)
    VALUES (user_id_var, role_uuid, tenant_uuid, true, NOW())
    ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
        is_active = true,
        created_at = NOW();
    
    -- 5. Créer l'employé
    RAISE NOTICE 'Création employé: %', employee_id_var;
    INSERT INTO public.employees (
        user_id,
        employee_id,
        full_name,
        email,
        job_title,
        hire_date,
        contract_type,
        status,
        tenant_id,
        created_at,
        updated_at
    )
    VALUES (
        user_id_var,
        employee_id_var,
        full_name_var,
        email_var,
        'Directeur Général',
        CURRENT_DATE,
        'CDI',
        'active',
        tenant_uuid,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET
        employee_id = EXCLUDED.employee_id,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        job_title = EXCLUDED.job_title,
        updated_at = NOW();
    
    -- 6. Marquer l'invitation comme acceptée
    RAISE NOTICE 'Marquage invitation comme acceptée';
    UPDATE public.invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('completed_by', user_id_var)
    WHERE token = '758ac777fb6d8ae23436bd1802c890ef9300b1dafb4559661337f990'
    AND email = email_var;
    
    RAISE NOTICE 'Réparation terminée avec succès';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur réparation: %', SQLERRM;
END $$;

-- Vérification complète
SELECT 
    'TENANT' as type,
    t.id::text as id,
    t.name as nom,
    t.status as statut
FROM public.tenants t
WHERE t.id = '115d5fa0-006a-4978-8776-c19b4157731a'

UNION ALL

SELECT 
    'PROFIL' as type,
    p.id::text as id,
    p.full_name as nom,
    p.role as statut
FROM public.profiles p
WHERE p.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'

UNION ALL

SELECT 
    'USER_ROLE' as type,
    ur.id::text as id,
    r.name as nom,
    ur.is_active::text as statut
FROM public.user_roles ur
JOIN public.roles r ON r.id = ur.role_id
WHERE ur.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'

UNION ALL

SELECT 
    'EMPLOYÉ' as type,
    e.id::text as id,
    e.employee_id as nom,
    e.status as statut
FROM public.employees e
WHERE e.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'

UNION ALL

SELECT 
    'INVITATION' as type,
    i.id::text as id,
    i.email as nom,
    i.status as statut
FROM public.invitations i
WHERE i.token = '758ac777fb6d8ae23436bd1802c890ef9300b1dafb4559661337f990';
