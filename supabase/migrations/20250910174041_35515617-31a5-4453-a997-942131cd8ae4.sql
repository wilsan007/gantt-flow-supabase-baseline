-- Nettoyer les données et créer les foreign keys progressivement

-- 1. Créer une contrainte unique sur user_id dans la table employees (si pas déjà fait)
ALTER TABLE public.employees ADD CONSTRAINT unique_employees_user_id UNIQUE (user_id);

-- 2. Supprimer les enregistrements orphelins dans toutes les tables
-- Absences orphelines
DELETE FROM public.absences 
WHERE employee_id NOT IN (
    SELECT COALESCE(user_id, id) FROM public.employees WHERE user_id IS NOT NULL
    UNION 
    SELECT id FROM public.profiles
);

-- Attendances orphelines  
DELETE FROM public.attendances 
WHERE employee_id NOT IN (
    SELECT COALESCE(user_id, id) FROM public.employees WHERE user_id IS NOT NULL
    UNION 
    SELECT id FROM public.profiles
);

-- Documents employés orphelins
DELETE FROM public.employee_documents 
WHERE employee_id NOT IN (
    SELECT COALESCE(user_id, id) FROM public.employees WHERE user_id IS NOT NULL
    UNION 
    SELECT id FROM public.profiles
);

-- Payrolls orphelins
DELETE FROM public.employee_payrolls 
WHERE employee_id NOT IN (
    SELECT COALESCE(user_id, id) FROM public.employees WHERE user_id IS NOT NULL
    UNION 
    SELECT id FROM public.profiles
);

-- Leave balances orphelins
DELETE FROM public.leave_balances 
WHERE employee_id NOT IN (
    SELECT COALESCE(user_id, id) FROM public.employees WHERE user_id IS NOT NULL
    UNION 
    SELECT id FROM public.profiles
);

-- Leave requests orphelins
DELETE FROM public.leave_requests 
WHERE employee_id NOT IN (
    SELECT COALESCE(user_id, id) FROM public.employees WHERE user_id IS NOT NULL
    UNION 
    SELECT id FROM public.profiles
);

-- Skill assessments orphelins
DELETE FROM public.skill_assessments 
WHERE employee_id NOT IN (
    SELECT COALESCE(user_id, id) FROM public.employees WHERE user_id IS NOT NULL
    UNION 
    SELECT id FROM public.profiles
);

-- Tardiness orphelins
DELETE FROM public.tardiness 
WHERE employee_id NOT IN (
    SELECT COALESCE(user_id, id) FROM public.employees WHERE user_id IS NOT NULL
    UNION 
    SELECT id FROM public.profiles
);

-- 3. Mettre à jour les employee_id pour pointer vers employees.user_id quand possible
UPDATE public.absences 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE absences.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL;

UPDATE public.attendances 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE attendances.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL;

UPDATE public.employee_documents 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE employee_documents.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL;

UPDATE public.employee_payrolls 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE employee_payrolls.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL;

UPDATE public.leave_balances 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE leave_balances.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL;

UPDATE public.leave_requests 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE leave_requests.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL;

UPDATE public.skill_assessments 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE skill_assessments.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL;

UPDATE public.tardiness 
SET employee_id = e.user_id 
FROM public.employees e, public.profiles p 
WHERE tardiness.employee_id = p.id AND p.user_id = e.user_id AND e.user_id IS NOT NULL;