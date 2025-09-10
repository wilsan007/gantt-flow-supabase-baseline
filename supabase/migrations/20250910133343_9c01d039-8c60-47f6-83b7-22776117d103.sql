-- Fix only the specific vulnerable policies identified
-- Fix departments table vulnerable policies
DROP POLICY "Users can view tenant departments" ON public.departments;
DROP POLICY "Users can create tenant departments" ON public.departments;  
DROP POLICY "Users can update tenant departments" ON public.departments;

CREATE POLICY "Authenticated users can view tenant departments" 
ON public.departments 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can create tenant departments" 
ON public.departments 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can update tenant departments" 
ON public.departments 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

-- Fix projects table vulnerable policies  
DROP POLICY "Users can view tenant projects" ON public.projects;
DROP POLICY "Users can create tenant projects" ON public.projects;
DROP POLICY "Users can update tenant projects" ON public.projects;

CREATE POLICY "Authenticated users can view tenant projects" 
ON public.projects 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can create tenant projects" 
ON public.projects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can update tenant projects" 
ON public.projects 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

-- Fix tenant_members vulnerable policy
DROP POLICY "Users can view their tenant members" ON public.tenant_members;

CREATE POLICY "Authenticated users can view their tenant members" 
ON public.tenant_members 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);