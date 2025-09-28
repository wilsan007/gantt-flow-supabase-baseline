-- Script pour réparer l'utilisateur test212@yahoo.com
-- À exécuter via Supabase Dashboard > SQL Editor

-- 1. Vérifier l'état actuel de l'utilisateur
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.id as profile_id,
    p.tenant_id
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'test212@yahoo.com';

-- 2. Réparer cet utilisateur spécifique avec la fonction de réparation
SELECT public.auto_create_tenant_owner_direct(
    '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'::uuid,
    'test212@yahoo.com',
    NULL::jsonb
);

-- 3. Vérifier que tout a été créé correctement
SELECT 
    'Tenant' as type,
    t.id::text as id,
    t.name as name,
    t.status as status
FROM public.tenants t
WHERE t.id IN (
    SELECT p.tenant_id 
    FROM public.profiles p 
    WHERE p.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'
)

UNION ALL

SELECT 
    'Profile' as type,
    p.id::text as id,
    p.full_name as name,
    p.role as status
FROM public.profiles p
WHERE p.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'

UNION ALL

SELECT 
    'User Role' as type,
    ur.id::text as id,
    r.name as name,
    ur.is_active::text as status
FROM public.user_roles ur
JOIN public.roles r ON r.id = ur.role_id
WHERE ur.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'

UNION ALL

SELECT 
    'Employee' as type,
    e.id::text as id,
    e.employee_id as name,
    e.status as status
FROM public.employees e
WHERE e.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';

-- 4. Vérifier que le trigger est bien installé
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'auto_tenant_owner_creation_trigger';

-- 5. Tester le trigger avec un utilisateur fictif (optionnel)
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email = 'test212@yahoo.com' AND email_confirmed_at IS NULL;
