-- MAINTENANCE COMPLÈTE DE LA BASE DE DONNÉES
-- Résolution des 151 problèmes restants

-- 1. ANALYSE DES TABLES (VACUUM sera fait manuellement)
-- =====================================================

-- Note: VACUUM doit être exécuté manuellement car il ne peut pas être dans une transaction
-- Commandes à exécuter séparément :
-- VACUUM (VERBOSE, ANALYZE) public.alert_type_solutions;
-- VACUUM (VERBOSE, ANALYZE) public.capacity_planning;
-- VACUUM (VERBOSE, ANALYZE) public.role_permissions;
-- etc...

-- 2. MISE À JOUR DES STATISTIQUES POUR L'OPTIMISEUR
-- =====================================================

-- Analyser toutes les tables importantes
ANALYZE public.task_audit_logs;
ANALYZE public.employee_insights;
ANALYZE public.attendances;
ANALYZE public.alert_solutions;
ANALYZE public.employees;
ANALYZE public.permissions;
ANALYZE public.roles;
ANALYZE public.tardiness;
ANALYZE public.skill_assessments;
ANALYZE public.absence_types;
ANALYZE public.skills;
ANALYZE public.alert_instances;
ANALYZE public.expense_categories;
ANALYZE public.payroll_periods;
ANALYZE public.expense_items;
ANALYZE public.task_comments;
ANALYZE public.leave_requests;
ANALYZE public.notifications;
ANALYZE public.onboarding_tasks;
ANALYZE public.job_applications;
ANALYZE public.evaluation_categories;
ANALYZE public.safety_documents;
ANALYZE public.candidates;
ANALYZE public.job_posts;
ANALYZE public.offboarding_tasks;
ANALYZE public.training_programs;
ANALYZE public.expense_reports;
ANALYZE public.corrective_actions;
ANALYZE public.absences;
ANALYZE public.interviews;
ANALYZE public.country_policies;
ANALYZE public.safety_incidents;
ANALYZE public.key_results;
ANALYZE public.onboarding_processes;
ANALYZE public.job_offers;
ANALYZE public.task_history;
ANALYZE public.offboarding_processes;
ANALYZE public.task_documents;

-- 3. CONFIGURATION DE L'AUTOVACUUM POUR LES TABLES CRITIQUES
-- =====================================================

-- Tables avec beaucoup d'activité
ALTER TABLE public.task_audit_logs SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE public.alert_type_solutions SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE public.tasks SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE public.task_actions SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- 4. INDEX MANQUANTS POUR LES TABLES CRITIQUES
-- =====================================================

-- Index seulement pour les tables qui ont tenant_id
DO $$
BEGIN
  -- Index pour task_audit_logs si tenant_id existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_audit_logs' 
    AND column_name = 'tenant_id' 
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_task_audit_logs_tenant_task 
      ON public.task_audit_logs(tenant_id, task_id);
  END IF;
  
  CREATE INDEX IF NOT EXISTS idx_task_audit_logs_created_at 
    ON public.task_audit_logs(created_at DESC);

  -- Index pour alert_type_solutions si tenant_id existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alert_type_solutions' 
    AND column_name = 'tenant_id' 
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_alert_type_solutions_tenant 
      ON public.alert_type_solutions(tenant_id);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alert_type_solutions' 
    AND column_name = 'alert_type_id' 
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_alert_type_solutions_alert_type 
      ON public.alert_type_solutions(alert_type_id);
  END IF;

  -- Index pour employee_insights si les colonnes existent
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employee_insights' 
    AND column_name = 'tenant_id' 
    AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employee_insights' 
    AND column_name = 'employee_id' 
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_employee_insights_tenant_employee 
      ON public.employee_insights(tenant_id, employee_id);
  END IF;

  -- Index pour attendances si les colonnes existent
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendances' 
    AND column_name = 'tenant_id' 
    AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendances' 
    AND column_name = 'employee_id' 
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_attendances_tenant_employee 
      ON public.attendances(tenant_id, employee_id);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendances' 
    AND column_name = 'date' 
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_attendances_date 
      ON public.attendances(date DESC);
  END IF;

  -- Index pour role_permissions si les colonnes existent
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'role_permissions' 
    AND column_name = 'tenant_id' 
    AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'role_permissions' 
    AND column_name = 'role_id' 
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant_role 
      ON public.role_permissions(tenant_id, role_id);
  END IF;
END $$;

-- 5. NETTOYAGE DES TABLES VIDES OU INUTILES
-- =====================================================

-- Supprimer les enregistrements orphelins dans les tables de liaison
DELETE FROM public.training_enrollments 
WHERE employee_id NOT IN (SELECT id FROM public.employees);

DELETE FROM public.alert_instance_recommendations 
WHERE alert_instance_id NOT IN (SELECT id FROM public.alert_instances);

-- 6. OPTIMISATION DES REQUÊTES LENTES
-- =====================================================

