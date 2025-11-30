-- 1. Ajouter la colonne tenant_id à la table skills
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 2. Scoper les compétences existantes (technologiques) au tenant spécifique
UPDATE skills
SET tenant_id = '878c5ac9-4e99-4baf-803a-14f8ac964ec4'
WHERE tenant_id IS NULL;

-- 3. Insérer les nouvelles compétences globales (tenant_id IS NULL)
INSERT INTO skills (name, category, description, tenant_id, created_at, updated_at)
VALUES 
  ('Communication Efficace', 'Soft Skill', 'Capacité à transmettre des idées clairement, à écouter activement et à adapter son discours.', NULL, NOW(), NOW()),
  ('Travail d''Équipe & Collaboration', 'Soft Skill', 'Aptitude à travailler harmonieusement avec les autres et à contribuer aux objectifs communs.', NULL, NOW(), NOW()),
  ('Résolution de Problèmes', 'Soft Skill', 'Capacité à identifier les problèmes, analyser les causes et proposer des solutions.', NULL, NOW(), NOW()),
  ('Adaptabilité & Flexibilité', 'Soft Skill', 'Capacité à s''ajuster rapidement aux changements et aux nouvelles situations.', NULL, NOW(), NOW()),
  ('Gestion du Temps & Organisation', 'Soft Skill', 'Aptitude à prioriser les tâches et à respecter les délais.', NULL, NOW(), NOW()),
  ('Leadership & Initiative', 'Soft Skill', 'Capacité à prendre des initiatives et à motiver les autres.', NULL, NOW(), NOW()),
  ('Compétences Numériques', 'Hard Skill', 'Maîtrise des outils numériques essentiels et aisance avec les nouvelles technologies.', NULL, NOW(), NOW()),
  ('Orientation Client', 'Soft Skill', 'Capacité à comprendre et anticiper les besoins des clients.', NULL, NOW(), NOW()),
  ('Pensée Critique', 'Soft Skill', 'Aptitude à analyser objectivement l''information et prendre des décisions raisonnées.', NULL, NOW(), NOW()),
  ('Gestion de Projet', 'Hard Skill', 'Capacité à planifier, organiser et suivre l''exécution de tâches ou projets.', NULL, NOW(), NOW()),
  ('Créativité & Innovation', 'Soft Skill', 'Aptitude à générer de nouvelles idées et proposer des améliorations.', NULL, NOW(), NOW()),
  ('Négociation & Persuasion', 'Soft Skill', 'Capacité à discuter pour parvenir à un accord et influencer positivement.', NULL, NOW(), NOW()),
  ('Intelligence Émotionnelle', 'Soft Skill', 'Capacité à comprendre et gérer ses émotions et celles des autres.', NULL, NOW(), NOW());

-- 4. Mettre à jour les politiques RLS (si nécessaire)
-- Permettre la lecture des compétences globales ET des compétences du tenant
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON skills;
CREATE POLICY "Skills are viewable by tenant or globally" ON skills
  FOR SELECT USING (
    tenant_id IS NULL OR 
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );
