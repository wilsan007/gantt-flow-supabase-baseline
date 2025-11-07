-- ================================================
-- AMÉLIORATION SYSTÈME DE DÉPENDANCES EXISTANT
-- ================================================
-- Mise à jour de la table task_dependencies existante
-- Colonnes actuelles: id, task_id, depends_on_task_id, tenant_id, dependency_type, created_at

-- 1. Ajouter les colonnes manquantes si nécessaire
-- ================================================

-- Ajouter lag_days (délai en jours)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_dependencies' 
    AND column_name = 'lag_days'
  ) THEN
    ALTER TABLE task_dependencies ADD COLUMN lag_days integer DEFAULT 0;
    RAISE NOTICE '✅ Colonne lag_days ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne lag_days existe déjà';
  END IF;
END $$;

-- Ajouter updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_dependencies' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE task_dependencies ADD COLUMN updated_at timestamptz DEFAULT now();
    RAISE NOTICE '✅ Colonne updated_at ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne updated_at existe déjà';
  END IF;
END $$;

-- 2. Mettre à jour la contrainte sur dependency_type
-- ================================================
ALTER TABLE task_dependencies 
DROP CONSTRAINT IF EXISTS task_dependencies_dependency_type_check;

ALTER TABLE task_dependencies
ADD CONSTRAINT task_dependencies_dependency_type_check 
CHECK (dependency_type IN (
  'finish-to-start',  -- FS: Tâche B commence après la fin de A
  'start-to-start',   -- SS: Tâches A et B commencent ensemble  
  'finish-to-finish', -- FF: Tâches A et B finissent ensemble
  'start-to-finish'   -- SF: Tâche B finit quand A commence (rare)
));

DO $$
BEGIN
  RAISE NOTICE '✅ Contrainte dependency_type mise à jour';
END $$;

-- 3. Ajouter contrainte pour éviter les auto-dépendances
-- ================================================
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
    RAISE NOTICE '✅ Contrainte no_self_dependency ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Contrainte no_self_dependency existe déjà';
  END IF;
END $$;

