-- This script refactors the tenant creation flow to be more robust and secure.
-- It centralizes the logic into a single transactional function.

-- Step 1: Create the new, secure function to handle tenant owner creation.
CREATE OR REPLACE FUNCTION public.create_tenant_owner_from_invitation(
    p_invitation_token TEXT,
    p_user_id UUID,
    p_company_name TEXT,
    p_company_slug TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  created_tenant_id UUID;
  generated_employee_id TEXT;
  result JSON;
BEGIN
  -- Validate the invitation token
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE token = p_invitation_token
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Token d''invitation invalide ou expiré');
  END IF;

  -- Get the tenant_admin role ID
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';

  IF tenant_admin_role_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Rôle tenant_admin non trouvé');
  END IF;

  -- Use the pre-generated tenant_id from the invitation
  created_tenant_id := invitation_data.tenant_id;

  -- Create the tenant
  INSERT INTO public.tenants (id, name, slug, status, created_at, updated_at)
  VALUES (created_tenant_id, p_company_name, p_company_slug, 'active', now(), now());

  -- Create the user profile
  INSERT INTO public.profiles (user_id, tenant_id, full_name, email, role, created_at, updated_at)
  VALUES (p_user_id, created_tenant_id, invitation_data.full_name, invitation_data.email, 'tenant_admin', now(), now());

  -- Assign the tenant_admin role
  INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, created_at)
  VALUES (p_user_id, tenant_admin_role_id, created_tenant_id, true, now());

  -- Generate a unique employee_id for this tenant
  generated_employee_id := generate_next_employee_id(created_tenant_id);

  -- Create the employee record
  INSERT INTO public.employees (user_id, employee_id, full_name, email, job_title, hire_date, contract_type, status, tenant_id, created_at, updated_at)
  VALUES (p_user_id, generated_employee_id, invitation_data.full_name, invitation_data.email, 'Directeur Général', CURRENT_DATE, 'CDI', 'active', created_tenant_id, now(), now());

  -- Mark the invitation as accepted
  UPDATE public.invitations
  SET
    status = 'accepted',
    accepted_at = now(),
    metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{completed_by}', to_jsonb(p_user_id))
  WHERE id = invitation_data.id;

  -- Return the result
  result := json_build_object(
    'success', true,
    'tenant_id', created_tenant_id,
    'tenant_name', p_company_name,
    'user_id', p_user_id,
    'employee_id', generated_employee_id
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error during tenant owner creation: %', SQLERRM;
    RETURN json_build_object('success', false, 'error', 'Erreur lors de la création du tenant: ' || SQLERRM);
END;
$$;

-- Step 2: Drop old, redundant functions (we will do this after refactoring the Edge Functions)
-- DROP FUNCTION IF EXISTS public.auto_create_tenant_owner();
-- DROP FUNCTION IF EXISTS public.signup_tenant_owner_v6();
-- etc.