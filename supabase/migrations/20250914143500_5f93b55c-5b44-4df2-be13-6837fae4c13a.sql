-- Fix critical security vulnerability: get_user_tenant_id() and tenant RLS policies

-- First, drop the overly permissive policy that uses the broken function
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;

-- Create a secure function that properly checks user tenant membership
CREATE OR REPLACE FUNCTION public.get_user_actual_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT tm.tenant_id 
  FROM tenant_members tm
  WHERE tm.user_id = auth.uid()
    AND tm.status = 'active'
  LIMIT 1;
$$;

-- Create a more secure policy that only allows access to tenants where user is an active member
CREATE POLICY "Users can view tenant they belong to"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tenant_members tm
    WHERE tm.tenant_id = tenants.id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
  )
);

-- Also fix the tenant_members table RLS to prevent exposure of membership data
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Create restrictive policy for tenant_members table
CREATE POLICY "Users can only see their own memberships"
ON public.tenant_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can see tenant memberships"
ON public.tenant_members  
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tenant_members tm2
    WHERE tm2.tenant_id = tenant_members.tenant_id
      AND tm2.user_id = auth.uid()
      AND tm2.role IN ('admin', 'owner')
      AND tm2.status = 'active'
  )
);

-- Prevent unauthorized modifications to tenant memberships
CREATE POLICY "Only owners can manage memberships"
ON public.tenant_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tenant_members tm2
    WHERE tm2.tenant_id = tenant_members.tenant_id
      AND tm2.user_id = auth.uid()
      AND tm2.role = 'owner'
      AND tm2.status = 'active'
  )
);

-- Update the old function to use the new secure one (for backward compatibility)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.get_user_actual_tenant_id();
$$;

-- Add security comments
COMMENT ON FUNCTION public.get_user_actual_tenant_id() IS 
'Securely returns the tenant ID for the current authenticated user based on active membership.';

COMMENT ON TABLE public.tenant_members IS 
'SECURITY: Contains sensitive membership data. Access restricted via RLS policies.';;