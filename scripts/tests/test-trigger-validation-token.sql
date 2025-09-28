-- Test complet du trigger avec validation token invitation
-- Simuler le processus exact : création utilisateur → validation token → trigger

-- 1. Vérifier l'état actuel du trigger
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'auto_tenant_owner_creation_trigger';

-- 2. Vérifier l'utilisateur test212@yahoo.com
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    u.confirmation_token,
    u.email_change_confirm_status
FROM auth.users u
WHERE u.email = 'test212@yahoo.com';

-- 3. Vérifier s'il y a une invitation pour cet email
SELECT 
    id,
    email,
    status,
    invitation_type,
    expires_at,
    tenant_id,
    full_name,
    metadata
FROM public.invitations
WHERE email = 'test212@yahoo.com';

-- 4. Vérifier l'état actuel du profil
SELECT 
    p.id,
    p.user_id,
    p.tenant_id,
    p.full_name,
    p.email,
    p.role
FROM public.profiles p
WHERE p.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';

-- 5. Test manuel du trigger - Simuler la validation email
-- ATTENTION: Ceci va déclencher le trigger si email_confirmed_at passe de NULL à une valeur
DO $$
DECLARE
    user_before RECORD;
    user_after RECORD;
BEGIN
    -- Récupérer l'état avant
    SELECT * INTO user_before 
    FROM auth.users 
    WHERE id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
    
    RAISE NOTICE 'AVANT - User: %, Email confirmé: %', user_before.email, user_before.email_confirmed_at;
    
    -- Si email pas encore confirmé, le confirmer pour déclencher le trigger
    IF user_before.email_confirmed_at IS NULL THEN
        RAISE NOTICE 'Déclenchement du trigger - Confirmation email...';
        
        UPDATE auth.users 
        SET email_confirmed_at = NOW(),
            confirmation_token = NULL
        WHERE id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
        
        RAISE NOTICE 'Email confirmé - Trigger déclenché';
    ELSE
        RAISE NOTICE 'Email déjà confirmé le: %', user_before.email_confirmed_at;
    END IF;
    
    -- Récupérer l'état après
    SELECT * INTO user_after 
    FROM auth.users 
    WHERE id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
    
    RAISE NOTICE 'APRÈS - User: %, Email confirmé: %', user_after.email, user_after.email_confirmed_at;
END $$;

-- 6. Vérifier si le profil a été créé après le trigger
SELECT 
    'Profile créé' as status,
    p.id::text as id,
    p.tenant_id::text as tenant_id,
    p.full_name as name,
    p.role as details
FROM public.profiles p
WHERE p.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'

UNION ALL

SELECT 
    'Tenant créé' as status,
    t.id::text as id,
    NULL::text as tenant_id,
    t.name as name,
    t.status as details
FROM public.tenants t
WHERE t.id IN (
    SELECT p.tenant_id 
    FROM public.profiles p 
    WHERE p.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a'
)

UNION ALL

SELECT 
    'Employé créé' as status,
    e.id::text as id,
    e.tenant_id::text as tenant_id,
    e.employee_id as name,
    e.status as details
FROM public.employees e
WHERE e.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';

-- 7. Vérifier les logs du trigger (si disponibles)
-- Les messages NOTICE apparaîtront dans les logs PostgreSQL

-- 8. Test de la fonction trigger directement
SELECT 'Test fonction trigger directement' as test;

-- Simuler NEW et OLD pour tester la logique
DO $$
DECLARE
    test_user RECORD;
BEGIN
    SELECT * INTO test_user 
    FROM auth.users 
    WHERE id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
    
    RAISE NOTICE 'Test direct de la fonction trigger pour user: %', test_user.email;
    
    -- Appeler directement la fonction de réparation
    PERFORM public.auto_create_tenant_owner_direct(
        test_user.id,
        test_user.email,
        test_user.raw_user_meta_data
    );
    
    RAISE NOTICE 'Fonction de réparation exécutée';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur dans test fonction: %', SQLERRM;
END $$;
