-- Add comprehensive test data for all HR modules (corrected)

-- Insert sample absence types
INSERT INTO public.absence_types (name, code, color, deducts_from_balance, requires_approval, max_days_per_year, tenant_id) VALUES
('Congés Payés', 'CP', '#22C55E', true, true, 25, get_user_tenant_id()),
('Maladie', 'MALADIE', '#EF4444', false, false, NULL, get_user_tenant_id()),
('Formation', 'FORMATION', '#3B82F6', false, true, 10, get_user_tenant_id()),
('RTT', 'RTT', '#F59E0B', true, false, 12, get_user_tenant_id()),
('Congé Sans Solde', 'CSS', '#6B7280', false, true, NULL, get_user_tenant_id())
ON CONFLICT (code, tenant_id) DO NOTHING;

-- Insert sample leave balances for employees (without remaining_days as it's generated)
INSERT INTO public.leave_balances (employee_id, absence_type_id, year, total_days, used_days, tenant_id) 
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
  get_user_tenant_id()
FROM public.employees e
CROSS JOIN public.absence_types at
WHERE at.code IN ('CP', 'RTT')
ON CONFLICT (employee_id, absence_type_id, year) DO NOTHING;

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