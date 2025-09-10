-- 1. Supprimer toutes les données incohérentes existantes
DELETE FROM public.absences WHERE start_date > end_date;

-- 2. Ajouter une contrainte pour éviter les dates incohérentes
ALTER TABLE public.absences 
ADD CONSTRAINT check_absence_dates 
CHECK (start_date <= end_date);

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

-- 5. Supprimer toutes les données de test existantes pour recommencer proprement
DELETE FROM public.absences;

-- 6. Insérer des données de test cohérentes
WITH employee_data AS (
  SELECT id, full_name FROM public.employees WHERE tenant_id = get_user_tenant_id() LIMIT 6
),
absence_type_data AS (
  SELECT id, name FROM public.absence_types WHERE tenant_id = get_user_tenant_id()
),
date_ranges AS (
  SELECT 
    CURRENT_DATE - INTERVAL '60 days' + (row_number() OVER () * 3)::integer * INTERVAL '1 day' as start_date,
    CURRENT_DATE - INTERVAL '60 days' + (row_number() OVER () * 3)::integer * INTERVAL '1 day' + 
    (1 + (random() * 4)::integer) * INTERVAL '1 day' as end_date
  FROM generate_series(1, 20) as gs
)
INSERT INTO public.absences (employee_id, absence_type_id, start_date, end_date, reason, status, medical_certificate, tenant_id)
SELECT 
  ed.id,
  atd.id,
  dr.start_date,
  dr.end_date,
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
CROSS JOIN date_ranges dr
WHERE random() > 0.85
ORDER BY random()
LIMIT 30;