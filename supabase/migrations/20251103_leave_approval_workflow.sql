-- Migration: Workflow d'Approbation des Congés
-- Pattern: BambooHR, Workday, SAP SuccessFactors
-- Date: 2025-11-03

-- ============================================
-- Nettoyage pour permettre la réapplication
-- ============================================
-- Supprimer les triggers (conditionnellement)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_requests') THEN
    DROP TRIGGER IF EXISTS auto_create_leave_workflow ON leave_requests;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_approval_workflows') THEN
    DROP TRIGGER IF EXISTS leave_approval_workflows_updated_at ON leave_approval_workflows;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_approvals') THEN
    DROP TRIGGER IF EXISTS leave_approvals_updated_at ON leave_approvals;
  END IF;
END $$;

-- Supprimer les policies (conditionnellement)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_approvals') THEN
    DROP POLICY IF EXISTS "Users can view leave approvals in their tenant" ON leave_approvals;
    DROP POLICY IF EXISTS "Approvers can create decisions" ON leave_approvals;
    DROP POLICY IF EXISTS "Approvers can update their decisions" ON leave_approvals;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_approval_workflows') THEN
    DROP POLICY IF EXISTS "Users can view workflows in their tenant" ON leave_approval_workflows;
    DROP POLICY IF EXISTS "Only admins can modify workflows" ON leave_approval_workflows;
  END IF;
END $$;

-- Ajouter les colonnes nécessaires à leave_requests si elles n'existent pas
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES auth.users(id);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approval_date TIMESTAMPTZ;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Créer une table pour l'historique des approbations (multi-niveaux)
CREATE TABLE IF NOT EXISTS leave_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Approbateur
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  approver_level INTEGER DEFAULT 1, -- Niveau hiérarchique (1 = manager direct, 2 = N+2, etc.)
  
  -- Décision
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_date TIMESTAMPTZ,
  notes TEXT,
  
  -- Ordre dans le workflow
  sequence_order INTEGER DEFAULT 1,
  is_final_approver BOOLEAN DEFAULT false,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(leave_request_id, approver_id, sequence_order)
);

-- Index pour performance
DROP INDEX IF EXISTS idx_leave_approvals_request;
DROP INDEX IF EXISTS idx_leave_approvals_approver;
DROP INDEX IF EXISTS idx_leave_approvals_status;
DROP INDEX IF EXISTS idx_leave_approvals_tenant;

CREATE INDEX idx_leave_approvals_request ON leave_approvals(leave_request_id);
CREATE INDEX idx_leave_approvals_approver ON leave_approvals(approver_id);
CREATE INDEX idx_leave_approvals_status ON leave_approvals(status);
CREATE INDEX idx_leave_approvals_tenant ON leave_approvals(tenant_id);

-- Table de configuration du workflow par tenant
CREATE TABLE IF NOT EXISTS leave_approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Configuration
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Règles d'approbation
  approval_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   "levels": [
  --     {
  --       "level": 1,
  --       "role": "manager",
  --       "required": true,
  --       "auto_approve_if_absent": false
  --     }
  --   ],
  --   "conditions": {
  --     "days_threshold": 5, // Au-dessus de 5 jours, validation N+2
  --     "requires_hr_approval": true
  --   }
  -- }
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, name)
);