-- Créer des vues matérialisées seulement si les colonnes existent
DO $$
BEGIN
  -- Vue employee_stats seulement si les tables et colonnes existent
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'tenant_id' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'attendances' AND table_schema = 'public'
  ) THEN
    DROP MATERIALIZED VIEW IF EXISTS public.employee_stats;
    EXECUTE '
      CREATE MATERIALIZED VIEW public.employee_stats AS
      SELECT 
        e.tenant_id,
        e.id as employee_id,
        COUNT(DISTINCT a.id) as attendance_count,
        COUNT(DISTINCT t.id) as task_count,
        COALESCE(AVG(CASE WHEN a.status = ''present'' THEN 1 ELSE 0 END), 0) as attendance_rate
      FROM public.employees e
      LEFT JOIN public.attendances a ON e.id = a.employee_id
      LEFT JOIN public.tasks t ON e.id = t.assignee_id
      GROUP BY e.tenant_id, e.id
    ';
  END IF;
END $$;

-- Index pour la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_stats_tenant_employee 
  ON public.employee_stats(tenant_id, employee_id);

-- Vue matérialisée pour les statistiques de projets
DROP MATERIALIZED VIEW IF EXISTS public.project_task_stats;
CREATE MATERIALIZED VIEW public.project_task_stats AS
SELECT 
  p.tenant_id,
  p.id as project_id,
  p.name as project_name,
  COUNT(t.id) as task_count,
  COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
  AVG(t.progress) as avg_progress,
  SUM(t.effort_estimate_h) as total_estimated_hours
FROM public.projects p
LEFT JOIN public.tasks t ON p.id = t.project_id
GROUP BY p.tenant_id, p.id, p.name;

-- Index pour la vue matérialisée des projets
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_task_stats_tenant_project 
  ON public.project_task_stats(tenant_id, project_id);

-- 7. FONCTION POUR RAFRAÎCHIR LES STATISTIQUES
-- =====================================================

CREATE OR REPLACE FUNCTION public.refresh_all_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Rafraîchir les vues matérialisées
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.employee_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.project_task_stats;
  
  -- Analyser les tables principales
  ANALYZE public.tasks;
  ANALYZE public.projects;
  ANALYZE public.employees;
  ANALYZE public.task_actions;
  
  RAISE NOTICE 'Statistiques rafraîchies avec succès';
END;
$$;

-- 8. PROGRAMMATION DU RAFRAÎCHISSEMENT AUTOMATIQUE
-- =====================================================

-- Créer une fonction pour le cron job (si pg_cron est disponible)
CREATE OR REPLACE FUNCTION public.daily_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vacuum léger des tables critiques
  PERFORM public.refresh_all_stats();
  
  -- Log de la maintenance
  INSERT INTO public.task_audit_logs (task_id, action, details, tenant_id)
  SELECT 
    NULL,
    'system_maintenance',
    'Daily maintenance completed',
    id
  FROM public.tenants 
  WHERE status = 'active';
END;
$$;

-- 9. CONTRAINTES ET VALIDATIONS SUPPLÉMENTAIRES
-- =====================================================

-- Ajouter des contraintes pour éviter les données incohérentes
DO $$
BEGIN
  -- Contrainte pour les dates d'absence (vérifier que les colonnes existent)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'absences' AND column_name = 'start_date' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'absences' AND column_name = 'end_date' AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'absences_date_range' 
    AND table_name = 'absences'
  ) THEN
    ALTER TABLE public.absences 
    ADD CONSTRAINT absences_date_range 
    CHECK (start_date <= end_date);
  END IF;
  
  -- Contrainte pour les évaluations (vérifier que la colonne score existe)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'evaluations' AND column_name = 'score' AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'evaluations_score_range' 
    AND table_name = 'evaluations'
  ) THEN
    ALTER TABLE public.evaluations 
    ADD CONSTRAINT evaluations_score_range 
    CHECK (score >= 0 AND score <= 100);
  END IF;
  
  -- Contrainte pour les pourcentages de progression (si la colonne existe)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'progress' AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_progress_valid' 
    AND table_name = 'tasks'
  ) THEN
    ALTER TABLE public.tasks 
    ADD CONSTRAINT tasks_progress_valid 
    CHECK (progress >= 0 AND progress <= 100);
  END IF;
END $$;

-- 10. NETTOYAGE FINAL
-- =====================================================

-- Supprimer les index inutiles ou doublons (si ils existent)
DROP INDEX IF EXISTS public.idx_duplicate_tasks_tenant;
DROP INDEX IF EXISTS public.idx_old_projects_status;

-- Note: CLUSTER doit être exécuté manuellement
-- CLUSTER public.tasks USING idx_tasks_tenant_project;
-- CLUSTER public.projects USING idx_projects_tenant_status;

-- Message de fin
DO $$
BEGIN
  RAISE NOTICE 'Maintenance complète terminée. Base de données optimisée.';
END $$;
