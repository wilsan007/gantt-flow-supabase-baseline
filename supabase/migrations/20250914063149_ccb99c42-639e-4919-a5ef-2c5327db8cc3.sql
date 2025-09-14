-- Créer un système granulaire de permissions et rôles - Partie 1: Tables et fonctions

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

-- Triggers pour updated_at
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();