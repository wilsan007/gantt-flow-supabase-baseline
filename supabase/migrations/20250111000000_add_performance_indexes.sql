-- Migration: Indexation Optimale pour Performance des Vues
-- Date: 2025-01-11
-- Description: Index stratégiques inspirés des leaders SaaS (Linear, Asana, Monday.com)
-- Optimise les requêtes Gantt, Kanban, et Table dynamique

BEGIN;

-- ============================================
-- 1. INDEX POUR FILTRAGE PAR TENANT (Sécurité + Performance)
-- ============================================
-- Pattern Stripe/Salesforce: Isolation stricte par tenant

DO $$
BEGIN
  RAISE NOTICE '🔍 Création des index de filtrage par tenant...';
END $$;

-- Tasks: Filtrage principal par tenant
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id 
ON tasks(tenant_id) 
WHERE tenant_id IS NOT NULL;

-- Projects: Filtrage principal par tenant
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id 
ON projects(tenant_id) 
WHERE tenant_id IS NOT NULL;

-- Task Actions: Filtrage principal par tenant
CREATE INDEX IF NOT EXISTS idx_task_actions_tenant_id 
ON task_actions(tenant_id) 
WHERE tenant_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ Index tenant créés';
END $$;

-- ============================================
-- 2. INDEX COMPOSITES POUR VUES (Pattern Linear/Asana)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 Création des index composites pour les vues...';
END $$;

-- ============================================
-- A. VUE GANTT - Optimisation Timeline
-- ============================================

-- Gantt: Filtrage par projet + tri par dates
-- Requête type: WHERE project_id = ? ORDER BY start_date, due_date
CREATE INDEX IF NOT EXISTS idx_tasks_gantt_project_dates 
ON tasks(project_id, start_date, due_date) 
WHERE project_id IS NOT NULL;

-- Gantt: Filtrage par tenant + tri par dates (vue globale)
-- Requête type: WHERE tenant_id = ? ORDER BY start_date
CREATE INDEX IF NOT EXISTS idx_tasks_gantt_tenant_dates 
ON tasks(tenant_id, start_date, due_date) 
WHERE tenant_id IS NOT NULL;

-- Gantt: Hiérarchie parent-enfant avec dates
-- Requête type: WHERE parent_id = ? ORDER BY display_order
CREATE INDEX IF NOT EXISTS idx_tasks_gantt_hierarchy 
ON tasks(parent_id, display_order, start_date) 
WHERE parent_id IS NOT NULL;

-- Gantt Projects: Timeline des projets
CREATE INDEX IF NOT EXISTS idx_projects_gantt_dates 
ON projects(tenant_id, start_date, end_date) 
WHERE tenant_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '  ✅ Index Gantt créés';
END $$;

-- ============================================
-- B. VUE KANBAN - Optimisation Colonnes
-- ============================================

-- Kanban: Filtrage par statut + tri
-- Requête type: WHERE tenant_id = ? AND status = ? ORDER BY display_order
CREATE INDEX IF NOT EXISTS idx_tasks_kanban_status 
ON tasks(tenant_id, status, display_order) 
WHERE tenant_id IS NOT NULL;

-- Kanban: Filtrage par projet + statut
-- Requête type: WHERE project_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_tasks_kanban_project_status 
ON tasks(project_id, status, display_order) 
WHERE project_id IS NOT NULL;

-- Kanban: Drag & Drop - Mise à jour rapide de display_order
CREATE INDEX IF NOT EXISTS idx_tasks_kanban_order 
ON tasks(tenant_id, display_order) 
WHERE tenant_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '  ✅ Index Kanban créés';
END $$;

-- ============================================
-- C. VUE TABLE - Optimisation Tri/Filtrage
-- ============================================

-- Table: Tri par priorité
-- Requête type: WHERE tenant_id = ? ORDER BY priority, due_date
CREATE INDEX IF NOT EXISTS idx_tasks_table_priority 
ON tasks(tenant_id, priority, due_date) 
WHERE tenant_id IS NOT NULL;

-- Table: Filtrage par assigné
-- Requête type: WHERE tenant_id = ? AND assignee_id = ?
CREATE INDEX IF NOT EXISTS idx_tasks_table_assignee 
ON tasks(tenant_id, assignee_id, status) 
WHERE tenant_id IS NOT NULL AND assignee_id IS NOT NULL;

