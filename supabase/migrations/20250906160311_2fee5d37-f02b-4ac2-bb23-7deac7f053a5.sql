-- Vérifier et recréer complètement les fonctions et triggers

-- D'abord, supprimer le trigger existant
DROP TRIGGER IF EXISTS trigger_on_task_action_change ON public.task_actions;

-- Recréer la fonction de calcul de progression
DROP FUNCTION IF EXISTS public.compute_task_progress(uuid);
CREATE OR REPLACE FUNCTION public.compute_task_progress(p_task_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    total_actions integer;
    completed_actions integer;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE is_done = true)
    INTO total_actions, completed_actions
    FROM public.task_actions
    WHERE task_id = p_task_id;
    
    IF total_actions = 0 THEN
        RETURN 0;
    ELSE
        RETURN ROUND((completed_actions::NUMERIC / total_actions) * 100);
    END IF;
END;
$$;

-- Recréer la fonction de calcul du statut
DROP FUNCTION IF EXISTS public.compute_task_status(uuid);
CREATE OR REPLACE FUNCTION public.compute_task_status(p_task_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    progress_value integer;
BEGIN
    SELECT public.compute_task_progress(p_task_id) INTO progress_value;
    
    IF progress_value = 100 THEN
        RETURN 'done';
    ELSIF progress_value > 0 THEN
        RETURN 'doing';
    ELSE
        RETURN 'todo';
    END IF;
END;
$$;

-- Recréer la fonction trigger
DROP FUNCTION IF EXISTS public.on_task_action_change();
CREATE OR REPLACE FUNCTION public.on_task_action_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    target_task_id uuid;
BEGIN
    -- Déterminer l'ID de la tâche affectée
    IF TG_OP = 'DELETE' THEN
        target_task_id := OLD.task_id;
    ELSE
        target_task_id := NEW.task_id;
    END IF;
    
    -- Mettre à jour la progression et le statut
    UPDATE public.tasks 
    SET 
        progress = public.compute_task_progress(target_task_id),
        status = public.compute_task_status(target_task_id),
        updated_at = now()
    WHERE id = target_task_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Créer le trigger
CREATE TRIGGER trigger_on_task_action_change
    AFTER INSERT OR UPDATE OR DELETE ON public.task_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.on_task_action_change();