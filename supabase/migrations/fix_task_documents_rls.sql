-- ============================================
-- FIX RLS POLICIES FOR task_documents TABLE
-- ============================================
-- Date: 2025-10-25
-- Description: Permet aux utilisateurs d'insérer et lire des documents
--              pour les tâches de leur tenant
-- ============================================

-- 1. Activer RLS sur la table (si pas déjà fait)
ALTER TABLE task_documents ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "task_documents_select_policy" ON task_documents;
DROP POLICY IF EXISTS "task_documents_insert_policy" ON task_documents;
DROP POLICY IF EXISTS "task_documents_update_policy" ON task_documents;
DROP POLICY IF EXISTS "task_documents_delete_policy" ON task_documents;

-- 3. Politique SELECT : Voir les documents de son tenant
CREATE POLICY "task_documents_select_policy"
ON task_documents
FOR SELECT
USING (
  -- Option 1: Vérifier via le tenant_id directement
  tenant_id IN (
    SELECT tenant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
  OR
  -- Option 2: Super Admin peut tout voir
  EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    JOIN roles r ON r.id = ur.role_id
    WHERE p.id = auth.uid()
    AND r.name = 'super_admin'
  )
);

-- 4. Politique INSERT : Créer des documents pour son tenant
CREATE POLICY "task_documents_insert_policy"
ON task_documents
FOR INSERT
WITH CHECK (
  -- Vérifier que l'utilisateur appartient au tenant
  tenant_id IN (
    SELECT tenant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
  AND
  -- Vérifier que uploader_id correspond à l'utilisateur actuel
  uploader_id = auth.uid()
  AND
  -- Vérifier que la tâche existe et appartient au même tenant
  EXISTS (
    SELECT 1 
    FROM tasks 
    WHERE tasks.id = task_documents.task_id
    AND tasks.tenant_id = task_documents.tenant_id
  )
);

-- 5. Politique UPDATE : Modifier seulement ses propres uploads
CREATE POLICY "task_documents_update_policy"
ON task_documents
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
  AND uploader_id = auth.uid()
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
  AND uploader_id = auth.uid()
);

-- 6. Politique DELETE : Supprimer seulement ses propres uploads ou si admin
CREATE POLICY "task_documents_delete_policy"
ON task_documents
FOR DELETE
USING (
  (
    -- L'utilisateur a uploadé le document
    tenant_id IN (
      SELECT tenant_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
    AND uploader_id = auth.uid()
  )
  OR
  (
    -- Ou l'utilisateur est admin/tenant_admin du tenant
    tenant_id IN (
      SELECT tenant_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id
      JOIN roles r ON r.id = ur.role_id
      WHERE p.id = auth.uid()
      AND r.name IN ('super_admin', 'tenant_admin', 'admin')
    )
  )
);

-- 7. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_task_documents_tenant_id 
ON task_documents(tenant_id);

CREATE INDEX IF NOT EXISTS idx_task_documents_uploader_id 
ON task_documents(uploader_id);

CREATE INDEX IF NOT EXISTS idx_task_documents_task_id 
ON task_documents(task_id);

-- 8. Commentaires pour documentation
COMMENT ON POLICY "task_documents_select_policy" ON task_documents IS 
'Permet aux utilisateurs de voir les documents de leur tenant';

COMMENT ON POLICY "task_documents_insert_policy" ON task_documents IS 
'Permet aux utilisateurs de créer des documents pour les tâches de leur tenant';

COMMENT ON POLICY "task_documents_update_policy" ON task_documents IS 
'Permet aux utilisateurs de modifier leurs propres documents';

COMMENT ON POLICY "task_documents_delete_policy" ON task_documents IS 
'Permet aux utilisateurs de supprimer leurs propres documents ou aux admins de supprimer tout document du tenant';

-- ============================================
-- FIN DU SCRIPT
-- ============================================
