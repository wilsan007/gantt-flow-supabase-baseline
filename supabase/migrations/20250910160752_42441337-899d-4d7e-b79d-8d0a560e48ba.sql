-- Ajouter la colonne project_name à la table tasks
ALTER TABLE public.tasks 
ADD COLUMN project_name text;

-- Insérer des données de test cohérentes dans toutes les tables
WITH user_data AS (
  SELECT user_id, full_name, id as profile_id 
  FROM public.profiles 
  WHERE user_id IS NOT NULL 
  LIMIT 3
),
project_data AS (
  INSERT INTO public.projects (name, description, status, priority, start_date, end_date, budget, manager_id, department_id, tenant_id)
  SELECT 
    CASE 
      WHEN ROW_NUMBER() OVER() = 1 THEN 'Refonte Site Web'
      WHEN ROW_NUMBER() OVER() = 2 THEN 'Migration Cloud'
      ELSE 'Application Mobile'
    END,
    CASE 
      WHEN ROW_NUMBER() OVER() = 1 THEN 'Refonte complète du site web corporate'
      WHEN ROW_NUMBER() OVER() = 2 THEN 'Migration des serveurs vers le cloud'
      ELSE 'Développement application mobile iOS/Android'
    END,
    'active',
    'high',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '90 days',
    50000.00,
    (SELECT profile_id FROM user_data LIMIT 1),
    (SELECT id FROM public.departments LIMIT 1),
    get_user_tenant_id()
  FROM user_data
  RETURNING id, name
),
task_data AS (
  INSERT INTO public.tasks (title, assignee, start_date, due_date, priority, status, effort_estimate_h, progress, task_level, display_order, project_id, project_name, tenant_id)
  SELECT 
    CASE 
      WHEN ROW_NUMBER() OVER() = 1 THEN 'Design Interface Utilisateur'
      WHEN ROW_NUMBER() OVER() = 2 THEN 'Développement Backend API'
      WHEN ROW_NUMBER() OVER() = 3 THEN 'Tests et Validation'
      WHEN ROW_NUMBER() OVER() = 4 THEN 'Configuration Serveurs'
      WHEN ROW_NUMBER() OVER() = 5 THEN 'Migration Base de Données'
      ELSE 'Documentation Technique'
    END,
    u.full_name,
    CURRENT_DATE + (ROW_NUMBER() OVER() * INTERVAL '7 days'),
    CURRENT_DATE + (ROW_NUMBER() OVER() * INTERVAL '14 days'),
    CASE WHEN ROW_NUMBER() OVER() % 3 = 0 THEN 'high' ELSE 'medium' END,
    CASE 
      WHEN ROW_NUMBER() OVER() % 4 = 0 THEN 'done'
      WHEN ROW_NUMBER() OVER() % 3 = 0 THEN 'doing' 
      ELSE 'todo' 
    END,
    8 + (ROW_NUMBER() OVER() * 2),
    CASE 
      WHEN ROW_NUMBER() OVER() % 4 = 0 THEN 100
      WHEN ROW_NUMBER() OVER() % 3 = 0 THEN 60
      ELSE 0
    END,
    0,
    ROW_NUMBER() OVER()::text,
    p.id,
    p.name,
    get_user_tenant_id()
  FROM user_data u
  CROSS JOIN project_data p
  LIMIT 6
  RETURNING id, title, assignee
)
INSERT INTO public.task_actions (task_id, title, is_done, owner_id, weight_percentage, position, tenant_id)
SELECT 
  t.id,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY t.id) = 1 THEN 'Analyse des besoins'
    WHEN ROW_NUMBER() OVER(PARTITION BY t.id) = 2 THEN 'Conception'
    ELSE 'Implémentation'
  END,
  CASE WHEN ROW_NUMBER() OVER(PARTITION BY t.id) = 1 THEN true ELSE false END,
  t.assignee,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY t.id) = 1 THEN 40
    WHEN ROW_NUMBER() OVER(PARTITION BY t.id) = 2 THEN 35
    ELSE 25
  END,
  ROW_NUMBER() OVER(PARTITION BY t.id),
  get_user_tenant_id()
FROM task_data t
CROSS JOIN generate_series(1, 3) s;