-- ================================================
-- MISE À JOUR SYSTÈME DE DÉPENDANCES - GANTT
-- ================================================
-- Ce script met à jour la table existante task_dependencies
-- au lieu d'en créer une nouvelle

-- 1. Vérifier et ajouter les colonnes manquantes si nécessaire
-- ================================================

-- La table utilise déjà : task_id, depends_on_task_id, dependency_type
-- On s'assure que dependency_type accepte nos 4 types

-- Mettre à jour la contrainte sur dependency_type
ALTER TABLE task_dependencies 
DROP CONSTRAINT IF EXISTS task_dependencies_dependency_type_check;

ALTER TABLE task_dependencies
ADD CONSTRAINT task_dependencies_dependency_type_check 
CHECK (dependency_type IN (
  'finish-to-start',  -- FS: Tâche B commence après la fin de A
  'start-to-start',   -- SS: Tâches A et B commencent ensemble
  'finish-to-finish', -- FF: Tâches A et B finissent ensemble
  'start-to-finish'   -- SF: Tâche B finit quand A commence
));

-- Ajouter la colonne lag_days si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_dependencies' 
    AND column_name = 'lag_days'
  ) THEN
    ALTER TABLE task_dependencies ADD COLUMN lag_days integer DEFAULT 0;
  END IF;
END $$;

