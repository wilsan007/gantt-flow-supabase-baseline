-- Ajouter une colonne pour lier les sous-tâches aux actions spécifiques
ALTER TABLE public.tasks 
ADD COLUMN linked_action_id UUID REFERENCES public.task_actions(id) ON DELETE SET NULL;

-- Ajouter un index pour optimiser les requêtes
CREATE INDEX idx_tasks_linked_action_id ON public.tasks(linked_action_id);

-- Fonction pour marquer automatiquement une action comme terminée quand sa sous-tâche est à 100%
CREATE OR REPLACE FUNCTION public.auto_complete_linked_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la tâche a une action liée et que le progrès est maintenant à 100%
    IF NEW.linked_action_id IS NOT NULL AND NEW.progress = 100 AND (OLD.progress IS NULL OR OLD.progress < 100) THEN
        UPDATE public.task_actions
        SET is_done = true, updated_at = now()
        WHERE id = NEW.linked_action_id;
    -- Si le progrès redescend en dessous de 100%, marquer l'action comme non terminée
    ELSIF NEW.linked_action_id IS NOT NULL AND NEW.progress < 100 AND OLD.progress = 100 THEN
        UPDATE public.task_actions
        SET is_done = false, updated_at = now()
        WHERE id = NEW.linked_action_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour déclencher la fonction lors des mises à jour de tâches
CREATE TRIGGER trigger_auto_complete_linked_action
    AFTER UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_complete_linked_action();