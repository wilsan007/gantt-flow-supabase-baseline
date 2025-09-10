-- Insérer des données de test pour les tables vides

-- 1. Insérer des positions
INSERT INTO public.positions (title, description, department_id, salary_range_min, salary_range_max, requirements, tenant_id) VALUES
('Développeur Senior', 'Développement d''applications web et mobile', (SELECT id FROM public.departments WHERE name LIKE '%Tech%' OR name LIKE '%IT%' LIMIT 1), 45000, 65000, 'Master en informatique, 5+ ans d''expérience en développement', get_user_tenant_id()),
('Chef de Projet', 'Gestion de projets informatiques et coordination d''équipes', (SELECT id FROM public.departments WHERE name LIKE '%Tech%' OR name LIKE '%IT%' LIMIT 1), 50000, 70000, 'Formation en gestion de projet, certification PMP souhaitable', get_user_tenant_id()),
('Analyste Business', 'Analyse des besoins métier et spécifications fonctionnelles', (SELECT id FROM public.departments WHERE name LIKE '%Business%' OR name LIKE '%Vente%' LIMIT 1), 40000, 55000, 'Formation en analyse business, connaissance des processus métier', get_user_tenant_id()),
('Responsable RH', 'Gestion des ressources humaines et recrutement', (SELECT id FROM public.departments WHERE name LIKE '%RH%' OR name LIKE '%Human%' LIMIT 1), 42000, 58000, 'Master en RH, expérience en recrutement et gestion du personnel', get_user_tenant_id()),
('Comptable', 'Gestion de la comptabilité générale et analytique', (SELECT id FROM public.departments WHERE name LIKE '%Finance%' OR name LIKE '%Compta%' LIMIT 1), 35000, 48000, 'Formation comptable, maîtrise des logiciels de gestion', get_user_tenant_id()),
('Designer UX/UI', 'Conception d''interfaces utilisateur et expérience utilisateur', (SELECT id FROM public.departments WHERE name LIKE '%Tech%' OR name LIKE '%Design%' LIMIT 1), 38000, 52000, 'Formation en design, portfolio démontrant les compétences UX/UI', get_user_tenant_id());

-- 2. Créer des périodes de paie
INSERT INTO public.payroll_periods (year, month, status, total_employees, total_gross, total_net, total_charges, tenant_id) VALUES
(2024, 11, 'processed', 8, 38400, 30720, 7680, get_user_tenant_id()),
(2024, 12, 'processed', 8, 38400, 30720, 7680, get_user_tenant_id()),
(2025, 1, 'draft', 8, 38400, 30720, 7680, get_user_tenant_id());

-- 3. Créer les fiches de paie pour les employés
WITH period_data AS (
  SELECT id as period_id, year, month FROM public.payroll_periods WHERE tenant_id = get_user_tenant_id()
),
employee_data AS (
  SELECT 
    e.id as employee_id,
    e.full_name as employee_name,
    e.job_title as position,
    COALESCE(e.salary, 3200) as base_salary,
    160 as standard_hours,
    CASE 
      WHEN random() > 0.7 THEN floor(random() * 20)::integer
      ELSE 0
    END as overtime_hours
  FROM public.employees e
  WHERE e.tenant_id = get_user_tenant_id()
  LIMIT 8
)
INSERT INTO public.employee_payrolls (
  period_id, employee_id, employee_name, position, base_salary, 
  standard_hours, overtime_hours, hours_worked, gross_total, social_charges, net_total, tenant_id
)
SELECT 
  pd.period_id,
  ed.employee_id,
  ed.employee_name,
  ed.position,
  ed.base_salary,
  ed.standard_hours,
  ed.overtime_hours,
  ed.standard_hours + ed.overtime_hours as hours_worked,
  ed.base_salary + (ed.overtime_hours * (ed.base_salary / 160 * 1.5)) as gross_total,
  (ed.base_salary + (ed.overtime_hours * (ed.base_salary / 160 * 1.5))) * 0.2 as social_charges,
  (ed.base_salary + (ed.overtime_hours * (ed.base_salary / 160 * 1.5))) * 0.8 as net_total,
  get_user_tenant_id()
FROM period_data pd
CROSS JOIN employee_data ed
WHERE pd.year = 2024 AND pd.month IN (11, 12);

-- 4. Créer des composants de paie (primes, déductions)
WITH payroll_data AS (
  SELECT id as payroll_id FROM public.employee_payrolls WHERE tenant_id = get_user_tenant_id()
)
INSERT INTO public.payroll_components (payroll_id, name, type, amount, is_percentage, is_taxable, tenant_id)
SELECT 
  pd.payroll_id,
  'Prime de performance',
  'bonus',
  200 + (random() * 300)::numeric,
  false,
  true,
  get_user_tenant_id()
FROM payroll_data pd
WHERE random() > 0.6  -- 40% des employés ont une prime

UNION ALL

SELECT 
  pd.payroll_id,
  'Tickets restaurant',
  'benefit',
  120,
  false,
  false,
  get_user_tenant_id()
FROM payroll_data pd
WHERE random() > 0.3  -- 70% des employés ont des tickets

UNION ALL

SELECT 
  pd.payroll_id,
  'Mutuelle entreprise',
  'deduction',
  45,
  false,
  false,
  get_user_tenant_id()
FROM payroll_data pd
WHERE random() > 0.2; -- 80% des employés ont la mutuelle