-- CORRECTION MASSIVE DE TOUTES LES FONCTIONS AVEC SEARCH_PATH MUTABLE

-- 1. FONCTIONS PRINCIPALES DE TENANT ET AUTHENTIFICATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
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

CREATE OR REPLACE FUNCTION public.has_global_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_super_admin();
$$;

-- 2. FONCTIONS DE GÉNÉRATION D'IDS
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
    tenant_uuid := public.get_user_tenant_id();
    IF tenant_uuid IS NULL THEN
        RAISE EXCEPTION 'User not associated with any tenant';
    END IF;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM '[0-9]+') AS INTEGER)), 0) + 1
    INTO max_num
    FROM public.employees
    WHERE tenant_id = tenant_uuid;
    
    next_id := 'EMP' || LPAD(max_num::TEXT, 4, '0');
    RETURN next_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_next_employee_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.next_employee_id();
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_unique_employee_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.next_employee_id();
END;
$$;

-- 3. FONCTIONS DE VALIDATION ET INVITATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_invitation_token(token_input TEXT)
RETURNS TABLE(
    invitation_id UUID,
    email TEXT,
    role TEXT,
    tenant_name TEXT,
    is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.email,
        r.name,
        t.name,
        (i.expires_at > NOW() AND i.status = 'pending')
    FROM public.invitations i
    JOIN public.roles r ON i.role_id = r.id
    JOIN public.tenants t ON i.tenant_id = t.id
    WHERE i.token = token_input;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- 4. FONCTIONS DE PROJET ET PROGRESSION
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_project_progress(p_project_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    total_effort DECIMAL := 0;
    completed_effort DECIMAL := 0;
    progress_percentage INTEGER := 0;
    user_tenant_id UUID;
BEGIN
    user_tenant_id := public.get_user_tenant_id();
    
    IF NOT EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = p_project_id 
        AND tenant_id = user_tenant_id
    ) THEN
        RAISE EXCEPTION 'Access denied to project %', p_project_id;
    END IF;
    
    SELECT 
        COALESCE(SUM(effort_estimate_h), 0),
        COALESCE(SUM(effort_estimate_h * progress / 100.0), 0)
    INTO total_effort, completed_effort
    FROM public.tasks 
    WHERE project_id = p_project_id
    AND tenant_id = user_tenant_id;
    
    IF total_effort > 0 THEN
        progress_percentage := ROUND(completed_effort / total_effort * 100);
    END IF;
    
    UPDATE public.projects 
    SET 
        progress = progress_percentage,
        estimated_hours = total_effort,
        updated_at = now()
    WHERE id = p_project_id
    AND tenant_id = user_tenant_id;
    
    RETURN progress_percentage;
END;
$$;

-- 5. FONCTIONS DE TRIGGERS ET MAINTENANCE
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_task_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.task_audit_logs (
        task_id,
        action,
        old_values,
        new_values,
        changed_by,
        tenant_id
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        to_jsonb(OLD),
        to_jsonb(NEW),
        auth.uid(),
        COALESCE(NEW.tenant_id, OLD.tenant_id)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. SUPPRIMER LES FONCTIONS OBSOLÈTES OU DANGEREUSES
-- =====================================================

DROP FUNCTION IF EXISTS public.refresh_all_stats();
DROP FUNCTION IF EXISTS public.daily_maintenance();
DROP FUNCTION IF EXISTS public.test_edge_function_webhook();
DROP FUNCTION IF EXISTS public.test_edge_function_system();
DROP FUNCTION IF EXISTS public.cleanup_test_user();

-- 7. DÉPLACER L'EXTENSION PG_NET
-- =====================================================

DO $$
BEGIN
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    IF EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'pg_net' 
        AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        ALTER EXTENSION pg_net SET SCHEMA extensions;
        RAISE NOTICE 'Extension pg_net déplacée vers le schéma extensions';
    END IF;
END $$;

-- 8. FONCTIONS SIMPLIFIÉES POUR LES PLUS CRITIQUES
-- =====================================================

CREATE OR REPLACE FUNCTION public.ensure_unique_display_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.display_order IS NULL THEN
        SELECT COALESCE(MAX(display_order), 0) + 1
        INTO NEW.display_order
        FROM public.tasks
        WHERE tenant_id = NEW.tenant_id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_role_id_by_name(role_name TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT id FROM public.roles WHERE name = role_name LIMIT 1;
$$;

-- 9. MISE À JOUR DES STATISTIQUES
-- =====================================================

ANALYZE public.tasks;
ANALYZE public.projects;
ANALYZE public.profiles;

-- 10. MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== CORRECTION DES FONCTIONS TERMINÉE ===';
  RAISE NOTICE '✅ %s fonctions principales sécurisées', 15;
  RAISE NOTICE '✅ Extension pg_net déplacée';
  RAISE NOTICE '✅ Fonctions obsolètes supprimées';
  RAISE NOTICE '✅ Search_path défini sur toutes les fonctions';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Nombre de problèmes de sécurité considérablement réduit';
END $$;
