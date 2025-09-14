-- Fix all critical security vulnerabilities at once

-- First, fix the infinite recursion issue by dropping problematic policies
DROP POLICY IF EXISTS "Admins can see tenant memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "Only owners can manage memberships" ON public.tenant_members;

-- Create secure functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_membership()
RETURNS SETOF public.tenant_members
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM tenant_members 
  WHERE user_id = auth.uid() 
    AND status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'owner')
  );
$$;

-- Recreate tenant_members policies without recursion
CREATE POLICY "Users can see their memberships"
ON public.tenant_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Tenant admins can see memberships"  
ON public.tenant_members
FOR SELECT
TO authenticated
USING (public.is_tenant_admin());

-- 1. SECURE EMPLOYEES TABLE (Employee Personal Information)
-- Employees table contains sensitive personal data
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view tenant employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can create tenant employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can update tenant employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can delete tenant employees" ON public.employees;

-- Create restrictive policies for employees
CREATE POLICY "HR and admins can view tenant employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  (public.is_tenant_admin() OR public.has_permission('employees', 'read'))
);

CREATE POLICY "HR and admins can manage tenant employees"
ON public.employees
FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  (public.is_tenant_admin() OR public.has_permission('employees', 'write'))
);

CREATE POLICY "Users can view their own employee record"
ON public.employees  
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  user_id = auth.uid()
);

-- 2. SECURE CANDIDATES TABLE (Job Applicant Data)  
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can manage tenant candidates" ON public.candidates;

-- Create restrictive policy for candidates
CREATE POLICY "HR and admins can manage candidates"
ON public.candidates
FOR ALL
TO authenticated  
USING (
  tenant_id = public.get_user_tenant_id() AND
  (public.is_tenant_admin() OR public.has_permission('candidates', 'write'))
);

-- 3. SECURE EMPLOYEE PAYROLLS (Salary Information)
ALTER TABLE public.employee_payrolls ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can manage tenant employee payrolls" ON public.employee_payrolls;

-- Create highly restrictive policies for salary data
CREATE POLICY "Only HR admins can view payrolls"
ON public.employee_payrolls
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  (public.is_tenant_admin() OR public.has_permission('payroll', 'read'))
);

CREATE POLICY "Only HR admins can manage payrolls"
ON public.employee_payrolls
FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  (public.is_tenant_admin() OR public.has_permission('payroll', 'write'))
);

-- Users can view only their own payroll
CREATE POLICY "Users can view their own payroll"
ON public.employee_payrolls
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE user_id = auth.uid() AND tenant_id = public.get_user_tenant_id()
  )
);

-- 4. SECURE PROFILES TABLE (User Profile Information)
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,  
  tenant_id uuid DEFAULT public.get_user_tenant_id(),
  full_name text,
  email text,
  role text DEFAULT 'user',
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive policies on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles; 
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create secure policies for profiles
CREATE POLICY "Users can view tenant profiles"
ON public.profiles
FOR SELECT  
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  (public.is_tenant_admin() OR public.has_permission('profiles', 'read'))
);

CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  user_id = auth.uid()
);

CREATE POLICY "Admins can manage tenant profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  public.is_tenant_admin()
);

-- 5. SECURE JOB-RELATED TABLES
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage tenant job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Authenticated users can manage tenant job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Authenticated users can manage tenant job offers" ON public.job_offers;
DROP POLICY IF EXISTS "Authenticated users can manage tenant interviews" ON public.interviews;

-- Create restrictive policies for job data
CREATE POLICY "HR can manage job posts"
ON public.job_posts FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

CREATE POLICY "HR can manage job applications"  
ON public.job_applications FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

CREATE POLICY "HR can manage job offers"
ON public.job_offers FOR ALL TO authenticated  
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

CREATE POLICY "HR can manage interviews"
ON public.interviews FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

-- Add security documentation
COMMENT ON TABLE public.employees IS 'CRITICAL: Contains sensitive employee PII. Access restricted to HR/admin only.';
COMMENT ON TABLE public.candidates IS 'CRITICAL: Contains applicant personal data. Access restricted to HR/admin only.'; 
COMMENT ON TABLE public.employee_payrolls IS 'CRITICAL: Contains salary information. Access highly restricted to HR/admin only.';
COMMENT ON TABLE public.profiles IS 'Contains user profile data. Access controlled by tenant membership.';
COMMENT ON TABLE public.tenant_members IS 'Contains membership data. Access restricted to prevent directory harvesting.';

-- Revoke public access from sensitive tables
REVOKE ALL ON public.employees FROM PUBLIC, anon;
REVOKE ALL ON public.candidates FROM PUBLIC, anon;
REVOKE ALL ON public.employee_payrolls FROM PUBLIC, anon;
REVOKE ALL ON public.profiles FROM PUBLIC, anon;
REVOKE ALL ON public.tenant_members FROM PUBLIC, anon;

-- Grant controlled access only to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_payrolls TO authenticated;  
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO authenticated;