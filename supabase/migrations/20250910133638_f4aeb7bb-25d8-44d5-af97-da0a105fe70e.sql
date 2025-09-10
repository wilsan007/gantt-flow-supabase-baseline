-- Fix the final security issue with tenant tables
-- Add proper RLS policies for regular users to access only their tenant data

-- Add policy for regular users to view their own tenant
CREATE POLICY "Users can view their own tenant" 
ON public.tenants 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND id = get_user_tenant_id()
);

-- Add policy for regular users to view members of their tenant only
CREATE POLICY "Users can view their tenant members" 
ON public.tenant_members 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

-- Add policy for users to manage their own membership
CREATE POLICY "Users can update their own membership" 
ON public.tenant_members 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid() 
  AND tenant_id = get_user_tenant_id()
);