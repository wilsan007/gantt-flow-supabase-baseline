-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_on_task_action_change ON public.task_actions;

-- Créer le trigger correctement
CREATE OR REPLACE TRIGGER trigger_on_task_action_change
    AFTER INSERT OR UPDATE OR DELETE ON public.task_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.on_task_action_change();