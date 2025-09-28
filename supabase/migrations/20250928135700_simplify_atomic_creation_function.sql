-- Migration to simplify and fix the atomic tenant creation function.
-- This version removes the direct SELECT on auth.users, which can cause permission issues
-- even for SECURITY DEFINER functions in some environments. The responsibility for
-- matching the user's email to the invitation email is now fully handled by the
-- calling Edge Function, which is a secure and appropriate boundary for this check.

CREATE OR REPLACE FUNCTION public.create_tenant_and_owner_atomic(
  p_invitation_token TEXT,
  p_company_name TEXT,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_invitation RECORD;
  v_tenant_admin_role_id UUID;
  v_new_tenant_id UUID;
BEGIN
  -- Step 1: Validate the invitation token and retrieve its data.
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = p_invitation_token
    AND status = 'pending'
    AND invitation_type = 'tenant_owner'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVITATION_INVALID_OR_EXPIRED';
  END IF;

  -- The check against auth.users has been removed. The calling Edge Function
  -- is now responsible for ensuring the user_id matches the invitation email.

  -- Step 2: Retrieve the role ID for 'tenant_admin'.
  SELECT id INTO v_tenant_admin_role_id FROM public.roles WHERE name = 'tenant_admin';
  IF v_tenant_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'SETUP_ERROR: The role "tenant_admin" was not found.';
  END IF;

  -- Use the pre-generated tenant_id from the invitation.
  v_new_tenant_id := v_invitation.tenant_id;

  -- The following operations are all part of a single transaction.
  -- If any of them fail, the entire transaction is rolled back automatically.

  -- Step 3: Create the new tenant record.
  INSERT INTO public.tenants (id, name, status)
  VALUES (v_new_tenant_id, p_company_name, 'active');

  -- Step 4: Create the user's profile, linking them to the new tenant.
  INSERT INTO public.profiles (user_id, tenant_id, full_name, email)
  VALUES (p_user_id, v_new_tenant_id, v_invitation.full_name, v_invitation.email);

  -- Step 5: Assign the 'tenant_admin' role to the user for the new tenant.
  INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active)
  VALUES (p_user_id, v_tenant_admin_role_id, v_new_tenant_id, true);

  -- Step 6: Mark the invitation as 'accepted' to prevent reuse.
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invitation.id;

  -- Step 7: Return a success message with relevant IDs.
  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', v_new_tenant_id,
    'user_id', p_user_id
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_tenant_and_owner_atomic(TEXT, TEXT, UUID) IS 'Atomically creates a new tenant and its owner from a valid invitation. (Version 2: Removed direct SELECT on auth.users). To be called from a secure environment like an Edge Function.';