-- Migration 215: Correction policies RH (Part 2/4)
-- Date: 2025-01-11
-- Description: Recréation policies avec get_current_tenant_id()
-- Tables: objectives, key_results, onboarding, offboarding, payroll

BEGIN;

-- OBJECTIVES (2 policies)
DROP POLICY IF EXISTS "objectives_read" ON public.objectives;
DROP POLICY IF EXISTS "objectives_manage" ON public.objectives;

CREATE POLICY "objectives_read" ON public.objectives FOR SELECT
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

CREATE POLICY "objectives_manage" ON public.objectives FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

-- KEY_RESULTS (2 policies)
DROP POLICY IF EXISTS "key_results_read" ON public.key_results;
DROP POLICY IF EXISTS "key_results_manage" ON public.key_results;

CREATE POLICY "key_results_read" ON public.key_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM objectives o
    WHERE o.id = key_results.objective_id
    AND o.tenant_id = public.get_current_tenant_id()
  )
);

CREATE POLICY "key_results_manage" ON public.key_results FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM objectives o
    WHERE o.id = key_results.objective_id
    AND o.tenant_id = public.get_current_tenant_id()
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  )
);

-- ONBOARDING_PROCESSES (2 policies)
DROP POLICY IF EXISTS "onboarding_processes_read" ON public.onboarding_processes;
DROP POLICY IF EXISTS "onboarding_processes_manage" ON public.onboarding_processes;

CREATE POLICY "onboarding_processes_read" ON public.onboarding_processes FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

CREATE POLICY "onboarding_processes_manage" ON public.onboarding_processes FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

-- ONBOARDING_TASKS (2 policies)
DROP POLICY IF EXISTS "onboarding_tasks_read" ON public.onboarding_tasks;
DROP POLICY IF EXISTS "onboarding_tasks_manage" ON public.onboarding_tasks;

CREATE POLICY "onboarding_tasks_read" ON public.onboarding_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM onboarding_processes op
    WHERE op.id = onboarding_tasks.process_id
    AND op.tenant_id = public.get_current_tenant_id()
  )
);

CREATE POLICY "onboarding_tasks_manage" ON public.onboarding_tasks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM onboarding_processes op
    WHERE op.id = onboarding_tasks.process_id
    AND op.tenant_id = public.get_current_tenant_id()
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  )
);

-- OFFBOARDING_PROCESSES (2 policies)
DROP POLICY IF EXISTS "offboarding_processes_read" ON public.offboarding_processes;
DROP POLICY IF EXISTS "offboarding_processes_manage" ON public.offboarding_processes;

CREATE POLICY "offboarding_processes_read" ON public.offboarding_processes FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

CREATE POLICY "offboarding_processes_manage" ON public.offboarding_processes FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

-- OFFBOARDING_TASKS (2 policies)
DROP POLICY IF EXISTS "offboarding_tasks_read" ON public.offboarding_tasks;
DROP POLICY IF EXISTS "offboarding_tasks_manage" ON public.offboarding_tasks;

CREATE POLICY "offboarding_tasks_read" ON public.offboarding_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM offboarding_processes op
    WHERE op.id = offboarding_tasks.process_id
    AND op.tenant_id = public.get_current_tenant_id()
  )
);

CREATE POLICY "offboarding_tasks_manage" ON public.offboarding_tasks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM offboarding_processes op
    WHERE op.id = offboarding_tasks.process_id
    AND op.tenant_id = public.get_current_tenant_id()
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  )
);

-- PAYROLL_PERIODS (2 policies)
DROP POLICY IF EXISTS "payroll_periods_read" ON public.payroll_periods;
DROP POLICY IF EXISTS "payroll_periods_manage" ON public.payroll_periods;

CREATE POLICY "payroll_periods_read" ON public.payroll_periods FOR SELECT
USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "payroll_periods_manage" ON public.payroll_periods FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['payroll_admin', 'tenant_admin'])
);

-- PAYROLL_COMPONENTS (1 policy)
DROP POLICY IF EXISTS "payroll_components_manage" ON public.payroll_components;

CREATE POLICY "payroll_components_manage" ON public.payroll_components FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM employee_payrolls ep
    WHERE ep.id = payroll_components.payroll_id
    AND ep.tenant_id = public.get_current_tenant_id()
    AND public.user_has_role(ARRAY['payroll_admin', 'tenant_admin'])
  )
);

-- EMPLOYEE_PAYROLLS (1 policy)
DROP POLICY IF EXISTS "payrolls_manage_payroll" ON public.employee_payrolls;

CREATE POLICY "payrolls_manage_payroll" ON public.employee_payrolls FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['payroll_admin', 'tenant_admin'])
);

DO $$ BEGIN RAISE NOTICE '✅ Migration 215: 16 policies recréées (objectives, key_results, onboarding, offboarding, payroll)'; END $$;

COMMIT;
