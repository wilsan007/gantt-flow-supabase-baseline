-- Migration: Ajuster les dates des tâches pour qu'elles soient dans la plage des projets
-- Date: 2025-01-10
-- Description: Corrige les tâches dont les dates sont en dehors de la plage de leur projet

BEGIN;

-- ============================================
-- 1. ANALYSE DES PROBLÈMES
-- ============================================

-- Afficher les tâches avec dates incohérentes
DO $$
DECLARE
  task_record RECORD;
  project_record RECORD;
BEGIN
  RAISE NOTICE '🔍 Analyse des tâches avec dates incohérentes...';
  RAISE NOTICE '';
  
  FOR task_record IN 
    SELECT 
      t.id,
      t.title,
      t.start_date as task_start,
      t.due_date as task_end,
      t.project_id,
      p.name as project_name,
      p.start_date as project_start,
      p.end_date as project_end
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE 
      t.project_id IS NOT NULL
      AND (
        t.start_date < p.start_date 
        OR t.due_date > p.end_date
      )
    ORDER BY p.name, t.start_date
  LOOP
    RAISE NOTICE '❌ Tâche: % (Projet: %)', task_record.title, task_record.project_name;
    RAISE NOTICE '   Tâche: % → %', task_record.task_start, task_record.task_end;
    RAISE NOTICE '   Projet: % → %', task_record.project_start, task_record.project_end;
    RAISE NOTICE '';
  END LOOP;
END $$;

-- ============================================
-- 2. CORRECTION DES DATES
-- ============================================

-- Stratégie: Ajuster les dates des tâches pour qu'elles soient dans la plage du projet
-- en conservant la durée originale de la tâche

DO $$
BEGIN
  RAISE NOTICE '🔧 Correction des dates des tâches...';
  RAISE NOTICE '';
END $$;

-- Pour chaque tâche dont la date de début est avant le projet
UPDATE tasks t
SET 
  start_date = p.start_date,
  due_date = CASE 
    -- Si la durée de la tâche dépasse la fin du projet, ajuster la fin
    WHEN p.start_date + (t.due_date - t.start_date) > p.end_date 
    THEN p.end_date
    -- Sinon, conserver la durée originale
    ELSE p.start_date + (t.due_date - t.start_date)
  END,
  updated_at = NOW()
FROM projects p
WHERE 
  t.project_id = p.id
  AND t.start_date < p.start_date;

-- Pour chaque tâche dont la date de fin est après le projet
UPDATE tasks t
SET 
  due_date = p.end_date,
  start_date = CASE 
    -- Si en reculant la fin, le début devient avant le projet, ajuster le début
    WHEN p.end_date - (t.due_date - t.start_date) < p.start_date 
    THEN p.start_date
    -- Sinon, conserver la durée originale
    ELSE p.end_date - (t.due_date - t.start_date)
  END,
  updated_at = NOW()
FROM projects p
WHERE 
  t.project_id = p.id
  AND t.due_date > p.end_date
  AND t.start_date >= p.start_date; -- Éviter de traiter deux fois les mêmes tâches

-- ============================================
-- 3. VÉRIFICATION POST-CORRECTION
-- ============================================

DO $$
DECLARE
  remaining_issues INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_issues
  FROM tasks t
  JOIN projects p ON t.project_id = p.id
  WHERE 
    t.project_id IS NOT NULL
    AND (
      t.start_date < p.start_date 
      OR t.due_date > p.end_date
    );
  
  IF remaining_issues > 0 THEN
    RAISE NOTICE '⚠️  Il reste % tâche(s) avec des dates incohérentes', remaining_issues;
  ELSE
    RAISE NOTICE '✅ Toutes les dates des tâches sont maintenant cohérentes avec leurs projets';
  END IF;
END $$;

COMMIT;
