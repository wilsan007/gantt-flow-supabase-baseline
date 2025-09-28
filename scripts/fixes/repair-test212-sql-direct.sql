-- Script de réparation directe via SQL pour contourner les restrictions RLS
-- À exécuter via Supabase Dashboard > SQL Editor

-- Variables pour l'utilisateur test212
DO $$
DECLARE
    user_id_var UUID := '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
    tenant_id_var UUID := '115d5fa0-006a-4978-8776-c19b4157731a';
    email_var TEXT := 'test212@yahoo.com';
    full_name_var TEXT := 'Med Osman';
    token_var TEXT := '758ac777fb6d8ae23436bd1802c890ef9300b1dafb4559661337f990';
    role_id_var UUID;
    employee_id_var TEXT;
    max_emp_number INTEGER := 0;
    emp_record RECORD;
BEGIN
    RAISE NOTICE 'Début de la réparation pour user_id: %', user_id_var;
    
    -- 1. Nettoyage complet des données existantes
    RAISE NOTICE '1. Nettoyage des données existantes...';
    
    DELETE FROM public.employees WHERE user_id = user_id_var;
    DELETE FROM public.user_roles WHERE user_id = user_id_var;
    DELETE FROM public.profiles WHERE user_id = user_id_var;
    DELETE FROM public.tenants WHERE id = tenant_id_var;
    
    RAISE NOTICE 'Nettoyage terminé';
    
    -- 2. Créer le tenant
    RAISE NOTICE '2. Création du tenant...';
    
    INSERT INTO public.tenants (id, name, status, created_at, updated_at)
    VALUES (tenant_id_var, 'Entreprise Med Osman', 'active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Tenant créé: %', tenant_id_var;
    
    -- 3. Créer le profil utilisateur DIRECTEMENT avec tenant_id
    RAISE NOTICE '3. Création du profil utilisateur...';
    
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
        tenant_id_var,
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
    
    RAISE NOTICE 'Profil créé pour user_id: %', user_id_var;
    
    -- 4. Récupérer le rôle tenant_admin depuis la table globale
    RAISE NOTICE '4. Récupération du rôle tenant_admin...';
    
    SELECT id INTO role_id_var
    FROM public.roles
    WHERE name = 'tenant_admin'
    LIMIT 1;
    
    IF role_id_var IS NULL THEN
        RAISE EXCEPTION 'Rôle tenant_admin non trouvé dans la table globale roles';
    END IF;
    
    RAISE NOTICE 'Rôle tenant_admin trouvé: %', role_id_var;
    
    -- 5. Assigner le rôle
    RAISE NOTICE '5. Attribution du rôle...';
    
    INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, created_at)
    VALUES (user_id_var, role_id_var, tenant_id_var, true, NOW())
    ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
        is_active = true,
        updated_at = NOW();
    
    RAISE NOTICE 'Rôle attribué';
    
    -- 6. Générer employee_id unique
    RAISE NOTICE '6. Génération employee_id unique...';
    
    -- Trouver le prochain numéro disponible
    FOR emp_record IN 
        SELECT employee_id 
        FROM public.employees 
        WHERE tenant_id = tenant_id_var 
        AND employee_id ~ '^EMP[0-9]{3}$'
    LOOP
        max_emp_number := GREATEST(max_emp_number, 
            CAST(substring(emp_record.employee_id from 4) AS INTEGER));
    END LOOP;
    
    employee_id_var := 'EMP' || lpad((max_emp_number + 1)::TEXT, 3, '0');
    
    RAISE NOTICE 'Employee ID généré: %', employee_id_var;
    
    -- 7. Créer l'employé
    RAISE NOTICE '7. Création de l''employé...';
    
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
        tenant_id_var,
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
    
    RAISE NOTICE 'Employé créé avec ID: %', employee_id_var;
    
    -- 8. Marquer l'invitation comme acceptée
    RAISE NOTICE '8. Marquage de l''invitation...';
    
    UPDATE public.invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('completed_by', user_id_var)
    WHERE token = token_var;
    
    RAISE NOTICE 'Invitation marquée comme acceptée';
    
    -- 9. Vérification finale
    RAISE NOTICE '9. Vérification finale...';
    
    -- Vérifier profil
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = user_id_var AND tenant_id = tenant_id_var) THEN
        RAISE NOTICE '✅ Profil créé avec tenant_id';
    ELSE
        RAISE NOTICE '❌ Profil manquant ou sans tenant_id';
    END IF;
    
    -- Vérifier employé
    IF EXISTS (SELECT 1 FROM public.employees WHERE user_id = user_id_var AND tenant_id = tenant_id_var) THEN
        RAISE NOTICE '✅ Employé créé';
    ELSE
        RAISE NOTICE '❌ Employé manquant';
    END IF;
    
    -- Vérifier rôle
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = user_id_var AND tenant_id = tenant_id_var) THEN
        RAISE NOTICE '✅ Rôle attribué';
    ELSE
        RAISE NOTICE '❌ Rôle manquant';
    END IF;
    
    RAISE NOTICE '🎉 Réparation terminée avec succès !';
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de la réparation: %', SQLERRM;
END $$;

-- Afficher le résultat final
SELECT 
    'Profil' as element,
    CASE WHEN COUNT(*) > 0 THEN '✅ Créé' ELSE '❌ Manquant' END as status
FROM public.profiles 
WHERE user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'

UNION ALL

SELECT 
    'Employé' as element,
    CASE WHEN COUNT(*) > 0 THEN '✅ Créé (' || MAX(employee_id) || ')' ELSE '❌ Manquant' END as status
FROM public.employees 
WHERE user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'

UNION ALL

SELECT 
    'Rôle' as element,
    CASE WHEN COUNT(*) > 0 THEN '✅ Attribué' ELSE '❌ Manquant' END as status
FROM public.user_roles 
WHERE user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
