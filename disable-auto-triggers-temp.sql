-- Script temporaire pour désactiver les triggers automatiques
-- qui causent l'erreur "Database error creating new user"

-- 1. Désactiver temporairement le trigger auto_create_complete_tenant_owner
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger_complete ON auth.users;

-- 2. Désactiver aussi l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS auto_create_tenant_owner_trigger ON auth.users;

-- 3. Vérifier qu'il n'y a plus de triggers sur auth.users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';

-- 4. Message de confirmation
SELECT 'Triggers automatiques désactivés temporairement pour permettre la création d''utilisateurs via Edge Function' as status;
