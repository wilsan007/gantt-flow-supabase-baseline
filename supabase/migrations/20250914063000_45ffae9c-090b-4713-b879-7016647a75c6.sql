-- Créer un système granulaire de permissions et rôles

-- Table des rôles disponibles
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  hierarchy_level INTEGER NOT NULL DEFAULT 0, -- 0 = plus haut niveau (admin), 100 = plus bas (stagiaire)
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  tenant_id UUID DEFAULT get_user_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des permissions granulaires
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  resource TEXT NOT NULL, -- 'tasks', 'projects', 'hr', 'employees', etc.
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'upload_document', 'mark_complete', etc.
  context TEXT, -- 'own', 'assigned', 'department', 'project', 'all'
  tenant_id UUID DEFAULT get_user_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table de liaison rôles-permissions
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  tenant_id UUID DEFAULT get_user_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Table d'assignation des rôles aux utilisateurs
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  context_type TEXT, -- 'global', 'project', 'department'
  context_id UUID, -- ID du projet ou département si contexte spécifique
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tenant_id UUID DEFAULT get_user_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id, context_type, context_id)
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour les rôles
CREATE POLICY "Users can view tenant roles" 
ON public.roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can manage tenant roles" 
ON public.roles 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id() AND public.has_permission('roles', 'manage'));

-- RLS Policies pour les permissions
CREATE POLICY "Users can view permissions" 
ON public.permissions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can manage permissions" 
ON public.permissions 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id() AND public.has_permission('permissions', 'manage'));

-- RLS Policies pour role_permissions
CREATE POLICY "Users can view role permissions" 
ON public.role_permissions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id() AND public.has_permission('roles', 'manage'));

-- RLS Policies pour user_roles
CREATE POLICY "Users can view user roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Admins and managers can assign roles" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id() AND 
       (public.has_permission('user_roles', 'manage') OR public.has_permission('user_roles', 'assign')));

