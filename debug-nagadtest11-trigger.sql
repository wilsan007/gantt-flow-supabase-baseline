-- Script de diagnostic pour nagadtest11@yahoo.com
-- Vérifier pourquoi le trigger automatique ne s'est pas déclenché

-- 1. Vérifier l'utilisateur dans auth.users
SELECT 
  'auth.users' as table_name,
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'nagadtest11@yahoo.com';

-- 2. Vérifier si profil existe
SELECT 
  'profiles' as table_name,
  user_id,
  tenant_id,
  full_name,
  email,
  role,
  created_at
FROM public.profiles 
WHERE email = 'nagadtest11@yahoo.com';

-- 3. Vérifier les invitations
SELECT 
  'invitations' as table_name,
  id,
  email,
  invitation_type,
  status,
  expires_at,
  full_name,
  tenant_id,
  metadata,
  created_at
FROM public.invitations 
WHERE email = 'nagadtest11@yahoo.com';

-- 4. Vérifier si le trigger existe
SELECT 
  'triggers' as info_type,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%auto_tenant%' 
  AND event_object_table = 'users'
  AND event_object_schema = 'auth';

-- 5. Vérifier si la fonction trigger existe
SELECT 
  'functions' as info_type,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'auto_create_complete_tenant_owner'
  AND routine_schema = 'public';

-- 6. Test manuel de la fonction de réparation
SELECT repair_incomplete_users();
