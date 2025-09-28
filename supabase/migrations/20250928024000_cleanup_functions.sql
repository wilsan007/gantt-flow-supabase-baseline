-- NETTOYAGE COMPLET DES FONCTIONS EN DOUBLE

-- 1. IDENTIFIER ET SUPPRIMER TOUTES LES VERSIONS DE is_super_admin
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Lister toutes les fonctions is_super_admin
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'is_super_admin'
        AND n.nspname = 'public'
    LOOP
        -- Supprimer chaque version avec ses arguments spécifiques
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s)', 
                      func_record.schema_name, 
                      func_record.function_name, 
                      func_record.arguments);
        RAISE NOTICE 'Supprimé: %s.%s(%s)', 
                     func_record.schema_name, 
                     func_record.function_name, 
                     func_record.arguments;
    END LOOP;
END $$;

-- 2. IDENTIFIER ET SUPPRIMER TOUTES LES VERSIONS DE get_user_tenant_id
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Lister toutes les fonctions get_user_tenant_id
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_user_tenant_id'
        AND n.nspname = 'public'
    LOOP
        -- Supprimer chaque version avec ses arguments spécifiques
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s)', 
                      func_record.schema_name, 
                      func_record.function_name, 
                      func_record.arguments);
        RAISE NOTICE 'Supprimé: %s.%s(%s)', 
                     func_record.schema_name, 
                     func_record.function_name, 
                     func_record.arguments;
    END LOOP;
END $$;

-- 3. RECRÉER get_user_tenant_id PROPREMENT
CREATE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 4. RECRÉER is_super_admin PROPREMENT
CREATE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'super_admin'
    AND ur.is_active = true
  );
$$;

-- 5. TESTER LES FONCTIONS
DO $$
BEGIN
    -- Test get_user_tenant_id
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_tenant_id') THEN
        RAISE NOTICE '✅ get_user_tenant_id() créée avec succès';
    ELSE
        RAISE NOTICE '❌ Erreur création get_user_tenant_id()';
    END IF;
    
    -- Test is_super_admin
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin') THEN
        RAISE NOTICE '✅ is_super_admin() créée avec succès';
    ELSE
        RAISE NOTICE '❌ Erreur création is_super_admin()';
    END IF;
END $$;

-- 6. MESSAGE DE CONFIRMATION
DO $$
BEGIN
    RAISE NOTICE '=== NETTOYAGE DES FONCTIONS TERMINÉ ===';
    RAISE NOTICE '✅ Toutes les versions en double supprimées';
    RAISE NOTICE '✅ Fonctions uniques recréées';
    RAISE NOTICE '✅ search_path sécurisé défini';
    RAISE NOTICE '=====================================';
END $$;
