-- 🔍 DEBUG: Vérifier pourquoi task_actions est vide
-- Exécuter ce script dans Supabase SQL Editor

-- 1️⃣ Compter les task_actions dans la base
SELECT 
  'Total task_actions' as check_name,
  COUNT(*) as count
FROM task_actions;

-- 2️⃣ Vérifier si les task_actions ont des task_id valides
SELECT 
  'task_actions avec task_id NULL' as check_name,
  COUNT(*) as count
FROM task_actions
WHERE task_id IS NULL;

-- 3️⃣ Vérifier les task_actions de la première tâche
SELECT 
  'Actions pour première tâche (cda9cd43...)' as check_name,
  COUNT(*) as count
FROM task_actions
WHERE task_id = 'cda9cd43-d85f-4ff9-9176-e7c42cca9ade';

-- 4️⃣ Lister toutes les actions (max 10)
SELECT 
  id,
  task_id,
  title,
  is_done,
  position,
  created_at
FROM task_actions
ORDER BY created_at DESC
LIMIT 10;

-- 5️⃣ Vérifier les task_id qui ont des actions
SELECT 
  ta.task_id,
  t.title as task_title,
  COUNT(ta.id) as actions_count
FROM task_actions ta
LEFT JOIN tasks t ON t.id = ta.task_id
GROUP BY ta.task_id, t.title
ORDER BY actions_count DESC
LIMIT 10;

-- 6️⃣ Vérifier les policies RLS sur task_actions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'task_actions';

-- 7️⃣ Tester la requête exacte de l'app (avec jointure)
SELECT 
  t.id,
  t.title,
  (
    SELECT json_agg(ta.*)
    FROM task_actions ta
    WHERE ta.task_id = t.id
  ) as task_actions_manual
FROM tasks t
LIMIT 5;
