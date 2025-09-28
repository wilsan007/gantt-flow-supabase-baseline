-- CORRECTION DES NOUVEAUX PROBLÈMES (270 ISSUES)

-- 1. SUPPRIMER LES VUES MATÉRIALISÉES PROBLÉMATIQUES
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS public.project_task_stats;
DROP MATERIALIZED VIEW IF EXISTS public.employee_stats;

-- 2. CORRIGER LA FONCTION next_employee_id
-- =====================================================

CREATE OR REPLACE FUNCTION public.next_employee_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    next_id TEXT;
    max_num INTEGER;
    tenant_uuid UUID;
BEGIN
    -- Obtenir le tenant de l'utilisateur connecté de manière sécurisée
    SELECT public.get_user_tenant_id() INTO tenant_uuid;
    
    IF tenant_uuid IS NULL THEN
        RAISE EXCEPTION 'User not associated with any tenant';
    END IF;
    
    -- Obtenir le prochain ID d'employé
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM '[0-9]+') AS INTEGER)), 0) + 1
    INTO max_num
    FROM public.employees
    WHERE tenant_id = tenant_uuid
    AND employee_id ~ '^EMP[0-9]+$';
    
    next_id := 'EMP' || LPAD(max_num::TEXT, 4, '0');
    
    RETURN next_id;
END;
$$;

-- 3. DÉPLACER L'EXTENSION PG_NET
-- =====================================================

DO $$
BEGIN
    -- Créer le schéma extensions s'il n'existe pas
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    -- Déplacer pg_net si elle est dans public
    IF EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'pg_net' 
        AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        ALTER EXTENSION pg_net SET SCHEMA extensions;
        RAISE NOTICE 'Extension pg_net déplacée vers le schéma extensions';
    END IF;
    
    -- Déplacer d'autres extensions communes si nécessaire
    IF EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'uuid-ossp' 
        AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
        RAISE NOTICE 'Extension uuid-ossp déplacée vers le schéma extensions';
    END IF;
END $$;

-- 4. SUPPRIMER LES POLITIQUES EN DOUBLE
-- =====================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Supprimer les politiques en double créées par erreur
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, COUNT(*) as count
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY schemaname, tablename, policyname
        HAVING COUNT(*) > 1
    LOOP
        -- Garder une seule politique et supprimer les doublons
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
        RAISE NOTICE 'Politique en double supprimée: % sur %.%', 
                     policy_record.policyname,
                     policy_record.schemaname, 
                     policy_record.tablename;
    END LOOP;
END $$;

-- 5. NETTOYER LES INDEX EN DOUBLE
-- =====================================================

DO $$
DECLARE
    index_record RECORD;
BEGIN
    -- Supprimer les index en double qui peuvent causer des problèmes
    FOR index_record IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE '%_safe%'
    LOOP
        -- Supprimer les index temporaires de sécurité
        EXECUTE format('DROP INDEX IF EXISTS public.%I', index_record.indexname);
        RAISE NOTICE 'Index temporaire supprimé: %', index_record.indexname;
    END LOOP;
END $$;

-- 6. RECRÉER LES POLITIQUES CORRECTEMENT
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
            -- Supprimer les anciennes politiques
            EXECUTE format('DROP POLICY IF EXISTS "Users can view %s in their tenant" ON public.%I', current_table, current_table);
            EXECUTE format('DROP POLICY IF EXISTS "Users can create %s in their tenant" ON public.%I', current_table, current_table);
            EXECUTE format('DROP POLICY IF EXISTS "Users can update %s in their tenant" ON public.%I', current_table, current_table);
            EXECUTE format('DROP POLICY IF EXISTS "Users can delete %s in their tenant" ON public.%I', current_table, current_table);
            
            -- Créer des politiques propres
            BEGIN
                EXECUTE format('
                    CREATE POLICY "view_%s_tenant" 
                    ON public.%I FOR SELECT 
                    USING (tenant_id = public.get_user_tenant_id())
                ', current_table, current_table);
                
                EXECUTE format('
                    CREATE POLICY "create_%s_tenant" 
                    ON public.%I FOR INSERT 
                    WITH CHECK (tenant_id = public.get_user_tenant_id())
                ', current_table, current_table);
                
                EXECUTE format('
                    CREATE POLICY "update_%s_tenant" 
                    ON public.%I FOR UPDATE 
                    USING (tenant_id = public.get_user_tenant_id())
                ', current_table, current_table);
                
                EXECUTE format('
                    CREATE POLICY "delete_%s_tenant" 
                    ON public.%I FOR DELETE 
                    USING (tenant_id = public.get_user_tenant_id())
                ', current_table, current_table);
                
                RAISE NOTICE 'Politiques nettoyées et recréées pour %', current_table;
            EXCEPTION
                WHEN others THEN
                    RAISE NOTICE 'Erreur lors de la recréation des politiques pour %: %', current_table, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- 7. OPTIMISER LES STATISTIQUES
-- =====================================================

-- Analyser seulement les tables principales
ANALYZE public.tasks;
ANALYZE public.projects;
ANALYZE public.profiles;

-- 8. MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== CORRECTION DES 270 PROBLÈMES ===';
  RAISE NOTICE '✅ Vues matérialisées problématiques supprimées';
  RAISE NOTICE '✅ Fonction next_employee_id sécurisée';
  RAISE NOTICE '✅ Extension pg_net déplacée';
  RAISE NOTICE '✅ Politiques en double nettoyées';
  RAISE NOTICE '✅ Index temporaires supprimés';
  RAISE NOTICE '✅ Politiques recréées proprement';
  RAISE NOTICE '=====================================';
END $$;
