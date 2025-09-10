-- Module RH MVP - Tables essentielles
-- Extension des profils existants pour le module RH
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salary NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'CDI';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_hours NUMERIC DEFAULT 35;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

-- Table des positions/postes
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  description TEXT,
  requirements TEXT,
  salary_range_min NUMERIC,
  salary_range_max NUMERIC,
  tenant_id UUID DEFAULT get_user_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des types d'absences
CREATE TABLE public.absence_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  requires_approval BOOLEAN DEFAULT true,
  deducts_from_balance BOOLEAN DEFAULT true,
  max_days_per_year INTEGER,
  tenant_id UUID DEFAULT get_user_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(code, tenant_id)
);

-- Table des soldes de congés
CREATE TABLE public.leave_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  absence_type_id UUID NOT NULL REFERENCES public.absence_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_days NUMERIC DEFAULT 0,
  used_days NUMERIC DEFAULT 0,
  remaining_days NUMERIC GENERATED ALWAYS AS (total_days - used_days) STORED,
  tenant_id UUID DEFAULT get_user_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, absence_type_id, year)
);

-- Table des demandes d'absence
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  absence_type_id UUID NOT NULL REFERENCES public.absence_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  tenant_id UUID DEFAULT get_user_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des présences/pointages
CREATE TABLE public.attendances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  break_duration INTEGER DEFAULT 0, -- en minutes
  total_hours NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN check_in IS NOT NULL AND check_out IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (check_out - check_in))/3600 - (break_duration/60.0)
      ELSE 0 
    END
  ) STORED,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day')),
  notes TEXT,
  tenant_id UUID DEFAULT get_user_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Table des timesheets (lien avec les tâches existantes)
CREATE TABLE public.timesheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  hours NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  billable BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id),
  tenant_id UUID DEFAULT get_user_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des documents employés
CREATE TABLE public.employee_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  expires_at DATE,
  is_confidential BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES public.profiles(id),
  tenant_id UUID DEFAULT get_user_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Données par défaut pour les types d'absence
INSERT INTO public.absence_types (name, code, color, requires_approval, deducts_from_balance, max_days_per_year, tenant_id)
VALUES 
  ('Congés payés', 'CP', '#10B981', true, true, 25, get_user_tenant_id()),
  ('Maladie', 'SICK', '#EF4444', false, false, null, get_user_tenant_id()),
  ('Formation', 'TRAINING', '#3B82F6', true, false, null, get_user_tenant_id()),
  ('Congé sans solde', 'UNPAID', '#6B7280', true, false, null, get_user_tenant_id()),
  ('RTT', 'RTT', '#8B5CF6', true, true, 10, get_user_tenant_id());

-- Fonction pour calculer les jours ouvrés entre deux dates
CREATE OR REPLACE FUNCTION calculate_working_days(start_date DATE, end_date DATE)
RETURNS NUMERIC AS $$
DECLARE
  working_days NUMERIC := 0;
  current_date DATE := start_date;
BEGIN
  WHILE current_date <= end_date LOOP
    -- Exclure weekends (samedi = 6, dimanche = 0)
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      working_days := working_days + 1;
    END IF;
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN working_days;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger pour calculer automatiquement les jours de congé
CREATE OR REPLACE FUNCTION calculate_leave_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_days := calculate_working_days(NEW.start_date, NEW.end_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_leave_days_trigger
  BEFORE INSERT OR UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_leave_days();

-- Enable RLS on all new tables
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view tenant positions" ON public.positions FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "HR can manage tenant positions" ON public.positions FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can view tenant absence types" ON public.absence_types FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "HR can manage tenant absence types" ON public.absence_types FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can view tenant leave balances" ON public.leave_balances FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "HR can manage tenant leave balances" ON public.leave_balances FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can view tenant leave requests" ON public.leave_requests FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Users can create their leave requests" ON public.leave_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id() AND employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their leave requests" ON public.leave_requests FOR UPDATE USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id() AND employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "HR can manage tenant leave requests" ON public.leave_requests FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can view tenant attendances" ON public.attendances FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Users can manage their attendances" ON public.attendances FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id() AND employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "HR can manage tenant attendances" ON public.attendances FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can view tenant timesheets" ON public.timesheets FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Users can manage their timesheets" ON public.timesheets FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id() AND employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "HR can manage tenant timesheets" ON public.timesheets FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can view accessible employee documents" ON public.employee_documents FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id() AND (employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR NOT is_confidential));
CREATE POLICY "HR can manage tenant employee documents" ON public.employee_documents FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- Triggers pour updated_at
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_absence_types_updated_at BEFORE UPDATE ON public.absence_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON public.leave_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON public.attendances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON public.timesheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON public.employee_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();