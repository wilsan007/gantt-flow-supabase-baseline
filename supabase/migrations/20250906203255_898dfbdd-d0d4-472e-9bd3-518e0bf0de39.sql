-- Créer la table tenants
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  domain text,
  settings jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  subscription_plan text DEFAULT 'basic',
  subscription_expires_at timestamp with time zone,
  max_users integer DEFAULT 50,
  max_projects integer DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Ajouter la colonne tenant_id à toutes les tables existantes
ALTER TABLE public.departments ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.task_actions ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.task_comments ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.task_dependencies ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.task_documents ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.task_risks ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Créer une table pour les membres du tenant
CREATE TABLE public.tenant_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  permissions jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamp with time zone DEFAULT now(),
  joined_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Créer des index pour les performances
CREATE INDEX idx_departments_tenant_id ON public.departments(tenant_id);
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_projects_tenant_id ON public.projects(tenant_id);
CREATE INDEX idx_tasks_tenant_id ON public.tasks(tenant_id);
CREATE INDEX idx_task_actions_tenant_id ON public.task_actions(tenant_id);
CREATE INDEX idx_task_comments_tenant_id ON public.task_comments(tenant_id);
CREATE INDEX idx_task_dependencies_tenant_id ON public.task_dependencies(tenant_id);
CREATE INDEX idx_task_documents_tenant_id ON public.task_documents(tenant_id);
CREATE INDEX idx_task_risks_tenant_id ON public.task_risks(tenant_id);
CREATE INDEX idx_tenant_members_tenant_user ON public.tenant_members(tenant_id, user_id);

-- Fonction pour obtenir le tenant_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id 
  FROM public.tenant_members 
  WHERE user_id = auth.uid() 
  AND status = 'active'
  LIMIT 1;
$$;

-- Mettre à jour les triggers pour inclure tenant_id
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_members_updated_at
  BEFORE UPDATE ON public.tenant_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Policies pour tenants (seuls les admins peuvent voir/gérer)
CREATE POLICY "Tenant admins can view tenant" 
  ON public.tenants 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members 
      WHERE tenant_id = id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'owner')
      AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can update tenant" 
  ON public.tenants 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members 
      WHERE tenant_id = id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'owner')
      AND status = 'active'
    )
  );

-- Policies pour tenant_members
CREATE POLICY "Users can view their tenant members" 
  ON public.tenant_members 
  FOR SELECT 
  USING (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Tenant admins can manage members" 
  ON public.tenant_members 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm 
      WHERE tm.tenant_id = tenant_members.tenant_id 
      AND tm.user_id = auth.uid() 
      AND tm.role IN ('admin', 'owner')
      AND tm.status = 'active'
    )
  );

-- Mettre à jour toutes les policies existantes pour inclure le tenant_id
-- Departments
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone can create departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone can update departments" ON public.departments;

CREATE POLICY "Users can view tenant departments" 
  ON public.departments 
  FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can create tenant departments" 
  ON public.departments 
  FOR INSERT 
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant departments" 
  ON public.departments 
  FOR UPDATE 
  USING (tenant_id = public.get_user_tenant_id());

-- Projects
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can create projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can update projects" ON public.projects;

CREATE POLICY "Users can view tenant projects" 
  ON public.projects 
  FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can create tenant projects" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant projects" 
  ON public.projects 
  FOR UPDATE 
  USING (tenant_id = public.get_user_tenant_id());

-- Tasks
DROP POLICY IF EXISTS "Anyone can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can delete tasks" ON public.tasks;

CREATE POLICY "Users can view tenant tasks" 
  ON public.tasks 
  FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can create tenant tasks" 
  ON public.tasks 
  FOR INSERT 
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant tasks" 
  ON public.tasks 
  FOR UPDATE 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete tenant tasks" 
  ON public.tasks 
  FOR DELETE 
  USING (tenant_id = public.get_user_tenant_id());

