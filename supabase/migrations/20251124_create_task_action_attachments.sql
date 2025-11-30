-- Migration: Fichiers pour les actions de tâches projet
-- Date: 2025-11-24
-- Description: Table pour stocker les fichiers attachés aux task_actions (actions de tâches projet)

-- Table: task_action_attachments
CREATE TABLE IF NOT EXISTS task_action_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Référence à l'action de tâche
  task_action_id UUID NOT NULL REFERENCES task_actions(id) ON DELETE CASCADE,
  
  -- Référence à la tâche
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Informations du fichier
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'doc', 'other')),
  file_size BIGINT NOT NULL, -- en bytes
  file_extension TEXT, -- .jpg, .pdf, etc.
  mime_type TEXT,
  
  -- Stockage (chemin Supabase Storage)
  storage_path TEXT NOT NULL,
  storage_bucket TEXT DEFAULT 'action-attachments',
  
  -- Métadonnées
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_task_action_attachments_task_action 
  ON task_action_attachments(task_action_id);
  
CREATE INDEX IF NOT EXISTS idx_task_action_attachments_task 
  ON task_action_attachments(task_id);
  
CREATE INDEX IF NOT EXISTS idx_task_action_attachments_tenant 
  ON task_action_attachments(tenant_id);

-- Trigger pour updated_at
CREATE OR REPLACE TRIGGER update_task_action_attachments_updated_at
  BEFORE UPDATE ON task_action_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE task_action_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les fichiers de leur tenant
CREATE POLICY "Users can view task action attachments in their tenant"
  ON task_action_attachments
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent créer des fichiers pour leur tenant
CREATE POLICY "Users can create task action attachments in their tenant"
  ON task_action_attachments
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
CREATE POLICY "Users can delete their own task action attachments"
  ON task_action_attachments
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- Policy: Super Admin accès complet
CREATE POLICY "Super Admin full access to task action attachments"
  ON task_action_attachments
  FOR ALL
  USING (
    public.is_super_admin()
  );

-- Commentaires
COMMENT ON TABLE task_action_attachments IS 'Fichiers de preuve attachés aux actions de tâches projet';
COMMENT ON COLUMN task_action_attachments.task_action_id IS 'ID de l action de tâche (task_actions table)';
COMMENT ON COLUMN task_action_attachments.task_id IS 'ID de la tâche parente';
