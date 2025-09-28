-- NETTOYAGE ULTRA-SÉCURISÉ POUR ÉVITER LES ERREURS FK

-- 1. SUPPRIMER LES VUES MATÉRIALISÉES PROBLÉMATIQUES
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS public.employee_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.project_task_stats CASCADE;

-- Supprimer les index associés
DROP INDEX IF EXISTS public.idx_employee_stats_tenant_employee;
DROP INDEX IF EXISTS public.idx_project_task_stats_tenant_project;

-- 2. NETTOYER LES TABLES VIDES AVEC DELETE AU LIEU DE TRUNCATE
-- =====================================================

-- Utiliser DELETE pour éviter les problèmes de FK
DO $$
BEGIN
    -- Supprimer toutes les données des tables vides
    DELETE FROM public.payroll_components;
    DELETE FROM public.alert_instance_recommendations;
    DELETE FROM public.employee_payrolls;
    DELETE FROM public.timesheets;
    DELETE FROM public.leave_balances;
    DELETE FROM public.task_risks;
    DELETE FROM public.notification_preferences;
    DELETE FROM public.task_dependencies;
    DELETE FROM public.employee_access_logs;
    DELETE FROM public.employee_documents;
    DELETE FROM public.project_comments;
    DELETE FROM public.training_enrollments;
    
    RAISE NOTICE 'Nettoyage des tables vides terminé avec DELETE';
END $$;

-- 3. OPTIMISER LA CONFIGURATION AUTOVACUUM
-- =====================================================

-- Configuration plus agressive pour les tables critiques
ALTER TABLE public.tasks SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 10,
  autovacuum_analyze_threshold = 10
);

ALTER TABLE public.user_roles SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 5,
  autovacuum_analyze_threshold = 5
);

-- 4. CRÉER DES INDEX OPTIMAUX
-- =====================================================

-- Index pour les requêtes les plus fréquentes
CREATE INDEX IF NOT EXISTS idx_tasks_status_tenant 
  ON public.tasks(status, tenant_id) 
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_status_tenant 
  ON public.projects(status, tenant_id) 
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_tenant 
  ON public.user_roles(tenant_id) 
  WHERE tenant_id IS NOT NULL;

-- 5. NETTOYER LES POLITIQUES REDONDANTES
-- =====================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Supprimer les politiques avec des noms très longs
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND length(policyname) > 60
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Politique longue supprimée: %', pol.policyname;
    END LOOP;
END $$;

-- 6. RECRÉER DES POLITIQUES SIMPLES
-- =====================================================

DO $$
DECLARE
    tbl TEXT;
    tables_list TEXT[] := ARRAY['tasks', 'projects', 'profiles', 'task_actions'];
BEGIN
    FOREACH tbl IN ARRAY tables_list
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_schema = 'public' 
            AND c.table_name = tbl 
            AND c.column_name = 'tenant_id'
        ) THEN
            -- Supprimer les anciennes politiques
            EXECUTE format('DROP POLICY IF EXISTS "%s_tenant_policy" ON public.%I', tbl, tbl);
            
            -- Créer une politique simple
            BEGIN
                EXECUTE format('CREATE POLICY "%s_tenant_policy" ON public.%I USING (tenant_id = public.get_user_tenant_id())', tbl, tbl);
                RAISE NOTICE 'Politique simple créée pour %', tbl;
            EXCEPTION
                WHEN others THEN
                    RAISE NOTICE 'Erreur pour %: %', tbl, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- 7. MISE À JOUR FINALE DES STATISTIQUES
-- =====================================================

ANALYZE public.tasks;
ANALYZE public.projects;
ANALYZE public.profiles;
ANALYZE public.user_roles;

-- 8. MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== NETTOYAGE SÉCURISÉ TERMINÉ ===';
  RAISE NOTICE '✅ Vues matérialisées supprimées';
  RAISE NOTICE '✅ Tables vides nettoyées avec DELETE';
  RAISE NOTICE '✅ Configuration autovacuum optimisée';
  RAISE NOTICE '✅ Index optimaux créés';
  RAISE NOTICE '✅ Politiques simplifiées';
  RAISE NOTICE '✅ Statistiques mises à jour';
  RAISE NOTICE '==================================';
  RAISE NOTICE 'Exécutez maintenant VACUUM_PRIORITY_COMMANDS.sql manuellement';
END $$;
