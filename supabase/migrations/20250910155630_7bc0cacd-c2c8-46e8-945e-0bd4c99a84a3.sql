-- Créer des comptes d'authentification pour les profils existants et mettre à jour toutes les références

-- Fonction pour créer un utilisateur d'authentification et retourner son ID
CREATE OR REPLACE FUNCTION create_auth_user_for_profile(
    profile_email TEXT,
    profile_name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
    new_user_id UUID;
    temp_password TEXT := 'TempPassword123!';
BEGIN
    -- Créer un nouvel utilisateur dans auth.users
    INSERT INTO auth.users (
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        confirmation_token,
        email_change_token_new,
        recovery_token
    ) VALUES (
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        profile_email,
        crypt(temp_password, gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('full_name', profile_name),
        false,
        '',
        '',
        ''
    )
    RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$;

-- Créer des comptes d'authentification pour tous les profils existants
DO $$
DECLARE
    profile_record RECORD;
    new_user_id UUID;
BEGIN
    -- Pour chaque profil existant sans user_id
    FOR profile_record IN 
        SELECT id, full_name, tenant_id 
        FROM public.profiles 
        WHERE user_id IS NULL
        ORDER BY created_at
    LOOP
        -- Créer un email basé sur le nom complet
        DECLARE
            profile_email TEXT := lower(replace(profile_record.full_name, ' ', '.')) || '@company.com';
        BEGIN
            -- Créer l'utilisateur d'authentification
            new_user_id := create_auth_user_for_profile(profile_email, profile_record.full_name);
            
            -- Mettre à jour le profil avec le user_id
            UPDATE public.profiles 
            SET user_id = new_user_id
            WHERE id = profile_record.id;
            
            -- Mettre à jour la table employees si elle existe
            UPDATE public.employees 
            SET user_id = new_user_id
            WHERE full_name = profile_record.full_name 
            AND tenant_id = profile_record.tenant_id;
            
            RAISE NOTICE 'Créé utilisateur % avec ID % pour profil %', profile_email, new_user_id, profile_record.full_name;
        END;
    END LOOP;
END;
$$;

-- Mettre à jour toutes les tables HR pour utiliser les user_id des profils

-- Mettre à jour les leave_balances
UPDATE public.leave_balances lb
SET employee_id = p.user_id
FROM public.profiles p
WHERE lb.employee_id = p.id
AND p.user_id IS NOT NULL;

-- Mettre à jour les leave_requests
UPDATE public.leave_requests lr
SET employee_id = p.user_id
FROM public.profiles p
WHERE lr.employee_id = p.id
AND p.user_id IS NOT NULL;

-- Mettre à jour les attendances
UPDATE public.attendances a
SET employee_id = p.user_id
FROM public.profiles p
WHERE a.employee_id = p.id
AND p.user_id IS NOT NULL;

-- Mettre à jour les skill_assessments
UPDATE public.skill_assessments sa
SET employee_id = p.user_id
FROM public.profiles p
WHERE sa.employee_id = p.id
AND p.user_id IS NOT NULL;

-- Mettre à jour les expense_reports
UPDATE public.expense_reports er
SET employee_id = p.user_id
FROM public.profiles p
WHERE er.employee_id = p.id
AND p.user_id IS NOT NULL;

-- Mettre à jour les employee_payrolls
UPDATE public.employee_payrolls ep
SET employee_id = p.user_id
FROM public.profiles p
WHERE ep.employee_id = p.id
AND p.user_id IS NOT NULL;

-- Mettre à jour les onboarding_processes
UPDATE public.onboarding_processes op
SET employee_id = p.user_id
FROM public.profiles p
WHERE op.employee_id = p.id
AND p.user_id IS NOT NULL;

-- Mettre à jour les offboarding_processes
UPDATE public.offboarding_processes ofp
SET employee_id = p.user_id
FROM public.profiles p
WHERE ofp.employee_id = p.id
AND p.user_id IS NOT NULL;

-- Mettre à jour les evaluations
UPDATE public.evaluations e
SET employee_id = p.user_id
FROM public.profiles p
WHERE e.employee_id = p.id
AND p.user_id IS NOT NULL;

-- Mettre à jour les objectives
UPDATE public.objectives o
SET employee_id = p.user_id
FROM public.profiles p
WHERE o.employee_id = p.id
AND p.user_id IS NOT NULL;

-- Nettoyer la fonction temporaire
DROP FUNCTION IF EXISTS create_auth_user_for_profile(TEXT, TEXT);