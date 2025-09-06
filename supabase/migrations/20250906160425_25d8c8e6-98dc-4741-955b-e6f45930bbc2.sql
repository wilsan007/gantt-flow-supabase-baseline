-- Supprimer tous les triggers et fonctions existants avec CASCADE
DROP TRIGGER IF EXISTS trigger_on_task_action_change ON public.task_actions CASCADE;
DROP TRIGGER IF EXISTS trg_task_action_change ON public.task_actions CASCADE;
DROP FUNCTION IF EXISTS public.on_task_action_change() CASCADE;

-- Recréer la fonction trigger proprement
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

-- Créer le nouveau trigger
CREATE TRIGGER trigger_on_task_action_change
    AFTER INSERT OR UPDATE OR DELETE ON public.task_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.on_task_action_change();