-- Migration to clean up old, faulty invitation processing functions.
-- This prepares the database for a new, more robust invitation system.

-- Dropping the main function for creating a tenant owner.
-- We specify the argument types to avoid ambiguity and ensure the correct function is dropped.
DROP FUNCTION IF EXISTS public.create_tenant_owner_from_invitation(TEXT, UUID, TEXT, TEXT);

-- Dropping the helper function used to validate and get invitation info from a token.
DROP FUNCTION IF EXISTS public.get_invitation_info(TEXT);

-- Dropping the trigger on the tenants table that was used for automatic slug generation.
-- This logic will be handled differently in the new system.
DROP TRIGGER IF EXISTS tenant_slug_trigger ON public.tenants;

-- Dropping the function that the trigger depended on.
DROP FUNCTION IF EXISTS public.generate_tenant_slug_trigger();

-- Dropping the unique slug generation function.
DROP FUNCTION IF EXISTS public.generate_unique_tenant_slug(TEXT);

-- Dropping the function for cleaning up expired invitations.
-- This task will be managed by a scheduled job or a different mechanism.
DROP FUNCTION IF EXISTS public.cleanup_expired_invitations();

-- No SELECT statement needed here as this is a migration file.
-- The Supabase CLI will handle the execution and logging.