-- Script pour corriger le trigger qui doit se déclencher uniquement 
-- lors de la VALIDATION de l'email et non lors de la création utilisateur

-- 1. Supprimer l'ancien trigger qui se déclenche sur INSERT
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger_complete ON auth.users;
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS auto_create_tenant_owner_trigger ON auth.users;

-- 2. Créer le nouveau trigger qui se déclenche uniquement lors de la validation email
CREATE OR REPLACE TRIGGER auto_tenant_creation_on_email_confirmation
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    -- Se déclencher uniquement quand email_confirmed_at passe de NULL à une valeur
    OLD.email_confirmed_at IS NULL 
    AND NEW.email_confirmed_at IS NOT NULL
  )
  EXECUTE FUNCTION auto_create_complete_tenant_owner();

-- 3. Vérifier que le trigger est bien créé
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_condition
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth'
AND trigger_name LIKE '%tenant%';

-- 4. Message de confirmation
SELECT 'Trigger corrigé: se déclenche maintenant uniquement lors de la validation email (UPDATE avec email_confirmed_at)' as status;
