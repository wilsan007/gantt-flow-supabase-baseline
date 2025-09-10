-- Fix remaining tables without proper authentication
-- Only update tables that still have vulnerable policies

-- Fix departments table policies
DROP POLICY IF EXISTS "Users can view tenant departments" ON public.departments;
DROP POLICY IF EXISTS "Users can create tenant departments" ON public.departments;
DROP POLICY IF EXISTS "Users can update tenant departments" ON public.departments;

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

-- Fix projects table policies
DROP POLICY IF EXISTS "Users can view tenant projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create tenant projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update tenant projects" ON public.projects;

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

-- Fix tasks table policies (check if they exist and need updating)
DROP POLICY IF EXISTS "Users can view tenant tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tenant tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tenant tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tenant tasks" ON public.tasks;

CREATE POLICY "Authenticated users can view tenant tasks" 
ON public.tasks 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can create tenant tasks" 
ON public.tasks 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can update tenant tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can delete tenant tasks" 
ON public.tasks 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);