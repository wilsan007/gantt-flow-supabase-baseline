-- Migration 217: Correction policies Projets + Recrutement (Part 4/4)
-- Date: 2025-01-11
-- Description: Recréation policies avec get_current_tenant_id()
-- Tables: tasks, projects, departments, capacity, jobs, candidates, analytics

BEGIN;

-- TASKS (1 policy)
DROP POLICY IF EXISTS "tenant_tasks_access" ON public.tasks;

CREATE POLICY "tenant_tasks_access" ON public.tasks FOR ALL
USING (tenant_id = public.get_current_tenant_id());

-- PROJECTS (1 policy)
DROP POLICY IF EXISTS "tenant_projects_access" ON public.projects;

CREATE POLICY "tenant_projects_access" ON public.projects FOR ALL
USING (tenant_id = public.get_current_tenant_id());

-- PROJECT_COMMENTS (1 policy)
DROP POLICY IF EXISTS "Users can create tenant project comments" ON public.project_comments;

CREATE POLICY "Users can create tenant project comments" ON public.project_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_comments.project_id
    AND p.tenant_id = public.get_current_tenant_id()
  )
  AND user_id = (SELECT auth.uid())
);

-- DEPARTMENTS (1 policy)
DROP POLICY IF EXISTS "departments_super_admin_access" ON public.departments;

CREATE POLICY "departments_super_admin_access" ON public.departments FOR ALL
USING (
  is_super_admin_optimized()
  OR (
    tenant_id = public.get_current_tenant_id()
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  )
);

-- TASK_AUDIT_LOGS (1 policy)
DROP POLICY IF EXISTS "task_audit_logs_read_all" ON public.task_audit_logs;

CREATE POLICY "task_audit_logs_read_all" ON public.task_audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_audit_logs.task_id
    AND t.tenant_id = public.get_current_tenant_id()
  )
);

-- CAPACITY_PLANNING (1 policy)
DROP POLICY IF EXISTS "capacity_planning_read_all" ON public.capacity_planning;

CREATE POLICY "capacity_planning_read_all" ON public.capacity_planning FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['project_manager', 'department_manager', 'tenant_admin'])
);

-- JOB_POSTS (2 policies)
DROP POLICY IF EXISTS "job_posts_read_all" ON public.job_posts;
DROP POLICY IF EXISTS "job_posts_manage_hr" ON public.job_posts;

CREATE POLICY "job_posts_read_all" ON public.job_posts FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'recruitment_admin', 'tenant_admin'])
);

CREATE POLICY "job_posts_manage_hr" ON public.job_posts FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'recruitment_admin', 'tenant_admin'])
);

-- CANDIDATES (2 policies)
DROP POLICY IF EXISTS "candidates_read_hr" ON public.candidates;
DROP POLICY IF EXISTS "candidates_manage_hr" ON public.candidates;

CREATE POLICY "candidates_read_hr" ON public.candidates FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'recruitment_admin', 'tenant_admin'])
);

CREATE POLICY "candidates_manage_hr" ON public.candidates FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'recruitment_admin', 'tenant_admin'])
);

-- INTERVIEWS (2 policies)
DROP POLICY IF EXISTS "interviews_read_hr" ON public.interviews;
DROP POLICY IF EXISTS "interviews_manage_hr" ON public.interviews;

CREATE POLICY "interviews_read_hr" ON public.interviews FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'recruitment_admin', 'tenant_admin'])
);

CREATE POLICY "interviews_manage_hr" ON public.interviews FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'recruitment_admin', 'tenant_admin'])
);

-- JOB_APPLICATIONS (2 policies)
DROP POLICY IF EXISTS "job_applications_read_hr" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_manage_hr" ON public.job_applications;

CREATE POLICY "job_applications_read_hr" ON public.job_applications FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'recruitment_admin', 'tenant_admin'])
);

CREATE POLICY "job_applications_manage_hr" ON public.job_applications FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'recruitment_admin', 'tenant_admin'])
);

-- JOB_OFFERS (2 policies)
DROP POLICY IF EXISTS "job_offers_read_hr" ON public.job_offers;
DROP POLICY IF EXISTS "job_offers_manage_hr" ON public.job_offers;

CREATE POLICY "job_offers_read_hr" ON public.job_offers FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'recruitment_admin', 'tenant_admin'])
);

CREATE POLICY "job_offers_manage_hr" ON public.job_offers FOR ALL
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'recruitment_admin', 'tenant_admin'])
);

-- HR_ANALYTICS (1 policy)
DROP POLICY IF EXISTS "hr_analytics_read_all" ON public.hr_analytics;

CREATE POLICY "hr_analytics_read_all" ON public.hr_analytics FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

-- EMPLOYEE_INSIGHTS (1 policy)
DROP POLICY IF EXISTS "employee_insights_read_all" ON public.employee_insights;

CREATE POLICY "employee_insights_read_all" ON public.employee_insights FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
);

-- EMPLOYEE_ACCESS_LOGS (1 policy)
DROP POLICY IF EXISTS "employee_access_logs_read_admin" ON public.employee_access_logs;

CREATE POLICY "employee_access_logs_read_admin" ON public.employee_access_logs FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  AND public.user_has_role(ARRAY['tenant_admin'])
);

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Migration 217: 18 policies recréées (tasks, projects, departments, jobs, candidates, analytics)'; 
  RAISE NOTICE '';
  RAISE NOTICE '🎉 TOUTES LES MIGRATIONS COMPLÉTÉES !';
  RAISE NOTICE '   • Migration 213: Fonction helper get_current_tenant_id()';
  RAISE NOTICE '   • Migration 214: 14 policies RH Part 1';
  RAISE NOTICE '   • Migration 215: 16 policies RH Part 2';
  RAISE NOTICE '   • Migration 216: 14 policies RH Part 3';
  RAISE NOTICE '   • Migration 217: 18 policies Projets + Recrutement';
  RAISE NOTICE '   • TOTAL: 62 policies recréées avec optimisation complète';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Résultat attendu: 0 avertissement "Auth RLS InitPlan"';
  RAISE NOTICE '';
END $$;

COMMIT;
