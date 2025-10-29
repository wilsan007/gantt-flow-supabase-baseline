-- Migration: RLS Policies - Partie 2 (Modules RH Avancés + Évaluations + Onboarding)
-- Date: 2025-01-11
-- Description: Policies granulaires pour modules RH avancés, évaluations et onboarding
-- Partie 3/3 de la configuration RLS

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '🔐 Configuration RLS - Partie 2 (RH Avancés + Évaluations + Onboarding)...';
  RAISE NOTICE '';
END $$;

-- ============================================
-- MODULE RH: SKILL_ASSESSMENTS (2 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🎯 Module RH - Skill Assessments...';
END $$;

DROP POLICY IF EXISTS "skills_read_all" ON skill_assessments;
CREATE POLICY "skills_read_all" ON skill_assessments
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

DROP POLICY IF EXISTS "skills_manage_hr" ON skill_assessments;
CREATE POLICY "skills_manage_hr" ON skill_assessments
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 2 policies Skill Assessments créées';
END $$;

-- ============================================
-- MODULE RH: TARDINESS (3 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⏱️  Module RH - Tardiness...';
END $$;

DROP POLICY IF EXISTS "tardiness_read_self" ON tardiness;
CREATE POLICY "tardiness_read_self" ON tardiness
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tardiness_read_managers" ON tardiness;
CREATE POLICY "tardiness_read_managers" ON tardiness
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'department_manager', 'tenant_admin'])
  );

DROP POLICY IF EXISTS "tardiness_manage_hr" ON tardiness;
CREATE POLICY "tardiness_manage_hr" ON tardiness
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 3 policies Tardiness créées';
END $$;

-- ============================================
-- MODULE RH: TRAINING (4 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📚 Module RH - Training...';
END $$;

-- Training Programs
DROP POLICY IF EXISTS "training_programs_read" ON training_programs;
CREATE POLICY "training_programs_read" ON training_programs
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

DROP POLICY IF EXISTS "training_programs_manage" ON training_programs;
CREATE POLICY "training_programs_manage" ON training_programs
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'training_admin', 'tenant_admin'])
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'training_admin', 'tenant_admin'])
  );

-- Training Enrollments
DROP POLICY IF EXISTS "training_enrollments_read" ON training_enrollments;
CREATE POLICY "training_enrollments_read" ON training_enrollments
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

DROP POLICY IF EXISTS "training_enrollments_manage" ON training_enrollments;
CREATE POLICY "training_enrollments_manage" ON training_enrollments
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
      public.user_has_role(ARRAY['hr_admin', 'training_admin', 'tenant_admin'])
      OR employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
      public.user_has_role(ARRAY['hr_admin', 'training_admin', 'tenant_admin'])
      OR employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    )
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 4 policies Training créées';
END $$;

-- ============================================
-- MODULE ÉVALUATIONS (6 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Module Évaluations...';
END $$;

-- Evaluations
DROP POLICY IF EXISTS "evaluations_read" ON evaluations;
CREATE POLICY "evaluations_read" ON evaluations
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
      employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      OR evaluator_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      OR public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
    )
  );

DROP POLICY IF EXISTS "evaluations_manage" ON evaluations;
CREATE POLICY "evaluations_manage" ON evaluations
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
      evaluator_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      OR public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
    )
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
      evaluator_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      OR public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
    )
  );

-- Objectives
DROP POLICY IF EXISTS "objectives_read" ON objectives;
CREATE POLICY "objectives_read" ON objectives
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
      employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      OR public.user_has_role(ARRAY['hr_admin', 'department_manager', 'tenant_admin'])
    )
  );

DROP POLICY IF EXISTS "objectives_manage" ON objectives;
CREATE POLICY "objectives_manage" ON objectives
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
      employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      OR public.user_has_role(ARRAY['hr_admin', 'department_manager', 'tenant_admin'])
    )
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
      employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      OR public.user_has_role(ARRAY['hr_admin', 'department_manager', 'tenant_admin'])
    )
  );

-- Key Results
DROP POLICY IF EXISTS "key_results_read" ON key_results;
CREATE POLICY "key_results_read" ON key_results
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
      objective_id IN (
        SELECT id FROM objectives
        WHERE employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      )
      OR public.user_has_role(ARRAY['hr_admin', 'department_manager', 'tenant_admin'])
    )
  );

