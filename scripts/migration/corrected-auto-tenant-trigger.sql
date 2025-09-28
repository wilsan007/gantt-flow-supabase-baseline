-- Trigger corrigé pour création automatique de tenant owner
-- Ordre d'exécution: invitation → tenant → user_role → profile → employee
-- Utilise SECURITY DEFINER pour contourner RLS

-- ============================================
-- 1. FONCTION POUR GÉNÉRER EMPLOYEE_ID UNIQUE
-- ============================================
CREATE OR REPLACE FUNCTION generate_unique_employee_id(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    max_number INTEGER := 0;
    emp_record RECORD;
    new_employee_id TEXT;
BEGIN
    -- Trouver le plus grand numéro EMP existant pour ce tenant
    FOR emp_record IN 
        SELECT employee_id 
        FROM public.employees 
        WHERE tenant_id = p_tenant_id 
        AND employee_id ~ '^EMP[0-9]{6}$'
    LOOP
        max_number := GREATEST(max_number, 
            CAST(substring(emp_record.employee_id from 4) AS INTEGER));
    END LOOP;

    -- Générer le nouvel ID
    new_employee_id := 'EMP' || lpad((max_number + 1)::TEXT, 6, '0');
    
    RETURN new_employee_id;
END;
$$;

-- ============================================
-- 2. FONCTION PRINCIPALE DE CRÉATION TENANT OWNER
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_tenant_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_record RECORD;
    tenant_uuid UUID;
    company_name_var TEXT;
    tenant_admin_role_id UUID;
    employee_id_var TEXT;
    user_full_name TEXT;
    user_email TEXT;
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
        -- ============================================
        -- ÉTAPE 1: RÉCUPÉRER INVITATION ET TENANT_ID
        -- ============================================
        SELECT * INTO invitation_record
        FROM public.invitations
        WHERE email = NEW.email
        AND status = 'pending'
        AND invitation_type = 'tenant_owner'
        AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1;

        IF FOUND THEN
            RAISE NOTICE 'Found invitation: % with tenant_id: %', invitation_record.id, invitation_record.tenant_id;
            tenant_uuid := invitation_record.tenant_id;
            company_name_var := COALESCE(invitation_record.metadata->>'company_name', invitation_record.full_name || ' Company');
            user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', invitation_record.full_name, split_part(NEW.email, '@', 1));
        ELSE
            RAISE NOTICE 'No invitation found, creating default tenant';
            tenant_uuid := gen_random_uuid();
            company_name_var := 'Entreprise de ' || split_part(NEW.email, '@', 1);
            user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
        END IF;

        user_email := NEW.email;

        -- ============================================
        -- ÉTAPE 2: CRÉER LE TENANT
        -- ============================================
        RAISE NOTICE 'Creating tenant: % with name: %', tenant_uuid, company_name_var;
        
        INSERT INTO public.tenants (id, name, status, created_at, updated_at)
        VALUES (tenant_uuid, company_name_var, 'active', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = NOW();

        -- ============================================
        -- ÉTAPE 3: RÉCUPÉRER LE RÔLE TENANT_ADMIN
        -- ============================================
        SELECT id INTO tenant_admin_role_id
        FROM public.roles
        WHERE name = 'tenant_admin'
        LIMIT 1;

        IF tenant_admin_role_id IS NULL THEN
            RAISE EXCEPTION 'Role tenant_admin not found in roles table';
        END IF;

        RAISE NOTICE 'Found tenant_admin role: %', tenant_admin_role_id;

        -- ============================================
        -- ÉTAPE 4: ASSIGNER LE RÔLE USER_ROLES
        -- ============================================
        RAISE NOTICE 'Assigning tenant_admin role to user in user_roles';
        
        INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, created_at)
        VALUES (NEW.id, tenant_admin_role_id, tenant_uuid, true, NOW())
        ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
            is_active = true,
            updated_at = NOW();

        -- ============================================
        -- ÉTAPE 5: CRÉER LE PROFIL UTILISATEUR
        -- ============================================
        RAISE NOTICE 'Creating user profile with tenant_id: %', tenant_uuid;
        
        -- Utiliser une insertion directe avec SECURITY DEFINER pour contourner RLS
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
            user_full_name,
            user_email,
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

        -- ============================================
        -- ÉTAPE 6: GÉNÉRER EMPLOYEE_ID UNIQUE
        -- ============================================
        employee_id_var := generate_unique_employee_id(tenant_uuid);
        RAISE NOTICE 'Generated unique employee_id: %', employee_id_var;

        -- ============================================
        -- ÉTAPE 7: CRÉER L'EMPLOYÉ
        -- ============================================
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
            user_full_name,
            user_email,
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

        -- ============================================
        -- ÉTAPE 8: MARQUER L'INVITATION COMME ACCEPTÉE
        -- ============================================
        IF invitation_record.id IS NOT NULL THEN
            RAISE NOTICE 'Marking invitation as accepted: %', invitation_record.id;
            
            UPDATE public.invitations
            SET status = 'accepted',
                accepted_at = NOW(),
                metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                    'completed_by', NEW.id,
                    'tenant_created', tenant_uuid,
                    'completion_date', NOW()
                )
            WHERE id = invitation_record.id;
        END IF;

        RAISE NOTICE 'Tenant owner creation completed successfully for user: % with tenant: %', NEW.id, tenant_uuid;

    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error in auto_create_tenant_owner for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
        -- Log l'erreur mais ne pas faire échouer l'authentification
        INSERT INTO public.system_logs (
            level, 
            message, 
            context, 
            created_at
        ) VALUES (
            'ERROR',
            'Tenant owner creation failed: ' || SQLERRM,
            jsonb_build_object(
                'user_id', NEW.id,
                'email', NEW.email,
                'sqlstate', SQLSTATE,
                'function', 'auto_create_tenant_owner'
            ),
            NOW()
        );
    END;

    RETURN NEW;
