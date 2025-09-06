-- Insert actions for all tasks
WITH task_ids AS (
  SELECT id, title FROM public.tasks
)
INSERT INTO public.task_actions (task_id, title, is_done, position)
SELECT 
  t.id,
  action_data.action_title,
  action_data.is_done::boolean,
  action_data.position::integer
FROM task_ids t
JOIN (
  VALUES 
  -- Design UI/UX actions
  ('Design UI/UX', 'Wireframes', 'true', '1'),
  ('Design UI/UX', 'Maquettes', 'true', '2'),
  ('Design UI/UX', 'Prototype', 'false', '3'),
  ('Design UI/UX', 'Tests utilisateurs', 'false', '4'),
  ('Design UI/UX', 'Validation finale', 'false', '5'),
  
  -- Développement Frontend actions
  ('Développement Frontend', 'Setup projet', 'false', '1'),
  ('Développement Frontend', 'Composants UI', 'false', '2'),
  ('Développement Frontend', 'Pages principales', 'false', '3'),
  ('Développement Frontend', 'Intégration API', 'false', '4'),
  ('Développement Frontend', 'Tests unitaires', 'false', '5'),
  
  -- Backend API actions
  ('Backend API', 'Architecture API', 'false', '1'),
  ('Backend API', 'Endpoints base', 'false', '2'),
  ('Backend API', 'Authentification', 'false', '3'),
  ('Backend API', 'Base de données', 'false', '4'),
  ('Backend API', 'Documentation API', 'false', '5'),
  
  -- Tests et Déploiement actions
  ('Tests et Déploiement', 'Tests integration', 'false', '1'),
  ('Tests et Déploiement', 'Tests de performance', 'false', '2'),
  ('Tests et Déploiement', 'Setup CI/CD', 'false', '3'),
  ('Tests et Déploiement', 'Déploiement staging', 'false', '4'),
  ('Tests et Déploiement', 'Déploiement production', 'false', '5'),
  
  -- Documentation actions
  ('Documentation', 'Guide utilisateur', 'false', '1'),
  ('Documentation', 'Documentation technique', 'false', '2'),
  ('Documentation', 'Guide déploiement', 'false', '3'),
  ('Documentation', 'Formation équipe', 'false', '4'),
  ('Documentation', 'Validation finale', 'false', '5')
) AS action_data(task_title, action_title, is_done, position)
ON t.title = action_data.task_title;