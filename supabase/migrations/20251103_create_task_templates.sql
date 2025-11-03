-- Migration: Système de Templates de Tâches
-- Pattern: Notion, Linear, ClickUp
-- Date: 2025-11-03

-- Créer la table task_templates
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations du template
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- Ex: "Onboarding", "Bug Fix", "Feature", "Meeting"
  
  -- Données de la tâche à créer
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure du template_data:
  -- {
  --   "title": "string",
  --   "description": "string",
  --   "priority": "low|medium|high|urgent",
  --   "status": "todo|doing|blocked|done",
  --   "effort_estimate_h": number,
  --   "actions": [
  --     {
  --       "title": "string",
  --       "weight_percentage": number,
  --       "notes": "string"
  --     }
  --   ]
  -- }
  
  -- Métadonnées
  is_public BOOLEAN DEFAULT false, -- Template partagé dans le tenant
  usage_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_task_templates_tenant ON task_templates(tenant_id);
CREATE INDEX idx_task_templates_category ON task_templates(category);
CREATE INDEX idx_task_templates_public ON task_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_task_templates_created_by ON task_templates(created_by);

-- RLS (Row Level Security)
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres templates + templates publics de leur tenant
CREATE POLICY "Users can view own templates and public templates"
  ON task_templates
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()
    )
    AND (created_by = auth.uid() OR is_public = true)
  );

-- Policy: Les utilisateurs peuvent créer des templates
CREATE POLICY "Users can create templates"
  ON task_templates
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Policy: Les utilisateurs peuvent modifier leurs propres templates
CREATE POLICY "Users can update own templates"
  ON task_templates
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policy: Les utilisateurs peuvent supprimer leurs propres templates
CREATE POLICY "Users can delete own templates"
  ON task_templates
  FOR DELETE
  USING (created_by = auth.uid());

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_task_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_task_templates_updated_at();

-- Fonction pour incrémenter usage_count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE task_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE task_templates IS 'Templates de tâches réutilisables par tenant';
COMMENT ON COLUMN task_templates.template_data IS 'Données JSON de la tâche à créer depuis ce template';
COMMENT ON COLUMN task_templates.is_public IS 'Template partagé avec tous les utilisateurs du tenant';
COMMENT ON COLUMN task_templates.usage_count IS 'Nombre de fois que le template a été utilisé';
