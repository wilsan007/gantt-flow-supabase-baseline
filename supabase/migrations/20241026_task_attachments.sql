-- Migration: Gestion des fichiers de preuve pour les tâches
-- Date: 26 Oct 2024
-- Description: Table pour stocker les fichiers attachés aux tâches (preuves de réalisation)

-- Table: task_attachments
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Référence à la tâche
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Informations du fichier
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'doc', 'other')),
  file_size BIGINT NOT NULL, -- en bytes
  file_extension TEXT, -- .jpg, .pdf, etc.
  mime_type TEXT,
  
  -- Stockage (URL ou chemin Supabase Storage)
  storage_path TEXT NOT NULL, -- Chemin dans Supabase Storage
  storage_bucket TEXT DEFAULT 'task-attachments',
  
  -- Métadonnées
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT, -- Description optionnelle du fichier
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_task_attachments_task 
  ON task_attachments(task_id);
  
CREATE INDEX IF NOT EXISTS idx_task_attachments_tenant 
  ON task_attachments(tenant_id);
  
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by 
  ON task_attachments(uploaded_by);

-- Trigger pour updated_at
CREATE OR REPLACE TRIGGER update_task_attachments_updated_at
  BEFORE UPDATE ON task_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les fichiers de leur tenant
CREATE POLICY "Users can view task attachments in their tenant"
  ON task_attachments
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent créer des fichiers pour leur tenant
CREATE POLICY "Users can create task attachments in their tenant"
  ON task_attachments
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- Policy: Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own task attachments"
  ON task_attachments
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- Policy: Super Admin accès complet (via rôles)
CREATE POLICY "Super Admin full access to task attachments"
  ON task_attachments
  FOR ALL
  USING (
    public.is_super_admin()
  );

-- Fonction: Compter les fichiers d'une tâche
CREATE OR REPLACE FUNCTION get_task_attachments_count(p_task_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM task_attachments
  WHERE task_id = p_task_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Fonction: Vérifier si une tâche peut être validée (a au moins 1 fichier)
CREATE OR REPLACE FUNCTION can_validate_task(p_task_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  v_count := get_task_attachments_count(p_task_id);
  RETURN v_count > 0;
END;
$$;

-- Fonction: Supprimer tous les fichiers d'une tâche (trigger on delete)
CREATE OR REPLACE FUNCTION delete_task_attachments_on_task_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprimer tous les fichiers liés à cette tâche
  DELETE FROM task_attachments
  WHERE task_id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Trigger: Supprimer automatiquement les fichiers quand la tâche est supprimée
CREATE TRIGGER trigger_delete_task_attachments
  BEFORE DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION delete_task_attachments_on_task_delete();

-- Commentaires
COMMENT ON TABLE task_attachments IS 'Fichiers de preuve attachés aux tâches';
COMMENT ON COLUMN task_attachments.file_type IS 'Type de fichier : image, pdf, doc, other';
COMMENT ON COLUMN task_attachments.storage_path IS 'Chemin dans Supabase Storage';
COMMENT ON FUNCTION get_task_attachments_count IS 'Compte le nombre de fichiers attachés à une tâche';
COMMENT ON FUNCTION can_validate_task IS 'Vérifie si une tâche a au moins 1 fichier pour être validée';