-- Ajouter updated_at si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_dependencies' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE task_dependencies ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 2. Améliorer les index
-- ================================================
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id 
  ON task_dependencies(task_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on 
  ON task_dependencies(depends_on_task_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_tenant 
  ON task_dependencies(tenant_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_type 
  ON task_dependencies(dependency_type);

-- Index composite pour les recherches bidirectionnelles
CREATE INDEX IF NOT EXISTS idx_task_dependencies_both 
  ON task_dependencies(task_id, depends_on_task_id);

-- 3. Trigger pour updated_at
-- ================================================
CREATE OR REPLACE FUNCTION update_task_dependencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_dependencies_updated_at_trigger ON task_dependencies;

CREATE TRIGGER task_dependencies_updated_at_trigger
  BEFORE UPDATE ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION update_task_dependencies_updated_at();

-- 4. Fonction pour détecter les cycles (adaptée aux noms de colonnes existants)
-- ================================================
CREATE OR REPLACE FUNCTION check_dependency_cycle(
  p_depends_on_id uuid,
  p_task_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_cycle_detected boolean := false;
  v_current_id uuid;
  v_visited uuid[];
  v_max_iterations integer := 100;
  v_iterations integer := 0;
BEGIN
  -- Initialiser avec la tâche qui dépend
  v_visited := ARRAY[p_task_id];
  v_current_id := p_task_id;
  
  -- Parcourir le graphe des dépendances
  WHILE v_current_id IS NOT NULL AND v_iterations < v_max_iterations LOOP
    v_iterations := v_iterations + 1;
    
    -- Vérifier si on est revenu à la tâche dont on dépend
    IF v_current_id = p_depends_on_id THEN
      v_cycle_detected := true;
      EXIT;
    END IF;
    
    -- Trouver le prochain dans la chaîne de dépendances
    SELECT task_id INTO v_current_id
    FROM task_dependencies
    WHERE depends_on_task_id = v_current_id
    AND task_id != ALL(v_visited)
    LIMIT 1;
    
    -- Ajouter aux visités si trouvé
    IF v_current_id IS NOT NULL THEN
      v_visited := array_append(v_visited, v_current_id);
    END IF;
  END LOOP;
  
  RETURN v_cycle_detected;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger pour empêcher les cycles
-- ================================================
CREATE OR REPLACE FUNCTION prevent_dependency_cycle()
RETURNS TRIGGER AS $$
BEGIN
  IF check_dependency_cycle(NEW.depends_on_task_id, NEW.task_id) THEN
    RAISE EXCEPTION 'Cette dépendance créerait un cycle dans le graphe des dépendances';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_cycle_on_insert ON task_dependencies;
DROP TRIGGER IF EXISTS prevent_cycle_on_update ON task_dependencies;

CREATE TRIGGER prevent_cycle_on_insert
  BEFORE INSERT ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION prevent_dependency_cycle();

CREATE TRIGGER prevent_cycle_on_update
  BEFORE UPDATE ON task_dependencies
  FOR EACH ROW
  WHEN (
    OLD.depends_on_task_id IS DISTINCT FROM NEW.depends_on_task_id 
    OR OLD.task_id IS DISTINCT FROM NEW.task_id
  )
  EXECUTE FUNCTION prevent_dependency_cycle();

-- 6. Vue pour obtenir les dépendances avec les infos des tâches
-- ================================================
CREATE OR REPLACE VIEW task_dependencies_with_info AS
SELECT 
  td.id,
  td.depends_on_task_id,
  td.task_id,
  td.dependency_type,
  td.lag_days,
  t1.title as predecessor_title,
  t1.status as predecessor_status,
  t1.start_date as predecessor_start,
  t1.due_date as predecessor_end,
  t2.title as successor_title,
  t2.status as successor_status,
  t2.start_date as successor_start,
  t2.due_date as successor_end,
  td.created_at,
  td.updated_at
FROM task_dependencies td
JOIN tasks t1 ON td.depends_on_task_id = t1.id
JOIN tasks t2 ON td.task_id = t2.id;

-- 7. Fonction pour obtenir toutes les dépendances d'une tâche
-- ================================================
CREATE OR REPLACE FUNCTION get_task_dependencies(p_task_id uuid)
RETURNS TABLE (
  dependency_id uuid,
  related_task_id uuid,
  related_task_title text,
  dependency_type text,
  lag_days integer,
  is_predecessor boolean,
  related_start_date date,
  related_due_date date
) AS $$
BEGIN
  RETURN QUERY
  -- Tâches dont on dépend (prédécesseurs)
  SELECT 
    td.id as dependency_id,
    td.depends_on_task_id as related_task_id,
    t.title as related_task_title,
    td.dependency_type,
    td.lag_days,
    true as is_predecessor,
    t.start_date as related_start_date,
    t.due_date as related_due_date
  FROM task_dependencies td
  JOIN tasks t ON td.depends_on_task_id = t.id
  WHERE td.task_id = p_task_id
  
  UNION ALL
  
  -- Tâches qui dépendent de nous (successeurs)
  SELECT 
    td.id as dependency_id,
    td.task_id as related_task_id,
    t.title as related_task_title,
    td.dependency_type,
    td.lag_days,
    false as is_predecessor,
    t.start_date as related_start_date,
    t.due_date as related_due_date
  FROM task_dependencies td
  JOIN tasks t ON td.task_id = t.id
  WHERE td.depends_on_task_id = p_task_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour obtenir le chemin critique
-- ================================================
CREATE OR REPLACE FUNCTION get_critical_path(p_project_id uuid DEFAULT NULL)
RETURNS TABLE (
  task_id uuid,
  task_title text,
  start_date date,
  due_date date,
  duration_days integer,
  path_position integer
) AS $$
BEGIN
  -- Cette fonction calcule le chemin critique (tâches sans marge)
  -- Pour l'instant, retourne les tâches dans l'ordre de dépendance
  RETURN QUERY
  WITH RECURSIVE task_chain AS (
    -- Tâches sans prédécesseur (début de chaîne)
    SELECT 
      t.id,
      t.title,
      t.start_date,
      t.due_date,
      EXTRACT(DAY FROM (t.due_date - t.start_date))::integer as duration,
      1 as depth
    FROM tasks t
    LEFT JOIN task_dependencies td ON t.id = td.task_id
    WHERE td.id IS NULL
    AND (p_project_id IS NULL OR t.project_id = p_project_id)
    
    UNION ALL
    
    -- Tâches suivantes dans la chaîne
    SELECT 
      t.id,
      t.title,
      t.start_date,
      t.due_date,
      EXTRACT(DAY FROM (t.due_date - t.start_date))::integer,
      tc.depth + 1
    FROM tasks t
    JOIN task_dependencies td ON t.id = td.task_id
    JOIN task_chain tc ON td.depends_on_task_id = tc.id
    WHERE (p_project_id IS NULL OR t.project_id = p_project_id)
  )
  SELECT 
    id as task_id,
    title as task_title,
    start_date,
    due_date,
    duration as duration_days,
    depth as path_position
  FROM task_chain
  ORDER BY depth, start_date;
END;
$$ LANGUAGE plpgsql;

-- 9. Améliorer les contraintes existantes
-- ================================================

-- S'assurer qu'on ne peut pas créer de dépendance sur soi-même
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'no_self_dependency'
    AND table_name = 'task_dependencies'
  ) THEN
    ALTER TABLE task_dependencies 
    ADD CONSTRAINT no_self_dependency 
    CHECK (depends_on_task_id != task_id);
  END IF;
END $$;

-- Index unique pour éviter les doublons exacts
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_dependencies_unique 
  ON task_dependencies(depends_on_task_id, task_id, dependency_type);

-- ================================================
-- FIN DU SCRIPT
-- ================================================

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Système de dépendances mis à jour avec succès !';
  RAISE NOTICE '📊 Fonctions disponibles :';
  RAISE NOTICE '   - check_dependency_cycle(depends_on_id, task_id)';
  RAISE NOTICE '   - get_task_dependencies(task_id)';
  RAISE NOTICE '   - get_critical_path(project_id)';
  RAISE NOTICE '📋 Vues disponibles :';
  RAISE NOTICE '   - task_dependencies_with_info';
END $$;

-- Pour tester :
-- SELECT * FROM get_task_dependencies('your-task-uuid');
-- SELECT * FROM task_dependencies_with_info;
-- SELECT * FROM get_critical_path();
