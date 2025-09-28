-- Nettoyage des triggers en double sur auth.users
-- Plusieurs triggers font la même chose et peuvent causer des conflits

-- 1. Supprimer d'abord le trigger qui dépend de la fonction
DROP TRIGGER IF EXISTS global_auto_tenant_creation_on_email_confirmation ON auth.users;

-- 2. Supprimer les autres triggers en double
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS auto_tenant_owner_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS email_confirmation_webhook_trigger ON auth.users;

-- 3. Maintenant supprimer les fonctions obsolètes (plus de dépendances)
DROP FUNCTION IF EXISTS public.notify_email_confirmation();
DROP FUNCTION IF EXISTS public.global_auto_create_tenant_owner_on_confirmation();

-- 3. S'assurer qu'il n'y a qu'un seul trigger actif
-- Recréer le trigger principal si nécessaire
CREATE OR REPLACE TRIGGER global_auto_tenant_creation_on_email_confirmation
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
    EXECUTE FUNCTION public.auto_create_tenant_owner();

-- 4. Vérifier le résultat
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
ORDER BY trigger_name;

SELECT 'Triggers nettoyés - Il ne devrait rester qu''un seul trigger actif' as status;
