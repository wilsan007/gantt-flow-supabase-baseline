-- Create employees table with proper user_id reference
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  job_title TEXT,
  department_id UUID REFERENCES public.departments(id),
  manager_id UUID REFERENCES public.employees(id),
  hire_date DATE DEFAULT CURRENT_DATE,
  contract_type TEXT DEFAULT 'CDI',
  salary NUMERIC,
  weekly_hours NUMERIC DEFAULT 35,
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  emergency_contact JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policies for employees
CREATE POLICY "Authenticated users can view tenant employees" 
ON public.employees 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can create tenant employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can update tenant employees" 
ON public.employees 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Authenticated users can delete tenant employees" 
ON public.employees 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- Add trigger for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample departments first (if not exists)
INSERT INTO public.departments (id, name, description, budget, manager_id, tenant_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Ressources Humaines', 'Gestion du personnel et recrutement', 150000, NULL, get_user_tenant_id()),
('550e8400-e29b-41d4-a716-446655440002', 'Développement', 'Équipe de développement logiciel', 300000, NULL, get_user_tenant_id()),
('550e8400-e29b-41d4-a716-446655440003', 'Marketing', 'Marketing et communication', 200000, NULL, get_user_tenant_id()),
('550e8400-e29b-41d4-a716-446655440004', 'Finance', 'Comptabilité et finances', 180000, NULL, get_user_tenant_id()),
('550e8400-e29b-41d4-a716-446655440005', 'Commercial', 'Ventes et relations clients', 250000, NULL, get_user_tenant_id())
ON CONFLICT (id) DO NOTHING;

-- Insert sample employees with consistent data
INSERT INTO public.employees (id, user_id, employee_id, full_name, email, phone, job_title, department_id, hire_date, contract_type, salary, tenant_id) VALUES
('650e8400-e29b-41d4-a716-446655440001', NULL, 'EMP001', 'Marie Dupont', 'marie.dupont@company.com', '+33123456781', 'Directrice RH', '550e8400-e29b-41d4-a716-446655440001', '2023-01-15', 'CDI', 65000, get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440002', NULL, 'EMP002', 'Jean Martin', 'jean.martin@company.com', '+33123456782', 'Développeur Senior', '550e8400-e29b-41d4-a716-446655440002', '2023-02-01', 'CDI', 58000, get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440003', NULL, 'EMP003', 'Sophie Bernard', 'sophie.bernard@company.com', '+33123456783', 'Chef Marketing', '550e8400-e29b-41d4-a716-446655440003', '2023-03-10', 'CDI', 55000, get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440004', NULL, 'EMP004', 'Pierre Moreau', 'pierre.moreau@company.com', '+33123456784', 'Comptable', '550e8400-e29b-41d4-a716-446655440004', '2023-04-05', 'CDI', 48000, get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440005', NULL, 'EMP005', 'Julie Leroy', 'julie.leroy@company.com', '+33123456785', 'Commercial Senior', '550e8400-e29b-41d4-a716-446655440005', '2023-05-20', 'CDI', 52000, get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440006', NULL, 'EMP006', 'Antoine Dubois', 'antoine.dubois@company.com', '+33123456786', 'Développeur Junior', '550e8400-e29b-41d4-a716-446655440002', '2023-06-15', 'CDD', 42000, get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440007', NULL, 'EMP007', 'Camille Rousseau', 'camille.rousseau@company.com', '+33123456787', 'Assistant RH', '550e8400-e29b-41d4-a716-446655440001', '2023-07-01', 'CDI', 38000, get_user_tenant_id())
ON CONFLICT (id) DO NOTHING;

-- Update departments to set proper managers
UPDATE public.departments SET manager_id = '650e8400-e29b-41d4-a716-446655440001' WHERE id = '550e8400-e29b-41d4-a716-446655440001';
UPDATE public.departments SET manager_id = '650e8400-e29b-41d4-a716-446655440002' WHERE id = '550e8400-e29b-41d4-a716-446655440002';
UPDATE public.departments SET manager_id = '650e8400-e29b-41d4-a716-446655440003' WHERE id = '550e8400-e29b-41d4-a716-446655440003';
UPDATE public.departments SET manager_id = '650e8400-e29b-41d4-a716-446655440004' WHERE id = '550e8400-e29b-41d4-a716-446655440004';
UPDATE public.departments SET manager_id = '650e8400-e29b-41d4-a716-446655440005' WHERE id = '550e8400-e29b-41d4-a716-446655440005';

-- Insert sample payroll periods
INSERT INTO public.payroll_periods (id, year, month, status, total_gross, total_net, total_employees, total_charges, tenant_id) VALUES
('750e8400-e29b-41d4-a716-446655440001', 2024, 1, 'processed', 358000, 278460, 7, 79540, get_user_tenant_id()),
('750e8400-e29b-41d4-a716-446655440002', 2024, 2, 'processed', 358000, 278460, 7, 79540, get_user_tenant_id()),
('750e8400-e29b-41d4-a716-446655440003', 2024, 3, 'locked', 358000, 278460, 7, 79540, get_user_tenant_id()),
('750e8400-e29b-41d4-a716-446655440004', 2024, 4, 'draft', 0, 0, 7, 0, get_user_tenant_id())
ON CONFLICT (id) DO NOTHING;

-- Insert sample employee payrolls for current period
INSERT INTO public.employee_payrolls (employee_id, employee_name, position, base_salary, gross_total, net_total, social_charges, hours_worked, standard_hours, overtime_hours, period_id, tenant_id) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Marie Dupont', 'Directrice RH', 65000, 65000, 50570, 14430, 154, 154, 0, '750e8400-e29b-41d4-a716-446655440003', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440002', 'Jean Martin', 'Développeur Senior', 58000, 58000, 45120, 12880, 154, 154, 0, '750e8400-e29b-41d4-a716-446655440003', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440003', 'Sophie Bernard', 'Chef Marketing', 55000, 55000, 42790, 12210, 154, 154, 0, '750e8400-e29b-41d4-a716-446655440003', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440004', 'Pierre Moreau', 'Comptable', 48000, 48000, 37344, 10656, 154, 154, 0, '750e8400-e29b-41d4-a716-446655440003', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440005', 'Julie Leroy', 'Commercial Senior', 52000, 52000, 40456, 11544, 154, 154, 0, '750e8400-e29b-41d4-a716-446655440003', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440006', 'Antoine Dubois', 'Développeur Junior', 42000, 42000, 32676, 9324, 154, 154, 0, '750e8400-e29b-41d4-a716-446655440003', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440007', 'Camille Rousseau', 'Assistant RH', 38000, 38000, 29564, 8436, 154, 154, 0, '750e8400-e29b-41d4-a716-446655440003', get_user_tenant_id())
ON CONFLICT (employee_id, period_id) DO NOTHING;