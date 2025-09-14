-- Système de permissions - Partie 2: Données et politiques RLS

-- Enable RLS sur toutes les tables de permissions
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour les rôles (politiques simples pour commencer)
CREATE POLICY "Users can view tenant roles" 
ON public.roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can manage roles" 
ON public.roles 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- RLS Policies pour les permissions
CREATE POLICY "Users can view permissions" 
ON public.permissions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can manage permissions" 
ON public.permissions 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- RLS Policies pour role_permissions
CREATE POLICY "Users can view role permissions" 
ON public.role_permissions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- RLS Policies pour user_roles
CREATE POLICY "Users can view user roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- Insérer les rôles système de base
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role) VALUES
('tenant_admin', 'Administrateur Tenant', 'Administrateur avec tous les droits sur le tenant', 0, true),
('hr_manager', 'Responsable RH', 'Responsable des ressources humaines avec accès complet RH', 10, true),
('project_manager', 'Chef de Projet', 'Responsable de projets avec accès aux projets assignés', 20, true),
('team_lead', 'Chef d''Équipe', 'Responsable d''équipe avec accès limité à la gestion', 30, true),
('employee', 'Employé', 'Employé standard avec accès aux tâches assignées', 40, true),
('contractor', 'Contractuel', 'Travailleur externe avec accès limité', 50, true),
('intern', 'Stagiaire', 'Stagiaire avec accès en lecture seule', 60, true),
('viewer', 'Observateur', 'Accès en lecture seule limitée', 70, true)
ON CONFLICT (name) DO NOTHING;

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
('user_roles_assign', 'Assigner Rôles', 'Assigner des rôles aux utilisateurs', 'user_roles', 'assign', 'all')
ON CONFLICT (name) DO NOTHING;

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
  ))
ON CONFLICT (role_id, permission_id) DO NOTHING;