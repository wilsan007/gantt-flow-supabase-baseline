-- Désactiver le trigger de notification qui cause des erreurs
-- Le système de notification sera à réparer séparément

DROP TRIGGER IF EXISTS task_notification_trigger ON public.tasks;

-- Si vous voulez réactiver plus tard :
-- CREATE TRIGGER task_notification_trigger
--   AFTER INSERT OR UPDATE ON public.tasks
--   FOR EACH ROW
--   EXECUTE FUNCTION public.notify_task_changes();
