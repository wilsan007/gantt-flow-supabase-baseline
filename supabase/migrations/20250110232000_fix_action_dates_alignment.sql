-- Migration: Ajuster les dates des actions pour qu'elles soient dans la plage de leur tâche
-- Date: 2025-01-10
-- Description: Corrige les actions dont les dates sont en dehors de la plage de leur tâche

BEGIN;

-- ============================================
-- 1. ANALYSE DES PROBLÈMES
-- ============================================

DO $$
DECLARE
  action_record RECORD;
  task_record RECORD;
BEGIN
  RAISE NOTICE '🔍 Analyse des actions avec dates incohérentes...';
  RAISE NOTICE '';
  
  FOR action_record IN 
    SELECT 
      a.id,
      a.title as action_title,
      a.due_date as action_due,
      a.task_id,
      t.title as task_title,
      t.start_date as task_start,
      t.due_date as task_end
    FROM task_actions a
    JOIN tasks t ON a.task_id = t.id
    WHERE 
      a.due_date IS NOT NULL
      AND a.due_date > t.due_date
    ORDER BY t.title, a.due_date
  LOOP
    RAISE NOTICE '❌ Action: % (Tâche: %)', action_record.action_title, action_record.task_title;
    RAISE NOTICE '   Action due: %', action_record.action_due;
    RAISE NOTICE '   Tâche: % → %', action_record.task_start, action_record.task_end;
    RAISE NOTICE '';
  END LOOP;
END $$;

-- ============================================
-- 2. CORRECTION DES DATES DES ACTIONS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🔧 Correction des dates des actions...';
  RAISE NOTICE '';
END $$;

-- Pour chaque action dont la date d'échéance est après la tâche
UPDATE task_actions a
SET 
  due_date = t.due_date,
  updated_at = NOW()
FROM tasks t
WHERE 
  a.task_id = t.id
  AND a.due_date IS NOT NULL
  AND a.due_date > t.due_date;

-- ============================================
-- 3. VÉRIFICATION POST-CORRECTION
-- ============================================

DO $$
DECLARE
  remaining_issues INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_issues
  FROM task_actions a
  JOIN tasks t ON a.task_id = t.id
  WHERE 
    a.due_date IS NOT NULL
    AND a.due_date > t.due_date;
  
  IF remaining_issues > 0 THEN
    RAISE NOTICE '⚠️  Il reste % action(s) avec des dates incohérentes', remaining_issues;
  ELSE
    RAISE NOTICE '✅ Toutes les dates des actions sont maintenant cohérentes avec leurs tâches';
  END IF;
END $$;

COMMIT;
