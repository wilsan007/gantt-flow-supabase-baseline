-- 1. Ajouter la colonne tenant_id à la table objectives
ALTER TABLE objectives 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 2. Scoper les objectifs existants au tenant spécifique
UPDATE objectives
SET tenant_id = '878c5ac9-4e99-4baf-803a-14f8ac964ec4'
WHERE tenant_id IS NULL;

-- 3. Insérer les nouveaux OKR globaux (tenant_id IS NULL)
-- Note: On utilise des valeurs par défaut pour employee_id car ce sont des objectifs d'entreprise génériques
-- On suppose que employee_id peut être NULL ou on ne le met pas s'il n'est pas NOT NULL.
-- Si employee_id est obligatoire, il faudra peut-être revoir la stratégie ou assigner à un admin par défaut.
-- Pour l'instant on tente sans employee_id pour les globaux.

INSERT INTO objectives (title, description, status, progress, due_date, type, tenant_id, created_at, updated_at)
VALUES 
  -- Direction Générale
  ('Assurer la croissance et la pérennité', 'KR1: Augmenter CA +15% | KR2: Réduire coûts -10% | KR3: Satisfaction > 80', 'active', 0, NOW() + INTERVAL '1 year', 'company', NULL, NOW(), NOW()),
  
  -- Ressources Humaines
  ('Culture d''entreprise engageante', 'KR1: Engagement +20pts | KR2: Turnover < 5% | KR3: 100% managers formés', 'active', 0, NOW() + INTERVAL '1 year', 'company', NULL, NOW(), NOW()),
  
  -- Technologie & IT
  ('Infrastructure fiable et sécurisée', 'KR1: Uptime 99.9% | KR2: Latence < 200ms | KR3: 0 failles critiques', 'active', 0, NOW() + INTERVAL '1 year', 'company', NULL, NOW(), NOW()),
  
  -- Ventes & Marketing
  ('Accélérer acquisition et visibilité', 'KR1: 500 leads/trim | KR2: Conversion +15% | KR3: Trafic web +25%', 'active', 0, NOW() + INTERVAL '1 year', 'company', NULL, NOW(), NOW()),
  
  -- Opérations
  ('Optimiser efficacité opérationnelle', 'KR1: Support -30% temps | KR2: 3 processus auto | KR3: 95% délais respectés', 'active', 0, NOW() + INTERVAL '1 year', 'company', NULL, NOW(), NOW());

-- 4. Mettre à jour les politiques RLS
DROP POLICY IF EXISTS "Objectives are viewable by everyone" ON objectives;
CREATE POLICY "Objectives are viewable by tenant or globally" ON objectives
  FOR SELECT USING (
    tenant_id IS NULL OR 
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );
