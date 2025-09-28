-- Script final pour configurer le webhook et finaliser l'installation
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Nettoyer tous les anciens triggers
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS auto_tenant_owner_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS email_confirmation_trigger ON auth.users;
DROP FUNCTION IF EXISTS global_auto_create_tenant_owner_on_confirmation();
DROP FUNCTION IF EXISTS notify_email_confirmation();

-- 2. Créer la fonction de notification simple
CREATE OR REPLACE FUNCTION notify_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si l'email vient d'être confirmé
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Log pour debug
    RAISE NOTICE 'Email confirmé pour utilisateur: % (%)', NEW.email, NEW.id;
    
    -- Déclencher une notification
    PERFORM pg_notify('email_confirmed', json_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'confirmed_at', NEW.email_confirmed_at
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Créer le trigger
CREATE TRIGGER email_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_email_confirmation();

-- 4. Fonction de test pour vérifier le système
CREATE OR REPLACE FUNCTION test_edge_function_system(test_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  invitation_record RECORD;
  result JSON;
BEGIN
  -- Vérifier l'utilisateur
  SELECT * INTO user_record
  FROM auth.users
  WHERE email = test_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé',
      'email', test_email
    );
  END IF;
  
  -- Vérifier l'invitation
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE email = test_email
    AND invitation_type = 'tenant_owner';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation tenant_owner non trouvée',
      'email', test_email
    );
  END IF;
  
  -- Forcer la confirmation si pas encore fait
  IF user_record.email_confirmed_at IS NULL THEN
    UPDATE auth.users 
    SET email_confirmed_at = now()
    WHERE id = user_record.id;
    
    -- Attendre un peu pour le webhook
    PERFORM pg_sleep(2);
  END IF;
  
  -- Vérifier les résultats
  RETURN json_build_object(
    'success', true,
    'message', 'Test système Edge Function',
    'user_id', user_record.id,
    'email', test_email,
    'invitation_id', invitation_record.id,
    'tenant_id', invitation_record.tenant_id,
    'profile_exists', EXISTS(SELECT 1 FROM public.profiles WHERE user_id = user_record.id),
    'employee_exists', EXISTS(SELECT 1 FROM public.employees WHERE user_id = user_record.id),
    'roles_assigned', EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = user_record.id)
  );
END;
$$;

-- 5. Fonction pour nettoyer un utilisateur de test
CREATE OR REPLACE FUNCTION cleanup_test_user(test_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  invitation_record RECORD;
BEGIN
  -- Récupérer l'utilisateur
  SELECT * INTO user_record
  FROM auth.users
  WHERE email = test_email;
  
  -- Récupérer l'invitation
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE email = test_email;
  
  IF user_record.id IS NOT NULL THEN
    -- Supprimer les données dans l'ordre
    DELETE FROM public.employees WHERE user_id = user_record.id;
    DELETE FROM public.user_roles WHERE user_id = user_record.id;
    DELETE FROM public.profiles WHERE user_id = user_record.id;
    
    -- Remettre l'email comme non confirmé
    UPDATE auth.users 
    SET email_confirmed_at = NULL
    WHERE id = user_record.id;
  END IF;
  
  -- Remettre l'invitation en pending
  IF invitation_record.id IS NOT NULL THEN
    UPDATE public.invitations
    SET status = 'pending',
        accepted_at = NULL,
        metadata = CASE 
          WHEN metadata IS NOT NULL THEN metadata - 'completed_by' - 'completed_at' - 'employee_id'
          ELSE NULL
        END
    WHERE id = invitation_record.id;
    
    -- Supprimer le tenant si créé
    DELETE FROM public.tenants WHERE id = invitation_record.tenant_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Utilisateur nettoyé',
    'email', test_email
  );
END;
$$;

-- 6. Instructions finales
SELECT 'CONFIGURATION TERMINÉE' as status,
'Edge Function déployée et triggers configurés' as message,
'Prochaine étape: Configurer le webhook dans Supabase Dashboard' as next_step;

-- Instructions pour le webhook :
SELECT 'WEBHOOK CONFIGURATION' as section,
'1. Aller dans Database > Webhooks' as step_1,
'2. Créer un nouveau webhook:' as step_2,
'   - Table: auth.users' as param_1,
'   - Events: UPDATE' as param_2,
'   - Conditions: email_confirmed_at IS NOT NULL' as param_3,
'   - URL: https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation' as param_4,
'3. Tester avec: SELECT test_edge_function_system(''email@example.com'');' as step_3;
