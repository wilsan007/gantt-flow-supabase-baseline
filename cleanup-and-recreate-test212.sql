-- Nettoyage complet et recréation pour test212@yahoo.com
-- Avec employee_id unique et vérification tenant_id

-- 1. Nettoyer toutes les données existantes pour cet utilisateur
DELETE FROM public.employees WHERE user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
DELETE FROM public.user_roles WHERE user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
DELETE FROM public.profiles WHERE user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
DELETE FROM public.tenants WHERE id = '115d5fa0-006a-4978-8776-c19b4157731a';

-- 2. Vérifier la structure de la table profiles
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    AND column_name = 'tenant_id';

-- 3. Recréer dans l'ordre correct avec employee_id unique
DO $$
DECLARE
    user_id_var UUID := '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
    email_var TEXT := 'test212@yahoo.com';
    tenant_uuid UUID := '115d5fa0-006a-4978-8776-c19b4157731a';
    full_name_var TEXT := 'Med Osman';
    role_uuid UUID;
    employee_id_var TEXT;
    max_emp_number INTEGER := 0;
    emp_record RECORD;
BEGIN
    RAISE NOTICE 'Début recréation complète pour: %', email_var;
    
    -- Créer le tenant
    INSERT INTO public.tenants (id, name, status, created_at, updated_at)
    VALUES (tenant_uuid, 'Entreprise Med Osman', 'active', NOW(), NOW());
    RAISE NOTICE 'Tenant créé: %', tenant_uuid;
    
    -- Créer le profil
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
    );
    RAISE NOTICE 'Profil créé avec tenant_id: %', tenant_uuid;
    
    -- Récupérer le rôle tenant_admin
    SELECT id INTO role_uuid
    FROM public.roles
    WHERE name = 'tenant_admin'
    LIMIT 1;
    
    -- Créer user_roles
    INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, created_at)
    VALUES (user_id_var, role_uuid, tenant_uuid, true, NOW());
    RAISE NOTICE 'Rôle attribué: %', role_uuid;
    
    -- Générer employee_id unique en cherchant le prochain disponible
    FOR emp_record IN 
        SELECT employee_id 
        FROM public.employees 
        WHERE tenant_id = tenant_uuid 
        AND employee_id ~ '^EMP[0-9]{3}$'
        ORDER BY employee_id
    LOOP
        max_emp_number := GREATEST(max_emp_number, 
            CAST(substring(emp_record.employee_id from 4) AS INTEGER));
    END LOOP;
    
    -- Chercher le premier numéro disponible à partir de 001
    FOR i IN 1..999 LOOP
        employee_id_var := 'EMP' || lpad(i::TEXT, 3, '0');
        
        -- Vérifier si ce numéro est disponible
        IF NOT EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employee_id = employee_id_var
        ) THEN
            EXIT; -- Sortir de la boucle, on a trouvé un numéro libre
        END IF;
    END LOOP;
    
    -- Créer l'employé avec l'ID unique trouvé
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
    );
    RAISE NOTICE 'Employé créé avec ID: %', employee_id_var;
    
    -- Marquer l'invitation comme acceptée
    UPDATE public.invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('completed_by', user_id_var)
    WHERE token = '758ac777fb6d8ae23436bd1802c890ef9300b1dafb4559661337f990';
    RAISE NOTICE 'Invitation marquée comme acceptée';
    
    RAISE NOTICE 'Recréation terminée avec succès';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur: %', SQLERRM;
END $$;

-- 4. Vérification finale complète
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
