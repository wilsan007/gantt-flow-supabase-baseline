-- Créer tous les triggers d'audit manquants

-- 1. Trigger pour les changements de tâches (assignee, etc.)
DROP TRIGGER IF EXISTS trigger_log_task_changes ON public.tasks;
CREATE TRIGGER trigger_log_task_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_change();

-- 2. Trigger pour les actions de tâches
DROP TRIGGER IF EXISTS trigger_log_task_action_changes ON public.task_actions;
CREATE TRIGGER trigger_log_task_action_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.task_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_action_change();

-- 3. Trigger pour les commentaires
DROP TRIGGER IF EXISTS trigger_log_task_comment_changes ON public.task_comments;
CREATE TRIGGER trigger_log_task_comment_changes
  AFTER INSERT OR DELETE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_comment_change();

-- 4. Trigger pour les documents
DROP TRIGGER IF EXISTS trigger_log_task_document_changes ON public.task_documents;
CREATE TRIGGER trigger_log_task_document_changes
  AFTER INSERT OR DELETE ON public.task_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_document_change();