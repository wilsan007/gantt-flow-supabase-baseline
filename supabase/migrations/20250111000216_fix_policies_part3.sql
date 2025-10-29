-- Migration 216: Correction policies RH (Part 3/4)
-- Date: 2025-01-11
-- Description: Recréation policies avec get_current_tenant_id()
-- Tables: safety, skills, tardiness, timesheets, training

BEGIN;

-- SAFETY_DOCUMENTS (1 policy)
DROP POLICY IF EXISTS "safety_documents_read_all" ON public.safety_documents;

CREATE POLICY "safety_documents_read_all" ON public.safety_documents FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['safety_admin', 'tenant_admin'])
);

-- SAFETY_INCIDENTS (1 policy)
DROP POLICY IF EXISTS "safety_incidents_read_all" ON public.safety_incidents;

CREATE POLICY "safety_incidents_read_all" ON public.safety_incidents FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['safety_admin', 'tenant_admin'])
);

-- CORRECTIVE_ACTIONS (1 policy)
DROP POLICY IF EXISTS "corrective_actions_read_all" ON public.corrective_actions;

CREATE POLICY "corrective_actions_read_all" ON public.corrective_actions FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['safety_admin', 'tenant_admin'])
);

-- SKILL_ASSESSMENTS (2 policies)
DROP POLICY IF EXISTS "skills_read_all" ON public.skill_assessments;
DROP POLICY IF EXISTS "skills_manage_hr" ON public.skill_assessments;

CREATE POLICY "skills_read_all" ON public.skill_assessments FOR SELECT
USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "skills_manage_hr" ON public.skill_assessments FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

-- TARDINESS (2 policies)
DROP POLICY IF EXISTS "tardiness_read_managers" ON public.tardiness;
DROP POLICY IF EXISTS "tardiness_manage_hr" ON public.tardiness;

CREATE POLICY "tardiness_read_managers" ON public.tardiness FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['department_manager', 'hr_admin', 'tenant_admin'])
);

CREATE POLICY "tardiness_manage_hr" ON public.tardiness FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

-- TIMESHEETS (3 policies)
DROP POLICY IF EXISTS "timesheets_insert_self" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_update_self" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_manage_managers" ON public.timesheets;

CREATE POLICY "timesheets_insert_self" ON public.timesheets FOR INSERT
WITH CHECK (
  tenant_id = public.get_current_tenant_id()
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "timesheets_update_self" ON public.timesheets FOR UPDATE
USING (
  tenant_id = public.get_current_tenant_id()
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "timesheets_manage_managers" ON public.timesheets FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['department_manager', 'hr_admin', 'tenant_admin'])
);

-- TRAINING_PROGRAMS (2 policies)
DROP POLICY IF EXISTS "training_programs_read" ON public.training_programs;
DROP POLICY IF EXISTS "training_programs_manage" ON public.training_programs;

CREATE POLICY "training_programs_read" ON public.training_programs FOR SELECT
USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "training_programs_manage" ON public.training_programs FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'training_admin', 'tenant_admin'])
);

-- TRAINING_ENROLLMENTS (2 policies)
DROP POLICY IF EXISTS "training_enrollments_read" ON public.training_enrollments;
DROP POLICY IF EXISTS "training_enrollments_manage" ON public.training_enrollments;

CREATE POLICY "training_enrollments_read" ON public.training_enrollments FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND (
    public.user_has_role(ARRAY['hr_admin', 'training_admin', 'tenant_admin'])
    OR employee_id IN (
      SELECT id FROM employees 
      WHERE user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "training_enrollments_manage" ON public.training_enrollments FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'training_admin', 'tenant_admin'])
);

DO $$ BEGIN RAISE NOTICE '✅ Migration 216: 14 policies recréées (safety, skills, tardiness, timesheets, training)'; END $$;

COMMIT;
