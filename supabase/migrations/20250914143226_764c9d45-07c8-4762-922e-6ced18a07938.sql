-- Fix critical security vulnerability in tenants table RLS policies
-- The existing "Tenant admins can view tenant" policy has a bug that makes data accessible

-- Drop the buggy policy that has incorrect join condition
DROP POLICY IF EXISTS "Tenant admins can view tenant" ON public.tenants;

-- Drop the similar buggy update policy  
DROP POLICY IF EXISTS "Tenant admins can update tenant" ON public.tenants;

-- Recreate correct policies with proper join conditions
CREATE POLICY "Tenant admins can view tenant"
ON public.tenants
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM tenant_members
    WHERE tenant_members.tenant_id = tenants.id  -- Fixed: was tenant_members.id before
      AND tenant_members.user_id = auth.uid()
      AND tenant_members.role = ANY(ARRAY['admin'::text, 'owner'::text])
      AND tenant_members.status = 'active'::text
  )
);

CREATE POLICY "Tenant admins can update tenant"
ON public.tenants
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM tenant_members
    WHERE tenant_members.tenant_id = tenants.id  -- Fixed: was tenant_members.id before
      AND tenant_members.user_id = auth.uid()
      AND tenant_members.role = ANY(ARRAY['admin'::text, 'owner'::text])
      AND tenant_members.status = 'active'::text
  )
);

-- Ensure no other policies allow broader access
-- Add a restrictive policy for INSERT operations
CREATE POLICY "Only system can insert tenants"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (false);  -- Prevent all user inserts, only system/admin should create tenants

-- Add comprehensive policy documentation
COMMENT ON TABLE public.tenants IS 
'SECURITY: Contains sensitive business data. Access restricted to tenant members only via RLS policies.';

-- Verify RLS is enabled (should already be true)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;