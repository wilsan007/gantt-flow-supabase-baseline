-- 1. Créer la table des modèles d'objectifs (Global OKRs)
CREATE TABLE IF NOT EXISTS objective_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- ex: 'Ressources Humaines', 'IT', 'Ventes'
  tenant_id UUID REFERENCES tenants(id), -- NULL pour les modèles globaux
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insérer les OKR globaux (tenant_id IS NULL)
INSERT INTO objective_templates (title, description, category, tenant_id)
VALUES 
  -- Direction Générale
  ('Assurer la croissance et la pérennité', 'KR1: Augmenter CA +15% | KR2: Réduire coûts -10% | KR3: Satisfaction > 80', 'Direction', NULL),
  
  -- Ressources Humaines
  ('Culture d''entreprise engageante', 'KR1: Engagement +20pts | KR2: Turnover < 5% | KR3: 100% managers formés', 'Ressources Humaines', NULL),
  
  -- Technologie & IT
  ('Infrastructure fiable et sécurisée', 'KR1: Uptime 99.9% | KR2: Latence < 200ms | KR3: 0 failles critiques', 'Technologie & IT', NULL),
  
  -- Ventes & Marketing
  ('Accélérer acquisition et visibilité', 'KR1: 500 leads/trim | KR2: Conversion +15% | KR3: Trafic web +25%', 'Ventes & Marketing', NULL),
  
  -- Opérations
  ('Optimiser efficacité opérationnelle', 'KR1: Support -30% temps | KR2: 3 processus auto | KR3: 95% délais respectés', 'Opérations', NULL);

-- 3. Activer RLS
ALTER TABLE objective_templates ENABLE ROW LEVEL SECURITY;

-- 4. Politique de lecture : Tout le monde peut lire les templates globaux OU ceux de son tenant
DROP POLICY IF EXISTS "Templates viewable by everyone" ON objective_templates;
CREATE POLICY "Templates viewable by tenant or globally" ON objective_templates
  FOR SELECT USING (
    tenant_id IS NULL OR 
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 5. Politique d'écriture : Seuls les admins peuvent créer des templates (optionnel, à affiner selon besoins)
-- Pour l'instant on laisse ouvert ou on restreint si nécessaire. 
-- On va permettre aux utilisateurs authentifiés de créer pour leur tenant.
CREATE POLICY "Users can create templates for their tenant" ON objective_templates
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );
