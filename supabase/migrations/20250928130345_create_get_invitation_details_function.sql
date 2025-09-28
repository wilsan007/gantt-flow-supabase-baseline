-- Migration to create a secure function for retrieving invitation details.
-- This function is publicly accessible but secure, as knowledge of the token is required.
-- It is used by the tenant owner signup page to pre-fill user information.

CREATE OR REPLACE FUNCTION public.get_invitation_details(
  p_invitation_token TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Select the invitation details only if the token is valid, pending, and not expired.
  SELECT email, full_name, status, expires_at
  INTO v_invitation
  FROM public.invitations
  WHERE token = p_invitation_token;

  -- Handle cases where the token does not exist.
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'INVITATION_NOT_FOUND');
  END IF;

  -- Handle cases where the invitation is not in a pending state.
  IF v_invitation.status <> 'pending' THEN
    RETURN jsonb_build_object('error', 'INVITATION_ALREADY_USED');
  END IF;

  -- Handle cases where the invitation has expired.
  IF v_invitation.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'INVITATION_EXPIRED');
  END IF;

  -- If all checks pass, return the non-sensitive details.
  RETURN jsonb_build_object(
    'success', true,
    'email', v_invitation.email,
    'full_name', v_invitation.full_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment for documentation.
COMMENT ON FUNCTION public.get_invitation_details(TEXT) IS 'Securely retrieves non-sensitive details (email, full_name) for a given valid and pending invitation token.';