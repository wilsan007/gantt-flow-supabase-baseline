-- Tables pour Onboarding/Offboarding
CREATE TABLE public.onboarding_processes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.onboarding_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    process_id UUID NOT NULL REFERENCES public.onboarding_processes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    responsible TEXT NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
    category TEXT NOT NULL CHECK (category IN ('rh', 'it', 'manager', 'employee')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.offboarding_processes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    last_work_day DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.offboarding_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    process_id UUID NOT NULL REFERENCES public.offboarding_processes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    responsible TEXT NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
    category TEXT NOT NULL CHECK (category IN ('rh', 'it', 'manager', 'employee')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Tables pour Performance Management
CREATE TABLE public.objectives (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    employee_name TEXT NOT NULL,
    employee_id UUID,
    department TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('individual', 'team', 'okr')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.key_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    target TEXT NOT NULL,
    current_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.evaluations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_name TEXT NOT NULL,
    employee_id UUID,
    evaluator_name TEXT NOT NULL,
    evaluator_id UUID,
    period TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('annual', 'quarterly', '360')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed')),
    overall_score NUMERIC(3,1) DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.evaluation_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    score NUMERIC(3,1) NOT NULL CHECK (score >= 0 AND score <= 5),
    weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Tables pour Skills & Training
CREATE TABLE public.skills (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.skill_assessments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    current_level INTEGER NOT NULL CHECK (current_level >= 1 AND current_level <= 5),
    target_level INTEGER NOT NULL CHECK (target_level >= 1 AND target_level <= 5),
    last_assessed DATE NOT NULL DEFAULT CURRENT_DATE,
    assessor TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.training_programs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('online', 'classroom', 'workshop', 'certification')),
    duration_hours INTEGER NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'enrolled', 'completed', 'cancelled')),
    participants_count INTEGER DEFAULT 0,
    max_participants INTEGER,
    start_date DATE,
    end_date DATE,
    rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.training_enrollments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    training_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in-progress', 'completed', 'failed')),
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completion_date DATE,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    certificate_url TEXT,
    hours_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Tables pour Expense Management
CREATE TABLE public.expense_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    max_amount NUMERIC(10,2),
    requires_receipt BOOLEAN DEFAULT true,
    color TEXT DEFAULT 'bg-gray-100 text-gray-800',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.expense_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    title TEXT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid')),
    submission_date DATE,
    approval_date DATE,
    approved_by TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.expense_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    category_id UUID REFERENCES public.expense_categories(id),
    category_name TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    receipt_url TEXT,
    mileage INTEGER,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Tables pour Payroll Management
CREATE TABLE public.payroll_periods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'locked', 'processed', 'exported')),
    lock_date DATE,
    processed_date DATE,
    total_gross NUMERIC(12,2) DEFAULT 0,
    total_net NUMERIC(12,2) DEFAULT 0,
    total_employees INTEGER DEFAULT 0,
    total_charges NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id(),
    UNIQUE(year, month, tenant_id)
);

CREATE TABLE public.employee_payrolls (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    position TEXT NOT NULL,
    base_salary NUMERIC(10,2) NOT NULL,
    gross_total NUMERIC(10,2) NOT NULL,
    net_total NUMERIC(10,2) NOT NULL,
    social_charges NUMERIC(10,2) NOT NULL,
    hours_worked INTEGER NOT NULL,
    standard_hours INTEGER NOT NULL,
    overtime_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.payroll_components (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    payroll_id UUID NOT NULL REFERENCES public.employee_payrolls(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bonus', 'deduction', 'benefit')),
    name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    is_percentage BOOLEAN DEFAULT false,
    is_taxable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Tables pour Health & Safety
CREATE TABLE public.safety_incidents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('accident', 'near-miss', 'hazard', 'illness')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location TEXT NOT NULL,
    affected_employee TEXT,
    status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'action-required', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.corrective_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES public.safety_incidents(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    responsible_person TEXT NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

CREATE TABLE public.safety_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('policy', 'procedure', 'training', 'certificate', 'inspection')),
    category TEXT NOT NULL,
    version TEXT NOT NULL,
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'draft')),
    download_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Enable RLS on all new tables
ALTER TABLE public.onboarding_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offboarding_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view tenant onboarding processes" ON public.onboarding_processes FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can create tenant onboarding processes" ON public.onboarding_processes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can update tenant onboarding processes" ON public.onboarding_processes FOR UPDATE USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can delete tenant onboarding processes" ON public.onboarding_processes FOR DELETE USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can view tenant onboarding tasks" ON public.onboarding_tasks FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can create tenant onboarding tasks" ON public.onboarding_tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can update tenant onboarding tasks" ON public.onboarding_tasks FOR UPDATE USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can delete tenant onboarding tasks" ON public.onboarding_tasks FOR DELETE USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can view tenant offboarding processes" ON public.offboarding_processes FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can create tenant offboarding processes" ON public.offboarding_processes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can update tenant offboarding processes" ON public.offboarding_processes FOR UPDATE USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can delete tenant offboarding processes" ON public.offboarding_processes FOR DELETE USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can view tenant offboarding tasks" ON public.offboarding_tasks FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can create tenant offboarding tasks" ON public.offboarding_tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can update tenant offboarding tasks" ON public.offboarding_tasks FOR UPDATE USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can delete tenant offboarding tasks" ON public.offboarding_tasks FOR DELETE USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can manage tenant objectives" ON public.objectives FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can manage tenant key results" ON public.key_results FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can manage tenant evaluations" ON public.evaluations FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can manage tenant evaluation categories" ON public.evaluation_categories FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can manage tenant skills" ON public.skills FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can manage tenant skill assessments" ON public.skill_assessments FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can manage tenant training programs" ON public.training_programs FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can manage tenant training enrollments" ON public.training_enrollments FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can manage tenant expense categories" ON public.expense_categories FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can manage tenant expense reports" ON public.expense_reports FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can manage tenant expense items" ON public.expense_items FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can manage tenant payroll periods" ON public.payroll_periods FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can manage tenant employee payrolls" ON public.employee_payrolls FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can manage tenant payroll components" ON public.payroll_components FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can manage tenant safety incidents" ON public.safety_incidents FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can manage tenant corrective actions" ON public.corrective_actions FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());
CREATE POLICY "Authenticated users can manage tenant safety documents" ON public.safety_documents FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- Create triggers for updated_at
CREATE TRIGGER update_onboarding_processes_updated_at BEFORE UPDATE ON public.onboarding_processes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_onboarding_tasks_updated_at BEFORE UPDATE ON public.onboarding_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_offboarding_processes_updated_at BEFORE UPDATE ON public.offboarding_processes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_offboarding_tasks_updated_at BEFORE UPDATE ON public.offboarding_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON public.objectives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON public.key_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_skill_assessments_updated_at BEFORE UPDATE ON public.skill_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_programs_updated_at BEFORE UPDATE ON public.training_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_enrollments_updated_at BEFORE UPDATE ON public.training_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expense_reports_updated_at BEFORE UPDATE ON public.expense_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payroll_periods_updated_at BEFORE UPDATE ON public.payroll_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_payrolls_updated_at BEFORE UPDATE ON public.employee_payrolls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safety_incidents_updated_at BEFORE UPDATE ON public.safety_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_corrective_actions_updated_at BEFORE UPDATE ON public.corrective_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safety_documents_updated_at BEFORE UPDATE ON public.safety_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();