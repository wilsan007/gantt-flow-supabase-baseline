-- Fix all critical security vulnerabilities - corrected version

-- Drop ALL existing policies on sensitive tables first
DROP POLICY IF EXISTS "Users can see their memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "Users can only see their own memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "Tenant admins can see memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "Admins can see tenant memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "Only owners can manage memberships" ON public.tenant_members;

-- Drop existing employee policies
DROP POLICY IF EXISTS "Authenticated users can view tenant employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can create tenant employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can update tenant employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can delete tenant employees" ON public.employees;
DROP POLICY IF EXISTS "HR and admins can view tenant employees" ON public.employees;
DROP POLICY IF EXISTS "HR and admins can manage tenant employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;

-- Drop existing candidate policies
DROP POLICY IF EXISTS "Authenticated users can manage tenant candidates" ON public.candidates;
DROP POLICY IF EXISTS "HR and admins can manage candidates" ON public.candidates;

-- Drop existing payroll policies
DROP POLICY IF EXISTS "Authenticated users can manage tenant employee payrolls" ON public.employee_payrolls;
DROP POLICY IF EXISTS "Only HR admins can view payrolls" ON public.employee_payrolls;
DROP POLICY IF EXISTS "Only HR admins can manage payrolls" ON public.employee_payrolls;
DROP POLICY IF EXISTS "Users can view their own payroll" ON public.employee_payrolls;

-- Drop existing job-related policies
DROP POLICY IF EXISTS "Authenticated users can manage tenant job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Authenticated users can manage tenant job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Authenticated users can manage tenant job offers" ON public.job_offers;
DROP POLICY IF EXISTS "Authenticated users can manage tenant interviews" ON public.interviews;
DROP POLICY IF EXISTS "HR can manage job posts" ON public.job_posts;
DROP POLICY IF EXISTS "HR can manage job applications" ON public.job_applications;
DROP POLICY IF EXISTS "HR can manage job offers" ON public.job_offers;
DROP POLICY IF EXISTS "HR can manage interviews" ON public.interviews;

-- Create secure functions to avoid RLS recursion
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

-- Enable RLS on all sensitive tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- 1. SECURE TENANT_MEMBERS (Fix infinite recursion)
CREATE POLICY "Users can see own memberships"
ON public.tenant_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. SECURE EMPLOYEES TABLE (Employee Personal Information)
CREATE POLICY "HR admins can view employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  public.is_tenant_admin()
);

CREATE POLICY "HR admins can manage employees"
ON public.employees
FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  public.is_tenant_admin()
);

CREATE POLICY "Users view own employee record"
ON public.employees  
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  user_id = auth.uid()
);

-- 3. SECURE CANDIDATES TABLE (Job Applicant Data)
CREATE POLICY "HR admins manage candidates"
ON public.candidates
FOR ALL
TO authenticated  
USING (
  tenant_id = public.get_user_tenant_id() AND
  public.is_tenant_admin()
);

-- 4. SECURE EMPLOYEE PAYROLLS (Salary Information) - MOST RESTRICTIVE
CREATE POLICY "HR admins view payrolls"
ON public.employee_payrolls
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  public.is_tenant_admin()
);

CREATE POLICY "HR admins manage payrolls"
ON public.employee_payrolls
FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() AND
  public.is_tenant_admin()
);

-- 5. SECURE JOB-RELATED TABLES
CREATE POLICY "HR manage job posts"
ON public.job_posts FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

CREATE POLICY "HR manage job applications"  
ON public.job_applications FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

CREATE POLICY "HR manage job offers"
ON public.job_offers FOR ALL TO authenticated  
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

CREATE POLICY "HR manage interviews"
ON public.interviews FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin());

-- Add security comments
COMMENT ON TABLE public.employees IS 'SECURITY: Contains sensitive employee PII including personal info, salary, contact details. Access restricted to HR/admin roles only.';
COMMENT ON TABLE public.candidates IS 'SECURITY: Contains applicant personal data including resumes, contact info. Access restricted to HR/admin roles only.'; 
COMMENT ON TABLE public.employee_payrolls IS 'SECURITY: Contains highly sensitive salary and compensation data. Access restricted to HR/admin roles only with strongest controls.';
COMMENT ON TABLE public.tenant_members IS 'SECURITY: Contains tenant membership data. Access restricted to prevent user directory harvesting.';

-- Revoke public access from ALL sensitive tables
REVOKE ALL ON public.employees FROM PUBLIC, anon;
REVOKE ALL ON public.candidates FROM PUBLIC, anon;
REVOKE ALL ON public.employee_payrolls FROM PUBLIC, anon;
REVOKE ALL ON public.tenant_members FROM PUBLIC, anon;
REVOKE ALL ON public.job_posts FROM PUBLIC, anon;
REVOKE ALL ON public.job_applications FROM PUBLIC, anon;
REVOKE ALL ON public.job_offers FROM PUBLIC, anon;
REVOKE ALL ON public.interviews FROM PUBLIC, anon;

-- Grant minimal controlled access only to authenticated users  
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_payrolls TO authenticated;  
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_offers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;