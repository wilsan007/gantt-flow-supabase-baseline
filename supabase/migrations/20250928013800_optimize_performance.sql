-- OPTIMISATIONS DE PERFORMANCE

-- 1. INDEX COMPOSITES POUR REQUÊTES FRÉQUENTES
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status 
  ON public.tasks(assignee_id, status) WHERE assignee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_project_progress 
  ON public.tasks(project_id, progress) WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_task_actions_task_done 
  ON public.task_actions(task_id, is_done);

-- 2. INDEX POUR JOINTURES
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_user 
  ON public.profiles(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_projects_manager 
  ON public.projects(manager_id) WHERE manager_id IS NOT NULL;

-- 3. STATISTIQUES POUR L'OPTIMISEUR
ANALYZE public.tasks;
ANALYZE public.projects;
ANALYZE public.task_actions;
ANALYZE public.profiles;

-- 4. FONCTION OPTIMISÉE POUR RÉCUPÉRER LES PROJETS
CREATE OR REPLACE FUNCTION public.get_projects_with_stats(p_tenant_id UUID)
RETURNS TABLE(
  project_id UUID,
  project_name TEXT,
  status TEXT,
  progress INTEGER,
  task_count BIGINT,
  manager_name TEXT,
  department_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.name,
    p.status,
    COALESCE(p.progress, 0),
    COUNT(t.id),
    prof.full_name,
    d.name
  FROM public.projects p
  LEFT JOIN public.tasks t ON p.id = t.project_id
  LEFT JOIN public.profiles prof ON p.manager_id = prof.user_id AND prof.tenant_id = p.tenant_id
  LEFT JOIN public.departments d ON p.department_id = d.id
  WHERE p.tenant_id = p_tenant_id
  GROUP BY p.id, p.name, p.status, p.progress, prof.full_name, d.name
  ORDER BY p.created_at DESC;
$$;
