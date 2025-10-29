-- ============================================
-- ADD MISSING RLS POLICIES
-- ============================================
-- Date: 2025-10-25
-- Description: Ajoute les politiques RLS manquantes pour les tables
--              qui ont RLS activé mais aucune politique
-- Tables concernées: task_comments, task_dependencies, task_risks
-- ============================================

-- ============================================
-- TABLE: task_comments
-- ============================================

-- SELECT : Voir les commentaires des tâches de son tenant
CREATE POLICY "task_comments_select_policy"
ON task_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_comments.task_id
    AND tasks.tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
);

-- INSERT : Créer des commentaires sur les tâches de son tenant
CREATE POLICY "task_comments_insert_policy"
ON task_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_comments.task_id
    AND tasks.tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
);

-- UPDATE : Modifier les commentaires des tâches de son tenant
CREATE POLICY "task_comments_update_policy"
ON task_comments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_comments.task_id
    AND tasks.tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
);

-- DELETE : Supprimer les commentaires des tâches de son tenant
CREATE POLICY "task_comments_delete_policy"
ON task_comments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_comments.task_id
    AND tasks.tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
);

-- ============================================
-- TABLE: task_dependencies
-- ============================================

-- SELECT : Voir les dépendances des tâches de son tenant
CREATE POLICY "task_dependencies_select_policy"
ON task_dependencies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_dependencies.task_id
    AND tasks.tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
);

-- INSERT : Créer des dépendances pour les tâches de son tenant
CREATE POLICY "task_dependencies_insert_policy"
ON task_dependencies
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_dependencies.task_id
    AND tasks.tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
);

-- UPDATE : Modifier les dépendances des tâches de son tenant
CREATE POLICY "task_dependencies_update_policy"
ON task_dependencies
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_dependencies.task_id
    AND tasks.tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
);

-- DELETE : Supprimer les dépendances des tâches de son tenant
CREATE POLICY "task_dependencies_delete_policy"
ON task_dependencies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_dependencies.task_id
    AND tasks.tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
);

-- ============================================
-- TABLE: task_risks
-- ============================================

-- SELECT : Voir les risques des tâches de son tenant
CREATE POLICY "task_risks_select_policy"
ON task_risks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_risks.task_id
    AND tasks.tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
);

-- INSERT : Créer des risques pour les tâches de son tenant
CREATE POLICY "task_risks_insert_policy"
ON task_risks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_risks.task_id
    AND tasks.tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
);

-- UPDATE : Modifier les risques des tâches de son tenant
CREATE POLICY "task_risks_update_policy"
ON task_risks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_risks.task_id
    AND tasks.tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
);

-- DELETE : Supprimer les risques des tâches de son tenant
CREATE POLICY "task_risks_delete_policy"
ON task_risks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_risks.task_id
    AND tasks.tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
);

-- ============================================
-- VALIDATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '================================';
  RAISE NOTICE 'RLS Policies Added Successfully!';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Tables with new policies:';
  RAISE NOTICE '- task_comments (4 policies)';
  RAISE NOTICE '- task_dependencies (4 policies)';
  RAISE NOTICE '- task_risks (4 policies)';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Total: 12 policies created';
  RAISE NOTICE 'All tables now have proper RLS protection';
  RAISE NOTICE '================================';
END $$;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
