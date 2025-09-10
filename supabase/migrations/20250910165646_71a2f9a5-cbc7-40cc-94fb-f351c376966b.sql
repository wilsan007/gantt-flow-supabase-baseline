-- 1. Nettoyer les données existantes pour recommencer proprement
DELETE FROM public.attendances;
DELETE FROM public.absences;

-- 2. Générer des données complètes d'attendance et d'absences pour les 30 derniers jours
WITH 
-- Récupérer tous les employés
all_employees AS (
  SELECT id, full_name FROM public.employees WHERE tenant_id = get_user_tenant_id()
),
-- Générer une série de dates (30 derniers jours, seulement jours ouvrables)
work_dates AS (
  SELECT date_series::date as work_date
  FROM generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  ) as date_series
  WHERE EXTRACT(DOW FROM date_series) NOT IN (0, 6) -- Exclure weekend
),
-- Créer une combinaison employé x date
employee_dates AS (
  SELECT 
    e.id as employee_id,
    e.full_name,
    wd.work_date,
    -- Probabilité de présence (85% de chance d'être présent)
    CASE 
      WHEN random() > 0.15 THEN 'present'
      ELSE 'absent'
    END as daily_status,
    random() as rand_val
  FROM all_employees e
  CROSS JOIN work_dates wd
)
-- Insérer les attendances pour les employés présents
INSERT INTO public.attendances (
  employee_id, date, check_in, check_out, status, 
  total_hours, break_duration, notes, tenant_id
)
SELECT 
  employee_id,
  work_date,
  -- Heures d'arrivée variables (8h30 à 9h30)
  ('08:30:00'::time + (random() * 60)::integer * INTERVAL '1 minute'),
  -- Heures de départ variables (17h à 18h30)
  ('17:00:00'::time + (random() * 90)::integer * INTERVAL '1 minute'),
  'present',
  -- Calcul automatique des heures travaillées (7.5h à 8.5h)
  7.5 + (random() * 1),
  -- Pause déjeuner (30 à 60 minutes)
  30 + (random() * 30)::integer,
  CASE 
    WHEN rand_val > 0.9 THEN 'Arrivée légèrement en retard'
    WHEN rand_val > 0.8 THEN 'Départ anticipé autorisé'
    ELSE NULL
  END,
  get_user_tenant_id()
FROM employee_dates
WHERE daily_status = 'present';

-- 3. Créer des absences pour les employés non présents
WITH 
all_employees AS (
  SELECT id, full_name FROM public.employees WHERE tenant_id = get_user_tenant_id()
),
work_dates AS (
  SELECT date_series::date as work_date
  FROM generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  ) as date_series
  WHERE EXTRACT(DOW FROM date_series) NOT IN (0, 6)
),
employee_dates AS (
  SELECT 
    e.id as employee_id,
    e.full_name,
    wd.work_date,
    CASE 
      WHEN random() > 0.15 THEN 'present'
      ELSE 'absent'
    END as daily_status,
    random() as rand_type
  FROM all_employees e
  CROSS JOIN work_dates wd
),
absence_types_available AS (
  SELECT id, name, code FROM public.absence_types WHERE tenant_id = get_user_tenant_id()
)
INSERT INTO public.absences (
  employee_id, absence_type_id, start_date, end_date, 
  reason, status, medical_certificate, tenant_id
)
SELECT DISTINCT
  ed.employee_id,
  CASE 
    WHEN ed.rand_type > 0.7 THEN (SELECT id FROM absence_types_available WHERE code = 'CP' LIMIT 1)
    WHEN ed.rand_type > 0.5 THEN (SELECT id FROM absence_types_available WHERE code = 'MAL' LIMIT 1)
    WHEN ed.rand_type > 0.3 THEN (SELECT id FROM absence_types_available WHERE code = 'ANJ' LIMIT 1)
    ELSE (SELECT id FROM absence_types_available WHERE code = 'FORM' LIMIT 1)
  END,
  ed.work_date,
  ed.work_date, -- Absence d'une journée
  CASE 
    WHEN ed.rand_type > 0.7 THEN 'Congés planifiés'
    WHEN ed.rand_type > 0.5 THEN 'Maladie'
    WHEN ed.rand_type > 0.3 THEN NULL -- Absence non justifiée
    ELSE 'Formation externe'
  END,
  CASE 
    WHEN ed.rand_type > 0.3 THEN 'approved'
    ELSE 'pending'
  END,
  CASE 
    WHEN ed.rand_type > 0.5 AND ed.rand_type <= 0.7 THEN true
    ELSE false
  END,
  get_user_tenant_id()
FROM employee_dates ed
WHERE ed.daily_status = 'absent'
  AND NOT EXISTS (
    SELECT 1 FROM public.attendances a 
    WHERE a.employee_id = ed.employee_id 
    AND a.date = ed.work_date
  );

-- 4. Ajouter quelques retards pour les employés présents
WITH present_employees AS (
  SELECT DISTINCT employee_id, date 
  FROM public.attendances 
  WHERE tenant_id = get_user_tenant_id()
    AND random() > 0.9 -- 10% de chance d'avoir un retard
  LIMIT 15
)
INSERT INTO public.tardiness (
  employee_id, date, scheduled_time, actual_time, 
  delay_minutes, reason, justified, justification, tenant_id
)
SELECT 
  pe.employee_id,
  pe.date,
  '09:00:00'::time,
  '09:00:00'::time + (5 + random() * 30)::integer * INTERVAL '1 minute',
  5 + (random() * 30)::integer,
  CASE 
    WHEN random() > 0.6 THEN 'Transport en retard'
    WHEN random() > 0.3 THEN 'Embouteillages'
    ELSE 'Problème personnel'
  END,
  random() > 0.7,
  CASE 
    WHEN random() > 0.7 THEN 'Problème de transport public'
    ELSE NULL
  END,
  get_user_tenant_id()
FROM present_employees pe;