-- Step 1: Clean up the old, faulty invitation processing functions.

-- Drop the main function for creating a tenant owner.
-- We specify the argument types to avoid ambiguity.
DROP FUNCTION IF EXISTS public.create_tenant_owner_from_invitation(TEXT, UUID, TEXT, TEXT);

-- Drop the helper function used to validate and get invitation info.
DROP FUNCTION IF EXISTS public.get_invitation_info(TEXT);

-- Drop the trigger on the tenants table that was used for slug generation.
DROP TRIGGER IF EXISTS tenant_slug_trigger ON public.tenants;

-- Drop the function that the trigger depended on.
DROP FUNCTION IF EXISTS public.generate_tenant_slug_trigger();

-- Drop the unique slug generation function.
DROP FUNCTION IF EXISTS public.generate_unique_tenant_slug(TEXT);

-- Also drop the cleanup function for expired invitations, as it will be handled differently.
DROP FUNCTION IF EXISTS public.cleanup_expired_invitations();

-- Log completion
SELECT 'Old invitation functions and triggers have been successfully dropped.';