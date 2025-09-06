-- Créer les triggers pour automatiquement mettre à jour la progression et le statut des tâches
CREATE TRIGGER trigger_on_task_action_change
  AFTER INSERT OR UPDATE OR DELETE ON public.task_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_task_action_change();

-- S'assurer que la fonction de trigger est bien configurée
CREATE OR REPLACE FUNCTION public.on_task_action_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;