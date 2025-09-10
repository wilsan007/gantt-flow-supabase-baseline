-- Migration pour lier tous les employee_id à public.employees.user_id
-- Correction : d'abord créer une contrainte unique sur employees.user_id

-- 1. Créer une contrainte unique sur user_id dans la table employees
ALTER TABLE public.employees ADD CONSTRAINT unique_employees_user_id UNIQUE (user_id);

-- 2. Mettre à jour les données existantes pour faire correspondre employee_id avec employees.user_id
-- Pour les absences
UPDATE public.absences 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE absences.employee_id = p.id AND p.user_id = e.user_id;

-- Pour les attendances
UPDATE public.attendances 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE attendances.employee_id = p.id AND p.user_id = e.user_id;

-- Pour les documents employés
UPDATE public.employee_documents 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE employee_documents.employee_id = p.id AND p.user_id = e.user_id;

-- Pour les payrolls
UPDATE public.employee_payrolls 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE employee_payrolls.employee_id = p.id AND p.user_id = e.user_id;

-- Pour les leave_balances
UPDATE public.leave_balances 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE leave_balances.employee_id = p.id AND p.user_id = e.user_id;

-- Pour les leave_requests
UPDATE public.leave_requests 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE leave_requests.employee_id = p.id AND p.user_id = e.user_id;

-- Pour les skill_assessments
UPDATE public.skill_assessments 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE skill_assessments.employee_id = p.id AND p.user_id = e.user_id;

-- Pour les tardiness
UPDATE public.tardiness 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE tardiness.employee_id = p.id AND p.user_id = e.user_id;

-- 3. Ajouter les foreign keys
ALTER TABLE public.absences 
ADD CONSTRAINT fk_absences_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(user_id) ON DELETE CASCADE;

ALTER TABLE public.attendances 
ADD CONSTRAINT fk_attendances_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(user_id) ON DELETE CASCADE;

ALTER TABLE public.employee_documents 
ADD CONSTRAINT fk_employee_documents_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(user_id) ON DELETE CASCADE;

ALTER TABLE public.employee_payrolls 
ADD CONSTRAINT fk_employee_payrolls_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(user_id) ON DELETE CASCADE;

ALTER TABLE public.leave_balances 
ADD CONSTRAINT fk_leave_balances_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(user_id) ON DELETE CASCADE;

ALTER TABLE public.leave_requests 
ADD CONSTRAINT fk_leave_requests_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(user_id) ON DELETE CASCADE;

ALTER TABLE public.skill_assessments 
ADD CONSTRAINT fk_skill_assessments_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(user_id) ON DELETE CASCADE;

ALTER TABLE public.tardiness 
ADD CONSTRAINT fk_tardiness_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(user_id) ON DELETE CASCADE;

-- 4. Créer des fonctions pour récupérer automatiquement les noms des employés
CREATE OR REPLACE FUNCTION public.get_employee_name(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT full_name FROM public.employees WHERE user_id = p_user_id;
$$;

-- 5. Créer des triggers pour mettre à jour automatiquement les noms des employés
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

-- 6. Mettre à jour les noms existants dans toutes les tables
UPDATE public.skill_assessments 
SET employee_name = e.full_name 
FROM public.employees e 
WHERE skill_assessments.employee_id = e.user_id;

UPDATE public.employee_payrolls 
SET employee_name = e.full_name 
FROM public.employees e 
WHERE employee_payrolls.employee_id = e.user_id;