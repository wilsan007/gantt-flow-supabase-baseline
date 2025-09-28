-- CORRECTION DES PROBLÈMES CRITIQUES DE SÉCURITÉ

-- 1. SUPPRIMER LES POLITIQUES DANGEREUSES
DROP POLICY IF EXISTS "super_admin_all_tasks" ON public.tasks;
DROP POLICY IF EXISTS "super_admin_all_projects" ON public.projects;
DROP POLICY IF EXISTS "super_admin_all_profiles" ON public.profiles;

-- 2. ACTIVER RLS SUR PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. POLITIQUES SÉCURISÉES POUR PROFILES
CREATE POLICY "Users can view profiles in their tenant" 
  ON public.profiles FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (user_id = auth.uid());

-- 4. INDEX CRITIQUES POUR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_project 
  ON public.tasks(tenant_id, project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_status 
  ON public.tasks(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_projects_tenant_status 
  ON public.projects(tenant_id, status);

-- 5. CONTRAINTES DE SÉCURITÉ
DO $$
BEGIN
    -- Ajouter contrainte progress si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_progress_range' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_progress_range 
        CHECK (progress >= 0 AND progress <= 100);
    END IF;
    
    -- Ajouter contrainte name length si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_name_length' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE public.projects 
        ADD CONSTRAINT projects_name_length 
        CHECK (char_length(name) BETWEEN 1 AND 100);
    END IF;
END $$;
