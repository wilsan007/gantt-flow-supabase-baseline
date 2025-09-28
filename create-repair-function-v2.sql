-- Fonction PostgreSQL pour réparer la création de tenant owner
-- À exécuter via Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION public.repair_tenant_owner_complete(
    p_user_id UUID,
    p_tenant_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_token TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    role_id_var UUID;
    employee_id_var TEXT;
    max_emp_number INTEGER := 0;
    emp_record RECORD;
    result JSON;
BEGIN
    -- 1. Nettoyage complet
    DELETE FROM public.employees WHERE user_id = p_user_id;
    DELETE FROM public.user_roles WHERE user_id = p_user_id;
    DELETE FROM public.profiles WHERE user_id = p_user_id;
    DELETE FROM public.tenants WHERE id = p_tenant_id;
    
    -- 2. Créer le tenant
    INSERT INTO public.tenants (id, name, status, created_at, updated_at)
    VALUES (p_tenant_id, 'Entreprise ' || p_full_name, 'active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- 3. Créer le profil utilisateur
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
        p_user_id,
        p_tenant_id,
        p_full_name,
        p_email,
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
    
    -- 4. Récupérer le rôle tenant_admin
    SELECT id INTO role_id_var
    FROM public.roles
    WHERE name = 'tenant_admin'
    LIMIT 1;
    
    IF role_id_var IS NULL THEN
        RAISE EXCEPTION 'Rôle tenant_admin non trouvé';
    END IF;
    
    -- 5. Assigner le rôle
    INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, created_at)
    VALUES (p_user_id, role_id_var, p_tenant_id, true, NOW())
    ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
        is_active = true,
        updated_at = NOW();
    
    -- 6. Générer employee_id unique
    FOR emp_record IN 
        SELECT employee_id 
        FROM public.employees 
        WHERE tenant_id = p_tenant_id 
        AND employee_id ~ '^EMP[0-9]{3}$'
    LOOP
        max_emp_number := GREATEST(max_emp_number, 
            CAST(substring(emp_record.employee_id from 4) AS INTEGER));
    END LOOP;
    
    employee_id_var := 'EMP' || lpad((max_emp_number + 1)::TEXT, 3, '0');
    
    -- 7. Créer l'employé
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
        p_user_id,
        employee_id_var,
        p_full_name,
        p_email,
        'Directeur Général',
        CURRENT_DATE,
        'CDI',
        'active',
        p_tenant_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET
        employee_id = EXCLUDED.employee_id,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        job_title = EXCLUDED.job_title,
        hire_date = EXCLUDED.hire_date,
        contract_type = EXCLUDED.contract_type,
        status = EXCLUDED.status,
        updated_at = NOW();
    
    -- 8. Marquer l'invitation comme acceptée si token fourni
    IF p_token IS NOT NULL THEN
        UPDATE public.invitations
        SET status = 'accepted',
            accepted_at = NOW(),
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('completed_by', p_user_id)
        WHERE token = p_token;
    END IF;
    
    -- 9. Construire le résultat
    result := json_build_object(
        'success', true,
        'user_id', p_user_id,
        'tenant_id', p_tenant_id,
        'employee_id', employee_id_var,
        'role_id', role_id_var,
        'message', 'Tenant owner créé avec succès'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Erreur lors de la création du tenant owner'
    );
END;
$$;

-- Fonction de test simple
CREATE OR REPLACE FUNCTION public.test_repair_function()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.repair_tenant_owner_complete(
        '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'::UUID,
        '115d5fa0-006a-4978-8776-c19b4157731a'::UUID,
        'test212@yahoo.com',
        'Med Osman',
        '758ac777fb6d8ae23436bd1802c890ef9300b1dafb4559661337f990'
    );
END;
$$;