END;
$$;

-- ============================================
-- 3. CRÉER/RECRÉER LE TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;

CREATE TRIGGER auto_tenant_creation_trigger
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
    EXECUTE FUNCTION auto_create_tenant_owner();

-- ============================================
-- 4. FONCTION DE RÉPARATION POUR UTILISATEURS EXISTANTS
-- ============================================
CREATE OR REPLACE FUNCTION repair_existing_tenant_owner(p_user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    result_message TEXT;
BEGIN
    -- Récupérer l'utilisateur
    SELECT * INTO user_record
    FROM auth.users
    WHERE email = p_user_email
    AND email_confirmed_at IS NOT NULL;

    IF NOT FOUND THEN
        RETURN 'User not found or email not confirmed: ' || p_user_email;
    END IF;

    -- Simuler le trigger
    BEGIN
        -- Appeler la fonction de création
        PERFORM auto_create_tenant_owner_direct(user_record);
        result_message := 'SUCCESS: Tenant owner created for ' || p_user_email;
    EXCEPTION WHEN OTHERS THEN
        result_message := 'ERROR: ' || SQLERRM || ' for user ' || p_user_email;
    END;

    RETURN result_message;
END;
$$;

-- ============================================
-- 5. FONCTION DIRECTE POUR RÉPARATION
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_tenant_owner_direct(user_record auth.users)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_record RECORD;
    tenant_uuid UUID;
    company_name_var TEXT;
    tenant_admin_role_id UUID;
    employee_id_var TEXT;
    user_full_name TEXT;
BEGIN
    -- Vérifier si l'utilisateur a déjà un profil
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = user_record.id) THEN
        RAISE NOTICE 'Profile already exists for user %', user_record.id;
        RETURN;
    END IF;

    -- Récupérer invitation
    SELECT * INTO invitation_record
    FROM public.invitations
    WHERE email = user_record.email
    AND invitation_type = 'tenant_owner'
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        tenant_uuid := invitation_record.tenant_id;
        company_name_var := COALESCE(invitation_record.metadata->>'company_name', invitation_record.full_name || ' Company');
        user_full_name := COALESCE(user_record.raw_user_meta_data->>'full_name', invitation_record.full_name, split_part(user_record.email, '@', 1));
    ELSE
        tenant_uuid := gen_random_uuid();
        company_name_var := 'Entreprise de ' || split_part(user_record.email, '@', 1);
        user_full_name := COALESCE(user_record.raw_user_meta_data->>'full_name', split_part(user_record.email, '@', 1));
    END IF;

    -- Créer tenant
    INSERT INTO public.tenants (id, name, status, created_at, updated_at)
    VALUES (tenant_uuid, company_name_var, 'active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Récupérer rôle tenant_admin
    SELECT id INTO tenant_admin_role_id FROM public.roles WHERE name = 'tenant_admin' LIMIT 1;

    -- Assigner rôle
    INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, created_at)
    VALUES (user_record.id, tenant_admin_role_id, tenant_uuid, true, NOW())
    ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

    -- Créer profil
    INSERT INTO public.profiles (user_id, tenant_id, full_name, email, role, created_at, updated_at)
    VALUES (user_record.id, tenant_uuid, user_full_name, user_record.email, 'tenant_admin', NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;

    -- Générer employee_id et créer employé
    employee_id_var := generate_unique_employee_id(tenant_uuid);
    
    INSERT INTO public.employees (
        user_id, employee_id, full_name, email, job_title, hire_date, 
        contract_type, status, tenant_id, created_at, updated_at
    )
    VALUES (
        user_record.id, employee_id_var, user_full_name, user_record.email, 
        'Directeur Général', CURRENT_DATE, 'CDI', 'active', tenant_uuid, NOW(), NOW()
    )
    ON CONFLICT (user_id, tenant_id) DO NOTHING;

    -- Marquer invitation comme acceptée
    IF invitation_record.id IS NOT NULL THEN
        UPDATE public.invitations
        SET status = 'accepted', accepted_at = NOW()
        WHERE id = invitation_record.id;
    END IF;
END;
$$;

-- ============================================
-- 6. COMMENTAIRES D'UTILISATION
-- ============================================
/*
ORDRE D'EXÉCUTION RESPECTÉ:
1. Récupération invitation avec tenant_id
2. Création tenant avec tenant_id de l'invitation
3. Attribution rôle tenant_admin dans user_roles
4. Création profil avec user_id et tenant_id
5. Génération employee_id unique (EMP000001, EMP000002, etc.)
6. Création employé avec employee_id généré
7. Marquage invitation comme acceptée

UTILISATION:
- Le trigger se déclenche automatiquement lors de la confirmation d'email
- Pour réparer un utilisateur existant: SELECT repair_existing_tenant_owner('email@example.com');
- Toutes les fonctions utilisent SECURITY DEFINER pour contourner RLS
*/
