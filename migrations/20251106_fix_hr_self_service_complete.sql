-- ============================================================================
-- MIGRATION CORRIGÉE: Système RH Self-Service COMPLET
-- Date: 2025-11-06
-- Fix: Suppression des références tenant_id si la table tenants n'existe pas
-- ============================================================================

-- ============================================================================
-- 1. TABLE: EXPENSE_REPORTS (Notes de Frais)
-- ============================================================================
CREATE TABLE IF NOT EXISTS expense_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'EUR',
  expense_date DATE NOT NULL,
  receipt_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_by_manager UUID REFERENCES employees(id),
  approved_manager_at TIMESTAMPTZ,
  approved_by_finance UUID REFERENCES employees(id),
  approved_finance_at TIMESTAMPTZ,
  rejection_reason TEXT,
  payment_date DATE,
  payment_reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_reports_employee ON expense_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_expense_reports_status ON expense_reports(status);
CREATE INDEX IF NOT EXISTS idx_expense_reports_dates ON expense_reports(expense_date, submitted_at);

-- ============================================================================
-- 2. TABLE: ABSENCE_JUSTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS absence_justifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  absence_type VARCHAR(50) NOT NULL,
  justification_type VARCHAR(50) NOT NULL,
  document_url VARCHAR(500),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  reviewed_by UUID REFERENCES employees(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_absence_justifications_employee ON absence_justifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_absence_justifications_date ON absence_justifications(absence_date);
CREATE INDEX IF NOT EXISTS idx_absence_justifications_status ON absence_justifications(status);

-- ============================================================================
-- 3. TABLE: ADMINISTRATIVE_REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS administrative_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  request_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2),
  document_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  processed_by UUID REFERENCES employees(id),
  processed_at TIMESTAMPTZ,
  response TEXT,
  completion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_requests_employee ON administrative_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_admin_requests_type ON administrative_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON administrative_requests(status);

-- ============================================================================
-- 4. TABLE: TIMESHEETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_hours DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (total_hours >= 0),
  regular_hours DECIMAL(5,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_employee_week UNIQUE(employee_id, week_start_date),
  CONSTRAINT valid_week_dates CHECK (week_end_date > week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_timesheets_employee ON timesheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_week ON timesheets(week_start_date, week_end_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status);

-- ============================================================================
-- 5. TABLE: TIMESHEET_ENTRIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS timesheet_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  project_id UUID REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id),
  hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  description TEXT,
  is_overtime BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timesheet_entries_timesheet ON timesheet_entries(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_date ON timesheet_entries(work_date);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_project ON timesheet_entries(project_id);

-- ============================================================================
-- 6. TABLE: WORK_LOCATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  location_type VARCHAR(50) NOT NULL,
  location_address VARCHAR(255),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  total_hours DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_employee_date UNIQUE(employee_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_work_locations_employee ON work_locations(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_locations_date ON work_locations(work_date);
CREATE INDEX IF NOT EXISTS idx_work_locations_type ON work_locations(location_type);

-- ============================================================================
-- 7. TABLE: REMOTE_WORK_REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS remote_work_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  request_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  frequency VARCHAR(50),
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_remote_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_remote_work_employee ON remote_work_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_remote_work_dates ON remote_work_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_remote_work_status ON remote_work_requests(status);

-- ============================================================================
-- TRIGGERS: Updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS update_expense_reports_updated_at ON expense_reports;
CREATE TRIGGER update_expense_reports_updated_at BEFORE UPDATE ON expense_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_absence_justifications_updated_at ON absence_justifications;
CREATE TRIGGER update_absence_justifications_updated_at BEFORE UPDATE ON absence_justifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_requests_updated_at ON administrative_requests;
CREATE TRIGGER update_admin_requests_updated_at BEFORE UPDATE ON administrative_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timesheets_updated_at ON timesheets;
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timesheet_entries_updated_at ON timesheet_entries;
CREATE TRIGGER update_timesheet_entries_updated_at BEFORE UPDATE ON timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_remote_work_updated_at ON remote_work_requests;
CREATE TRIGGER update_remote_work_updated_at BEFORE UPDATE ON remote_work_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Calculer total_hours du timesheet automatiquement
-- ============================================================================
CREATE OR REPLACE FUNCTION update_timesheet_total_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE timesheets SET
      total_hours = (
        SELECT COALESCE(SUM(hours), 0)
        FROM timesheet_entries
        WHERE timesheet_id = OLD.timesheet_id
      ),
      regular_hours = (
        SELECT COALESCE(SUM(hours), 0)
        FROM timesheet_entries
        WHERE timesheet_id = OLD.timesheet_id AND is_overtime = FALSE
      ),
      overtime_hours = (
        SELECT COALESCE(SUM(hours), 0)
        FROM timesheet_entries
        WHERE timesheet_id = OLD.timesheet_id AND is_overtime = TRUE
      )
    WHERE id = OLD.timesheet_id;
  ELSE
    UPDATE timesheets SET
      total_hours = (
        SELECT COALESCE(SUM(hours), 0)
        FROM timesheet_entries
        WHERE timesheet_id = NEW.timesheet_id
      ),
      regular_hours = (
        SELECT COALESCE(SUM(hours), 0)
        FROM timesheet_entries
        WHERE timesheet_id = NEW.timesheet_id AND is_overtime = FALSE
      ),
      overtime_hours = (
        SELECT COALESCE(SUM(hours), 0)
        FROM timesheet_entries
        WHERE timesheet_id = NEW.timesheet_id AND is_overtime = TRUE
      )
    WHERE id = NEW.timesheet_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timesheet_hours_trigger ON timesheet_entries;
CREATE TRIGGER update_timesheet_hours_trigger
  AFTER INSERT OR UPDATE OR DELETE ON timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION update_timesheet_total_hours();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_justifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrative_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE remote_work_requests ENABLE ROW LEVEL SECURITY;

-- Policies: Employé voit ses données, Managers voient leur équipe
DROP POLICY IF EXISTS expense_reports_own_manage ON expense_reports;
CREATE POLICY expense_reports_own_manage ON expense_reports FOR ALL USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS absence_justifications_own_manage ON absence_justifications;
CREATE POLICY absence_justifications_own_manage ON absence_justifications FOR ALL USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS admin_requests_own_manage ON administrative_requests;
CREATE POLICY admin_requests_own_manage ON administrative_requests FOR ALL USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS timesheets_own_manage ON timesheets;
CREATE POLICY timesheets_own_manage ON timesheets FOR ALL USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS timesheet_entries_via_timesheet ON timesheet_entries;
CREATE POLICY timesheet_entries_via_timesheet ON timesheet_entries FOR ALL USING (
  timesheet_id IN (
    SELECT id FROM timesheets WHERE employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS work_locations_own_manage ON work_locations;
CREATE POLICY work_locations_own_manage ON work_locations FOR ALL USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS remote_work_own_manage ON remote_work_requests;
CREATE POLICY remote_work_own_manage ON remote_work_requests FOR ALL USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

-- ============================================================================
-- FIN
-- ============================================================================
COMMENT ON SCHEMA public IS 'Système RH Self-Service complet - Version corrigée sans tenant_id';