-- Task Actions
DROP POLICY IF EXISTS "Anyone can view task_actions" ON public.task_actions;
DROP POLICY IF EXISTS "Anyone can create task_actions" ON public.task_actions;
DROP POLICY IF EXISTS "Anyone can update task_actions" ON public.task_actions;
DROP POLICY IF EXISTS "Anyone can delete task_actions" ON public.task_actions;

CREATE POLICY "Users can view tenant task_actions" 
  ON public.task_actions 
  FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can create tenant task_actions" 
  ON public.task_actions 
  FOR INSERT 
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant task_actions" 
  ON public.task_actions 
  FOR UPDATE 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete tenant task_actions" 
  ON public.task_actions 
  FOR DELETE 
  USING (tenant_id = public.get_user_tenant_id());

-- Task Comments
DROP POLICY IF EXISTS "Anyone can view task_comments" ON public.task_comments;
DROP POLICY IF EXISTS "Anyone can create task_comments" ON public.task_comments;
DROP POLICY IF EXISTS "Anyone can update task_comments" ON public.task_comments;
DROP POLICY IF EXISTS "Anyone can delete task_comments" ON public.task_comments;

CREATE POLICY "Users can view tenant task_comments" 
  ON public.task_comments 
  FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can create tenant task_comments" 
  ON public.task_comments 
  FOR INSERT 
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant task_comments" 
  ON public.task_comments 
  FOR UPDATE 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete tenant task_comments" 
  ON public.task_comments 
  FOR DELETE 
  USING (tenant_id = public.get_user_tenant_id());

-- Task Dependencies
DROP POLICY IF EXISTS "Anyone can view task_dependencies" ON public.task_dependencies;
DROP POLICY IF EXISTS "Anyone can create task_dependencies" ON public.task_dependencies;
DROP POLICY IF EXISTS "Anyone can delete task_dependencies" ON public.task_dependencies;

CREATE POLICY "Users can view tenant task_dependencies" 
  ON public.task_dependencies 
  FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can create tenant task_dependencies" 
  ON public.task_dependencies 
  FOR INSERT 
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete tenant task_dependencies" 
  ON public.task_dependencies 
  FOR DELETE 
  USING (tenant_id = public.get_user_tenant_id());

-- Task Documents
DROP POLICY IF EXISTS "Anyone can view task documents" ON public.task_documents;
DROP POLICY IF EXISTS "Anyone can upload task documents" ON public.task_documents;
DROP POLICY IF EXISTS "Anyone can delete task documents" ON public.task_documents;

CREATE POLICY "Users can view tenant task documents" 
  ON public.task_documents 
  FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can upload tenant task documents" 
  ON public.task_documents 
  FOR INSERT 
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete tenant task documents" 
  ON public.task_documents 
  FOR DELETE 
  USING (tenant_id = public.get_user_tenant_id());

-- Task Risks
DROP POLICY IF EXISTS "Anyone can view task_risks" ON public.task_risks;
DROP POLICY IF EXISTS "Anyone can create task_risks" ON public.task_risks;
DROP POLICY IF EXISTS "Anyone can update task_risks" ON public.task_risks;
DROP POLICY IF EXISTS "Anyone can delete task_risks" ON public.task_risks;

CREATE POLICY "Users can view tenant task_risks" 
  ON public.task_risks 
  FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can create tenant task_risks" 
  ON public.task_risks 
  FOR INSERT 
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant task_risks" 
  ON public.task_risks 
  FOR UPDATE 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete tenant task_risks" 
  ON public.task_risks 
  FOR DELETE 
  USING (tenant_id = public.get_user_tenant_id());

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view tenant profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid() AND tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (user_id = auth.uid() AND tenant_id = public.get_user_tenant_id());

-- Ajouter des données par défaut pour le développement
INSERT INTO public.tenants (id, name, slug, description, status) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Tenant', 'default', 'Tenant par défaut pour le développement', 'active');

-- Mettre à jour les enregistrements existants avec le tenant par défaut
UPDATE public.departments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.profiles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.projects SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.tasks SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.task_actions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.task_comments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.task_dependencies SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.task_documents SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.task_risks SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;