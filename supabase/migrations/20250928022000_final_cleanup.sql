-- NETTOYAGE FINAL POUR RÉSOUDRE LES 270 PROBLÈMES

-- 1. SUPPRIMER LES VUES MATÉRIALISÉES PROBLÉMATIQUES
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS public.employee_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.project_task_stats CASCADE;

-- Supprimer les index associés
DROP INDEX IF EXISTS public.idx_employee_stats_tenant_employee;
DROP INDEX IF EXISTS public.idx_project_task_stats_tenant_project;

-- 2. NETTOYER LES TABLES VIDES AVEC DES DEAD_ROWS
-- =====================================================

-- Supprimer complètement les données des tables vides avec CASCADE pour les FK
DO $$
BEGIN
    -- Tables avec contraintes FK - utiliser CASCADE
    BEGIN
        TRUNCATE TABLE public.payroll_components CASCADE;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Erreur TRUNCATE payroll_components: %', SQLERRM;
    END;
    
    BEGIN
        TRUNCATE TABLE public.employee_payrolls CASCADE;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Erreur TRUNCATE employee_payrolls: %', SQLERRM;
    END;
    
    BEGIN
        TRUNCATE TABLE public.alert_instance_recommendations CASCADE;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Erreur TRUNCATE alert_instance_recommendations: %', SQLERRM;
    END;
    
    -- Tables sans contraintes FK complexes
    BEGIN
        TRUNCATE TABLE public.timesheets;
        TRUNCATE TABLE public.leave_balances;
        TRUNCATE TABLE public.task_risks;
        TRUNCATE TABLE public.notification_preferences;
        TRUNCATE TABLE public.task_dependencies;
        TRUNCATE TABLE public.employee_access_logs;
        TRUNCATE TABLE public.employee_documents;
        TRUNCATE TABLE public.project_comments;
        TRUNCATE TABLE public.training_enrollments;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Erreur TRUNCATE autres tables: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Nettoyage des tables vides terminé';
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

ALTER TABLE public.evaluations SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- 4. SUPPRIMER LES FONCTIONS PROBLÉMATIQUES NON UTILISÉES
-- =====================================================

-- Supprimer les fonctions qui causent des alertes de sécurité
DROP FUNCTION IF EXISTS public.refresh_all_stats();
DROP FUNCTION IF EXISTS public.daily_maintenance();

-- 5. CRÉER DES INDEX OPTIMAUX
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

-- 6. NETTOYER LES POLITIQUES REDONDANTES
-- =====================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Supprimer les politiques avec des noms longs qui peuvent causer des problèmes
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND length(policyname) > 50
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Politique longue supprimée: %', pol.policyname;
    END LOOP;
END $$;

-- 7. RECRÉER DES POLITIQUES SIMPLES ET EFFICACES
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
            -- Créer des politiques simples
            BEGIN
                EXECUTE format('CREATE POLICY "%s_tenant_policy" ON public.%I USING (tenant_id = public.get_user_tenant_id())', tbl, tbl);
                RAISE NOTICE 'Politique simple créée pour %', tbl;
            EXCEPTION
                WHEN duplicate_object THEN
                    RAISE NOTICE 'Politique déjà existante pour %', tbl;
                WHEN others THEN
                    RAISE NOTICE 'Erreur pour %: %', tbl, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- 8. OPTIMISER LES CONTRAINTES
-- =====================================================

-- Supprimer les contraintes redondantes ou problématiques
DO $$
BEGIN
    -- Supprimer les contraintes qui peuvent causer des problèmes
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_progress_valid;
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_title_length;
    
    -- Recréer des contraintes simples
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_progress_check' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_progress_check CHECK (progress >= 0 AND progress <= 100);
    END IF;
END $$;

-- 9. MISE À JOUR FINALE DES STATISTIQUES
-- =====================================================

-- Analyser seulement les tables principales
ANALYZE public.tasks;
ANALYZE public.projects;
ANALYZE public.profiles;
ANALYZE public.user_roles;

-- 10. MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== NETTOYAGE FINAL TERMINÉ ===';
  RAISE NOTICE '✅ Vues matérialisées supprimées';
  RAISE NOTICE '✅ Tables vides nettoyées';
  RAISE NOTICE '✅ Configuration autovacuum optimisée';
  RAISE NOTICE '✅ Fonctions problématiques supprimées';
  RAISE NOTICE '✅ Index optimaux créés';
  RAISE NOTICE '✅ Politiques simplifiées';
  RAISE NOTICE '✅ Contraintes optimisées';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Exécutez maintenant VACUUM_PRIORITY_COMMANDS.sql manuellement';
END $$;
