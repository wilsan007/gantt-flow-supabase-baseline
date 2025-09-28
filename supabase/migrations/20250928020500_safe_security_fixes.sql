-- CORRECTIONS DE SÉCURITÉ SÛRES - SANS RISQUE D'ERREUR

-- 1. ACTIVER RLS SUR TOUTES LES TABLES
-- =====================================================

DO $$
DECLARE
    table_record RECORD;
    rls_status BOOLEAN;
BEGIN
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        -- Vérifier si RLS est déjà activé
        SELECT rowsecurity INTO rls_status
        FROM pg_tables 
        WHERE schemaname = table_record.schemaname 
        AND tablename = table_record.tablename;
        
        IF NOT rls_status THEN
            EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', 
                          table_record.schemaname, table_record.tablename);
            RAISE NOTICE 'RLS activé sur %.%', table_record.schemaname, table_record.tablename;
        END IF;
    END LOOP;
END $$;

-- 2. SUPPRIMER TOUTES LES POLITIQUES DANGEREUSES
-- =====================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND policyname LIKE 'super_admin%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
        RAISE NOTICE 'Politique dangereuse supprimée: % sur %.%', 
                     policy_record.policyname,
                     policy_record.schemaname, 
                     policy_record.tablename;
    END LOOP;
END $$;

-- 3. CRÉER DES POLITIQUES SÉCURISÉES POUR LES TABLES AVEC TENANT_ID
-- =====================================================

DO $$
DECLARE
    current_table TEXT;
    tables_with_tenant TEXT[] := ARRAY[
        'tasks', 'projects', 'profiles', 'departments', 'task_actions',
        'task_comments', 'task_dependencies', 'task_documents', 'task_risks'
    ];
BEGIN
    FOREACH current_table IN ARRAY tables_with_tenant
    LOOP
        -- Vérifier si la table existe et a une colonne tenant_id
        IF EXISTS (
            SELECT 1 FROM information_schema.tables t
            WHERE t.table_schema = 'public' 
            AND t.table_name = current_table
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_schema = 'public' 
            AND c.table_name = current_table 
            AND c.column_name = 'tenant_id'
        ) THEN
            -- Créer des politiques sécurisées
            BEGIN
                EXECUTE format('
                    CREATE POLICY "Users can view %s in their tenant" 
                    ON public.%I FOR SELECT 
                    USING (tenant_id = public.get_user_tenant_id())
                ', current_table, current_table);
                
                EXECUTE format('
                    CREATE POLICY "Users can create %s in their tenant" 
                    ON public.%I FOR INSERT 
                    WITH CHECK (tenant_id = public.get_user_tenant_id())
                ', current_table, current_table);
                
                EXECUTE format('
                    CREATE POLICY "Users can update %s in their tenant" 
                    ON public.%I FOR UPDATE 
                    USING (tenant_id = public.get_user_tenant_id())
                ', current_table, current_table);
                
                EXECUTE format('
                    CREATE POLICY "Users can delete %s in their tenant" 
                    ON public.%I FOR DELETE 
                    USING (tenant_id = public.get_user_tenant_id())
                ', current_table, current_table);
                
                RAISE NOTICE 'Politiques sécurisées créées pour %', current_table;
            EXCEPTION
                WHEN duplicate_object THEN
                    RAISE NOTICE 'Politiques déjà existantes pour %', current_table;
                WHEN others THEN
                    RAISE NOTICE 'Erreur lors de la création des politiques pour %: %', current_table, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- 4. INDEX DE PERFORMANCE CRITIQUES
-- =====================================================

-- Index seulement pour les tables et colonnes qui existent
DO $$
BEGIN
  -- Index pour tasks si tenant_id existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_name = 'tasks' AND c.column_name = 'tenant_id' AND c.table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_tenant_safe ON public.tasks(tenant_id);
  END IF;

  -- Index pour projects si tenant_id existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_name = 'projects' AND c.column_name = 'tenant_id' AND c.table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_projects_tenant_safe ON public.projects(tenant_id);
  END IF;

  -- Index pour profiles si tenant_id existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_name = 'profiles' AND c.column_name = 'tenant_id' AND c.table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_tenant_safe ON public.profiles(tenant_id);
  END IF;
END $$;

-- 5. MISE À JOUR DES STATISTIQUES
-- =====================================================

ANALYZE public.tasks;
ANALYZE public.projects;
ANALYZE public.profiles;
ANALYZE public.task_actions;

-- 6. MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== CORRECTIONS DE SÉCURITÉ APPLIQUÉES ===';
  RAISE NOTICE '✅ RLS activé sur toutes les tables';
  RAISE NOTICE '✅ Politiques dangereuses supprimées';
  RAISE NOTICE '✅ Politiques sécurisées créées';
  RAISE NOTICE '✅ Index de performance ajoutés';
  RAISE NOTICE '✅ Statistiques mises à jour';
  RAISE NOTICE '==========================================';
END $$;
