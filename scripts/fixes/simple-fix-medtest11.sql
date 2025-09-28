-- Solution simple et directe pour medtest11@yahoo.com
-- Utilisateur ID: fc558593-4a2c-45ec-8e07-5be2a465dbde

-- Créer manuellement toutes les données nécessaires
DO $$
DECLARE
    new_tenant_id UUID;
    new_employee_id TEXT;
    tenant_owner_role_id UUID;
    department_id UUID;
    position_id UUID;
BEGIN
    -- Générer un nouvel ID de tenant
    new_tenant_id := gen_random_uuid();
    
    -- Récupérer le role_id pour tenant_owner
    SELECT id INTO tenant_owner_role_id FROM roles WHERE name = 'tenant_owner' LIMIT 1;
    
    RAISE NOTICE 'Début création pour medtest11@yahoo.com avec tenant_id: %', new_tenant_id;
    
    -- 1. Créer le tenant
    INSERT INTO tenants (id, name, owner_id, status, created_at, updated_at)
    VALUES (
        new_tenant_id,
        'Entreprise Med Test User',
        'fc558593-4a2c-45ec-8e07-5be2a465dbde',
        'active',
        NOW(),
        NOW()
    );
    RAISE NOTICE '✓ Tenant créé';
    
    -- 2. Créer le profil
    INSERT INTO profiles (user_id, full_name, role, tenant_id, created_at, updated_at)
    VALUES (
        'fc558593-4a2c-45ec-8e07-5be2a465dbde',
        'Med Test User',
        'tenant_owner',
        new_tenant_id,
        NOW(),
        NOW()
    );
    RAISE NOTICE '✓ Profil créé';
    
    -- 3. Créer les user_roles
    INSERT INTO user_roles (user_id, role_id, tenant_id, is_active, created_at, updated_at)
    VALUES (
        'fc558593-4a2c-45ec-8e07-5be2a465dbde',
        tenant_owner_role_id,
        new_tenant_id,
        true,
        NOW(),
        NOW()
    );
    RAISE NOTICE '✓ User roles créés';
    
    -- 4. Créer un département par défaut
    INSERT INTO departments (id, name, tenant_id, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Direction Générale',
        new_tenant_id,
        NOW(),
        NOW()
    ) RETURNING id INTO department_id;
    RAISE NOTICE '✓ Département créé: %', department_id;
    
    -- 5. Créer une position par défaut
    INSERT INTO positions (id, title, tenant_id, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Directeur Général',
        new_tenant_id,
        NOW(),
        NOW()
    ) RETURNING id INTO position_id;
    RAISE NOTICE '✓ Position créée: %', position_id;
    
    -- 6. Générer l'employee_id
    SELECT COALESCE(
        'EMP' || LPAD((
            SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1
            FROM employees 
            WHERE employee_id ~ '^EMP[0-9]+$'
        )::TEXT, 3, '0'),
        'EMP001'
    ) INTO new_employee_id;
    
    -- 7. Créer l'employé
    INSERT INTO employees (
        id,
        employee_id, 
        user_id, 
        full_name, 
        email, 
        tenant_id, 
        department_id, 
        position_id, 
        status,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        new_employee_id,
        'fc558593-4a2c-45ec-8e07-5be2a465dbde',
        'Med Test User',
        'medtest11@yahoo.com',
        new_tenant_id,
        department_id,
        position_id,
        'active',
        NOW(),
        NOW()
    );
    RAISE NOTICE '✓ Employé créé avec ID: %', new_employee_id;
    
    -- 8. Créer les permissions de base pour tenant_owner
    INSERT INTO role_permissions (role_id, permission_id, tenant_id, is_active, created_at, updated_at)
    SELECT 
        tenant_owner_role_id,
        p.id,
        new_tenant_id,
        true,
        NOW(),
        NOW()
    FROM permissions p
    WHERE NOT EXISTS (
        SELECT 1 FROM role_permissions rp 
        WHERE rp.role_id = tenant_owner_role_id 
        AND rp.permission_id = p.id 
        AND rp.tenant_id = new_tenant_id
    );
    RAISE NOTICE '✓ Permissions créées';
    
    RAISE NOTICE '🎉 CRÉATION COMPLÈTE RÉUSSIE pour medtest11@yahoo.com';
    RAISE NOTICE 'Tenant ID: %', new_tenant_id;
    RAISE NOTICE 'Employee ID: %', new_employee_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERREUR: %', SQLERRM;
    ROLLBACK;
END $$;

-- Vérification finale
SELECT '=== VÉRIFICATION FINALE ===' as status;

SELECT 'PROFIL' as table_name, user_id, full_name, role, tenant_id 
FROM profiles WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

SELECT 'TENANT' as table_name, id, name, owner_id, status 
FROM tenants WHERE owner_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

SELECT 'EMPLOYEE' as table_name, employee_id, user_id, full_name, email, status 
FROM employees WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

SELECT 'USER_ROLES' as table_name, user_id, role_id, tenant_id, is_active 
FROM user_roles WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';
