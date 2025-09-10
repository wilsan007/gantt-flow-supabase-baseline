-- 1. Supprimer toutes les données incohérentes existantes
DELETE FROM public.absences WHERE start_date > end_date;

-- 2. Ajouter une contrainte pour éviter les dates incohérentes seulement si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_absence_dates' 
    AND table_name = 'absences'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.absences 
    ADD CONSTRAINT check_absence_dates 
    CHECK (start_date <= end_date);
  END IF;
END
$$;

-- 3. Créer un trigger pour calculer automatiquement total_days
CREATE OR REPLACE FUNCTION calculate_absence_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_days := calculate_working_days(NEW.start_date, NEW.end_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Ajouter le trigger si il n'existe pas
DROP TRIGGER IF EXISTS calculate_absence_days_trigger ON public.absences;
CREATE TRIGGER calculate_absence_days_trigger
  BEFORE INSERT OR UPDATE ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION calculate_absence_days();

-- 5. Corriger les données existantes avec des dates cohérentes
UPDATE public.absences 
SET 
  start_date = CURRENT_DATE - INTERVAL '30 days' + (random() * 60)::integer * INTERVAL '1 day',
  end_date = CURRENT_DATE - INTERVAL '30 days' + (random() * 60)::integer * INTERVAL '1 day' + (1 + (random() * 3)::integer) * INTERVAL '1 day'
WHERE start_date > end_date OR total_days <= 0;

-- 6. Recalculer total_days pour toutes les absences existantes
UPDATE public.absences 
SET total_days = calculate_working_days(start_date, end_date)
WHERE total_days != calculate_working_days(start_date, end_date);

-- 7. Ajouter quelques nouvelles données de test cohérentes si pas assez
WITH employee_data AS (
  SELECT id FROM public.employees WHERE tenant_id = get_user_tenant_id() LIMIT 3
),
absence_type_data AS (
  SELECT id, name FROM public.absence_types WHERE tenant_id = get_user_tenant_id() LIMIT 5
)
INSERT INTO public.absences (employee_id, absence_type_id, start_date, end_date, reason, status, medical_certificate, tenant_id)
SELECT 
  ed.id,
  atd.id,
  CURRENT_DATE - INTERVAL '45 days' + (gs.n * 7)::integer * INTERVAL '1 day',
  CURRENT_DATE - INTERVAL '45 days' + (gs.n * 7)::integer * INTERVAL '1 day' + (1 + (gs.n % 3)) * INTERVAL '1 day',
  CASE 
    WHEN atd.name LIKE '%Congé%' THEN 'Congés annuels'
    WHEN atd.name LIKE '%Maladie%' THEN 'Grippe saisonnière'
    WHEN atd.name LIKE '%Formation%' THEN 'Formation technique'
    ELSE 'Raison personnelle'
  END,
  CASE 
    WHEN gs.n % 4 = 0 THEN 'pending'
    WHEN gs.n % 4 = 1 THEN 'approved'
    ELSE 'rejected'
  END,
  CASE WHEN atd.name LIKE '%Maladie%' THEN true ELSE false END,
  get_user_tenant_id()
FROM employee_data ed
CROSS JOIN absence_type_data atd
CROSS JOIN generate_series(1, 2) as gs(n)
WHERE (SELECT COUNT(*) FROM public.absences) < 15
ORDER BY random()
LIMIT 10;