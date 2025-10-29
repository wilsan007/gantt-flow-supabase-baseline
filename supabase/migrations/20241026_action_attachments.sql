-- Migration: Gestion des fichiers de preuve pour les actions
-- Date: 26 Oct 2024
-- Description: Table pour stocker les fichiers attachés aux actions (preuves de réalisation)

-- Table: operational_action_attachments
CREATE TABLE IF NOT EXISTS operational_action_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Référence à l'action template
  action_template_id UUID NOT NULL REFERENCES operational_action_templates(id) ON DELETE CASCADE,
  
  -- Référence optionnelle à l'occurrence/tâche si l'action est instanciée
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Informations du fichier
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'doc', 'other')),
  file_size BIGINT NOT NULL, -- en bytes
  file_extension TEXT, -- .jpg, .pdf, etc.
  mime_type TEXT,
  
  -- Stockage (URL ou chemin Supabase Storage)
  storage_path TEXT NOT NULL, -- Chemin dans Supabase Storage
  storage_bucket TEXT DEFAULT 'action-attachments',
  
  -- Métadonnées
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT, -- Description optionnelle du fichier
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_action_attachments_action_template 
  ON operational_action_attachments(action_template_id);
  
CREATE INDEX IF NOT EXISTS idx_action_attachments_task 
  ON operational_action_attachments(task_id);
  
CREATE INDEX IF NOT EXISTS idx_action_attachments_tenant 
  ON operational_action_attachments(tenant_id);
  
CREATE INDEX IF NOT EXISTS idx_action_attachments_uploaded_by 
  ON operational_action_attachments(uploaded_by);

-- Trigger pour updated_at
CREATE OR REPLACE TRIGGER update_action_attachments_updated_at
  BEFORE UPDATE ON operational_action_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE operational_action_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les fichiers de leur tenant
CREATE POLICY "Users can view attachments in their tenant"
  ON operational_action_attachments
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent créer des fichiers pour leur tenant
CREATE POLICY "Users can create attachments in their tenant"
  ON operational_action_attachments
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
CREATE POLICY "Users can delete their own attachments"
  ON operational_action_attachments
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
CREATE POLICY "Super Admin full access to action attachments"
  ON operational_action_attachments
  FOR ALL
  USING (
    public.is_super_admin()
  );

-- Fonction: Compter les fichiers d'une action
CREATE OR REPLACE FUNCTION get_action_attachments_count(p_action_template_id UUID, p_task_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_task_id IS NOT NULL THEN
    -- Compter pour une tâche spécifique
    SELECT COUNT(*)
    INTO v_count
    FROM operational_action_attachments
    WHERE action_template_id = p_action_template_id
    AND task_id = p_task_id;
  ELSE
    -- Compter tous les fichiers du template
    SELECT COUNT(*)
    INTO v_count
    FROM operational_action_attachments
    WHERE action_template_id = p_action_template_id;
  END IF;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Fonction: Vérifier si une action peut être validée (a au moins 1 fichier)
CREATE OR REPLACE FUNCTION can_validate_action(p_action_template_id UUID, p_task_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  v_count := get_action_attachments_count(p_action_template_id, p_task_id);
  RETURN v_count > 0;
END;
$$;

-- Fonction: Supprimer tous les fichiers d'une action (trigger on delete)
CREATE OR REPLACE FUNCTION delete_action_attachments_on_action_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprimer tous les fichiers liés à ce template
  DELETE FROM operational_action_attachments
  WHERE action_template_id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Trigger: Supprimer automatiquement les fichiers quand l'action est supprimée
CREATE TRIGGER trigger_delete_action_attachments
  BEFORE DELETE ON operational_action_templates
  FOR EACH ROW
  EXECUTE FUNCTION delete_action_attachments_on_action_delete();

-- Commentaires
COMMENT ON TABLE operational_action_attachments IS 'Fichiers de preuve attachés aux actions opérationnelles';
COMMENT ON COLUMN operational_action_attachments.file_type IS 'Type de fichier : image, pdf, doc, other';
COMMENT ON COLUMN operational_action_attachments.storage_path IS 'Chemin dans Supabase Storage';
COMMENT ON FUNCTION get_action_attachments_count IS 'Compte le nombre de fichiers attachés à une action';
COMMENT ON FUNCTION can_validate_action IS 'Vérifie si une action a au moins 1 fichier pour être validée';
