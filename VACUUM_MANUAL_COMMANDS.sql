-- COMMANDES VACUUM À EXÉCUTER MANUELLEMENT
-- Ces commandes ne peuvent pas être dans une transaction et doivent être exécutées une par une

-- 1. VACUUM DES TABLES AVEC BEAUCOUP DE DEAD_ROWS
VACUUM (VERBOSE, ANALYZE) public.alert_type_solutions;
VACUUM (VERBOSE, ANALYZE) public.capacity_planning;
VACUUM (VERBOSE, ANALYZE) public.role_permissions;
VACUUM (VERBOSE, ANALYZE) public.alert_types;
VACUUM (VERBOSE, ANALYZE) public.invitations;
VACUUM (VERBOSE, ANALYZE) public.hr_analytics;
VACUUM (VERBOSE, ANALYZE) public.task_actions;
VACUUM (VERBOSE, ANALYZE) public.user_roles;
VACUUM (VERBOSE, ANALYZE) public.tenants;
VACUUM (VERBOSE, ANALYZE) public.tasks;
VACUUM (VERBOSE, ANALYZE) public.projects;
VACUUM (VERBOSE, ANALYZE) public.profiles;
VACUUM (VERBOSE, ANALYZE) public.departments;
VACUUM (VERBOSE, ANALYZE) public.evaluations;
VACUUM (VERBOSE, ANALYZE) public.positions;
VACUUM (VERBOSE, ANALYZE) public.objectives;
VACUUM (VERBOSE, ANALYZE) public.timesheets;
VACUUM (VERBOSE, ANALYZE) public.leave_balances;
VACUUM (VERBOSE, ANALYZE) public.payroll_components;
VACUUM (VERBOSE, ANALYZE) public.task_risks;

-- 2. VACUUM FULL POUR LES TABLES TRÈS FRAGMENTÉES (ATTENTION: BLOQUE LA TABLE)
-- VACUUM FULL public.alert_type_solutions;
-- VACUUM FULL public.payroll_components;

-- 3. RÉORGANISATION DES TABLES (OPTIONNEL)
-- CLUSTER public.tasks USING idx_tasks_tenant_project;
-- CLUSTER public.projects USING idx_projects_tenant_status;

-- 4. REINDEX POUR OPTIMISER LES INDEX
-- REINDEX TABLE public.tasks;
-- REINDEX TABLE public.projects;
-- REINDEX TABLE public.task_actions;
