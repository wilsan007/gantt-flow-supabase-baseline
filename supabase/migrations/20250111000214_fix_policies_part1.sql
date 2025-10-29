-- Migration 214: Correction policies RH (Part 1/4)
-- Date: 2025-01-11
-- Description: Recréation policies avec get_current_tenant_id()
-- Tables: absences, employees, employee_documents, evaluations, expense_reports

BEGIN;

-- ABSENCES (4 policies)
DROP POLICY IF EXISTS "absences_read_all" ON public.absences;
DROP POLICY IF EXISTS "absences_create_self" ON public.absences;
DROP POLICY IF EXISTS "absences_update_hr" ON public.absences;
DROP POLICY IF EXISTS "absences_delete_hr" ON public.absences;

CREATE POLICY "absences_read_all" ON public.absences FOR SELECT
USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "absences_create_self" ON public.absences FOR INSERT
WITH CHECK (
  tenant_id = public.get_current_tenant_id()
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE user_id = (SELECT auth.uid()) 
    AND tenant_id = public.get_current_tenant_id()
  )
);

CREATE POLICY "absences_update_hr" ON public.absences FOR UPDATE
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

CREATE POLICY "absences_delete_hr" ON public.absences FOR DELETE
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

-- EMPLOYEES (4 policies)
DROP POLICY IF EXISTS "employees_read_all" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_hr" ON public.employees;
DROP POLICY IF EXISTS "employees_update_hr" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_hr" ON public.employees;

CREATE POLICY "employees_read_all" ON public.employees FOR SELECT
USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "employees_insert_hr" ON public.employees FOR INSERT
WITH CHECK (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

CREATE POLICY "employees_update_hr" ON public.employees FOR UPDATE
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

CREATE POLICY "employees_delete_hr" ON public.employees FOR DELETE
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

-- EMPLOYEE_DOCUMENTS (2 policies)
DROP POLICY IF EXISTS "documents_read_hr" ON public.employee_documents;
DROP POLICY IF EXISTS "documents_manage_hr" ON public.employee_documents;

CREATE POLICY "documents_read_hr" ON public.employee_documents FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND (
    public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
    OR employee_id IN (
      SELECT id FROM employees 
      WHERE user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "documents_manage_hr" ON public.employee_documents FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

-- EVALUATIONS (2 policies)
DROP POLICY IF EXISTS "evaluations_read" ON public.evaluations;
DROP POLICY IF EXISTS "evaluations_manage" ON public.evaluations;

CREATE POLICY "evaluations_read" ON public.evaluations FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND (
    public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
    OR employee_id IN (
      SELECT id FROM employees 
      WHERE user_id = (SELECT auth.uid())
    )
    OR evaluator_id IN (
      SELECT id FROM employees 
      WHERE user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "evaluations_manage" ON public.evaluations FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

-- EXPENSE_REPORTS (2 policies)
DROP POLICY IF EXISTS "expenses_create_self" ON public.expense_reports;
DROP POLICY IF EXISTS "expenses_manage_finance" ON public.expense_reports;

CREATE POLICY "expenses_create_self" ON public.expense_reports FOR INSERT
WITH CHECK (
  tenant_id = public.get_current_tenant_id()
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "expenses_manage_finance" ON public.expense_reports FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['finance_admin', 'tenant_admin'])
);

DO $$ BEGIN RAISE NOTICE '✅ Migration 214: 14 policies recréées (absences, employees, documents, evaluations, expenses)'; END $$;

COMMIT;
