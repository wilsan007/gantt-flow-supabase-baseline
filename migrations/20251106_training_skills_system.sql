-- ============================================================================
-- MIGRATION: Système Formations & Compétences Complet
-- Date: 2025-11-06
-- Pattern: Workday, BambooHR, LinkedIn Learning, Cornerstone
-- ============================================================================

-- ============================================================================
-- 1. TABLE: SKILLS (Compétences)
-- ============================================================================
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- Tech, Soft Skills, Business, Leadership, etc.
  description TEXT,
  level_required VARCHAR(50) DEFAULT 'beginner', -- beginner, intermediate, advanced, expert
  is_critical BOOLEAN DEFAULT FALSE, -- Compétence stratégique pour l'entreprise
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT skills_name_tenant_unique UNIQUE(name, tenant_id)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_skills_tenant ON skills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_critical ON skills(is_critical) WHERE is_critical = TRUE;

COMMENT ON TABLE skills IS 'Référentiel de compétences organisationnelles';
COMMENT ON COLUMN skills.is_critical IS 'Compétences stratégiques identifiées par la direction';

-- ============================================================================
-- 2. TABLE: EMPLOYEE_SKILLS (Compétences des Employés)
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level VARCHAR(50) NOT NULL DEFAULT 'beginner', -- beginner, intermediate, advanced, expert
  is_certified BOOLEAN DEFAULT FALSE, -- Validé par manager/HR
  certified_by UUID REFERENCES employees(id),
  certified_at TIMESTAMPTZ,
  years_experience INTEGER DEFAULT 0,
  last_used_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT employee_skills_unique UNIQUE(employee_id, skill_id)
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_skill ON employee_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_certified ON employee_skills(is_certified) WHERE is_certified = TRUE;
CREATE INDEX IF NOT EXISTS idx_employee_skills_level ON employee_skills(level);

COMMENT ON TABLE employee_skills IS 'Inventaire des compétences par employé avec niveaux et certifications';

