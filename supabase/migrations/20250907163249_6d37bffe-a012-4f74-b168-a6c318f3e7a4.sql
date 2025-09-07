-- NETTOYAGE ET CONSOLIDATION DE LA BASE DE DONNÉES
-- Cette migration supprime les anciens objets obsolètes et recrée une structure propre

-- Nettoyer les anciennes politiques RLS obsolètes qui pourraient encore exister
DO $$
BEGIN
    -- Supprimer les anciennes politiques "Anyone can..." si elles existent encore
    DROP POLICY IF EXISTS "Anyone can view tasks" ON public.tasks;
    DROP POLICY IF EXISTS "Anyone can create tasks" ON public.tasks;
    DROP POLICY IF EXISTS "Anyone can update tasks" ON public.tasks;
    DROP POLICY IF EXISTS "Anyone can delete tasks" ON public.tasks;
    
    DROP POLICY IF EXISTS "Anyone can view task_actions" ON public.task_actions;
    DROP POLICY IF EXISTS "Anyone can create task_actions" ON public.task_actions;
    DROP POLICY IF EXISTS "Anyone can update task_actions" ON public.task_actions;
    DROP POLICY IF EXISTS "Anyone can delete task_actions" ON public.task_actions;
    
EXCEPTION WHEN OTHERS THEN
    -- Ignorer les erreurs si les politiques n'existent pas
    NULL;
END $$;

-- Nettoyer d'éventuelles fonctions obsolètes ou mal nommées
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- S'assurer que tous les triggers nécessaires sont en place
DROP TRIGGER IF EXISTS trg_task_action_change ON public.task_actions;
CREATE TRIGGER trg_task_action_change
    AFTER INSERT OR UPDATE OR DELETE ON public.task_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.on_task_action_change();

-- S'assurer que les triggers de validation sont en place
DROP TRIGGER IF EXISTS validate_weight_sum_trigger ON public.task_actions;
CREATE TRIGGER validate_weight_sum_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON public.task_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_task_actions_weight_sum();

-- S'assurer que les triggers d'audit sont en place
DROP TRIGGER IF EXISTS log_task_changes ON public.tasks;
CREATE TRIGGER log_task_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.log_task_change();

DROP TRIGGER IF EXISTS log_task_action_changes ON public.task_actions;
CREATE TRIGGER log_task_action_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.task_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_task_action_change();

DROP TRIGGER IF EXISTS log_task_comment_changes ON public.task_comments;
CREATE TRIGGER log_task_comment_changes
    AFTER INSERT OR DELETE ON public.task_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.log_task_comment_change();

DROP TRIGGER IF EXISTS log_task_document_changes ON public.task_documents;
CREATE TRIGGER log_task_document_changes
    AFTER INSERT OR DELETE ON public.task_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.log_task_document_change();

-- S'assurer que le trigger d'auto-complétion est en place
DROP TRIGGER IF EXISTS auto_complete_linked_action_trigger ON public.tasks;
CREATE TRIGGER auto_complete_linked_action_trigger
    AFTER UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_complete_linked_action();

-- S'assurer que le trigger de tenant_id automatique est en place
DROP TRIGGER IF EXISTS auto_fill_document_tenant_trigger ON public.task_documents;
CREATE TRIGGER auto_fill_document_tenant_trigger
    BEFORE INSERT ON public.task_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_fill_document_tenant_id();

-- Nettoyer les colonnes obsolètes qui ne sont plus utilisées
DO $$
BEGIN
    -- Supprimer la colonne project_id si elle existe mais n'est plus utilisée
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'project_id' AND table_schema = 'public') THEN
        -- Vérifier si elle est utilisée
        IF NOT EXISTS (SELECT 1 FROM public.tasks WHERE project_id IS NOT NULL LIMIT 1) THEN
            ALTER TABLE public.tasks DROP COLUMN IF EXISTS project_id;
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

COMMENT ON SCHEMA public IS 'Migration de nettoyage - Base de données consolidée et optimisée';