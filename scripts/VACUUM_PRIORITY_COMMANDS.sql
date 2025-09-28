-- COMMANDES VACUUM PRIORITAIRES À EXÉCUTER UNE PAR UNE
-- Ces commandes doivent être exécutées dans le SQL Editor de Supabase

-- 1. VACUUM COMPLET DES TABLES AVEC LE PLUS DE DEAD_ROWS
VACUUM (VERBOSE, ANALYZE) public.user_roles;
VACUUM (VERBOSE, ANALYZE) public.tasks;
VACUUM (VERBOSE, ANALYZE) public.evaluations;
VACUUM (VERBOSE, ANALYZE) public.skill_assessments;
VACUUM (VERBOSE, ANALYZE) public.absence_types;
VACUUM (VERBOSE, ANALYZE) public.departments;
VACUUM (VERBOSE, ANALYZE) public.projects;

-- 2. VACUUM POUR LES TABLES AVEC DEAD_ROWS (éviter VACUUM FULL à cause des FK)
VACUUM (VERBOSE, ANALYZE) public.payroll_components;
VACUUM (VERBOSE, ANALYZE) public.alert_instance_recommendations;
VACUUM (VERBOSE, ANALYZE) public.employee_payrolls;
VACUUM (VERBOSE, ANALYZE) public.timesheets;
VACUUM (VERBOSE, ANALYZE) public.leave_balances;
VACUUM (VERBOSE, ANALYZE) public.task_risks;

-- 3. VACUUM DES AUTRES TABLES IMPORTANTES
VACUUM (VERBOSE, ANALYZE) public.alert_type_solutions;
VACUUM (VERBOSE, ANALYZE) public.capacity_planning;
VACUUM (VERBOSE, ANALYZE) public.role_permissions;
VACUUM (VERBOSE, ANALYZE) public.alert_types;
VACUUM (VERBOSE, ANALYZE) public.invitations;
VACUUM (VERBOSE, ANALYZE) public.hr_analytics;
VACUUM (VERBOSE, ANALYZE) public.task_actions;

-- 4. REINDEX DES TABLES CRITIQUES
REINDEX TABLE public.tasks;
REINDEX TABLE public.projects;
REINDEX TABLE public.user_roles;

-- 5. MISE À JOUR DES STATISTIQUES FINALES
ANALYZE public.tasks;
ANALYZE public.projects;
ANALYZE public.profiles;
ANALYZE public.task_actions;
ANALYZE public.user_roles;
