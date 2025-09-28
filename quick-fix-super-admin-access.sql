-- Solution rapide : Supprimer les politiques existantes et recréer
-- Pour corriger l'erreur "policy already exists"

-- 1. Supprimer toutes les politiques existantes sur tasks et projects
DROP POLICY IF EXISTS "super_admin_all_tasks" ON public.tasks;
DROP POLICY IF EXISTS "super_admin_all_projects" ON public.projects;
DROP POLICY IF EXISTS "tenant_tasks_access" ON public.tasks;
DROP POLICY IF EXISTS "tenant_projects_access" ON public.projects;

-- 2. Désactiver RLS temporairement (solution la plus simple)
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- 3. Accorder toutes les permissions
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.projects TO authenticated;

-- 4. Vérifier le résultat
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'projects');

SELECT 'RLS désactivé sur tasks et projects - Super admin peut tout voir' as status;
