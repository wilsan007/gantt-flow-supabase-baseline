-- Réparation directe pour l'utilisateur test212@yahoo.com
-- Ordre correct: tenant (depuis invitation) → profil → user_roles → employee

DO $$
DECLARE
    invitation_record RECORD;
    tenant_uuid UUID;
    company_name_var TEXT;
    role_uuid UUID;
    employee_id_var TEXT;
    max_emp_number INTEGER := 0;
    emp_record RECORD;
    user_id_var UUID := '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
    email_var TEXT := 'test212@yahoo.com';
BEGIN
    RAISE NOTICE 'Début réparation utilisateur: %', email_var;
    
    -- 1. Récupérer l'invitation pour cet email
    SELECT * INTO invitation_record
    FROM public.invitations
    WHERE email = email_var
    AND status = 'pending'
    AND invitation_type = 'tenant_owner'
    AND expires_at > NOW();
    
    IF FOUND THEN
        RAISE NOTICE 'Invitation trouvée: %, tenant_id: %', invitation_record.id, invitation_record.tenant_id;
        tenant_uuid := invitation_record.tenant_id;
        company_name_var := COALESCE(invitation_record.metadata->>'company_name', invitation_record.full_name || ' Company');
    ELSE
        RAISE NOTICE 'Aucune invitation trouvée, création tenant par défaut';
        tenant_uuid := gen_random_uuid();
        company_name_var := 'Entreprise de ' || split_part(email_var, '@', 1);
    END IF;
    
    -- 2. Créer le tenant (depuis invitation ou par défaut)
    RAISE NOTICE 'Création tenant: % - %', tenant_uuid, company_name_var;
    INSERT INTO public.tenants (id, name, status, created_at, updated_at)
    VALUES (tenant_uuid, company_name_var, 'active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- 3. Créer le profil utilisateur
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
        COALESCE(invitation_record.full_name, split_part(email_var, '@', 1)),
        email_var,
        'tenant_admin',
        NOW(),
        NOW()
    );
    
    -- 4. Récupérer le rôle tenant_admin
    SELECT id INTO role_uuid
    FROM public.roles
    WHERE name = 'tenant_admin'
    LIMIT 1;
    
    IF role_uuid IS NULL THEN
        RAISE EXCEPTION 'Rôle tenant_admin introuvable';
    END IF;
    
    -- 5. Créer user_roles
    RAISE NOTICE 'Attribution rôle tenant_admin';
    INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, created_at)
    VALUES (user_id_var, role_uuid, tenant_uuid, true, NOW());
    
    -- 6. Générer employee_id unique
    FOR emp_record IN 
        SELECT employee_id 
        FROM public.employees 
        WHERE tenant_id = tenant_uuid 
        AND employee_id ~ '^EMP[0-9]{3}$'
    LOOP
        max_emp_number := GREATEST(max_emp_number, 
            CAST(substring(emp_record.employee_id from 4) AS INTEGER));
    END LOOP;
    
    employee_id_var := 'EMP' || lpad((max_emp_number + 1)::TEXT, 3, '0');
    
    -- 7. Créer l'employé
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
        COALESCE(invitation_record.full_name, split_part(email_var, '@', 1)),
        email_var,
        'Directeur Général',
        CURRENT_DATE,
        'CDI',
        'active',
        tenant_uuid,
        NOW(),
        NOW()
    );
    
    -- 8. Marquer l'invitation comme acceptée
    IF invitation_record.id IS NOT NULL THEN
        RAISE NOTICE 'Marquage invitation comme acceptée';
        UPDATE public.invitations
        SET status = 'accepted',
            accepted_at = NOW(),
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('completed_by', user_id_var)
        WHERE id = invitation_record.id;
    END IF;
    
    RAISE NOTICE 'Réparation terminée avec succès';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur réparation: %', SQLERRM;
END $$;

-- Vérifier immédiatement le résultat
SELECT 
    'RÉSULTAT' as type,
    CASE 
        WHEN p.id IS NOT NULL THEN '✅ PROFIL CRÉÉ'
        ELSE '❌ PROFIL MANQUANT'
    END as status,
    p.tenant_id::text as tenant_id,
    p.full_name as nom,
    p.role as role
FROM public.profiles p
WHERE p.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'

UNION ALL

SELECT 
    'TENANT' as type,
    CASE 
        WHEN t.id IS NOT NULL THEN '✅ TENANT CRÉÉ'
        ELSE '❌ TENANT MANQUANT'
    END as status,
    t.id::text as tenant_id,
    t.name as nom,
    t.status as role
FROM public.tenants t
WHERE t.id IN (
    SELECT p.tenant_id FROM public.profiles p 
    WHERE p.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'
)

UNION ALL

SELECT 
    'EMPLOYÉ' as type,
    CASE 
        WHEN e.id IS NOT NULL THEN '✅ EMPLOYÉ CRÉÉ'
        ELSE '❌ EMPLOYÉ MANQUANT'
    END as status,
    e.tenant_id::text as tenant_id,
    e.employee_id as nom,
    e.status as role
FROM public.employees e
WHERE e.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
