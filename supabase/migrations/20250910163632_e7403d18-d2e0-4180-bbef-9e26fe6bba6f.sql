-- 1. Ajouter plus de types d'absences
INSERT INTO public.absence_types (name, code, color, requires_approval, deducts_from_balance, max_days_per_year, tenant_id) VALUES
('Absence non justifiée', 'ANJ', '#EF4444', false, true, null, get_user_tenant_id()),
('Maladie sans arrêt', 'MSA', '#F97316', true, true, 3, get_user_tenant_id()),
('Congé sans solde', 'CSS', '#8B5CF6', true, false, 30, get_user_tenant_id()),
('Formation', 'FORM', '#10B981', true, false, 20, get_user_tenant_id()),
('Congé de deuil', 'DEUIL', '#374151', true, false, 5, get_user_tenant_id()),
('Congé de mariage', 'MAR', '#EC4899', true, false, 4, get_user_tenant_id()),
('Congé de naissance', 'NAIS', '#06B6D4', true, false, 3, get_user_tenant_id()),
('Mission externe', 'MISS', '#F59E0B', true, false, null, get_user_tenant_id()),
('Récupération', 'RECUP', '#84CC16', false, false, null, get_user_tenant_id())
ON CONFLICT (code, tenant_id) DO NOTHING;

-- 2. Créer la table des absences réelles
CREATE TABLE IF NOT EXISTS public.absences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  absence_type_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days numeric NOT NULL DEFAULT 1,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamp with time zone,
  rejection_reason text,
  medical_certificate boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid DEFAULT get_user_tenant_id()
);

-- 3. Créer la table des retards
CREATE TABLE IF NOT EXISTS public.tardiness (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  date date NOT NULL,
  scheduled_time time without time zone NOT NULL,
  actual_time time without time zone NOT NULL,
  delay_minutes integer NOT NULL,
  reason text,
  justified boolean DEFAULT false,
  justification text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid DEFAULT get_user_tenant_id()
);

-- 4. Activer RLS sur les nouvelles tables
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tardiness ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques RLS pour les absences
CREATE POLICY "HR can manage tenant absences" ON public.absences
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create their absences" ON public.absences
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    tenant_id = get_user_tenant_id() AND 
    employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view tenant absences" ON public.absences
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- 6. Créer les politiques RLS pour les retards
CREATE POLICY "HR can manage tenant tardiness" ON public.tardiness
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create their tardiness" ON public.tardiness
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    tenant_id = get_user_tenant_id() AND 
    employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view tenant tardiness" ON public.tardiness
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- 7. Créer des triggers pour les timestamps
CREATE TRIGGER update_absences_updated_at
  BEFORE UPDATE ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tardiness_updated_at
  BEFORE UPDATE ON public.tardiness
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Insérer des données de test pour les absences
WITH employee_data AS (
  SELECT id, full_name FROM public.employees WHERE tenant_id = get_user_tenant_id() LIMIT 6
),
absence_type_data AS (
  SELECT id, name FROM public.absence_types WHERE tenant_id = get_user_tenant_id()
)
INSERT INTO public.absences (employee_id, absence_type_id, start_date, end_date, total_days, reason, status, medical_certificate, tenant_id)
SELECT 
  ed.id,
  atd.id,
  CURRENT_DATE - INTERVAL '30 days' + (random() * 60)::integer * INTERVAL '1 day',
  CURRENT_DATE - INTERVAL '30 days' + (random() * 60)::integer * INTERVAL '1 day' + INTERVAL '1 day',
  1 + (random() * 3)::integer,
  CASE 
    WHEN atd.name = 'Congé payé' THEN 'Congés annuels'
    WHEN atd.name = 'Maladie' THEN 'Grippe saisonnière'
    WHEN atd.name = 'Absence non justifiée' THEN null
    WHEN atd.name = 'Formation' THEN 'Formation technique'
    ELSE 'Raison personnelle'
  END,
  CASE 
    WHEN random() > 0.8 THEN 'pending'
    WHEN random() > 0.1 THEN 'approved'
    ELSE 'rejected'
  END,
  CASE WHEN atd.name = 'Maladie' THEN true ELSE false END,
  get_user_tenant_id()
FROM employee_data ed
CROSS JOIN absence_type_data atd
WHERE random() > 0.7; -- 30% de chances par employé/type

-- 9. Insérer des données de test pour les retards
WITH employee_data AS (
  SELECT id, full_name FROM public.employees WHERE tenant_id = get_user_tenant_id() LIMIT 6
)
INSERT INTO public.tardiness (employee_id, date, scheduled_time, actual_time, delay_minutes, reason, justified, justification, tenant_id)
SELECT 
  ed.id,
  CURRENT_DATE - (random() * 30)::integer * INTERVAL '1 day',
  '09:00:00'::time,
  ('09:00:00'::time + (5 + random() * 60)::integer * INTERVAL '1 minute'),
  5 + (random() * 60)::integer,
  CASE 
    WHEN random() > 0.7 THEN 'Transport en retard'
    WHEN random() > 0.4 THEN 'Embouteillages'
    WHEN random() > 0.2 THEN 'Problème personnel'
    ELSE 'Réveil tardif'
  END,
  random() > 0.6,
  CASE 
    WHEN random() > 0.6 THEN 'Grève des transports publics'
    WHEN random() > 0.3 THEN 'Rendez-vous médical urgent'
    ELSE null
  END,
  get_user_tenant_id()
FROM employee_data ed
WHERE random() > 0.8; -- 20% de chances par employé