-- Migration: Ajuster les dates des sous-tâches pour qu'elles soient dans la plage de leur tâche parente
-- Date: 2025-01-10
-- Description: Corrige les sous-tâches dont les dates sont en dehors de la plage de leur tâche parente

BEGIN;

-- ============================================
-- 1. ANALYSE DES PROBLÈMES
-- ============================================

DO $$
DECLARE
  subtask_record RECORD;
  parent_record RECORD;
BEGIN
  RAISE NOTICE '🔍 Analyse des sous-tâches avec dates incohérentes...';
  RAISE NOTICE '';
  
  FOR subtask_record IN 
    SELECT 
      st.id,
      st.title as subtask_title,
      st.start_date as subtask_start,
      st.due_date as subtask_end,
      st.parent_id,
      pt.title as parent_title,
      pt.start_date as parent_start,
      pt.due_date as parent_end
    FROM tasks st
    JOIN tasks pt ON st.parent_id = pt.id
    WHERE 
      st.parent_id IS NOT NULL
      AND (
        st.start_date < pt.start_date 
        OR st.due_date > pt.due_date
      )
    ORDER BY pt.title, st.start_date
  LOOP
    RAISE NOTICE '❌ Sous-tâche: % (Tâche parente: %)', subtask_record.subtask_title, subtask_record.parent_title;
    RAISE NOTICE '   Sous-tâche: % → %', subtask_record.subtask_start, subtask_record.subtask_end;
    RAISE NOTICE '   Tâche parente: % → %', subtask_record.parent_start, subtask_record.parent_end;
    RAISE NOTICE '';
  END LOOP;
END $$;

-- ============================================
-- 2. CORRECTION DES DATES DES SOUS-TÂCHES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🔧 Correction des dates des sous-tâches...';
  RAISE NOTICE '';
END $$;

-- Pour chaque sous-tâche dont la date de début est avant la tâche parente
UPDATE tasks st
SET 
  start_date = pt.start_date,
  due_date = CASE 
    -- Si la durée de la sous-tâche dépasse la fin de la tâche parente, ajuster la fin
    WHEN pt.start_date + (st.due_date - st.start_date) > pt.due_date 
    THEN pt.due_date
    -- Sinon, conserver la durée originale
    ELSE pt.start_date + (st.due_date - st.start_date)
  END,
  updated_at = NOW()
FROM tasks pt
WHERE 
  st.parent_id = pt.id
  AND st.start_date < pt.start_date;

-- Pour chaque sous-tâche dont la date de fin est après la tâche parente
UPDATE tasks st
SET 
  due_date = pt.due_date,
  start_date = CASE 
    -- Si en reculant la fin, le début devient avant la tâche parente, ajuster le début
    WHEN pt.due_date - (st.due_date - st.start_date) < pt.start_date 
    THEN pt.start_date
    -- Sinon, conserver la durée originale
    ELSE pt.due_date - (st.due_date - st.start_date)
  END,
  updated_at = NOW()
FROM tasks pt
WHERE 
  st.parent_id = pt.id
  AND st.due_date > pt.due_date
  AND st.start_date >= pt.start_date; -- Éviter de traiter deux fois les mêmes sous-tâches

-- ============================================
-- 3. VÉRIFICATION POST-CORRECTION
-- ============================================

DO $$
DECLARE
  remaining_issues INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_issues
  FROM tasks st
  JOIN tasks pt ON st.parent_id = pt.id
  WHERE 
    st.parent_id IS NOT NULL
    AND (
      st.start_date < pt.start_date 
      OR st.due_date > pt.due_date
    );
  
  IF remaining_issues > 0 THEN
    RAISE NOTICE '⚠️  Il reste % sous-tâche(s) avec des dates incohérentes', remaining_issues;
  ELSE
    RAISE NOTICE '✅ Toutes les dates des sous-tâches sont maintenant cohérentes avec leurs tâches parentes';
  END IF;
END $$;

COMMIT;
