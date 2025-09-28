-- Configuration du webhook pour déclencher l'Edge Function lors de la confirmation d'email
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS auto_tenant_owner_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS email_confirmation_trigger ON auth.users;
DROP FUNCTION IF EXISTS global_auto_create_tenant_owner_on_confirmation();
DROP FUNCTION IF EXISTS notify_email_confirmation();

-- 2. Créer une fonction pour notifier l'Edge Function
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
    
    -- Déclencher une notification (optionnel - pour les logs)
    PERFORM pg_notify('email_confirmed', json_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'confirmed_at', NEW.email_confirmed_at
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Créer le trigger sur auth.users
CREATE TRIGGER email_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_email_confirmation();

-- 4. Fonction utilitaire pour tester l'Edge Function manuellement
CREATE OR REPLACE FUNCTION test_edge_function_webhook(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  webhook_payload JSON;
  result JSON;
BEGIN
  -- Récupérer l'utilisateur
  SELECT * INTO user_record
  FROM auth.users
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;
  
  -- Construire le payload du webhook
  webhook_payload := json_build_object(
    'type', 'UPDATE',
    'table', 'users',
    'schema', 'auth',
    'record', json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'email_confirmed_at', COALESCE(user_record.email_confirmed_at, now())
    ),
    'old_record', json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'email_confirmed_at', NULL
    )
  );
  
  -- Simuler la confirmation si pas encore fait
  IF user_record.email_confirmed_at IS NULL THEN
    UPDATE auth.users 
    SET email_confirmed_at = now()
    WHERE id = user_record.id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Test webhook préparé',
    'user_id', user_record.id,
    'email', user_record.email,
    'webhook_payload', webhook_payload
  );
END;
$$;

-- 5. Fonction pour forcer la création d'un tenant owner (fallback)
CREATE OR REPLACE FUNCTION force_create_tenant_owner(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  invitation_record RECORD;
  tenant_admin_role_id UUID;
  employee_id_counter INTEGER;
  generated_employee_id TEXT;
  result JSON;
BEGIN
  -- Récupérer l'utilisateur
  SELECT * INTO user_record
  FROM auth.users
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Utilisateur non trouvé');
  END IF;
  
  -- Récupérer l'invitation
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE email = user_email
    AND invitation_type = 'tenant_owner'
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invitation non trouvée');
  END IF;
  
  -- Récupérer le rôle tenant_admin
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Rôle tenant_admin non trouvé');
  END IF;
  
  -- Créer le tenant
  INSERT INTO public.tenants (
    id, name, status, created_by, created_at, updated_at
  ) VALUES (
    invitation_record.tenant_id,
    COALESCE(invitation_record.metadata->>'company_name', 'Entreprise ' || invitation_record.full_name),
    'active',
    user_record.id,
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Créer le profil
  INSERT INTO public.profiles (
    user_id, tenant_id, full_name, email, role, created_at, updated_at
  ) VALUES (
    user_record.id,
    invitation_record.tenant_id,
    invitation_record.full_name,
    user_record.email,
    'tenant_admin',
    now(),
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();
  
  -- Assigner le rôle
  INSERT INTO public.user_roles (
    user_id, role_id, tenant_id, is_active, created_at, updated_at
  ) VALUES (
    user_record.id,
    tenant_admin_role_id,
    invitation_record.tenant_id,
    true,
    now(),
    now()
  ) ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
    is_active = true,
    updated_at = now();
  
  -- Générer employee_id unique (chercher le premier numéro disponible)
  WITH used_numbers AS (
    SELECT CAST(SUBSTRING(employee_id FROM 4) AS INTEGER) as num
    FROM public.employees 
    WHERE employee_id ~ '^EMP[0-9]{3}$'
  ),
  available_number AS (
    SELECT generate_series(1, 999) as num
    EXCEPT
    SELECT num FROM used_numbers
    ORDER BY num
    LIMIT 1
  )
  SELECT COALESCE((SELECT num FROM available_number), 1)
  INTO employee_id_counter;
  
  generated_employee_id := 'EMP' || LPAD(employee_id_counter::TEXT, 3, '0');
  
  -- Créer l'employé
  INSERT INTO public.employees (
    user_id, employee_id, full_name, email, job_title, hire_date, 
    contract_type, status, tenant_id, created_at, updated_at
  ) VALUES (
    user_record.id,
    generated_employee_id,
    invitation_record.full_name,
    user_record.email,
    'Directeur Général',
    CURRENT_DATE,
    'CDI',
    'active',
    invitation_record.tenant_id,
    now(),
    now()
  ) ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = now();
  
  -- Mettre à jour l'invitation
  UPDATE public.invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'completed_by', user_record.id,
      'completed_at', now(),
      'employee_id', generated_employee_id
    )
  WHERE id = invitation_record.id;
  
  -- Confirmer l'email si pas encore fait
  IF user_record.email_confirmed_at IS NULL THEN
    UPDATE auth.users 
    SET email_confirmed_at = now()
    WHERE id = user_record.id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Tenant owner créé avec succès',
    'user_id', user_record.id,
    'tenant_id', invitation_record.tenant_id,
    'employee_id', generated_employee_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'Erreur: ' || SQLERRM
  );
END;
$$;

-- 6. Instructions pour configurer le webhook dans Supabase Dashboard
SELECT 'INSTRUCTIONS WEBHOOK' as section, 
'1. Aller dans Database > Webhooks dans Supabase Dashboard' as step_1,
'2. Créer un nouveau webhook avec les paramètres suivants:' as step_2,
'   - Table: auth.users' as param_1,
'   - Events: UPDATE' as param_2,
'   - Conditions: email_confirmed_at IS NOT NULL' as param_3,
'   - URL: https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation' as param_4,
'3. Ou utiliser la fonction force_create_tenant_owner() pour les cas manuels' as step_3;