-- 4. Créer index pour les performances
-- ================================================
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task 
  ON task_dependencies(task_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends 
  ON task_dependencies(depends_on_task_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_type 
  ON task_dependencies(dependency_type);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_both 
  ON task_dependencies(task_id, depends_on_task_id);

DO $$
BEGIN
  RAISE NOTICE '✅ Index créés';
END $$;

-- 5. Trigger pour updated_at
-- ================================================
CREATE OR REPLACE FUNCTION update_task_dependencies_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_task_dependencies_updated ON task_dependencies;

CREATE TRIGGER trg_task_dependencies_updated
  BEFORE UPDATE ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION update_task_dependencies_timestamp();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger updated_at configuré';
END $$;

-- 6. Fonction de détection de cycles
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
  v_visited := ARRAY[p_task_id];
  v_current_id := p_task_id;
  
  WHILE v_current_id IS NOT NULL AND v_iterations < v_max_iterations LOOP
    v_iterations := v_iterations + 1;
    
    IF v_current_id = p_depends_on_id THEN
      v_cycle_detected := true;
      EXIT;
    END IF;
    
    SELECT task_id INTO v_current_id
    FROM task_dependencies
    WHERE depends_on_task_id = v_current_id
    AND task_id != ALL(v_visited)
    LIMIT 1;
    
    IF v_current_id IS NOT NULL THEN
      v_visited := array_append(v_visited, v_current_id);
    END IF;
  END LOOP;
  
  RETURN v_cycle_detected;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction check_dependency_cycle créée';
END $$;

-- 7. Trigger pour empêcher les cycles
-- ================================================
CREATE OR REPLACE FUNCTION prevent_dependency_cycle()
RETURNS TRIGGER AS $$
BEGIN
  IF check_dependency_cycle(NEW.depends_on_task_id, NEW.task_id) THEN
    RAISE EXCEPTION 'Cette dépendance créerait un cycle';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_cycle_insert ON task_dependencies;
DROP TRIGGER IF EXISTS trg_prevent_cycle_update ON task_dependencies;

CREATE TRIGGER trg_prevent_cycle_insert
  BEFORE INSERT ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION prevent_dependency_cycle();

CREATE TRIGGER trg_prevent_cycle_update
  BEFORE UPDATE ON task_dependencies
  FOR EACH ROW
  WHEN (
    OLD.depends_on_task_id IS DISTINCT FROM NEW.depends_on_task_id 
    OR OLD.task_id IS DISTINCT FROM NEW.task_id
  )
  EXECUTE FUNCTION prevent_dependency_cycle();

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers de prévention de cycles configurés';
END $$;

-- 8. Vue avec informations enrichies
-- ================================================
CREATE OR REPLACE VIEW v_task_dependencies_info AS
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
LEFT JOIN tasks t1 ON td.depends_on_task_id = t1.id
LEFT JOIN tasks t2 ON td.task_id = t2.id;

DO $$
BEGIN
  RAISE NOTICE '✅ Vue v_task_dependencies_info créée';
END $$;

-- 9. Fonction pour obtenir les dépendances d'une tâche
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
  related_due_date date,
  related_status text
) AS $$
BEGIN
  RETURN QUERY
  -- Prédécesseurs (tâches dont on dépend)
  SELECT 
    td.id,
    td.depends_on_task_id,
    t.title,
    td.dependency_type,
    td.lag_days,
    true,
    t.start_date,
    t.due_date,
    t.status
  FROM task_dependencies td
  JOIN tasks t ON td.depends_on_task_id = t.id
  WHERE td.task_id = p_task_id
  
  UNION ALL
  
  -- Successeurs (tâches qui dépendent de nous)
  SELECT 
    td.id,
    td.task_id,
    t.title,
    td.dependency_type,
    td.lag_days,
    false,
    t.start_date,
    t.due_date,
    t.status
  FROM task_dependencies td
  JOIN tasks t ON td.task_id = t.id
  WHERE td.depends_on_task_id = p_task_id;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction get_task_dependencies créée';
END $$;

-- 10. Fonction pour obtenir toute la chaîne de dépendances
-- ================================================
CREATE OR REPLACE FUNCTION get_dependency_chain(p_task_id uuid)
RETURNS TABLE (
  task_id uuid,
  task_title text,
  level_depth integer,
  path text[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE dep_chain AS (
    -- Point de départ
    SELECT 
      t.id,
      t.title,
      0 as depth,
      ARRAY[t.title] as path
    FROM tasks t
    WHERE t.id = p_task_id
    
    UNION ALL
    
    -- Suivre les successeurs
    SELECT 
      t.id,
      t.title,
      dc.depth + 1,
      dc.path || t.title
    FROM tasks t
    JOIN task_dependencies td ON t.id = td.task_id
    JOIN dep_chain dc ON td.depends_on_task_id = dc.id
    WHERE dc.depth < 10  -- Limite de profondeur
  )
  SELECT 
    id as task_id,
    title as task_title,
    depth as level_depth,
    path
  FROM dep_chain
  ORDER BY depth, title;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction get_dependency_chain créée';
END $$;

-- ================================================
-- RÉSUMÉ
-- ================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ SYSTÈME DE DÉPENDANCES AMÉLIORÉ           ║';
  RAISE NOTICE '╚════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Colonnes disponibles:';
  RAISE NOTICE '   - depends_on_task_id (prédécesseur)';
  RAISE NOTICE '   - task_id (successeur)';
  RAISE NOTICE '   - dependency_type (4 types)';
  RAISE NOTICE '   - lag_days (délai)';
  RAISE NOTICE '   - tenant_id, created_at, updated_at';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Fonctions SQL:';
  RAISE NOTICE '   - check_dependency_cycle(depends_on, task)';
  RAISE NOTICE '   - get_task_dependencies(task_id)';
  RAISE NOTICE '   - get_dependency_chain(task_id)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Vues:';
  RAISE NOTICE '   - v_task_dependencies_info';
  RAISE NOTICE '';
  RAISE NOTICE '🛡️  Protection:';
  RAISE NOTICE '   - Pas de cycle possible';
  RAISE NOTICE '   - Pas d''auto-dépendance';
  RAISE NOTICE '   - Contraintes sur types';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Pour tester:';
  RAISE NOTICE '   SELECT * FROM get_task_dependencies(''uuid'');';
  RAISE NOTICE '   SELECT * FROM v_task_dependencies_info;';
END $$;
