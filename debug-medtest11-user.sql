-- Debug script pour analyser l'utilisateur medtest11@yahoo.com
-- Utilisateur ID: fc558593-4a2c-45ec-8e07-5be2a465dbde

-- 1. Vérifier l'utilisateur dans auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
WHERE id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

-- 2. Vérifier le profil dans profiles
SELECT 
    user_id,
    full_name,
    role,
    tenant_id,
    created_at,
    updated_at
FROM profiles 
WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

-- 3. Vérifier les employés
SELECT 
    id,
    employee_id,
    user_id,
    full_name,
    email,
    tenant_id,
    created_at
FROM employees 
WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

-- 4. Vérifier les tenants associés
SELECT 
    t.id,
    t.name,
    t.owner_id,
    t.created_at,
    t.status
FROM tenants t
WHERE t.owner_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

-- 5. Vérifier les invitations
SELECT 
    id,
    email,
    full_name,
    tenant_id,
    invitation_type,
    status,
    token,
    expires_at,
    created_at,
    metadata
FROM invitations 
WHERE email = 'medtest11@yahoo.com' 
ORDER BY created_at DESC;

-- 6. Vérifier les user_roles
SELECT 
    user_id,
    role_id,
    tenant_id,
    is_active,
    created_at
FROM user_roles 
WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

-- 7. Vérifier les politiques RLS sur profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 8. Tester la fonction is_super_admin
SELECT is_super_admin('fc558593-4a2c-45ec-8e07-5be2a465dbde') as is_super_admin_result;

-- 9. Vérifier si l'utilisateur peut voir ses propres données avec RLS
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub":"fc558593-4a2c-45ec-8e07-5be2a465dbde","email":"medtest11@yahoo.com"}';

SELECT 
    user_id,
    full_name,
    role,
    tenant_id
FROM profiles 
WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';

RESET ROLE;
