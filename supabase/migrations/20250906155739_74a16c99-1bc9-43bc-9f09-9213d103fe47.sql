-- Corriger les warnings de sécurité en définissant le search_path pour toutes les fonctions

-- 1. Corriger la fonction compute_task_progress
CREATE OR REPLACE FUNCTION public.compute_task_progress(p_task_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND((COUNT(*) FILTER (WHERE is_done = true)::NUMERIC / COUNT(*)) * 100)
  END::INTEGER
  FROM public.task_actions
  WHERE task_id = p_task_id;
$$;

-- 2. Corriger la fonction compute_task_status
CREATE OR REPLACE FUNCTION public.compute_task_status(p_task_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.compute_task_progress(p_task_id) = 100 THEN 'done'
    WHEN public.compute_task_progress(p_task_id) > 0 THEN 'doing'
    ELSE 'todo'
  END;
$$;

-- 3. Corriger la fonction on_task_action_change
CREATE OR REPLACE FUNCTION public.on_task_action_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Update progress and status for the affected task
  UPDATE public.tasks 
  SET 
    progress = public.compute_task_progress(COALESCE(NEW.task_id, OLD.task_id)),
    status = public.compute_task_status(COALESCE(NEW.task_id, OLD.task_id)),
    updated_at = now()
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;