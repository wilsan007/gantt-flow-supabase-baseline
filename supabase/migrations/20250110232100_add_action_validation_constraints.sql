-- Migration: Ajouter des contraintes de validation pour les actions
-- Date: 2025-01-10
-- Description: Empêche l'insertion d'actions avec des dates en dehors de leur tâche

BEGIN;

-- ============================================
-- 1. FONCTION DE VALIDATION DES ACTIONS
-- ============================================

-- Fonction pour vérifier que les dates des actions sont dans la plage de la tâche/sous-tâche
CREATE OR REPLACE FUNCTION validate_action_dates_within_task()
RETURNS TRIGGER AS $$
DECLARE
  task_start DATE;
  task_end DATE;
  task_title TEXT;
  is_subtask BOOLEAN;
BEGIN
  -- Si l'action n'a pas de date d'échéance, pas de validation
  IF NEW.due_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer les dates de la tâche (ou sous-tâche)
  SELECT start_date, due_date, title, (parent_id IS NOT NULL)
  INTO task_start, task_end, task_title, is_subtask
  FROM tasks 
  WHERE id = NEW.task_id;

  -- Si la tâche n'a pas de dates définies, pas de validation
  IF task_start IS NULL OR task_end IS NULL THEN
    RETURN NEW;
  END IF;

  -- Vérifier que la date d'échéance de l'action est avant la fin de la tâche/sous-tâche
  IF NEW.due_date > task_end THEN
    IF is_subtask THEN
      RAISE EXCEPTION E'❌ Date invalide pour l''action\n\n'
        '📅 Vous avez choisi : %\n'
        '🎯 Sous-tâche : "%"\n'
        '⏰ Date limite de la sous-tâche : %\n\n'
        '💡 Solution : Choisissez une date entre % et %', 
        NEW.due_date, task_title, task_end, task_start, task_end
        USING HINT = 'L''action doit se terminer avant ou en même temps que sa sous-tâche parente';
    ELSE
      RAISE EXCEPTION E'❌ Date invalide pour l''action\n\n'
        '📅 Vous avez choisi : %\n'
        '🎯 Tâche : "%"\n'
        '⏰ Date limite de la tâche : %\n\n'
        '💡 Solution : Choisissez une date entre % et %', 
        NEW.due_date, task_title, task_end, task_start, task_end
        USING HINT = 'L''action doit se terminer avant ou en même temps que sa tâche parente';
    END IF;
  END IF;

  -- Optionnel: Vérifier que l'action ne commence pas avant la tâche/sous-tâche
  -- (si vous ajoutez un champ start_date aux actions)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction de validation créée: validate_action_dates_within_task()';
END $$;

-- ============================================
-- 2. TRIGGER DE VALIDATION DES ACTIONS
-- ============================================

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS trigger_validate_action_dates ON task_actions;

-- Créer le trigger qui s'exécute avant INSERT et UPDATE
CREATE TRIGGER trigger_validate_action_dates
  BEFORE INSERT OR UPDATE OF due_date, task_id
  ON task_actions
  FOR EACH ROW
  EXECUTE FUNCTION validate_action_dates_within_task();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger créé: trigger_validate_action_dates';
END $$;

-- ============================================
-- 3. FONCTION POUR AJUSTER AUTOMATIQUEMENT LES ACTIONS
-- ============================================

-- Fonction optionnelle pour ajuster automatiquement au lieu de rejeter
CREATE OR REPLACE FUNCTION auto_adjust_action_dates_to_task()
RETURNS TRIGGER AS $$
DECLARE
  task_start DATE;
  task_end DATE;
  task_title TEXT;
  is_subtask BOOLEAN;
BEGIN
  -- Si l'action n'a pas de date d'échéance, pas d'ajustement
  IF NEW.due_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer les dates de la tâche (ou sous-tâche)
  SELECT start_date, due_date, title, (parent_id IS NOT NULL)
  INTO task_start, task_end, task_title, is_subtask
  FROM tasks 
  WHERE id = NEW.task_id;

  -- Si la tâche n'a pas de dates définies, pas d'ajustement
  IF task_start IS NULL OR task_end IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ajuster la date d'échéance si elle est après la tâche/sous-tâche
  IF NEW.due_date > task_end THEN
    NEW.due_date := task_end;
    IF is_subtask THEN
      RAISE NOTICE 'Date d''échéance de l''action ajustée automatiquement pour correspondre à la sous-tâche "%"', task_title;
    ELSE
      RAISE NOTICE 'Date d''échéance de l''action ajustée automatiquement pour correspondre à la tâche "%"', task_title;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction d''ajustement automatique créée: auto_adjust_action_dates_to_task()';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Pour activer l''ajustement automatique au lieu de la validation stricte:';
  RAISE NOTICE '   DROP TRIGGER trigger_validate_action_dates ON task_actions;';
  RAISE NOTICE '   CREATE TRIGGER trigger_auto_adjust_action_dates';
  RAISE NOTICE '     BEFORE INSERT OR UPDATE OF due_date, task_id';
  RAISE NOTICE '     ON task_actions FOR EACH ROW';
  RAISE NOTICE '     EXECUTE FUNCTION auto_adjust_action_dates_to_task();';
END $$;

-- ============================================
-- 4. RÉSUMÉ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Contraintes de validation des actions installées avec succès';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Hiérarchie de validation complète:';
  RAISE NOTICE '   1. Projet → Tâches (trigger_validate_task_dates)';
  RAISE NOTICE '   2. Tâche parente → Sous-tâches (trigger_validate_subtask_dates)';
  RAISE NOTICE '   3. Tâche/Sous-tâche → Actions (trigger_validate_action_dates)';
  RAISE NOTICE '   4. Dates cohérentes (tasks_dates_order_check, projects_dates_order_check)';
  RAISE NOTICE '';
  RAISE NOTICE '💡 La contrainte fonctionne pour:';
  RAISE NOTICE '   • Actions de tâches parentes';
  RAISE NOTICE '   • Actions de sous-tâches';
  RAISE NOTICE '   Les messages d''erreur s''adaptent automatiquement au type';
END $$;

COMMIT;
