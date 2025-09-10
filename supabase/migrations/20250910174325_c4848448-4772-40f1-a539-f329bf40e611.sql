-- Nettoyer les données et créer les éléments manquants uniquement

-- 1. Supprimer les enregistrements orphelins dans toutes les tables
DELETE FROM public.absences 
WHERE employee_id NOT IN (
    SELECT user_id FROM public.employees WHERE user_id IS NOT NULL
);

DELETE FROM public.attendances 
WHERE employee_id NOT IN (
    SELECT user_id FROM public.employees WHERE user_id IS NOT NULL
);

DELETE FROM public.employee_documents 
WHERE employee_id NOT IN (
    SELECT user_id FROM public.employees WHERE user_id IS NOT NULL
);

DELETE FROM public.employee_payrolls 
WHERE employee_id NOT IN (
    SELECT user_id FROM public.employees WHERE user_id IS NOT NULL
);

DELETE FROM public.leave_balances 
WHERE employee_id NOT IN (
    SELECT user_id FROM public.employees WHERE user_id IS NOT NULL
);

DELETE FROM public.leave_requests 
WHERE employee_id NOT IN (
    SELECT user_id FROM public.employees WHERE user_id IS NOT NULL
);

DELETE FROM public.skill_assessments 
WHERE employee_id NOT IN (
    SELECT user_id FROM public.employees WHERE user_id IS NOT NULL
);

DELETE FROM public.tardiness 
WHERE employee_id NOT IN (
    SELECT user_id FROM public.employees WHERE user_id IS NOT NULL
);

-- 2. Mettre à jour les employee_id pour pointer vers employees.user_id quand c'est nécessaire
UPDATE public.absences 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE absences.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL
AND absences.employee_id != e.user_id;

UPDATE public.attendances 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE attendances.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL
AND attendances.employee_id != e.user_id;

UPDATE public.employee_documents 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE employee_documents.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL
AND employee_documents.employee_id != e.user_id;

UPDATE public.employee_payrolls 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE employee_payrolls.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL
AND employee_payrolls.employee_id != e.user_id;

UPDATE public.leave_balances 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE leave_balances.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL
AND leave_balances.employee_id != e.user_id;

UPDATE public.leave_requests 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE leave_requests.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL
AND leave_requests.employee_id != e.user_id;

UPDATE public.skill_assessments 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE skill_assessments.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL
AND skill_assessments.employee_id != e.user_id;

UPDATE public.tardiness 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE tardiness.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL
AND tardiness.employee_id != e.user_id;

-- 3. Créer une fonction pour récupérer automatiquement les noms des employés
CREATE OR REPLACE FUNCTION public.get_employee_name(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT full_name FROM public.employees WHERE user_id = p_user_id;
$$;

-- 4. Créer des triggers pour mettre à jour automatiquement les noms des employés
CREATE OR REPLACE FUNCTION public.update_employee_name_in_tables()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour les noms dans toutes les tables concernées
  UPDATE public.skill_assessments SET employee_name = NEW.full_name WHERE employee_id = NEW.user_id;
  UPDATE public.employee_payrolls SET employee_name = NEW.full_name WHERE employee_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table employees
DROP TRIGGER IF EXISTS trigger_update_employee_names ON public.employees;
CREATE TRIGGER trigger_update_employee_names
    AFTER UPDATE OF full_name ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_employee_name_in_tables();

-- 5. Mettre à jour les noms existants dans toutes les tables
UPDATE public.skill_assessments 
SET employee_name = e.full_name 
FROM public.employees e 
WHERE skill_assessments.employee_id = e.user_id;

UPDATE public.employee_payrolls 
SET employee_name = e.full_name 
FROM public.employees e 
WHERE employee_payrolls.employee_id = e.user_id;