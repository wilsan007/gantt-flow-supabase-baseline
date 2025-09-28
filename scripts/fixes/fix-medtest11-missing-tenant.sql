-- Solution pour créer manuellement le tenant pour medtest11@yahoo.com
-- Utilisateur ID: fc558593-4a2c-45ec-8e07-5be2a465dbde

-- ========================================
-- DIAGNOSTIC RAPIDE
-- ========================================

-- Vérifier l'état actuel de l'utilisateur
SELECT 'ETAT_ACTUEL_USER' as diagnostic;
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
WHERE id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

-- Vérifier les données manquantes
SELECT 'DONNEES_MANQUANTES' as diagnostic;
SELECT 
    (SELECT COUNT(*) FROM profiles WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde') as profiles_count,
    (SELECT COUNT(*) FROM tenants WHERE owner_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde') as tenants_count,
    (SELECT COUNT(*) FROM employees WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde') as employees_count;

-- ========================================
-- SOLUTION 1: UTILISER LA FONCTION EXISTANTE
-- ========================================

-- Essayer d'abord avec la fonction create_tenant_owner_from_invitation
SELECT 'TENTATIVE_FONCTION_EXISTANTE' as solution;

DO $$
DECLARE
    result_message TEXT;
BEGIN
    -- Tenter de créer le tenant avec la fonction existante
    SELECT create_tenant_owner_from_invitation(
        'fc558593-4a2c-45ec-8e07-5be2a465dbde',  -- user_id
        'medtest11@yahoo.com',                    -- email  
        'Med Test User',                          -- full_name
        'tenant_owner'                            -- invitation_type
    ) INTO result_message;
    
    RAISE NOTICE 'Résultat fonction: %', result_message;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur fonction existante: %', SQLERRM;
END $$;

-- ========================================
-- SOLUTION 2: CRÉATION MANUELLE ÉTAPE PAR ÉTAPE
-- ========================================

-- Si la fonction échoue, créer manuellement
SELECT 'CREATION_MANUELLE' as solution;

DO $$
DECLARE
    new_tenant_id UUID;
    new_employee_id TEXT;
BEGIN
    -- Générer un nouvel ID de tenant
    new_tenant_id := gen_random_uuid();
    
    -- 1. Créer le tenant
    INSERT INTO tenants (id, name, owner_id, status)
    VALUES (
        new_tenant_id,
        'Entreprise Med Test User',
        'fc558593-4a2c-45ec-8e07-5be2a465dbde',
        'active'
    );
    RAISE NOTICE 'Tenant créé: %', new_tenant_id;
    
    -- 2. Créer le profil
    INSERT INTO profiles (user_id, full_name, role, tenant_id)
    VALUES (
        'fc558593-4a2c-45ec-8e07-5be2a465dbde',
        'Med Test User',
        'tenant_owner',
        new_tenant_id
    );
    RAISE NOTICE 'Profil créé pour user_id: fc558593-4a2c-45ec-8e07-5be2a465dbde';
    
    -- 3. Créer les user_roles
    INSERT INTO user_roles (user_id, role_id, tenant_id, is_active)
    SELECT 
        'fc558593-4a2c-45ec-8e07-5be2a465dbde',
        r.id,
        new_tenant_id,
        true
    FROM roles r 
    WHERE r.name = 'tenant_owner';
    RAISE NOTICE 'User roles créés';
    
    -- 4. Générer l'employee_id
    SELECT COALESCE(
        'EMP' || LPAD((
            SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1
            FROM employees 
            WHERE employee_id ~ '^EMP[0-9]+$'
        )::TEXT, 3, '0'),
        'EMP001'
    ) INTO new_employee_id;
    
    -- 5. Créer l'employé
    INSERT INTO employees (
        employee_id, 
        user_id, 
        full_name, 
        email, 
        tenant_id, 
        department_id, 
        position_id, 
        status
    )
    VALUES (
        new_employee_id,
        'fc558593-4a2c-45ec-8e07-5be2a465dbde',
        'Med Test User',
        'medtest11@yahoo.com',
        new_tenant_id,
        (SELECT id FROM departments WHERE tenant_id = new_tenant_id LIMIT 1),
        (SELECT id FROM positions WHERE tenant_id = new_tenant_id LIMIT 1),
        'active'
    );
    RAISE NOTICE 'Employé créé avec ID: %', new_employee_id;
    
    -- 6. Créer les permissions de base
    INSERT INTO role_permissions (role_id, permission_id, tenant_id, is_active)
    SELECT 
        r.id as role_id,
        p.id as permission_id,
        new_tenant_id,
        true
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.name = 'tenant_owner'
    AND NOT EXISTS (
        SELECT 1 FROM role_permissions rp 
        WHERE rp.role_id = r.id 
        AND rp.permission_id = p.id 
        AND rp.tenant_id = new_tenant_id
    );
    RAISE NOTICE 'Permissions créées';
    
    RAISE NOTICE 'CRÉATION COMPLÈTE RÉUSSIE pour medtest11@yahoo.com';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERREUR lors de la création manuelle: %', SQLERRM;
    ROLLBACK;
END $$;

-- ========================================
-- VÉRIFICATION FINALE
-- ========================================

SELECT 'VERIFICATION_FINALE' as etape;

-- Vérifier le profil
SELECT 'PROFIL' as table_name, * FROM profiles 
WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

-- Vérifier le tenant
SELECT 'TENANT' as table_name, * FROM tenants 
WHERE owner_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

-- Vérifier l'employé
SELECT 'EMPLOYEE' as table_name, * FROM employees 
WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

-- Vérifier les rôles
SELECT 'USER_ROLES' as table_name, * FROM user_roles 
WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

-- Test de la fonction is_super_admin
SELECT 'IS_SUPER_ADMIN' as test, is_super_admin('fc558593-4a2c-45ec-8e07-5be2a465dbde') as result;
