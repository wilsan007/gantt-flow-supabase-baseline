-- Fix critical security vulnerability: Ensure all tables require authentication
-- Drop existing policies and recreate with proper authentication requirements

-- Fix profiles table policies
DROP POLICY IF EXISTS "Users can view tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view tenant profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid() 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid() 
  AND tenant_id = get_user_tenant_id()
);

-- Fix tasks table policies
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

-- Fix task_audit_logs table policies
DROP POLICY IF EXISTS "Users can view tenant task audit logs" ON public.task_audit_logs;
DROP POLICY IF EXISTS "Users can create tenant task audit logs" ON public.task_audit_logs;

CREATE POLICY "Authenticated users can view tenant task audit logs" 
ON public.task_audit_logs 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can create tenant task audit logs" 
ON public.task_audit_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

-- Fix task_documents table policies
DROP POLICY IF EXISTS "Users can view tenant task documents" ON public.task_documents;
DROP POLICY IF EXISTS "Users can upload tenant task documents" ON public.task_documents;
DROP POLICY IF EXISTS "Users can delete tenant task documents" ON public.task_documents;

CREATE POLICY "Authenticated users can view tenant task documents" 
ON public.task_documents 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can upload tenant task documents" 
ON public.task_documents 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can delete tenant task documents" 
ON public.task_documents 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

-- Fix other vulnerable tables
DROP POLICY IF EXISTS "Users can view tenant task_actions" ON public.task_actions;
DROP POLICY IF EXISTS "Users can create tenant task_actions" ON public.task_actions;
DROP POLICY IF EXISTS "Users can update tenant task_actions" ON public.task_actions;
DROP POLICY IF EXISTS "Users can delete tenant task_actions" ON public.task_actions;

CREATE POLICY "Authenticated users can view tenant task_actions" 
ON public.task_actions 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can create tenant task_actions" 
ON public.task_actions 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can update tenant task_actions" 
ON public.task_actions 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can delete tenant task_actions" 
ON public.task_actions 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

-- Fix remaining tables
DROP POLICY IF EXISTS "Users can view tenant task_comments" ON public.task_comments;
DROP POLICY IF EXISTS "Users can create tenant task_comments" ON public.task_comments;
DROP POLICY IF EXISTS "Users can update tenant task_comments" ON public.task_comments;
DROP POLICY IF EXISTS "Users can delete tenant task_comments" ON public.task_comments;

CREATE POLICY "Authenticated users can view tenant task_comments" 
ON public.task_comments 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can create tenant task_comments" 
ON public.task_comments 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can update tenant task_comments" 
ON public.task_comments 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can delete tenant task_comments" 
ON public.task_comments 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

-- Fix remaining vulnerable tables
DROP POLICY IF EXISTS "Users can view tenant task_dependencies" ON public.task_dependencies;
DROP POLICY IF EXISTS "Users can create tenant task_dependencies" ON public.task_dependencies;
DROP POLICY IF EXISTS "Users can delete tenant task_dependencies" ON public.task_dependencies;

CREATE POLICY "Authenticated users can view tenant task_dependencies" 
ON public.task_dependencies 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can create tenant task_dependencies" 
ON public.task_dependencies 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can delete tenant task_dependencies" 
ON public.task_dependencies 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

DROP POLICY IF EXISTS "Users can view tenant task_risks" ON public.task_risks;
DROP POLICY IF EXISTS "Users can create tenant task_risks" ON public.task_risks;
DROP POLICY IF EXISTS "Users can update tenant task_risks" ON public.task_risks;
DROP POLICY IF EXISTS "Users can delete tenant task_risks" ON public.task_risks;

CREATE POLICY "Authenticated users can view tenant task_risks" 
ON public.task_risks 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can create tenant task_risks" 
ON public.task_risks 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can update tenant task_risks" 
ON public.task_risks 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "Authenticated users can delete tenant task_risks" 
ON public.task_risks 
FOR DELETE 
TO authenticated 
using (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id()
);