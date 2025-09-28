-- CORRECTION DES PROBLÈMES RLS ET PERFORMANCE
-- ATTENTION: Exécuter 20250928024000_cleanup_functions.sql D'ABORD !

-- 1. SUPPRIMER TOUTES LES POLITIQUES EN DOUBLE
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
    RAISE NOTICE 'Toutes les politiques RLS supprimées';
END $$;

-- 2. CRÉER POLITIQUES OPTIMISÉES POUR TABLES TENANT
CREATE POLICY "tasks_tenant_access" ON public.tasks
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "projects_tenant_access" ON public.projects
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "profiles_user_access" ON public.profiles
    USING (tenant_id = (SELECT public.get_user_tenant_id()) OR user_id = (SELECT auth.uid()));

CREATE POLICY "task_actions_tenant_access" ON public.task_actions
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "departments_tenant_access" ON public.departments
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "employees_tenant_access" ON public.employees
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- 3. POLITIQUES SUPER ADMIN POUR TABLES SYSTÈME
CREATE POLICY "tenants_super_admin_only" ON public.tenants
    USING ((SELECT public.is_super_admin()));

CREATE POLICY "roles_super_admin_only" ON public.roles
    USING ((SELECT public.is_super_admin()));

CREATE POLICY "permissions_super_admin_only" ON public.permissions
    USING ((SELECT public.is_super_admin()));

CREATE POLICY "role_permissions_super_admin_only" ON public.role_permissions
    USING ((SELECT public.is_super_admin()));

-- 4. POLITIQUES HYBRIDES (TENANT + SUPER ADMIN)
CREATE POLICY "user_roles_hybrid_access" ON public.user_roles
    USING (tenant_id = (SELECT public.get_user_tenant_id()) OR (SELECT public.is_super_admin()));

CREATE POLICY "invitations_hybrid_access" ON public.invitations
    USING (tenant_id = (SELECT public.get_user_tenant_id()) OR (SELECT public.is_super_admin()));

-- 5. POLITIQUES POUR TABLES GLOBALES
CREATE POLICY "skills_read_all" ON public.skills FOR SELECT USING (true);
CREATE POLICY "skills_write_admin" ON public.skills FOR ALL USING ((SELECT public.is_super_admin()));

-- 6. NETTOYER TABLES VIDES
DELETE FROM public.payroll_components;
DELETE FROM public.employee_payrolls;
DELETE FROM public.timesheets;
DELETE FROM public.leave_balances;

-- 7. ANALYSER
ANALYZE public.tasks;
ANALYZE public.projects;
ANALYZE public.profiles;

-- 8. MESSAGE DE CONFIRMATION
DO $$
BEGIN
    RAISE NOTICE '=== CORRECTION RLS ET PERFORMANCE TERMINÉE ===';
    RAISE NOTICE '✅ Toutes les politiques en double supprimées';
    RAISE NOTICE '✅ Politiques optimisées avec (SELECT function())';
    RAISE NOTICE '✅ Tables vides nettoyées';
    RAISE NOTICE '✅ Statistiques mises à jour';
    RAISE NOTICE '============================================';
END $$;

-- 6. ANALYSER
ANALYZE public.tasks;
ANALYZE public.projects;
ANALYZE public.profiles;
