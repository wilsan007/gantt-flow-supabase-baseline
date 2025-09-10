-- Add comprehensive test data for all HR modules

-- Insert sample absence types
INSERT INTO public.absence_types (name, code, color, deducts_from_balance, requires_approval, max_days_per_year, tenant_id) VALUES
('Congés Payés', 'CP', '#22C55E', true, true, 25, get_user_tenant_id()),
('Maladie', 'MALADIE', '#EF4444', false, false, NULL, get_user_tenant_id()),
('Formation', 'FORMATION', '#3B82F6', false, true, 10, get_user_tenant_id()),
('RTT', 'RTT', '#F59E0B', true, false, 12, get_user_tenant_id()),
('Congé Sans Solde', 'CSS', '#6B7280', false, true, NULL, get_user_tenant_id())
ON CONFLICT (code, tenant_id) DO NOTHING;

-- Insert sample leave balances for employees
INSERT INTO public.leave_balances (employee_id, absence_type_id, year, total_days, used_days, remaining_days, tenant_id) 
SELECT 
  e.id,
  at.id,
  2024,
  CASE 
    WHEN at.code = 'CP' THEN 25
    WHEN at.code = 'RTT' THEN 12
    ELSE 0
  END,
  CASE 
    WHEN at.code = 'CP' THEN FLOOR(RANDOM() * 10)::numeric
    WHEN at.code = 'RTT' THEN FLOOR(RANDOM() * 5)::numeric
    ELSE 0
  END,
  CASE 
    WHEN at.code = 'CP' THEN 25 - FLOOR(RANDOM() * 10)::numeric
    WHEN at.code = 'RTT' THEN 12 - FLOOR(RANDOM() * 5)::numeric
    ELSE 0
  END,
  get_user_tenant_id()
FROM public.employees e
CROSS JOIN public.absence_types at
WHERE at.code IN ('CP', 'RTT')
ON CONFLICT (employee_id, absence_type_id, year) DO NOTHING;

-- Insert sample leave requests
INSERT INTO public.leave_requests (employee_id, absence_type_id, start_date, end_date, total_days, status, reason, tenant_id) VALUES
('650e8400-e29b-41d4-a716-446655440001', (SELECT id FROM public.absence_types WHERE code = 'CP' LIMIT 1), '2024-07-15', '2024-07-19', 5, 'approved', 'Vacances d''été', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440002', (SELECT id FROM public.absence_types WHERE code = 'FORMATION' LIMIT 1), '2024-06-10', '2024-06-12', 3, 'approved', 'Formation React', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440003', (SELECT id FROM public.absence_types WHERE code = 'CP' LIMIT 1), '2024-08-20', '2024-08-30', 8, 'pending', 'Vacances', get_user_tenant_id())
ON CONFLICT DO NOTHING;

-- Insert sample attendances
INSERT INTO public.attendances (employee_id, date, check_in, check_out, total_hours, status, tenant_id) VALUES
('650e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '1 day', '09:00', '17:30', 7.5, 'present', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '1 day', '08:30', '17:00', 8, 'present', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440003', CURRENT_DATE - INTERVAL '1 day', '09:15', '18:00', 8.25, 'present', get_user_tenant_id())
ON CONFLICT (employee_id, date) DO NOTHING;

-- Insert sample skills
INSERT INTO public.skills (name, category, description, tenant_id) VALUES
('JavaScript', 'Technique', 'Langage de programmation JavaScript', get_user_tenant_id()),
('React', 'Technique', 'Framework React pour interfaces utilisateur', get_user_tenant_id()),
('Management', 'Soft Skills', 'Compétences de management d''équipe', get_user_tenant_id()),
('Communication', 'Soft Skills', 'Compétences de communication', get_user_tenant_id()),
('Marketing Digital', 'Marketing', 'Compétences en marketing digital', get_user_tenant_id())
ON CONFLICT (name, tenant_id) DO NOTHING;

-- Insert sample skill assessments
INSERT INTO public.skill_assessments (employee_id, skill_id, employee_name, position, department, current_level, target_level, assessor, tenant_id) VALUES
('650e8400-e29b-41d4-a716-446655440002', (SELECT id FROM public.skills WHERE name = 'JavaScript' LIMIT 1), 'Jean Martin', 'Développeur Senior', 'Développement', 4, 5, 'Marie Dupont', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440002', (SELECT id FROM public.skills WHERE name = 'React' LIMIT 1), 'Jean Martin', 'Développeur Senior', 'Développement', 4, 5, 'Marie Dupont', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440001', (SELECT id FROM public.skills WHERE name = 'Management' LIMIT 1), 'Marie Dupont', 'Directrice RH', 'RH', 5, 5, 'Auto-évaluation', get_user_tenant_id())
ON CONFLICT DO NOTHING;