-- RLS (Row Level Security)
ALTER TABLE leave_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_approval_workflows ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs voient les approbations de leur tenant
CREATE POLICY "Users can view leave approvals in their tenant"
  ON leave_approvals
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Policy: Les approbateurs peuvent créer des décisions
CREATE POLICY "Approvers can create decisions"
  ON leave_approvals
  FOR INSERT
  WITH CHECK (
    approver_id = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Policy: Les approbateurs peuvent mettre à jour leurs décisions
CREATE POLICY "Approvers can update their decisions"
  ON leave_approvals
  FOR UPDATE
  USING (approver_id = auth.uid())
  WITH CHECK (approver_id = auth.uid());

-- Policy: Workflows visibles par le tenant
CREATE POLICY "Users can view workflows in their tenant"
  ON leave_approval_workflows
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Policy: Seuls les admins peuvent modifier les workflows
CREATE POLICY "Only admins can modify workflows"
  ON leave_approval_workflows
  FOR ALL
  USING (
    tenant_id IN (
      SELECT ur.tenant_id 
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('tenant_admin', 'super_admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT ur.tenant_id 
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('tenant_admin', 'super_admin')
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_leave_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leave_approvals_updated_at
  BEFORE UPDATE ON leave_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_approvals_updated_at();

CREATE TRIGGER leave_approval_workflows_updated_at
  BEFORE UPDATE ON leave_approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_approvals_updated_at();

-- Fonction pour obtenir le prochain approbateur
CREATE OR REPLACE FUNCTION get_next_approver(p_leave_request_id UUID)
RETURNS TABLE (
  approver_id UUID,
  approver_level INTEGER,
  sequence_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.approver_id,
    la.approver_level,
    la.sequence_order
  FROM leave_approvals la
  WHERE la.leave_request_id = p_leave_request_id
    AND la.status = 'pending'
  ORDER BY la.sequence_order ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour approuver/rejeter une demande
CREATE OR REPLACE FUNCTION process_leave_approval(
  p_approval_id UUID,
  p_status VARCHAR(50),
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_approval leave_approvals%ROWTYPE;
  v_leave_request leave_requests%ROWTYPE;
  v_all_approved BOOLEAN;
  v_result jsonb;
BEGIN
  -- Récupérer l'approbation
  SELECT * INTO v_approval
  FROM leave_approvals
  WHERE id = p_approval_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Approbation non trouvée'
    );
  END IF;
  
  -- Vérifier que l'utilisateur est bien l'approbateur
  IF v_approval.approver_id != auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vous n''êtes pas autorisé à traiter cette approbation'
    );
  END IF;
  
  -- Mettre à jour l'approbation
  UPDATE leave_approvals
  SET 
    status = p_status,
    decision_date = NOW(),
    notes = p_notes,
    updated_at = NOW()
  WHERE id = p_approval_id;
  
  -- Si rejet, rejeter toute la demande
  IF p_status = 'rejected' THEN
    UPDATE leave_requests
    SET 
      approval_status = 'rejected',
      status = 'rejected',
      rejection_reason = p_notes,
      updated_at = NOW()
    WHERE id = v_approval.leave_request_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Demande rejetée',
      'final_status', 'rejected'
    );
  END IF;
  
  -- Si approbation, vérifier si c'est le dernier approbateur
  IF p_status = 'approved' THEN
    -- Vérifier s'il reste des approbations en attente
    SELECT COUNT(*) = 0 INTO v_all_approved
    FROM leave_approvals
    WHERE leave_request_id = v_approval.leave_request_id
      AND status = 'pending';
    
    IF v_all_approved THEN
      -- Toutes les approbations sont OK, approuver la demande
      UPDATE leave_requests
      SET 
        approval_status = 'approved',
        status = 'approved',
        approval_date = NOW(),
        updated_at = NOW()
      WHERE id = v_approval.leave_request_id;
      
      RETURN jsonb_build_object(
        'success', true,
        'message', 'Demande entièrement approuvée',
        'final_status', 'approved'
      );
    ELSE
      RETURN jsonb_build_object(
        'success', true,
        'message', 'Approbation enregistrée, en attente des autres approbateurs',
        'final_status', 'pending'
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer automatiquement le workflow d'approbation
CREATE OR REPLACE FUNCTION create_leave_approval_workflow(p_leave_request_id UUID)
RETURNS void AS $$
DECLARE
  v_leave_request leave_requests%ROWTYPE;
  v_manager_id UUID;
  v_hr_admin_id UUID;
  v_days INTEGER;
BEGIN
  -- Récupérer la demande
  SELECT * INTO v_leave_request
  FROM leave_requests
  WHERE id = p_leave_request_id;
  
  -- Calculer la durée en jours
  v_days := v_leave_request.end_date::date - v_leave_request.start_date::date + 1;
  
  -- Récupérer le manager direct (depuis la table employees)
  SELECT emp.manager_id INTO v_manager_id
  FROM public.employees emp
  WHERE emp.user_id = v_leave_request.employee_id;
  
  -- Créer l'approbation du manager (niveau 1)
  IF v_manager_id IS NOT NULL THEN
    INSERT INTO leave_approvals (
      leave_request_id,
      tenant_id,
      approver_id,
      approver_level,
      status,
      sequence_order,
      is_final_approver
    ) VALUES (
      p_leave_request_id,
      v_leave_request.tenant_id,
      v_manager_id,
      1,
      'pending',
      1,
      v_days <= 5 -- Si <= 5 jours, manager est approbateur final
    );
  END IF;
  
  -- Si > 5 jours, ajouter approbation RH (niveau 2)
  IF v_days > 5 THEN
    -- Trouver un admin RH du tenant
    SELECT ur.user_id INTO v_hr_admin_id
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.tenant_id = v_leave_request.tenant_id
      AND r.name IN ('hr_admin', 'tenant_admin')
    LIMIT 1;
    
    IF v_hr_admin_id IS NOT NULL THEN
      INSERT INTO leave_approvals (
        leave_request_id,
        tenant_id,
        approver_id,
        approver_level,
        status,
        sequence_order,
        is_final_approver
      ) VALUES (
        p_leave_request_id,
        v_leave_request.tenant_id,
        v_hr_admin_id,
        2,
        'pending',
        2,
        true -- RH est approbateur final
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement le workflow lors de la création d'une demande
CREATE OR REPLACE FUNCTION trigger_create_leave_workflow()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer le workflow d'approbation automatiquement
  PERFORM create_leave_approval_workflow(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les nouvelles demandes
CREATE TRIGGER auto_create_leave_workflow
  AFTER INSERT ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_leave_workflow();

-- Commentaires
COMMENT ON TABLE leave_approvals IS 'Historique des approbations de congés avec support multi-niveaux';
COMMENT ON TABLE leave_approval_workflows IS 'Configuration des workflows d''approbation par tenant';
COMMENT ON FUNCTION process_leave_approval IS 'Traite une décision d''approbation (approuver/rejeter)';
COMMENT ON FUNCTION create_leave_approval_workflow IS 'Crée automatiquement le workflow d''approbation pour une demande';
