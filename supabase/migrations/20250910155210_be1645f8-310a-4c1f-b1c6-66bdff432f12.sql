-- Simple data insertion without complex constraints
INSERT INTO public.absence_types (name, code, color, deducts_from_balance, requires_approval, max_days_per_year, tenant_id) 
SELECT * FROM (VALUES
  ('Congés Payés', 'CP', '#22C55E', true, true, 25, get_user_tenant_id()),
  ('Maladie', 'MALADIE', '#EF4444', false, false, NULL, get_user_tenant_id()),
  ('Formation', 'FORMATION', '#3B82F6', false, true, 10, get_user_tenant_id()),
  ('RTT', 'RTT', '#F59E0B', true, false, 12, get_user_tenant_id())
) AS t(name, code, color, deducts_from_balance, requires_approval, max_days_per_year, tenant_id)
WHERE NOT EXISTS (SELECT 1 FROM public.absence_types WHERE code = t.code AND tenant_id = t.tenant_id);

INSERT INTO public.skills (name, category, description, tenant_id)
SELECT * FROM (VALUES
  ('JavaScript', 'Technique', 'Langage de programmation JavaScript', get_user_tenant_id()),
  ('React', 'Technique', 'Framework React pour interfaces utilisateur', get_user_tenant_id()),
  ('Management', 'Soft Skills', 'Compétences de management d''équipe', get_user_tenant_id()),
  ('Communication', 'Soft Skills', 'Compétences de communication', get_user_tenant_id()),
  ('Marketing Digital', 'Marketing', 'Compétences en marketing digital', get_user_tenant_id())
) AS t(name, category, description, tenant_id)
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE name = t.name AND tenant_id = t.tenant_id);

INSERT INTO public.expense_categories (name, icon, color, requires_receipt, max_amount, tenant_id)
SELECT * FROM (VALUES
  ('Transport', 'Car', 'bg-blue-100 text-blue-800', true, 500, get_user_tenant_id()),
  ('Restauration', 'UtensilsCrossed', 'bg-green-100 text-green-800', true, 100, get_user_tenant_id()),
  ('Hébergement', 'Hotel', 'bg-purple-100 text-purple-800', true, 300, get_user_tenant_id()),
  ('Formation', 'GraduationCap', 'bg-yellow-100 text-yellow-800', true, 2000, get_user_tenant_id()),
  ('Bureau', 'Briefcase', 'bg-gray-100 text-gray-800', false, 200, get_user_tenant_id())
) AS t(name, icon, color, requires_receipt, max_amount, tenant_id)
WHERE NOT EXISTS (SELECT 1 FROM public.expense_categories WHERE name = t.name AND tenant_id = t.tenant_id);