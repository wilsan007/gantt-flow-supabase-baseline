-- Migration: Ajouter des contraintes de validation pour les sous-tâches
-- Date: 2025-01-10
-- Description: Empêche l'insertion de sous-tâches avec des dates en dehors de leur tâche parente

BEGIN;

-- ============================================
-- 1. FONCTION DE VALIDATION DES SOUS-TÂCHES
-- ============================================

-- Fonction pour vérifier que les dates des sous-tâches sont dans la plage de la tâche parente
CREATE OR REPLACE FUNCTION validate_subtask_dates_within_parent()
RETURNS TRIGGER AS $$
DECLARE
  parent_start DATE;
  parent_end DATE;
BEGIN
  -- Si la tâche n'a pas de parent, pas de validation (c'est une tâche parente)
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer les dates de la tâche parente
  SELECT start_date, due_date 
  INTO parent_start, parent_end
  FROM tasks 
  WHERE id = NEW.parent_id;

  -- Si la tâche parente n'a pas de dates définies, pas de validation
  IF parent_start IS NULL OR parent_end IS NULL THEN
    RETURN NEW;
  END IF;

  -- Vérifier que la date de début de la sous-tâche est après le début de la tâche parente
  IF NEW.start_date < parent_start THEN
    RAISE EXCEPTION E'❌ Date de début invalide pour la sous-tâche\n\n'
      '📅 Date choisie : %\n'
      '📝 Tâche parente : Début le %\n\n'
      '💡 Solution : Choisissez une date à partir du %', 
      NEW.start_date, parent_start, parent_start
      USING HINT = 'La sous-tâche doit commencer après ou en même temps que sa tâche parente';
  END IF;

  -- Vérifier que la date de fin de la sous-tâche est avant la fin de la tâche parente
  IF NEW.due_date > parent_end THEN
    RAISE EXCEPTION E'❌ Date de fin invalide pour la sous-tâche\n\n'
      '📅 Date choisie : %\n'
      '📝 Tâche parente : Se termine le %\n\n'
      '💡 Solution : Choisissez une date avant le %', 
      NEW.due_date, parent_end, parent_end
      USING HINT = 'La sous-tâche doit se terminer avant ou en même temps que sa tâche parente';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction de validation créée: validate_subtask_dates_within_parent()';
END $$;

-- ============================================
-- 2. TRIGGER DE VALIDATION DES SOUS-TÂCHES
-- ============================================

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS trigger_validate_subtask_dates ON tasks;

-- Créer le trigger qui s'exécute avant INSERT et UPDATE
CREATE TRIGGER trigger_validate_subtask_dates
  BEFORE INSERT OR UPDATE OF start_date, due_date, parent_id
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_subtask_dates_within_parent();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger créé: trigger_validate_subtask_dates';
END $$;

-- ============================================
-- 3. FONCTION POUR AJUSTER AUTOMATIQUEMENT LES SOUS-TÂCHES
-- ============================================

-- Fonction optionnelle pour ajuster automatiquement au lieu de rejeter
CREATE OR REPLACE FUNCTION auto_adjust_subtask_dates_to_parent()
RETURNS TRIGGER AS $$
DECLARE
  parent_start DATE;
  parent_end DATE;
  subtask_duration INTERVAL;
BEGIN
  -- Si la tâche n'a pas de parent, pas d'ajustement
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer les dates de la tâche parente
  SELECT start_date, due_date 
  INTO parent_start, parent_end
  FROM tasks 
  WHERE id = NEW.parent_id;

  -- Si la tâche parente n'a pas de dates définies, pas d'ajustement
  IF parent_start IS NULL OR parent_end IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculer la durée de la sous-tâche
  subtask_duration := NEW.due_date - NEW.start_date;

  -- Ajuster la date de début si elle est avant la tâche parente
  IF NEW.start_date < parent_start THEN
    NEW.start_date := parent_start;
    NEW.due_date := parent_start + subtask_duration;
    
    -- Si la nouvelle date de fin dépasse la tâche parente, ajuster
    IF NEW.due_date > parent_end THEN
      NEW.due_date := parent_end;
    END IF;
    
    RAISE NOTICE 'Dates de la sous-tâche ajustées automatiquement pour correspondre à la tâche parente';
  END IF;

  -- Ajuster la date de fin si elle est après la tâche parente
  IF NEW.due_date > parent_end THEN
    NEW.due_date := parent_end;
    NEW.start_date := parent_end - subtask_duration;
    
    -- Si le nouveau début est avant la tâche parente, ajuster
    IF NEW.start_date < parent_start THEN
      NEW.start_date := parent_start;
    END IF;
    
    RAISE NOTICE 'Dates de la sous-tâche ajustées automatiquement pour correspondre à la tâche parente';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction d''ajustement automatique créée: auto_adjust_subtask_dates_to_parent()';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Pour activer l''ajustement automatique au lieu de la validation stricte:';
  RAISE NOTICE '   DROP TRIGGER trigger_validate_subtask_dates ON tasks;';
  RAISE NOTICE '   CREATE TRIGGER trigger_auto_adjust_subtask_dates';
  RAISE NOTICE '     BEFORE INSERT OR UPDATE OF start_date, due_date, parent_id';
  RAISE NOTICE '     ON tasks FOR EACH ROW';
  RAISE NOTICE '     EXECUTE FUNCTION auto_adjust_subtask_dates_to_parent();';
END $$;

-- ============================================
-- 4. RÉSUMÉ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Contraintes de validation des sous-tâches installées avec succès';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Hiérarchie de validation complète:';
  RAISE NOTICE '   1. Projet → Tâches (trigger_validate_task_dates)';
  RAISE NOTICE '   2. Tâche parente → Sous-tâches (trigger_validate_subtask_dates)';
  RAISE NOTICE '   3. Dates cohérentes (tasks_dates_order_check, projects_dates_order_check)';
END $$;

COMMIT;
