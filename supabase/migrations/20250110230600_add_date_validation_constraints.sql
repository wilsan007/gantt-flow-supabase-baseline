-- Migration: Ajouter des contraintes de validation pour les dates
-- Date: 2025-01-10
-- Description: Empêche l'insertion de tâches avec des dates incohérentes

BEGIN;

-- ============================================
-- 1. CONTRAINTES SUR LA TABLE TASKS
-- ============================================

-- Contrainte: La date de début doit être avant la date de fin
ALTER TABLE tasks
DROP CONSTRAINT IF EXISTS tasks_dates_order_check;

ALTER TABLE tasks
ADD CONSTRAINT tasks_dates_order_check 
CHECK (start_date <= due_date);

DO $$
BEGIN
  RAISE NOTICE '✅ Contrainte ajoutée: start_date <= due_date';
END $$;

-- ============================================
-- 2. CONTRAINTES SUR LA TABLE PROJECTS
-- ============================================

-- Contrainte: La date de début doit être avant la date de fin
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_dates_order_check;

ALTER TABLE projects
ADD CONSTRAINT projects_dates_order_check 
CHECK (start_date <= end_date);

DO $$
BEGIN
  RAISE NOTICE '✅ Contrainte ajoutée: project start_date <= end_date';
END $$;

-- ============================================
-- 3. FONCTION DE VALIDATION DES DATES
-- ============================================

-- Fonction pour vérifier que les dates des tâches sont dans la plage du projet
CREATE OR REPLACE FUNCTION validate_task_dates_within_project()
RETURNS TRIGGER AS $$
DECLARE
  project_start DATE;
  project_end DATE;
BEGIN
  -- Si la tâche n'a pas de projet, pas de validation
  IF NEW.project_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer les dates du projet
  SELECT start_date, end_date 
  INTO project_start, project_end
  FROM projects 
  WHERE id = NEW.project_id;

  -- Si le projet n'a pas de dates définies, pas de validation
  IF project_start IS NULL OR project_end IS NULL THEN
    RETURN NEW;
  END IF;

  -- Vérifier que la date de début de la tâche est après le début du projet
  IF NEW.start_date < project_start THEN
    RAISE EXCEPTION E'❌ Date de début invalide pour la tâche\n\n'
      '📅 Date choisie : %\n'
      '📁 Projet : Début le %\n\n'
      '💡 Solution : Choisissez une date à partir du %', 
      NEW.start_date, project_start, project_start
      USING HINT = 'La tâche doit commencer après ou en même temps que son projet';
  END IF;

  -- Vérifier que la date de fin de la tâche est avant la fin du projet
  IF NEW.due_date > project_end THEN
    RAISE EXCEPTION E'❌ Date de fin invalide pour la tâche\n\n'
      '📅 Date choisie : %\n'
      '📁 Projet : Se termine le %\n\n'
      '💡 Solution : Choisissez une date avant le %', 
      NEW.due_date, project_end, project_end
      USING HINT = 'La tâche doit se terminer avant ou en même temps que son projet';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction de validation créée: validate_task_dates_within_project()';
END $$;

-- ============================================
-- 4. TRIGGER DE VALIDATION
-- ============================================

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS trigger_validate_task_dates ON tasks;

-- Créer le trigger qui s'exécute avant INSERT et UPDATE
CREATE TRIGGER trigger_validate_task_dates
  BEFORE INSERT OR UPDATE OF start_date, due_date, project_id
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_dates_within_project();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger créé: trigger_validate_task_dates';
END $$;

-- ============================================
-- 5. FONCTION POUR AJUSTER AUTOMATIQUEMENT
-- ============================================

-- Fonction optionnelle pour ajuster automatiquement au lieu de rejeter
CREATE OR REPLACE FUNCTION auto_adjust_task_dates_to_project()
RETURNS TRIGGER AS $$
DECLARE
  project_start DATE;
  project_end DATE;
  task_duration INTERVAL;
BEGIN
  -- Si la tâche n'a pas de projet, pas d'ajustement
  IF NEW.project_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer les dates du projet
  SELECT start_date, end_date 
  INTO project_start, project_end
  FROM projects 
  WHERE id = NEW.project_id;

  -- Si le projet n'a pas de dates définies, pas d'ajustement
  IF project_start IS NULL OR project_end IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculer la durée de la tâche
  task_duration := NEW.due_date - NEW.start_date;

  -- Ajuster la date de début si elle est avant le projet
  IF NEW.start_date < project_start THEN
    NEW.start_date := project_start;
    NEW.due_date := project_start + task_duration;
    
    -- Si la nouvelle date de fin dépasse le projet, ajuster
    IF NEW.due_date > project_end THEN
      NEW.due_date := project_end;
    END IF;
    
    RAISE NOTICE 'Dates de la tâche ajustées automatiquement pour correspondre au projet';
  END IF;

  -- Ajuster la date de fin si elle est après le projet
  IF NEW.due_date > project_end THEN
    NEW.due_date := project_end;
    NEW.start_date := project_end - task_duration;
    
    -- Si la nouvelle date de début est avant le projet, ajuster
    IF NEW.start_date < project_start THEN
      NEW.start_date := project_start;
    END IF;
    
    RAISE NOTICE 'Dates de la tâche ajustées automatiquement pour correspondre au projet';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction d''ajustement automatique créée: auto_adjust_task_dates_to_project()';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Pour activer l''ajustement automatique au lieu de la validation stricte:';
  RAISE NOTICE '   DROP TRIGGER trigger_validate_task_dates ON tasks;';
  RAISE NOTICE '   CREATE TRIGGER trigger_auto_adjust_task_dates';
  RAISE NOTICE '     BEFORE INSERT OR UPDATE OF start_date, due_date, project_id';
  RAISE NOTICE '     ON tasks FOR EACH ROW';
  RAISE NOTICE '     EXECUTE FUNCTION auto_adjust_task_dates_to_project();';
END $$;

-- ============================================
-- 6. TEST DES CONTRAINTES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test des contraintes...';
  
  -- Test 1: Vérifier qu'on ne peut pas créer une tâche avec start > due
  BEGIN
    INSERT INTO tasks (title, start_date, due_date, priority, tenant_id)
    VALUES ('Test Invalid', '2025-12-31', '2025-01-01', 'medium', (SELECT id FROM tenants LIMIT 1));
    
    -- Si on arrive ici, supprimer la tâche de test
    DELETE FROM tasks WHERE title = 'Test Invalid';
    RAISE NOTICE '❌ Test 1 ÉCHOUÉ: La contrainte start_date <= due_date n''a pas fonctionné';
  EXCEPTION 
    WHEN check_violation THEN
      RAISE NOTICE '✅ Test 1 RÉUSSI: La contrainte start_date <= due_date fonctionne';
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️  Test 1: Erreur inattendue - %', SQLERRM;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Contraintes de validation installées avec succès';
END $$;

COMMIT;
