-- Corriger l'accès super admin aux données de tous les tenants
-- Le super admin a tenant_id = 00000000-0000-0000-0000-000000000000
-- mais les données sont dans d'autres tenants

-- 1. Désactiver temporairement RLS sur les tables principales pour super admin
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- 2. Ou créer des politiques spéciales pour super admin
-- Réactiver RLS avec politiques super admin
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Supprimer d'abord les politiques existantes
DROP POLICY IF EXISTS "super_admin_all_tasks" ON public.tasks;
DROP POLICY IF EXISTS "super_admin_all_projects" ON public.projects;
DROP POLICY IF EXISTS "tenant_tasks_access" ON public.tasks;
DROP POLICY IF EXISTS "tenant_projects_access" ON public.projects;

-- Politique super admin pour tasks
CREATE POLICY "super_admin_all_tasks" 
ON public.tasks FOR ALL 
USING (
  COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean,
    false
  ) = true
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'super_admin'
  )
);

-- Politique super admin pour projects
CREATE POLICY "super_admin_all_projects" 
ON public.projects FOR ALL 
USING (
  COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean,
    false
  ) = true
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'super_admin'
  )
);

-- 3. Politique normale pour les autres utilisateurs (basée sur tenant)
CREATE POLICY "tenant_tasks_access" 
ON public.tasks FOR ALL 
USING (
  tenant_id IN (
    SELECT ur.tenant_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.is_active = true
  )
);

CREATE POLICY "tenant_projects_access" 
ON public.projects FOR ALL 
USING (
  tenant_id IN (
    SELECT ur.tenant_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.is_active = true
  )
);

-- 4. Accorder les permissions
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.projects TO authenticated;

-- 5. Vérifier les politiques créées
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'projects')
ORDER BY tablename, policyname;

SELECT 'Politiques super admin créées pour accès à toutes les données' as status;