-- ============================================================================
-- 3. TABLE: TRAININGS (Catalogue Formations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trainings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- Tech, Management, Soft Skills, Compliance, etc.
  type VARCHAR(50) NOT NULL DEFAULT 'internal', -- internal, external, e-learning, certification, webinar
  provider VARCHAR(255), -- LinkedIn Learning, Udemy, Interne, Organisme externe
  duration_hours DECIMAL(5,2) NOT NULL DEFAULT 1,
  cost DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  language VARCHAR(10) DEFAULT 'fr',
  level VARCHAR(50) DEFAULT 'beginner', -- beginner, intermediate, advanced, all_levels
  is_mandatory BOOLEAN DEFAULT FALSE, -- Formation obligatoire (compliance)
  max_participants INTEGER,
  url VARCHAR(500), -- Lien cours externe ou LMS
  objectives TEXT[], -- Liste objectifs pédagogiques
  prerequisites TEXT[], -- Prérequis
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche et filtrage
CREATE INDEX IF NOT EXISTS idx_trainings_tenant ON trainings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trainings_category ON trainings(category);
CREATE INDEX IF NOT EXISTS idx_trainings_type ON trainings(type);
CREATE INDEX IF NOT EXISTS idx_trainings_mandatory ON trainings(is_mandatory) WHERE is_mandatory = TRUE;
CREATE INDEX IF NOT EXISTS idx_trainings_active ON trainings(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE trainings IS 'Catalogue complet des formations disponibles';

-- ============================================================================
-- 4. TABLE: TRAINING_SKILLS (Compétences Développées par Formation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  skill_level_target VARCHAR(50) NOT NULL, -- Niveau visé après formation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT training_skills_unique UNIQUE(training_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_training_skills_training ON training_skills(training_id);
CREATE INDEX IF NOT EXISTS idx_training_skills_skill ON training_skills(skill_id);

COMMENT ON TABLE training_skills IS 'Lien entre formations et compétences développées';

-- ============================================================================
-- 5. TABLE: TRAINING_SESSIONS (Sessions de Formation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255), -- Salle, Adresse, ou "Remote"
  trainer_id UUID REFERENCES employees(id), -- Formateur interne
  external_trainer VARCHAR(255), -- Formateur externe si applicable
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, ongoing, completed, cancelled
  notes TEXT,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_session_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_training ON training_sessions(training_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_dates ON training_sessions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_tenant ON training_sessions(tenant_id);

COMMENT ON TABLE training_sessions IS 'Sessions planifiées de formations avec dates et lieux';

-- ============================================================================
-- 6. TABLE: TRAINING_ENROLLMENTS (Inscriptions Formations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, completed, cancelled, waitlist
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  certificate_url VARCHAR(500), -- URL du certificat stocké
  quiz_score INTEGER CHECK (quiz_score >= 0 AND quiz_score <= 100),
  passing_score INTEGER DEFAULT 80,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  rejection_reason TEXT,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_employee ON training_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_training ON training_enrollments(training_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_session ON training_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON training_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_tenant ON training_enrollments(tenant_id);

COMMENT ON TABLE training_enrollments IS 'Inscriptions et suivi de complétion des formations';

-- ============================================================================
-- 7. TABLE: DEVELOPMENT_PLANS (Plans de Développement Individuels)
-- ============================================================================
CREATE TABLE IF NOT EXISTS development_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled, on_hold
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_by UUID NOT NULL REFERENCES employees(id), -- Manager qui crée
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_plan_dates CHECK (target_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_development_plans_employee ON development_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_development_plans_status ON development_plans(status);
CREATE INDEX IF NOT EXISTS idx_development_plans_tenant ON development_plans(tenant_id);

COMMENT ON TABLE development_plans IS 'Plans de développement individuels (IDP) pour évolution de carrière';

-- ============================================================================
-- 8. TABLE: PLAN_SKILL_GOALS (Objectifs Compétences du Plan)
-- ============================================================================
CREATE TABLE IF NOT EXISTS plan_skill_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  current_level VARCHAR(50) NOT NULL,
  target_level VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, achieved, cancelled
  achieved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_goals_plan ON plan_skill_goals(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_goals_skill ON plan_skill_goals(skill_id);
CREATE INDEX IF NOT EXISTS idx_plan_goals_status ON plan_skill_goals(status);

COMMENT ON TABLE plan_skill_goals IS 'Objectifs de compétences spécifiques dans les plans de développement';

-- ============================================================================
-- TRIGGERS: Updated_at Automatique
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_skills_updated_at ON skills;
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_skills_updated_at ON employee_skills;
CREATE TRIGGER update_employee_skills_updated_at BEFORE UPDATE ON employee_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trainings_updated_at ON trainings;
CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON trainings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_sessions_updated_at ON training_sessions;
CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_enrollments_updated_at ON training_enrollments;
CREATE TRIGGER update_training_enrollments_updated_at BEFORE UPDATE ON training_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_development_plans_updated_at ON development_plans;
CREATE TRIGGER update_development_plans_updated_at BEFORE UPDATE ON development_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plan_skill_goals_updated_at ON plan_skill_goals;
CREATE TRIGGER update_plan_skill_goals_updated_at BEFORE UPDATE ON plan_skill_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Mettre à jour participant count automatiquement
-- ============================================================================
CREATE OR REPLACE FUNCTION update_session_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status IN ('approved', 'completed') THEN
    UPDATE training_sessions 
    SET current_participants = current_participants + 1
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status NOT IN ('approved', 'completed') AND NEW.status IN ('approved', 'completed') THEN
      UPDATE training_sessions 
      SET current_participants = current_participants + 1
      WHERE id = NEW.session_id;
    ELSIF OLD.status IN ('approved', 'completed') AND NEW.status NOT IN ('approved', 'completed') THEN
      UPDATE training_sessions 
      SET current_participants = current_participants - 1
      WHERE id = NEW.session_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status IN ('approved', 'completed') THEN
    UPDATE training_sessions 
    SET current_participants = current_participants - 1
    WHERE id = OLD.session_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_session_count_trigger ON training_enrollments;
CREATE TRIGGER update_session_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON training_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_session_participants_count();

-- ============================================================================
-- RLS POLICIES: Row Level Security par Rôle
-- ============================================================================

-- Enable RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_skill_goals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: SKILLS
-- ============================================================================
DROP POLICY IF EXISTS skills_super_admin_all ON skills;
CREATE POLICY skills_super_admin_all ON skills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = TRUE
    )
  );

DROP POLICY IF EXISTS skills_tenant_read ON skills;
CREATE POLICY skills_tenant_read ON skills
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS skills_hr_manage ON skills;
CREATE POLICY skills_hr_manage ON skills
  FOR ALL USING (
    tenant_id IN (
      SELECT ur.tenant_id FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.is_active = TRUE
      AND r.name IN ('tenant_admin', 'hr_manager')
    )
  );

-- ============================================================================
-- POLICIES: EMPLOYEE_SKILLS
-- ============================================================================
DROP POLICY IF EXISTS employee_skills_super_admin_all ON employee_skills;
CREATE POLICY employee_skills_super_admin_all ON employee_skills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = TRUE
    )
  );

DROP POLICY IF EXISTS employee_skills_own_manage ON employee_skills;
CREATE POLICY employee_skills_own_manage ON employee_skills
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS employee_skills_manager_read ON employee_skills;
CREATE POLICY employee_skills_manager_read ON employee_skills
  FOR SELECT USING (
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN user_roles ur ON e.tenant_id = ur.tenant_id
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.is_active = TRUE
      AND r.name IN ('tenant_admin', 'hr_manager', 'project_manager', 'team_lead')
    )
  );

-- ============================================================================
-- POLICIES: TRAININGS (Catalogue accessible à tous du tenant)
-- ============================================================================
DROP POLICY IF EXISTS trainings_super_admin_all ON trainings;
CREATE POLICY trainings_super_admin_all ON trainings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = TRUE
    )
  );

DROP POLICY IF EXISTS trainings_tenant_read ON trainings;
CREATE POLICY trainings_tenant_read ON trainings
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles 
      WHERE user_id = auth.uid() AND is_active = TRUE
    ) AND is_active = TRUE
  );

