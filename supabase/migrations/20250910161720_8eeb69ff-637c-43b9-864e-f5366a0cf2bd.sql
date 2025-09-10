-- Créer des comptes d'authentification pour tous les profils existants
-- Note: Cette migration utilise une fonction pour insérer dans auth.users

DO $$
DECLARE
    profile_record RECORD;
    temp_password TEXT := 'TempPass123!'; -- Mot de passe temporaire
    auth_user_id UUID;
BEGIN
    -- Parcourir tous les profils
    FOR profile_record IN 
        SELECT id, full_name, user_id 
        FROM public.profiles 
        WHERE user_id IS NOT NULL
    LOOP
        BEGIN
            -- Générer un email basé sur le nom
            DECLARE
                email_address TEXT;
                clean_name TEXT;
            BEGIN
                -- Nettoyer le nom pour créer un email
                clean_name := lower(replace(replace(profile_record.full_name, ' ', '.'), 'é', 'e'));
                email_address := clean_name || '@company.com';
                
                -- Insérer directement dans auth.users (nécessite des privilèges admin)
                INSERT INTO auth.users (
                    id,
                    instance_id,
                    email,
                    encrypted_password,
                    email_confirmed_at,
                    created_at,
                    updated_at,
                    confirmation_token,
                    email_change,
                    email_change_token_new,
                    recovery_token,
                    aud,
                    role
                ) VALUES (
                    profile_record.user_id,
                    '00000000-0000-0000-0000-000000000000'::uuid,
                    email_address,
                    crypt(temp_password, gen_salt('bf')),
                    now(),
                    now(),
                    now(),
                    '',
                    '',
                    '',
                    '',
                    'authenticated',
                    'authenticated'
                )
                ON CONFLICT (id) DO NOTHING;
                
                RAISE NOTICE 'Compte créé pour % avec email %', profile_record.full_name, email_address;
                
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Erreur lors de la création du compte pour %: %', profile_record.full_name, SQLERRM;
            END;
        END;
    END LOOP;
END $$;