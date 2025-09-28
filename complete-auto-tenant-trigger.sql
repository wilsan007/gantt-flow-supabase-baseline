-- Trigger automatique complet pour création tenant owner
-- Se déclenche automatiquement lors de la confirmation d'email dans auth.users

-- 1. Fonction principale de création tenant owner
CREATE OR REPLACE FUNCTION public.auto_create_tenant_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_record RECORD;
    tenant_uuid UUID;
    company_name_var TEXT;
    role_uuid UUID;
    employee_id_var TEXT;
    max_emp_number INTEGER := 0;
    emp_record RECORD;
BEGIN
    -- Vérifier que c'est bien une confirmation d'email
    IF NEW.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Vérifier si l'utilisateur a déjà un profil
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
        RAISE NOTICE 'Profile already exists for user %', NEW.id;
        RETURN NEW;
    END IF;

    RAISE NOTICE 'Starting tenant owner creation for user: % (email: %)', NEW.id, NEW.email;

    BEGIN
        -- Chercher une invitation pour cet email
        SELECT * INTO invitation_record
        FROM public.invitations
        WHERE email = NEW.email
        AND status = 'pending'
        AND invitation_type = 'tenant_owner'
        AND expires_at > NOW();

        IF FOUND THEN
            RAISE NOTICE 'Found invitation: %', invitation_record.id;
            tenant_uuid := invitation_record.tenant_id;
            company_name_var := COALESCE(invitation_record.metadata->>'company_name', invitation_record.full_name || ' Company');
        ELSE
            RAISE NOTICE 'No invitation found, creating default tenant';
            tenant_uuid := gen_random_uuid();
            company_name_var := 'Entreprise de ' || split_part(NEW.email, '@', 1);
        END IF;

        -- 1. Créer le tenant
        RAISE NOTICE 'Creating tenant: %', tenant_uuid;
        INSERT INTO public.tenants (id, name, status, created_at, updated_at)
        VALUES (tenant_uuid, company_name_var, 'active', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;

        -- 2. Créer le profil utilisateur
        RAISE NOTICE 'Creating user profile';
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
            NEW.id,
            tenant_uuid,
            COALESCE(NEW.raw_user_meta_data->>'full_name', invitation_record.full_name, split_part(NEW.email, '@', 1)),
            NEW.email,
            'tenant_admin',
            NOW(),
            NOW()
        );

        -- 3. Récupérer le rôle tenant_admin
        SELECT id INTO role_uuid
        FROM public.roles
        WHERE name = 'tenant_admin'
        LIMIT 1;

        IF role_uuid IS NULL THEN
            RAISE EXCEPTION 'Role tenant_admin not found';
        END IF;

        -- 4. Assigner le rôle
        RAISE NOTICE 'Assigning tenant_admin role';
        INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, created_at)
        VALUES (NEW.id, role_uuid, tenant_uuid, true, NOW());

        -- 5. Générer employee_id unique
        RAISE NOTICE 'Generating employee ID';
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

        -- 6. Créer l'employé
        RAISE NOTICE 'Creating employee with ID: %', employee_id_var;
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
            NEW.id,
            employee_id_var,
            COALESCE(NEW.raw_user_meta_data->>'full_name', invitation_record.full_name, split_part(NEW.email, '@', 1)),
            NEW.email,
            'Directeur Général',
            CURRENT_DATE,
            'CDI',
            'active',
            tenant_uuid,
            NOW(),
            NOW()
        );

        -- 7. Marquer l'invitation comme acceptée si elle existe
        IF invitation_record.id IS NOT NULL THEN
            RAISE NOTICE 'Marking invitation as accepted';
            UPDATE public.invitations
            SET status = 'accepted',
                accepted_at = NOW(),
                metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('completed_by', NEW.id)
            WHERE id = invitation_record.id;
        END IF;

        RAISE NOTICE 'Tenant owner creation completed successfully for user: %', NEW.id;

    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error in auto_create_tenant_owner for user %: %', NEW.id, SQLERRM;
        -- Ne pas faire échouer l'authentification pour une erreur de tenant
    END;

    RETURN NEW;
END;
$$;

-- 2. Créer le trigger
DROP TRIGGER IF EXISTS auto_tenant_owner_creation_trigger ON auth.users;

CREATE TRIGGER auto_tenant_owner_creation_trigger
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
    EXECUTE FUNCTION public.auto_create_tenant_owner();

-- 3. Fonction de réparation pour les utilisateurs existants
DROP FUNCTION IF EXISTS public.repair_incomplete_users();