DROP POLICY IF EXISTS trainings_hr_manage ON trainings;
CREATE POLICY trainings_hr_manage ON trainings
  FOR ALL USING (
    tenant_id IN (
      SELECT ur.tenant_id FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.is_active = TRUE
      AND r.name IN ('tenant_admin', 'hr_manager')
    )
  );

-- ============================================================================
-- POLICIES: TRAINING_SESSIONS
-- ============================================================================
DROP POLICY IF EXISTS sessions_tenant_read ON training_sessions;
CREATE POLICY sessions_tenant_read ON training_sessions
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS sessions_hr_manage ON training_sessions;
CREATE POLICY sessions_hr_manage ON training_sessions
  FOR ALL USING (
    tenant_id IN (
      SELECT ur.tenant_id FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.is_active = TRUE
      AND r.name IN ('tenant_admin', 'hr_manager')
    )
  );

-- ============================================================================
-- POLICIES: TRAINING_ENROLLMENTS
-- ============================================================================
DROP POLICY IF EXISTS enrollments_own_manage ON training_enrollments;
CREATE POLICY enrollments_own_manage ON training_enrollments
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS enrollments_manager_approve ON training_enrollments;
CREATE POLICY enrollments_manager_approve ON training_enrollments
  FOR ALL USING (
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN user_roles ur ON e.tenant_id = ur.tenant_id
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.is_active = TRUE
      AND r.name IN ('tenant_admin', 'hr_manager', 'project_manager', 'team_lead')
    )
  );

-- ============================================================================
-- POLICIES: DEVELOPMENT_PLANS
-- ============================================================================
DROP POLICY IF EXISTS plans_own_read ON development_plans;
CREATE POLICY plans_own_read ON development_plans
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS plans_manager_manage ON development_plans;
CREATE POLICY plans_manager_manage ON development_plans
  FOR ALL USING (
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN user_roles ur ON e.tenant_id = ur.tenant_id
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.is_active = TRUE
      AND r.name IN ('tenant_admin', 'hr_manager', 'project_manager', 'team_lead')
    ) OR created_by IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- DONNÉES INITIALES: Compétences Standards
-- ============================================================================
-- Note: Ces données seront insérées par tenant lors de l'onboarding
-- Voici des exemples de compétences communes

COMMENT ON SCHEMA public IS 'Schéma principal - Système Formations & Compétences implémenté selon best practices Workday/BambooHR';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
-- Pour appliquer: psql -U postgres -d votre_database -f 20251106_training_skills_system.sql
-- Pour rollback: DROP TABLE IF EXISTS plan_skill_goals, development_plans, training_enrollments, 
--                training_sessions, training_skills, trainings, employee_skills, skills CASCADE;