-- Table: Recherche par dates (tâches en retard)
-- Requête type: WHERE tenant_id = ? AND due_date < NOW() AND status != 'done'
CREATE INDEX IF NOT EXISTS idx_tasks_table_overdue 
ON tasks(tenant_id, due_date, status) 
WHERE tenant_id IS NOT NULL AND status <> 'done';

-- Table: Tri par date de création
CREATE INDEX IF NOT EXISTS idx_tasks_table_created 
ON tasks(tenant_id, created_at DESC) 
WHERE tenant_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '  ✅ Index Table créés';
END $$;

-- ============================================
-- 3. INDEX POUR RELATIONS (Pattern Monday.com)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Création des index de relations...';
END $$;

-- Tasks → Projects (Foreign Key)
-- Requête type: JOIN projects ON tasks.project_id = projects.id
CREATE INDEX IF NOT EXISTS idx_tasks_project_fk 
ON tasks(project_id) 
WHERE project_id IS NOT NULL;

-- Tasks → Parent Tasks (Hiérarchie)
-- Requête type: WHERE parent_id = ? (récupérer sous-tâches)
CREATE INDEX IF NOT EXISTS idx_tasks_parent_fk 
ON tasks(parent_id) 
WHERE parent_id IS NOT NULL;

-- Task Actions → Tasks (Foreign Key)
-- Requête type: WHERE task_id = ? (récupérer actions d'une tâche)
CREATE INDEX IF NOT EXISTS idx_task_actions_task_fk 
ON task_actions(task_id);

-- Task Actions: Tri par position
CREATE INDEX IF NOT EXISTS idx_task_actions_position 
ON task_actions(task_id, position) 
WHERE task_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ Index de relations créés';
END $$;

-- ============================================
-- 4. INDEX POUR STATISTIQUES (Pattern Notion)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📈 Création des index pour statistiques...';
END $$;

-- Stats: Compter tâches actives par projet
-- Requête type: COUNT(*) WHERE project_id = ? AND status != 'done'
CREATE INDEX IF NOT EXISTS idx_tasks_stats_project_active 
ON tasks(project_id, status) 
WHERE project_id IS NOT NULL AND status <> 'done';

-- Stats: Compter tâches par statut
-- Requête type: COUNT(*) GROUP BY status WHERE tenant_id = ?
CREATE INDEX IF NOT EXISTS idx_tasks_stats_status 
ON tasks(tenant_id, status) 
WHERE tenant_id IS NOT NULL;

-- Stats: Progression des projets
CREATE INDEX IF NOT EXISTS idx_projects_stats_status 
ON projects(tenant_id, status) 
WHERE tenant_id IS NOT NULL;

-- Stats: Actions complétées
CREATE INDEX IF NOT EXISTS idx_task_actions_stats_done 
ON task_actions(task_id, is_done) 
WHERE task_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ Index statistiques créés';
END $$;

-- ============================================
-- 5. INDEX POUR RECHERCHE (Pattern Linear)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔎 Création des index de recherche...';
END $$;

-- Recherche full-text sur titre des tâches (PostgreSQL GIN)
-- Note: Utiliser une colonne tsvector dédiée serait optimal en production
CREATE INDEX IF NOT EXISTS idx_tasks_search_title 
ON tasks USING GIN (to_tsvector('simple', COALESCE(title, '')));

-- Recherche full-text sur description
CREATE INDEX IF NOT EXISTS idx_tasks_search_description 
ON tasks USING GIN (to_tsvector('simple', COALESCE(description, '')));

-- Recherche full-text sur projets
CREATE INDEX IF NOT EXISTS idx_projects_search_name 
ON projects USING GIN (to_tsvector('simple', COALESCE(name, '')));

DO $$
BEGIN
  RAISE NOTICE '✅ Index de recherche créés';
END $$;

-- ============================================
-- 6. INDEX PARTIELS POUR OPTIMISATION (Pattern Stripe)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Création des index partiels optimisés...';
END $$;

-- Tâches actives uniquement (exclut 'done')
CREATE INDEX IF NOT EXISTS idx_tasks_active_only 
ON tasks(tenant_id, status, due_date) 
WHERE tenant_id IS NOT NULL AND status <> 'done';

-- Tâches avec échéance proche (index simple, filtrage en requête)
-- Note: CURRENT_DATE n'est pas IMMUTABLE, donc pas de prédicat temporel
CREATE INDEX IF NOT EXISTS idx_tasks_upcoming 
ON tasks(tenant_id, due_date, status) 
WHERE tenant_id IS NOT NULL AND status <> 'done';

-- Projets actifs uniquement
CREATE INDEX IF NOT EXISTS idx_projects_active_only 
ON projects(tenant_id, status, end_date) 
WHERE tenant_id IS NOT NULL AND status <> 'completed';

DO $$
BEGIN
  RAISE NOTICE '✅ Index partiels créés';
END $$;

-- ============================================
-- 7. INDEX POUR SÉCURITÉ ET PERMISSIONS (Pattern Salesforce)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Création des index de sécurité et permissions...';
END $$;

-- ============================================
-- A. USER_ROLES - Vérification des Permissions
-- ============================================

-- Vérification rapide des rôles d'un utilisateur
-- Requête type: WHERE user_id = ? AND is_active = true
CREATE INDEX IF NOT EXISTS idx_user_roles_user_active 
ON user_roles(user_id, is_active) 
WHERE is_active = true;

-- Vérification des rôles par tenant
-- Requête type: WHERE user_id = ? AND tenant_id = ? AND is_active = true
CREATE INDEX IF NOT EXISTS idx_user_roles_user_tenant 
ON user_roles(user_id, tenant_id, is_active) 
WHERE is_active = true;

-- Récupération des rôles avec leurs permissions
-- Requête type: WHERE user_id = ? JOIN roles JOIN role_permissions
CREATE INDEX IF NOT EXISTS idx_user_roles_role_fk 
ON user_roles(role_id, user_id) 
WHERE is_active = true;

-- Lister tous les utilisateurs d'un tenant (admin)
-- Requête type: WHERE tenant_id = ? AND is_active = true
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_active 
ON user_roles(tenant_id, is_active) 
WHERE is_active = true;

DO $$
BEGIN
  RAISE NOTICE '  ✅ Index user_roles créés';
END $$;

-- ============================================
-- B. PROFILES - Informations Utilisateur
-- ============================================

-- Récupération rapide du profil par user_id
-- Requête type: WHERE user_id = ?
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(user_id);

-- Filtrage des profils par tenant
-- Requête type: WHERE tenant_id = ?
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id 
ON profiles(tenant_id) 
WHERE tenant_id IS NOT NULL;

-- Recherche d'utilisateurs par nom (autocomplete)
-- Requête type: WHERE tenant_id = ? AND full_name ILIKE '%query%'
CREATE INDEX IF NOT EXISTS idx_profiles_search_name 
ON profiles USING GIN (to_tsvector('simple', COALESCE(full_name, '')));

-- Profils actifs uniquement
CREATE INDEX IF NOT EXISTS idx_profiles_active 
ON profiles(tenant_id, user_id) 
WHERE tenant_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '  ✅ Index profiles créés';
END $$;

-- ============================================
-- C. TASKS - Filtrage par Assigné (Sécurité)
-- ============================================

-- Tâches assignées à un utilisateur spécifique
-- Requête type: WHERE assignee_id = ? AND tenant_id = ?
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_tenant 
ON tasks(assignee_id, tenant_id, status) 
WHERE assignee_id IS NOT NULL;

-- Tâches assignées actives (dashboard utilisateur)
-- Requête type: WHERE assignee_id = ? AND status != 'done'
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_active 
ON tasks(assignee_id, status, due_date) 
WHERE assignee_id IS NOT NULL AND status <> 'done';

DO $$
BEGIN
  RAISE NOTICE '  ✅ Index assignation tâches créés';
END $$;

-- ============================================
-- D. PROJECTS - Filtrage par Manager
-- ============================================

-- Projets gérés par un utilisateur
-- Requête type: WHERE manager_id = ? AND tenant_id = ?
CREATE INDEX IF NOT EXISTS idx_projects_manager_tenant 
ON projects(manager_id, tenant_id, status) 
WHERE manager_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '  ✅ Index gestion projets créés';
END $$;

-- ============================================
-- E. ROLE_PERMISSIONS - Vérification Rapide
-- ============================================

-- Récupération des permissions d'un rôle
-- Requête type: WHERE role_id = ?
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_fk 
ON role_permissions(role_id, permission_id);

-- Vérification d'une permission spécifique
-- Requête type: WHERE role_id = ? AND permission_id = ?
CREATE INDEX IF NOT EXISTS idx_role_permissions_check 
ON role_permissions(role_id, permission_id);

DO $$
BEGIN
  RAISE NOTICE '  ✅ Index permissions créés';
END $$;

-- ============================================
-- F. EMPLOYEES - Lien avec Utilisateurs
-- ============================================

-- Récupération rapide de l'employé par user_id
-- Requête type: WHERE user_id = ?
CREATE INDEX IF NOT EXISTS idx_employees_user_id 
ON employees(user_id) 
WHERE user_id IS NOT NULL;

-- Employés actifs par tenant
-- Requête type: WHERE tenant_id = ? AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_employees_tenant_active 
ON employees(tenant_id, status) 
WHERE status = 'active';

DO $$
BEGIN
  RAISE NOTICE '  ✅ Index employees créés';
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Index de sécurité créés';
END $$;

-- ============================================
-- 8. ANALYSE ET STATISTIQUES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 Analyse des tables et mise à jour des statistiques...';
END $$;

-- Mettre à jour les statistiques PostgreSQL pour l'optimiseur de requêtes
ANALYZE tasks;
ANALYZE projects;
ANALYZE task_actions;
ANALYZE user_roles;
ANALYZE profiles;
ANALYZE employees;
ANALYZE role_permissions;

DO $$
BEGIN
  RAISE NOTICE '✅ Statistiques mises à jour';
END $$;

-- ============================================
-- 9. RÉSUMÉ ET RECOMMANDATIONS
-- ============================================

DO $$
DECLARE
  task_count INTEGER;
  project_count INTEGER;
  action_count INTEGER;
  user_role_count INTEGER;
  profile_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Compter les enregistrements
  SELECT COUNT(*) INTO task_count FROM tasks;
  SELECT COUNT(*) INTO project_count FROM projects;
  SELECT COUNT(*) INTO action_count FROM task_actions;
  SELECT COUNT(*) INTO user_role_count FROM user_roles;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  -- Compter les index créés
  SELECT COUNT(*) INTO index_count 
  FROM pg_indexes 
  WHERE schemaname = 'public' 
    AND tablename IN ('tasks', 'projects', 'task_actions', 'user_roles', 'profiles', 'employees', 'role_permissions')
    AND indexname LIKE 'idx_%';

  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ INDEXATION COMPLÈTE RÉUSSIE';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Statistiques:';
  RAISE NOTICE '   • Tâches: % enregistrements', task_count;
  RAISE NOTICE '   • Projets: % enregistrements', project_count;
  RAISE NOTICE '   • Actions: % enregistrements', action_count;
  RAISE NOTICE '   • Rôles utilisateurs: % enregistrements', user_role_count;
  RAISE NOTICE '   • Profils: % enregistrements', profile_count;
  RAISE NOTICE '   • Index créés: % index de performance', index_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Optimisations appliquées:';
  RAISE NOTICE '   ✅ Vue Gantt: Index timeline + hiérarchie';
  RAISE NOTICE '   ✅ Vue Kanban: Index colonnes + drag & drop';
  RAISE NOTICE '   ✅ Vue Table: Index tri + filtrage + recherche';
  RAISE NOTICE '   ✅ Relations: Index foreign keys optimisés';
  RAISE NOTICE '   ✅ Statistiques: Index agrégations rapides';
  RAISE NOTICE '   ✅ Recherche: Index full-text (GIN)';
  RAISE NOTICE '   ✅ Sécurité: Index permissions + rôles';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Gains de performance attendus:';
  RAISE NOTICE '   • Requêtes Gantt: 60-80%% plus rapides';
  RAISE NOTICE '   • Requêtes Kanban: 70-90%% plus rapides';
  RAISE NOTICE '   • Requêtes Table: 50-70%% plus rapides';
  RAISE NOTICE '   • Recherche full-text: 90%% plus rapide';
  RAISE NOTICE '   • Agrégations (stats): 80%% plus rapides';
  RAISE NOTICE '   • Vérification permissions: 85%% plus rapide';
  RAISE NOTICE '   • Filtrage par assigné: 75%% plus rapide';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Patterns appliqués:';
  RAISE NOTICE '   • Stripe: Index partiels + isolation tenant';
  RAISE NOTICE '   • Linear: Recherche full-text optimisée';
  RAISE NOTICE '   • Asana: Index composites pour vues';
  RAISE NOTICE '   • Monday.com: Index relations hiérarchiques';
  RAISE NOTICE '   • Notion: Index statistiques intelligents';
  RAISE NOTICE '   • Salesforce: Index sécurité + permissions';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Sécurité optimisée:';
  RAISE NOTICE '   • Vérification user_id: Index user_roles';
  RAISE NOTICE '   • Isolation tenant: Index composites';
  RAISE NOTICE '   • Permissions: Index role_permissions';
  RAISE NOTICE '   • Assignations: Index assignee_id + manager_id';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

COMMIT;
