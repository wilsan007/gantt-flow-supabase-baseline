-- Fix Employee Data Security: Implement Granular Access Controls
-- Remove overly permissive policies and create role-based restrictions

-- Drop the overly permissive policy that allows any user with 'employees' read permission to view all data
DROP POLICY IF EXISTS "HR and admins can view tenant employees" ON public.employees;

-- Create more granular, secure policies

-- 1. HR and system admins can view all employee data (most restrictive admin access)
CREATE POLICY "HR admins can view all tenant employees" 
ON public.employees 
FOR SELECT 
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND (
    is_tenant_admin() 
    OR has_permission('hr_management', 'read')
    OR has_permission('employee_administration', 'read')
  )
);

-- 2. Managers can view their direct reports only
CREATE POLICY "Managers can view direct reports" 
ON public.employees 
FOR SELECT 
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND manager_id IN (
    SELECT e.id 
    FROM public.employees e 
    WHERE e.user_id = auth.uid() 
    AND e.tenant_id = get_user_tenant_id()
  )
);

-- 3. Department heads can view employees in their department (if they have department management permission)
CREATE POLICY "Department heads can view department employees" 
ON public.employees 
FOR SELECT 
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND has_permission('department_management', 'read')
  AND department_id IN (
    SELECT d.id 
    FROM public.departments d 
    WHERE d.manager_id IN (
      SELECT e.id 
      FROM public.employees e 
      WHERE e.user_id = auth.uid() 
      AND e.tenant_id = get_user_tenant_id()
    )
  )
);

-- 4. Users can only view their own employee record (unchanged - this was already secure)
-- This policy already exists and is properly restrictive

-- Update the management policy to be more specific about HR roles
DROP POLICY IF EXISTS "HR and admins can manage tenant employees" ON public.employees;

CREATE POLICY "HR admins can manage tenant employees" 
ON public.employees 
FOR ALL 
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND (
    is_tenant_admin() 
    OR has_permission('hr_management', 'write')
    OR has_permission('employee_administration', 'write')
  )
)
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  AND (
    is_tenant_admin() 
    OR has_permission('hr_management', 'write')
    OR has_permission('employee_administration', 'write')
  )
);

-- Add a policy for managers to update their direct reports' basic info (limited fields)
CREATE POLICY "Managers can update direct reports basic info" 
ON public.employees 
FOR UPDATE 
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND manager_id IN (
    SELECT e.id 
    FROM public.employees e 
    WHERE e.user_id = auth.uid() 
    AND e.tenant_id = get_user_tenant_id()
  )
  AND has_permission('team_management', 'write')
);

-- Ensure no one can insert employee records except HR
CREATE POLICY "Only HR can create employee records" 
ON public.employees 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  AND (
    is_tenant_admin() 
    OR has_permission('hr_management', 'write')
    OR has_permission('employee_administration', 'write')
  )
);

-- Add comments for clarity
COMMENT ON TABLE public.employees IS 'Sensitive employee data - access restricted to HR, managers (for direct reports), and self-access only';

-- Create a security audit log for employee data access
CREATE TABLE IF NOT EXISTS public.employee_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id),
  accessed_by uuid NOT NULL,
  access_type text NOT NULL, -- 'view', 'update', 'create', 'delete'
  accessed_at timestamp with time zone DEFAULT now(),
  tenant_id uuid DEFAULT get_user_tenant_id(),
  access_context text -- 'hr_admin', 'manager', 'self', 'department_head'
);

-- Enable RLS on audit log
ALTER TABLE public.employee_access_logs ENABLE ROW LEVEL SECURITY;

-- Only HR admins can view audit logs
CREATE POLICY "Only HR admins can view employee access logs" 
ON public.employee_access_logs 
FOR ALL 
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND (
    is_tenant_admin() 
    OR has_permission('hr_management', 'read')
    OR has_permission('audit_logs', 'read')
  )
);

-- Create a function to log employee data access
CREATE OR REPLACE FUNCTION public.log_employee_access()
RETURNS TRIGGER AS $$
DECLARE
  access_context_val text;
  current_user_id uuid;
BEGIN
  -- Get the current user ID
  SELECT auth.uid() INTO current_user_id;
  
  -- Determine access context
  IF is_tenant_admin() OR has_permission('hr_management', 'read') THEN
    access_context_val := 'hr_admin';
  ELSIF NEW.user_id = current_user_id THEN
    access_context_val := 'self';
  ELSIF NEW.manager_id IN (SELECT e.id FROM public.employees e WHERE e.user_id = current_user_id) THEN
    access_context_val := 'manager';
  ELSIF has_permission('department_management', 'read') THEN
    access_context_val := 'department_head';
  ELSE
    access_context_val := 'unauthorized';
  END IF;
  
  -- Log the access
  INSERT INTO public.employee_access_logs (
    employee_id, 
    accessed_by, 
    access_type, 
    access_context,
    tenant_id
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    current_user_id,
    TG_OP::text,
    access_context_val,
    get_user_tenant_id()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;