-- Insert sample expense categories
INSERT INTO public.expense_categories (name, icon, color, requires_receipt, max_amount, tenant_id) VALUES
('Transport', 'Car', 'bg-blue-100 text-blue-800', true, 500, get_user_tenant_id()),
('Restauration', 'UtensilsCrossed', 'bg-green-100 text-green-800', true, 100, get_user_tenant_id()),
('Hébergement', 'Hotel', 'bg-purple-100 text-purple-800', true, 300, get_user_tenant_id()),
('Formation', 'GraduationCap', 'bg-yellow-100 text-yellow-800', true, 2000, get_user_tenant_id()),
('Bureau', 'Briefcase', 'bg-gray-100 text-gray-800', false, 200, get_user_tenant_id())
ON CONFLICT (name, tenant_id) DO NOTHING;

-- Insert sample expense reports
INSERT INTO public.expense_reports (employee_id, employee_name, title, status, total_amount, submission_date, tenant_id) VALUES
('650e8400-e29b-41d4-a716-446655440002', 'Jean Martin', 'Déplacement client Paris', 'approved', 185.50, '2024-03-15', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440003', 'Sophie Bernard', 'Salon Marketing 2024', 'pending', 450.30, '2024-03-20', get_user_tenant_id())
ON CONFLICT DO NOTHING;

-- Insert sample onboarding processes
INSERT INTO public.onboarding_processes (employee_id, employee_name, position, department, start_date, status, progress, tenant_id) VALUES
('650e8400-e29b-41d4-a716-446655440006', 'Antoine Dubois', 'Développeur Junior', 'Développement', '2023-06-15', 'completed', 100, get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440007', 'Camille Rousseau', 'Assistant RH', 'RH', '2023-07-01', 'in_progress', 75, get_user_tenant_id())
ON CONFLICT DO NOTHING;

-- Insert sample onboarding tasks
INSERT INTO public.onboarding_tasks (process_id, title, description, category, responsible, due_date, status, tenant_id) 
SELECT 
  op.id,
  tasks.title,
  tasks.description,
  tasks.category,
  tasks.responsible,
  op.start_date + INTERVAL '7 days',
  'completed',
  get_user_tenant_id()
FROM public.onboarding_processes op,
(VALUES 
  ('Préparation du poste de travail', 'Configurer ordinateur et accès', 'IT', 'Service IT'),
  ('Formation sécurité', 'Formation aux règles de sécurité', 'Formation', 'RH'),
  ('Présentation équipe', 'Présentation à l''équipe', 'Social', 'Manager')
) AS tasks(title, description, category, responsible)
ON CONFLICT DO NOTHING;

-- Insert sample evaluations
INSERT INTO public.evaluations (employee_id, employee_name, evaluator_id, evaluator_name, type, period, status, overall_score, tenant_id) VALUES
('650e8400-e29b-41d4-a716-446655440002', 'Jean Martin', '650e8400-e29b-41d4-a716-446655440001', 'Marie Dupont', 'annual', '2023', 'completed', 4.2, get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440003', 'Sophie Bernard', '650e8400-e29b-41d4-a716-446655440001', 'Marie Dupont', 'annual', '2023', 'completed', 4.5, get_user_tenant_id())
ON CONFLICT DO NOTHING;

-- Insert sample objectives
INSERT INTO public.objectives (employee_id, employee_name, department, title, description, type, status, progress, due_date, tenant_id) VALUES
('650e8400-e29b-41d4-a716-446655440002', 'Jean Martin', 'Développement', 'Maîtriser React 18', 'Apprendre les nouvelles fonctionnalités de React 18', 'development', 'active', 75, '2024-06-30', get_user_tenant_id()),
('650e8400-e29b-41d4-a716-446655440003', 'Sophie Bernard', 'Marketing', 'Augmenter le taux de conversion', 'Améliorer le taux de conversion du site web de 15%', 'performance', 'active', 60, '2024-12-31', get_user_tenant_id())
ON CONFLICT DO NOTHING;

-- Insert sample safety incidents
INSERT INTO public.safety_incidents (title, description, type, severity, location, reported_by, affected_employee, status, tenant_id) VALUES
('Chute dans escalier', 'Employé a glissé dans l''escalier principal', 'accident', 'minor', 'Escalier principal - 2ème étage', 'Marie Dupont', 'Antoine Dubois', 'resolved', get_user_tenant_id()),
('Écran défaillant', 'Écran qui clignote causant fatigue oculaire', 'ergonomic', 'low', 'Bureau 205', 'Jean Martin', 'Jean Martin', 'in_progress', get_user_tenant_id())
ON CONFLICT DO NOTHING;