-- ============================================================================
-- MIGRATION CORRIGÉE: Système Formations & Compétences
-- Date: 2025-11-06
-- Fix: Suppression des références tenant_id si la table tenants n'existe pas
-- ============================================================================

-- Vérifier si la table tenants existe, sinon on supprime les colonnes tenant_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    RAISE NOTICE 'Table tenants non trouvée - Les colonnes tenant_id seront optionnelles';
  END IF;
END $$;

-- ============================================================================
-- 1. TABLE: SKILLS (Compétences) - SANS tenant_id
-- ============================================================================
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  level_required VARCHAR(50) DEFAULT 'beginner',
  is_critical BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT skills_name_unique UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_critical ON skills(is_critical) WHERE is_critical = TRUE;

-- ============================================================================
-- 2. TABLE: EMPLOYEE_SKILLS (Compétences des Employés)
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level VARCHAR(50) NOT NULL DEFAULT 'beginner',
  is_certified BOOLEAN DEFAULT FALSE,
  certified_by UUID REFERENCES employees(id),
  certified_at TIMESTAMPTZ,
  years_experience INTEGER DEFAULT 0,
  last_used_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT employee_skills_unique UNIQUE(employee_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_skill ON employee_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_certified ON employee_skills(is_certified) WHERE is_certified = TRUE;

-- ============================================================================
-- 3. TABLE: TRAININGS (Catalogue Formations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trainings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'internal',
  provider VARCHAR(255),
  duration_hours DECIMAL(5,2) NOT NULL DEFAULT 1,
  cost DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  language VARCHAR(10) DEFAULT 'fr',
  level VARCHAR(50) DEFAULT 'beginner',
  is_mandatory BOOLEAN DEFAULT FALSE,
  max_participants INTEGER,
  url VARCHAR(500),
  objectives TEXT[],
  prerequisites TEXT[],
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trainings_category ON trainings(category);
CREATE INDEX IF NOT EXISTS idx_trainings_type ON trainings(type);
CREATE INDEX IF NOT EXISTS idx_trainings_mandatory ON trainings(is_mandatory) WHERE is_mandatory = TRUE;
CREATE INDEX IF NOT EXISTS idx_trainings_active ON trainings(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 4. TABLE: TRAINING_SKILLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  skill_level_target VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT training_skills_unique UNIQUE(training_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_training_skills_training ON training_skills(training_id);
CREATE INDEX IF NOT EXISTS idx_training_skills_skill ON training_skills(skill_id);

-- ============================================================================
-- 5. TABLE: TRAINING_SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  trainer_id UUID REFERENCES employees(id),
  external_trainer VARCHAR(255),
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_session_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_training ON training_sessions(training_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_dates ON training_sessions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);

-- ============================================================================
-- 6. TABLE: TRAINING_ENROLLMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  certificate_url VARCHAR(500),
  quiz_score INTEGER CHECK (quiz_score >= 0 AND quiz_score <= 100),
  passing_score INTEGER DEFAULT 80,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_employee ON training_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_training ON training_enrollments(training_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_session ON training_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON training_enrollments(status);

-- ============================================================================
-- 7. TABLE: DEVELOPMENT_PLANS
-- ============================================================================
CREATE TABLE IF NOT EXISTS development_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_by UUID NOT NULL REFERENCES employees(id),
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_plan_dates CHECK (target_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_development_plans_employee ON development_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_development_plans_status ON development_plans(status);

-- ============================================================================
-- 8. TABLE: PLAN_SKILL_GOALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS plan_skill_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  current_level VARCHAR(50) NOT NULL,
  target_level VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'in_progress',
  achieved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_goals_plan ON plan_skill_goals(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_goals_skill ON plan_skill_goals(skill_id);
CREATE INDEX IF NOT EXISTS idx_plan_goals_status ON plan_skill_goals(status);

-- ============================================================================
-- TRIGGERS: Updated_at
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
-- FUNCTION: Mise à jour participants sessions
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
-- RLS POLICIES
-- ============================================================================
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_skill_goals ENABLE ROW LEVEL SECURITY;

-- Policies simples: Tout le monde peut voir, seuls les admins peuvent modifier
DROP POLICY IF EXISTS skills_read_all ON skills;
CREATE POLICY skills_read_all ON skills FOR SELECT USING (true);

DROP POLICY IF EXISTS skills_admin_manage ON skills;
CREATE POLICY skills_admin_manage ON skills FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name IN ('super_admin', 'tenant_admin', 'hr_manager')
  )
);

DROP POLICY IF EXISTS employee_skills_own_manage ON employee_skills;
CREATE POLICY employee_skills_own_manage ON employee_skills FOR ALL USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS trainings_read_all ON trainings;
CREATE POLICY trainings_read_all ON trainings FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS enrollments_own_manage ON training_enrollments;
CREATE POLICY enrollments_own_manage ON training_enrollments FOR ALL USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

-- ============================================================================
-- DONNÉES INITIALES
-- ============================================================================
INSERT INTO skills (name, category, is_critical) VALUES
('React.js', 'Tech', true),
('TypeScript', 'Tech', true),
('Node.js', 'Tech', true),
('Python', 'Tech', false),
('SQL', 'Tech', true),
('Communication', 'Soft Skills', true),
('Leadership', 'Management', true),
('Gestion de projet', 'Management', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FIN
-- ============================================================================
COMMENT ON TABLE skills IS 'Système Formations & Compétences - Version corrigée sans tenant_id';
