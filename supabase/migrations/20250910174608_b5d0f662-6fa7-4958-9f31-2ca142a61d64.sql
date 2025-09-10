-- Corriger les avertissements de sécurité des fonctions

-- Mettre à jour la fonction get_employee_name avec le search_path correct
CREATE OR REPLACE FUNCTION public.get_employee_name(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT full_name FROM public.employees WHERE user_id = p_user_id;
$$;

-- Mettre à jour la fonction update_employee_name_in_tables avec le search_path correct  
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