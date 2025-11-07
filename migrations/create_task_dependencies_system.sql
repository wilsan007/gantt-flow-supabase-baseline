-- ================================================
-- SYSTÈME DE DÉPENDANCES ENTRE TÂCHES - GANTT
-- ================================================
-- Ce script crée le système complet de gestion des dépendances
-- pour le diagramme de Gantt avec crochets drag & drop

-- 1. Créer ou remplacer la table task_dependencies
-- ================================================
CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- IDs des tâches liées
  predecessor_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  successor_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Type de dépendance
  dependency_type text NOT NULL CHECK (dependency_type IN (
    'finish-to-start',  -- FS: Tâche B commence après la fin de A
    'start-to-start',   -- SS: Tâches A et B commencent ensemble
    'finish-to-finish', -- FF: Tâches A et B finissent ensemble
    'start-to-finish'   -- SF: Tâche B finit quand A commence
  )),
  
  -- Délai (lag) en jours (peut être négatif)
  lag_days integer DEFAULT 0,
  
  -- Tenant pour la sécurité RLS
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT no_self_dependency CHECK (predecessor_task_id != successor_task_id),
  CONSTRAINT unique_dependency UNIQUE (predecessor_task_id, successor_task_id, dependency_type)
);

-- 2. Index pour les performances
-- ================================================
CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor 
  ON task_dependencies(predecessor_task_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor 
  ON task_dependencies(successor_task_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_tenant 
  ON task_dependencies(tenant_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_type 
  ON task_dependencies(dependency_type);

-- 3. Trigger pour updated_at
-- ================================================
CREATE OR REPLACE FUNCTION update_task_dependencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_dependencies_updated_at
  BEFORE UPDATE ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION update_task_dependencies_updated_at();

-- 4. Fonction pour auto-remplir tenant_id
-- ================================================
CREATE OR REPLACE FUNCTION set_task_dependency_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- Récupérer le tenant_id de la tâche prédécesseur
  SELECT tenant_id INTO NEW.tenant_id
  FROM tasks
  WHERE id = NEW.predecessor_task_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_dependencies_set_tenant
  BEFORE INSERT ON task_dependencies
  FOR EACH ROW
  WHEN (NEW.tenant_id IS NULL)
  EXECUTE FUNCTION set_task_dependency_tenant();

-- 5. RLS (Row Level Security)
-- ================================================
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les dépendances de leur tenant
CREATE POLICY "Users can view dependencies of their tenant"
  ON task_dependencies
  FOR SELECT
  USING (
    tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid
  );

-- Policy: Les utilisateurs peuvent créer des dépendances
CREATE POLICY "Users can create dependencies"
  ON task_dependencies
  FOR INSERT
  WITH CHECK (
    -- Vérifier que les deux tâches appartiennent au même tenant
    EXISTS (
      SELECT 1 FROM tasks
      WHERE id = predecessor_task_id
      AND tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE id = successor_task_id
      AND tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- Policy: Les utilisateurs peuvent supprimer les dépendances de leur tenant
CREATE POLICY "Users can delete dependencies of their tenant"
  ON task_dependencies
  FOR DELETE
  USING (
    tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid
  );

-- Policy: Les utilisateurs peuvent mettre à jour les dépendances de leur tenant
CREATE POLICY "Users can update dependencies of their tenant"
  ON task_dependencies
  FOR UPDATE
  USING (
    tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid
  )
  WITH CHECK (
    tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid
  );

-- 6. Fonction pour détecter les cycles
-- ================================================
CREATE OR REPLACE FUNCTION check_dependency_cycle(
  p_predecessor_id uuid,
  p_successor_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_cycle_detected boolean := false;
  v_current_id uuid;
  v_visited uuid[];
BEGIN
  -- Initialiser avec la tâche successeur
  v_visited := ARRAY[p_successor_id];
  v_current_id := p_successor_id;
  
  -- Parcourir le graphe des dépendances
  WHILE v_current_id IS NOT NULL LOOP
    -- Vérifier si on est revenu à la tâche prédécesseur
    IF v_current_id = p_predecessor_id THEN
      v_cycle_detected := true;
      EXIT;
    END IF;
    
    -- Trouver le prochain successeur
    SELECT successor_task_id INTO v_current_id
    FROM task_dependencies
    WHERE predecessor_task_id = v_current_id
    AND successor_task_id != ALL(v_visited)
    LIMIT 1;
    
    -- Ajouter aux visités
    IF v_current_id IS NOT NULL THEN
      v_visited := array_append(v_visited, v_current_id);
    END IF;
  END LOOP;
  
  RETURN v_cycle_detected;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger pour empêcher les cycles
-- ================================================
CREATE OR REPLACE FUNCTION prevent_dependency_cycle()
RETURNS TRIGGER AS $$
BEGIN
  IF check_dependency_cycle(NEW.predecessor_task_id, NEW.successor_task_id) THEN
    RAISE EXCEPTION 'Cette dépendance créerait un cycle';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_cycle_on_insert
  BEFORE INSERT ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION prevent_dependency_cycle();

CREATE TRIGGER prevent_cycle_on_update
  BEFORE UPDATE ON task_dependencies
  FOR EACH ROW
  WHEN (
    OLD.predecessor_task_id != NEW.predecessor_task_id 
    OR OLD.successor_task_id != NEW.successor_task_id
  )
  EXECUTE FUNCTION prevent_dependency_cycle();

-- 8. Vues utiles
-- ================================================

-- Vue pour obtenir les dépendances avec les infos des tâches
CREATE OR REPLACE VIEW task_dependencies_with_info AS
SELECT 
  td.id,
  td.predecessor_task_id,
  td.successor_task_id,
  td.dependency_type,
  td.lag_days,
  t1.title as predecessor_title,
  t1.status as predecessor_status,
  t2.title as successor_title,
  t2.status as successor_status,
  td.created_at,
  td.updated_at
FROM task_dependencies td
JOIN tasks t1 ON td.predecessor_task_id = t1.id
JOIN tasks t2 ON td.successor_task_id = t2.id;

-- 9. Fonction pour obtenir toutes les dépendances d'une tâche
-- ================================================
CREATE OR REPLACE FUNCTION get_task_dependencies(p_task_id uuid)
RETURNS TABLE (
  dependency_id uuid,
  related_task_id uuid,
  related_task_title text,
  dependency_type text,
  lag_days integer,
  is_predecessor boolean
) AS $$
BEGIN
  RETURN QUERY
  -- Tâches dont on dépend (prédécesseurs)
  SELECT 
    td.id as dependency_id,
    td.predecessor_task_id as related_task_id,
    t.title as related_task_title,
    td.dependency_type,
    td.lag_days,
    true as is_predecessor
  FROM task_dependencies td
  JOIN tasks t ON td.predecessor_task_id = t.id
  WHERE td.successor_task_id = p_task_id
  
  UNION ALL
  
  -- Tâches qui dépendent de nous (successeurs)
  SELECT 
    td.id as dependency_id,
    td.successor_task_id as related_task_id,
    t.title as related_task_title,
    td.dependency_type,
    td.lag_days,
    false as is_predecessor
  FROM task_dependencies td
  JOIN tasks t ON td.successor_task_id = t.id
  WHERE td.predecessor_task_id = p_task_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FIN DU SCRIPT
-- ================================================

-- Pour tester :
-- SELECT * FROM task_dependencies;
-- SELECT * FROM task_dependencies_with_info;
-- SELECT * FROM get_task_dependencies('task-uuid-here');