-- Fonction pour vérifier les permissions
CREATE OR REPLACE FUNCTION public.has_permission(
  p_resource TEXT,
  p_action TEXT,
  p_context TEXT DEFAULT 'all',
  p_context_id UUID DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid UUID;
  has_perm BOOLEAN := false;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO user_uuid;
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has the specific permission through their roles
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
    AND p.resource = p_resource
    AND p.action = p_action
    AND (p.context = 'all' OR p.context = p_context OR p.context IS NULL)
    AND ur.tenant_id = get_user_tenant_id()
    AND (
      ur.context_type = 'global' OR 
      (ur.context_type = p_context AND ur.context_id = p_context_id) OR
      p_context_id IS NULL
    )
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$;

-- Fonction pour obtenir les rôles d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  role_name TEXT,
  role_display_name TEXT,
  context_type TEXT,
  context_id UUID,
  hierarchy_level INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(p_user_id, auth.uid());
  
  RETURN QUERY
  SELECT 
    r.name,
    r.display_name,
    ur.context_type,
    ur.context_id,
    r.hierarchy_level
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = target_user_id
  AND ur.is_active = true
  AND (ur.expires_at IS NULL OR ur.expires_at > now())
  AND ur.tenant_id = get_user_tenant_id()
  ORDER BY r.hierarchy_level ASC;
END;
$$;

-- Fonction pour vérifier si un utilisateur peut accéder à une ressource spécifique
CREATE OR REPLACE FUNCTION public.can_access_resource(
  p_resource_type TEXT,
  p_resource_id UUID,
  p_action TEXT DEFAULT 'read'
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid UUID;
  can_access BOOLEAN := false;
  resource_data RECORD;
BEGIN
  SELECT auth.uid() INTO user_uuid;
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;

  -- Check global permissions first
  IF public.has_permission(p_resource_type, p_action, 'all') THEN
    RETURN true;
  END IF;

  -- Check context-specific permissions based on resource type
  CASE p_resource_type
    WHEN 'tasks' THEN
      -- Get task details
      SELECT t.assignee_id, t.project_id, p.manager_id as project_manager_id
      INTO resource_data
      FROM public.tasks t
      LEFT JOIN public.projects p ON t.project_id = p.id
      WHERE t.id = p_resource_id;
      
      -- Check if user is assigned to the task
      IF resource_data.assignee_id = user_uuid AND public.has_permission('tasks', p_action, 'assigned') THEN
        RETURN true;
      END IF;
      
      -- Check if user is project manager
      IF resource_data.project_manager_id = user_uuid AND public.has_permission('tasks', p_action, 'project') THEN
        RETURN true;
      END IF;
      
      -- Check project-specific role
      IF public.has_permission('tasks', p_action, 'project', resource_data.project_id) THEN
        RETURN true;
      END IF;

    WHEN 'projects' THEN
      -- Get project details
      SELECT p.manager_id, p.department_id
      INTO resource_data
      FROM public.projects p
      WHERE p.id = p_resource_id;
      
      -- Check if user is project manager
      IF resource_data.manager_id = user_uuid AND public.has_permission('projects', p_action, 'own') THEN
        RETURN true;
      END IF;
      
      -- Check project-specific role
      IF public.has_permission('projects', p_action, 'project', p_resource_id) THEN
        RETURN true;
      END IF;

    WHEN 'employees' THEN
      -- Check if accessing own profile
      IF p_resource_id = user_uuid AND public.has_permission('employees', p_action, 'own') THEN
        RETURN true;
      END IF;
      
      -- Check department-specific access
      SELECT e.department_id INTO resource_data
      FROM public.employees e
      WHERE e.user_id = p_resource_id;
      
      IF public.has_permission('employees', p_action, 'department', resource_data.department_id) THEN
        RETURN true;
      END IF;
  END CASE;

  RETURN false;
END;
$$;

-- Insérer les rôles système de base
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role) VALUES
('tenant_admin', 'Administrateur Tenant', 'Administrateur avec tous les droits sur le tenant', 0, true),
('hr_manager', 'Responsable RH', 'Responsable des ressources humaines avec accès complet RH', 10, true),
('project_manager', 'Chef de Projet', 'Responsable de projets avec accès aux projets assignés', 20, true),
('team_lead', 'Chef d''Équipe', 'Responsable d''équipe avec accès limité à la gestion', 30, true),
('employee', 'Employé', 'Employé standard avec accès aux tâches assignées', 40, true),
('contractor', 'Contractuel', 'Travailleur externe avec accès limité', 50, true),
('intern', 'Stagiaire', 'Stagiaire avec accès en lecture seule', 60, true),
('viewer', 'Observateur', 'Accès en lecture seule limitée', 70, true);

-- Insérer les permissions de base
INSERT INTO public.permissions (name, display_name, description, resource, action, context) VALUES
-- Permissions administrateur
('admin_all', 'Administration Complète', 'Accès administrateur complet', 'all', 'manage', 'all'),

-- Permissions RH
('hr_employees_manage', 'Gestion Employés', 'Gérer tous les employés', 'employees', 'manage', 'all'),
('hr_leave_manage', 'Gestion Congés', 'Gérer les demandes de congé', 'leave_requests', 'manage', 'all'),
('hr_expense_manage', 'Gestion Notes de Frais', 'Gérer les notes de frais', 'expense_reports', 'manage', 'all'),
('hr_payroll_manage', 'Gestion Paie', 'Gérer la paie', 'payroll', 'manage', 'all'),

-- Permissions projets
('projects_create', 'Créer Projets', 'Créer de nouveaux projets', 'projects', 'create', 'all'),
('projects_manage_own', 'Gérer Ses Projets', 'Gérer ses propres projets', 'projects', 'manage', 'own'),
('projects_view_all', 'Voir Tous Projets', 'Voir tous les projets', 'projects', 'read', 'all'),
('projects_view_assigned', 'Voir Projets Assignés', 'Voir les projets assignés', 'projects', 'read', 'assigned'),

-- Permissions tâches
('tasks_create', 'Créer Tâches', 'Créer des tâches', 'tasks', 'create', 'project'),
('tasks_manage_project', 'Gérer Tâches Projet', 'Gérer toutes les tâches du projet', 'tasks', 'manage', 'project'),
('tasks_view_assigned', 'Voir Tâches Assignées', 'Voir ses tâches assignées', 'tasks', 'read', 'assigned'),
('tasks_update_assigned', 'Modifier Tâches Assignées', 'Modifier ses tâches assignées', 'tasks', 'update', 'assigned'),
('tasks_complete_assigned', 'Terminer Tâches Assignées', 'Marquer ses tâches comme terminées', 'tasks', 'complete', 'assigned'),

-- Permissions documents
('documents_upload', 'Télécharger Documents', 'Télécharger des documents', 'documents', 'upload', 'assigned'),
('documents_view', 'Voir Documents', 'Voir les documents', 'documents', 'read', 'assigned'),
('documents_manage', 'Gérer Documents', 'Gérer tous les documents', 'documents', 'manage', 'project'),

-- Permissions commentaires
('comments_add', 'Ajouter Commentaires', 'Ajouter des commentaires', 'comments', 'create', 'assigned'),
('comments_view', 'Voir Commentaires', 'Voir les commentaires', 'comments', 'read', 'assigned'),

-- Permissions utilisateurs
('users_view_own', 'Voir Son Profil', 'Voir son propre profil', 'users', 'read', 'own'),
('users_edit_own', 'Modifier Son Profil', 'Modifier son propre profil', 'users', 'update', 'own'),

-- Permissions rôles
('roles_manage', 'Gérer Rôles', 'Gérer les rôles et permissions', 'roles', 'manage', 'all'),
('user_roles_assign', 'Assigner Rôles', 'Assigner des rôles aux utilisateurs', 'user_roles', 'assign', 'all');

-- Assigner les permissions aux rôles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE 
  -- Tenant Admin : toutes les permissions
  (r.name = 'tenant_admin') OR
  
  -- HR Manager : toutes les permissions RH + lecture projets
  (r.name = 'hr_manager' AND (
    p.name LIKE 'hr_%' OR 
    p.name = 'projects_view_all' OR 
    p.name = 'users_view_own' OR 
    p.name = 'users_edit_own' OR
    p.name = 'user_roles_assign'
  )) OR
  
  -- Project Manager : gestion projets et tâches
  (r.name = 'project_manager' AND (
    p.name IN ('projects_create', 'projects_manage_own', 'projects_view_all', 'tasks_create', 'tasks_manage_project', 'documents_manage', 'comments_view', 'users_view_own', 'users_edit_own')
  )) OR
  
  -- Team Lead : gestion limitée
  (r.name = 'team_lead' AND (
    p.name IN ('projects_view_assigned', 'tasks_create', 'tasks_view_assigned', 'tasks_update_assigned', 'documents_view', 'comments_add', 'comments_view', 'users_view_own', 'users_edit_own')
  )) OR
  
  -- Employee : tâches assignées
  (r.name = 'employee' AND (
    p.name IN ('tasks_view_assigned', 'tasks_complete_assigned', 'documents_upload', 'documents_view', 'comments_add', 'comments_view', 'users_view_own', 'users_edit_own')
  )) OR
  
  -- Contractor : similaire à employee mais limité
  (r.name = 'contractor' AND (
    p.name IN ('tasks_view_assigned', 'tasks_complete_assigned', 'documents_upload', 'documents_view', 'comments_add', 'users_view_own')
  )) OR
  
  -- Intern : lecture seule
  (r.name = 'intern' AND (
    p.name IN ('projects_view_assigned', 'tasks_view_assigned', 'documents_view', 'comments_view', 'users_view_own')
  )) OR
  
  -- Viewer : lecture très limitée
  (r.name = 'viewer' AND (
    p.name IN ('projects_view_assigned', 'tasks_view_assigned', 'users_view_own')
  ));

-- Triggers pour updated_at
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();