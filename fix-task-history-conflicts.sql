-- Script pour corriger les conflits du système d'historique des tâches

-- 1. Supprimer les fonctions existantes qui peuvent causer des conflits
DROP FUNCTION IF EXISTS public.log_task_change CASCADE;
DROP FUNCTION IF EXISTS public.tasks_audit_trigger CASCADE;
DROP FUNCTION IF EXISTS public.get_task_history CASCADE;
DROP FUNCTION IF EXISTS public.get_recent_task_activities CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_task_history CASCADE;

-- 2. Supprimer les triggers existants
DROP TRIGGER IF EXISTS tasks_audit_trigger ON public.tasks;

-- 3. Supprimer la vue si elle existe
DROP VIEW IF EXISTS public.task_history_view CASCADE;

-- 4. Supprimer la table si elle existe (attention aux données)
-- DROP TABLE IF EXISTS public.task_history CASCADE;

-- 5. Maintenant, recréer tout proprement

-- Créer la table task_history
CREATE TABLE IF NOT EXISTS public.task_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON public.task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_changed_at ON public.task_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_history_tenant_id ON public.task_history(tenant_id);

-- Activer RLS
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view task history for their tenant" ON public.task_history;
DROP POLICY IF EXISTS "System can insert task history" ON public.task_history;

-- Créer les nouvelles politiques RLS
CREATE POLICY "Users can view task history for their tenant" ON public.task_history
    FOR SELECT USING (
        tenant_id = (
            SELECT tenant_id FROM public.profiles 
            WHERE user_id = auth.uid() 
            LIMIT 1
        )
    );

CREATE POLICY "System can insert task history" ON public.task_history
    FOR INSERT WITH CHECK (true);

-- 6. Fonction pour enregistrer les modifications (version corrigée)
CREATE OR REPLACE FUNCTION public.log_task_change(
    p_task_id UUID,
    p_action_type VARCHAR(50),
    p_field_name VARCHAR(100) DEFAULT NULL,
    p_old_value TEXT DEFAULT NULL,
    p_new_value TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    history_id UUID;
    task_tenant_id UUID;
BEGIN
    -- Récupérer le tenant_id de la tâche
    SELECT tenant_id INTO task_tenant_id
    FROM public.tasks
    WHERE id = p_task_id;

    -- Insérer l'entrée d'historique
    INSERT INTO public.task_history (
        task_id,
        action_type,
        field_name,
        old_value,
        new_value,
        changed_by,
        tenant_id,
        metadata
    ) VALUES (
        p_task_id,
        p_action_type,
        p_field_name,
        p_old_value,
        p_new_value,
        auth.uid(),
        task_tenant_id,
        p_metadata
    ) RETURNING id INTO history_id;

    RETURN history_id;
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, ne pas faire échouer l'opération principale
        RAISE WARNING 'Erreur lors de l''enregistrement de l''historique: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- 7. Fonction trigger simplifiée
CREATE OR REPLACE FUNCTION public.tasks_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Pour les insertions (création de tâche)
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_task_change(
            NEW.id,
            'created',
            NULL,
            NULL,
            NEW.title,
            jsonb_build_object('operation', 'insert')
        );
        RETURN NEW;
    END IF;

    -- Pour les suppressions
    IF TG_OP = 'DELETE' THEN
        PERFORM public.log_task_change(
            OLD.id,
            'deleted',
            NULL,
            OLD.title,
            NULL,
            jsonb_build_object('operation', 'delete')
        );
        RETURN OLD;
    END IF;

    -- Pour les mises à jour (seulement les champs principaux)
    IF TG_OP = 'UPDATE' THEN
        IF OLD.title IS DISTINCT FROM NEW.title THEN
            PERFORM public.log_task_change(NEW.id, 'updated', 'title', OLD.title, NEW.title);
        END IF;

        IF OLD.status IS DISTINCT FROM NEW.status THEN
            PERFORM public.log_task_change(NEW.id, 'status_changed', 'status', OLD.status, NEW.status);
        END IF;

        IF OLD.assigned_name IS DISTINCT FROM NEW.assigned_name THEN
            PERFORM public.log_task_change(NEW.id, 'updated', 'assigned_name', OLD.assigned_name, NEW.assigned_name);
        END IF;

        IF OLD.priority IS DISTINCT FROM NEW.priority THEN
            PERFORM public.log_task_change(NEW.id, 'updated', 'priority', OLD.priority, NEW.priority);
        END IF;

        IF OLD.progress IS DISTINCT FROM NEW.progress THEN
            PERFORM public.log_task_change(NEW.id, 'updated', 'progress', OLD.progress::TEXT, NEW.progress::TEXT);
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$;

-- 8. Créer le trigger
CREATE TRIGGER tasks_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.tasks_audit_trigger();

-- 9. Fonction pour récupérer l'historique d'une tâche
CREATE OR REPLACE FUNCTION public.get_task_history(p_task_id UUID)
RETURNS TABLE (
    id UUID,
    action_type VARCHAR(50),
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE,
    user_email TEXT,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        th.id,
        th.action_type,
        th.field_name,
        th.old_value,
        th.new_value,
        th.changed_by,
        th.changed_at,
        COALESCE(au.email, 'Système') as user_email,
        th.metadata
    FROM public.task_history th
    LEFT JOIN auth.users au ON th.changed_by = au.id
    WHERE th.task_id = p_task_id
    AND th.tenant_id = (
        SELECT tenant_id FROM public.profiles 
        WHERE user_id = auth.uid() 
        LIMIT 1
    )
    ORDER BY th.changed_at DESC;
END;
$$;

-- 10. Fonction pour les activités récentes
CREATE OR REPLACE FUNCTION public.get_recent_task_activities(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    task_id UUID,
    task_title TEXT,
    action_type VARCHAR(50),
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE,
    user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        th.task_id,
        t.title as task_title,
        th.action_type,
        th.field_name,
        th.old_value,
        th.new_value,
        th.changed_by,
        th.changed_at,
        COALESCE(au.email, 'Système') as user_email
    FROM public.task_history th
    LEFT JOIN public.tasks t ON th.task_id = t.id
    LEFT JOIN auth.users au ON th.changed_by = au.id
    WHERE th.tenant_id = (
        SELECT tenant_id FROM public.profiles 
        WHERE user_id = auth.uid() 
        LIMIT 1
    )
    ORDER BY th.changed_at DESC
    LIMIT p_limit;
END;
$$;

-- 11. Test rapide
DO $$
DECLARE
    test_task_id UUID;
BEGIN
    -- Récupérer une tâche pour test
    SELECT id INTO test_task_id 
    FROM public.tasks 
    LIMIT 1;
    
    IF test_task_id IS NOT NULL THEN
        -- Tester la fonction
        PERFORM public.log_task_change(
            test_task_id,
            'test',
            'test_field',
            'old_value',
            'new_value'
        );
        RAISE NOTICE 'Test réussi pour la tâche: %', test_task_id;
    ELSE
        RAISE NOTICE 'Aucune tâche trouvée pour le test';
    END IF;
END $$;

-- 12. Vérification finale
SELECT 
    'task_history' as table_name,
    COUNT(*) as row_count
FROM public.task_history
UNION ALL
SELECT 
    'triggers' as table_name,
    COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE event_object_table = 'tasks' 
AND trigger_schema = 'public';
