-- Tester que les triggers fonctionnent
-- Mettre à jour manuellement la progression pour toutes les tâches existantes
UPDATE public.tasks 
SET 
    progress = public.compute_task_progress(id),
    status = public.compute_task_status(id),
    updated_at = now()
WHERE id IN (SELECT DISTINCT task_id FROM public.task_actions);