CREATE OR REPLACE FUNCTION public.repair_incomplete_users()
RETURNS TABLE(user_id UUID, email TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    result_status TEXT;
BEGIN
    FOR user_record IN 
        SELECT u.id, u.email, u.email_confirmed_at, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.user_id = u.id
        WHERE u.email_confirmed_at IS NOT NULL
        AND p.user_id IS NULL
        AND u.email NOT LIKE '%@supabase.io'
    LOOP
        BEGIN
            -- Simuler le trigger pour cet utilisateur
            PERFORM public.auto_create_tenant_owner_direct(
                user_record.id,
                user_record.email,
                user_record.raw_user_meta_data
            );
            result_status := 'SUCCESS';
        EXCEPTION WHEN OTHERS THEN
            result_status := 'ERROR: ' || SQLERRM;
        END;
        
        user_id := user_record.id;
        email := user_record.email;
        status := result_status;
        RETURN NEXT;
    END LOOP;
END;
$$;

-- 4. Fonction helper pour réparation directe
DROP FUNCTION IF EXISTS public.auto_create_tenant_owner_direct(UUID, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.auto_create_tenant_owner_direct(
    p_user_id UUID,
    p_email TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_record RECORD;
    tenant_uuid UUID;
    company_name_var TEXT;
    role_uuid UUID;
    employee_id_var TEXT;
    max_emp_number INTEGER := 0;
    emp_record RECORD;
BEGIN
    -- Vérifier si l'utilisateur a déjà un profil
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
        RAISE NOTICE 'Profile already exists for user %', p_user_id;
        RETURN;
    END IF;

    -- Chercher une invitation pour cet email
    SELECT * INTO invitation_record
    FROM public.invitations
    WHERE email = p_email
    AND status = 'pending'
    AND invitation_type = 'tenant_owner'
    AND expires_at > NOW();

    IF FOUND THEN
        tenant_uuid := invitation_record.tenant_id;
        company_name_var := COALESCE(invitation_record.metadata->>'company_name', invitation_record.full_name || ' Company');
    ELSE
        tenant_uuid := gen_random_uuid();
        company_name_var := 'Entreprise de ' || split_part(p_email, '@', 1);
    END IF;

    -- Créer tenant, profil, rôle, employé (même logique que le trigger)
    INSERT INTO public.tenants (id, name, status, created_at, updated_at)
    VALUES (tenant_uuid, company_name_var, 'active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (user_id, tenant_id, full_name, email, role, created_at, updated_at)
    VALUES (
        p_user_id,
        tenant_uuid,
        COALESCE(p_metadata->>'full_name', invitation_record.full_name, split_part(p_email, '@', 1)),
        p_email,
        'tenant_admin',
        NOW(),
        NOW()
    );

    SELECT id INTO role_uuid FROM public.roles WHERE name = 'tenant_admin' LIMIT 1;
    
    INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, created_at)
    VALUES (p_user_id, role_uuid, tenant_uuid, true, NOW());

    -- Générer employee_id
    FOR emp_record IN 
        SELECT employee_id FROM public.employees 
        WHERE tenant_id = tenant_uuid AND employee_id ~ '^EMP[0-9]{3}$'
    LOOP
        max_emp_number := GREATEST(max_emp_number, CAST(substring(emp_record.employee_id from 4) AS INTEGER));
    END LOOP;
    
    employee_id_var := 'EMP' || lpad((max_emp_number + 1)::TEXT, 3, '0');

    INSERT INTO public.employees (
        user_id, employee_id, full_name, email, job_title, hire_date, 
        contract_type, status, tenant_id, created_at, updated_at
    )
    VALUES (
        p_user_id, employee_id_var,
        COALESCE(p_metadata->>'full_name', invitation_record.full_name, split_part(p_email, '@', 1)),
        p_email, 'Directeur Général', CURRENT_DATE, 'CDI', 'active', 
        tenant_uuid, NOW(), NOW()
    );

    -- Marquer invitation comme acceptée
    IF invitation_record.id IS NOT NULL THEN
        UPDATE public.invitations
        SET status = 'accepted', accepted_at = NOW(),
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('completed_by', p_user_id)
        WHERE id = invitation_record.id;
    END IF;
END;
$$;

-- 5. Test du trigger
COMMENT ON FUNCTION public.auto_create_tenant_owner() IS 'Trigger automatique pour créer tenant owner lors confirmation email';
COMMENT ON FUNCTION public.repair_incomplete_users() IS 'Répare les utilisateurs existants sans profil complet';

-- Pour tester : SELECT * FROM public.repair_incomplete_users();