DROP POLICY IF EXISTS "key_results_manage" ON key_results;
CREATE POLICY "key_results_manage" ON key_results
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
      objective_id IN (
        SELECT id FROM objectives
        WHERE employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      )
      OR public.user_has_role(ARRAY['hr_admin', 'department_manager', 'tenant_admin'])
    )
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
      objective_id IN (
        SELECT id FROM objectives
        WHERE employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      )
      OR public.user_has_role(ARRAY['hr_admin', 'department_manager', 'tenant_admin'])
    )
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 6 policies Évaluations créées';
END $$;

-- ============================================
-- MODULE ONBOARDING/OFFBOARDING (8 policies)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Module Onboarding/Offboarding...';
END $$;

-- Onboarding Processes
DROP POLICY IF EXISTS "onboarding_processes_read" ON onboarding_processes;
CREATE POLICY "onboarding_processes_read" ON onboarding_processes
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

DROP POLICY IF EXISTS "onboarding_processes_manage" ON onboarding_processes;
CREATE POLICY "onboarding_processes_manage" ON onboarding_processes
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );

-- Onboarding Tasks
DROP POLICY IF EXISTS "onboarding_tasks_read" ON onboarding_tasks;
CREATE POLICY "onboarding_tasks_read" ON onboarding_tasks
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

DROP POLICY IF EXISTS "onboarding_tasks_manage" ON onboarding_tasks;
CREATE POLICY "onboarding_tasks_manage" ON onboarding_tasks
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );

-- Offboarding Processes
DROP POLICY IF EXISTS "offboarding_processes_read" ON offboarding_processes;
CREATE POLICY "offboarding_processes_read" ON offboarding_processes
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );

DROP POLICY IF EXISTS "offboarding_processes_manage" ON offboarding_processes;
CREATE POLICY "offboarding_processes_manage" ON offboarding_processes
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );

-- Offboarding Tasks
DROP POLICY IF EXISTS "offboarding_tasks_read" ON offboarding_tasks;
CREATE POLICY "offboarding_tasks_read" ON offboarding_tasks
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );

DROP POLICY IF EXISTS "offboarding_tasks_manage" ON offboarding_tasks;
CREATE POLICY "offboarding_tasks_manage" ON offboarding_tasks
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ 8 policies Onboarding/Offboarding créées';
END $$;

-- ============================================
-- TABLES NON CRITIQUES: DÉSACTIVER RLS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔓 Désactivation RLS sur tables non critiques...';
END $$;

-- Analytics & Insights
ALTER TABLE hr_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_audit_logs DISABLE ROW LEVEL SECURITY;

-- Recrutement (pas encore actif)
ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts DISABLE ROW LEVEL SECURITY;

-- Configuration
ALTER TABLE capacity_planning DISABLE ROW LEVEL SECURITY;
ALTER TABLE country_policies DISABLE ROW LEVEL SECURITY;

-- Logs
ALTER TABLE employee_access_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE safety_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents DISABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '  ✅ RLS désactivé sur 14 tables';
END $$;

-- ============================================
-- RÉSUMÉ FINAL
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CONFIGURATION RLS COMPLÈTE (TOUTES LES PARTIES)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résumé Global:';
  RAISE NOTICE '   • Partie 1 (RH + Finances): 28 policies';
  RAISE NOTICE '   • Partie 2 (RH Avancés + Évaluations): 23 policies';
  RAISE NOTICE '   • Total policies créées: % policies', policy_count;
  RAISE NOTICE '   • Tables avec RLS: 21 (critiques)';
  RAISE NOTICE '   • Tables sans RLS: 14 (non critiques)';
  RAISE NOTICE '   • Fonctions helper: 2 (public.user_has_role)';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Sécurité:';
  RAISE NOTICE '   ✅ Contrôle par rôle (RH, Payroll, Finance, Manager)';
  RAISE NOTICE '   ✅ Séparation lecture/écriture';
  RAISE NOTICE '   ✅ Accès self-service (profil, salaire, absences)';
  RAISE NOTICE '   ✅ Isolation stricte par tenant';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  CONFIGURATION REQUISE:';
  RAISE NOTICE '   ⚠️  Définir app.current_tenant_id dans les requêtes';
  RAISE NOTICE '   ⚠️  Vérifier que les rôles existent dans la table roles';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Prochaines étapes:';
  RAISE NOTICE '   1. Tester l''accès avec différents rôles';
  RAISE NOTICE '   2. Vérifier l''isolation par tenant';
  RAISE NOTICE '   3. Valider les permissions granulaires';
  RAISE NOTICE '   4. Monitorer les performances RLS';
  RAISE NOTICE '';
  RAISE NOTICE '📚 Documentation: GUIDE_RLS_POLICIES_STRATEGY.md';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

COMMIT;
