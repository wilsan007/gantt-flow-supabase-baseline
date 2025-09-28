-- Migration pour créer le système d'historique des tâches
-- Permet de suivre toutes les modifications en temps réel

-- 1. Créer la table task_history
CREATE TABLE IF NOT EXISTS public.task_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed', etc.
    field_name VARCHAR(100), -- Nom du champ modifié (title, status, assignee, etc.)
    old_value TEXT, -- Ancienne valeur (JSON pour objets complexes)
    new_value TEXT, -- Nouvelle valeur (JSON pour objets complexes)
    changed_by UUID REFERENCES auth.users(id), -- Qui a fait la modification
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}', -- Métadonnées supplémentaires
    ip_address INET, -- Adresse IP pour audit
    user_agent TEXT -- User agent pour audit
);

-- 2. Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON public.task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_changed_at ON public.task_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_history_action_type ON public.task_history(action_type);
CREATE INDEX IF NOT EXISTS idx_task_history_tenant_id ON public.task_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_task_history_changed_by ON public.task_history(changed_by);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- 4. Créer les politiques RLS
CREATE POLICY "Users can view task history for their tenant" ON public.task_history
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert task history" ON public.task_history
    FOR INSERT WITH CHECK (true);

-- 5. Fonction pour enregistrer les modifications
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
END;
$$;

-- 6. Fonction trigger pour capturer automatiquement les modifications
CREATE OR REPLACE FUNCTION public.tasks_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    field_name TEXT;
    old_val TEXT;
    new_val TEXT;
BEGIN
    -- Pour les insertions (création de tâche)
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_task_change(
            NEW.id,
            'created',
            NULL,
            NULL,
            row_to_json(NEW)::TEXT,
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
            row_to_json(OLD)::TEXT,
            NULL,
            jsonb_build_object('operation', 'delete')
        );
        RETURN OLD;
    END IF;

    -- Pour les mises à jour
    IF TG_OP = 'UPDATE' THEN
        -- Vérifier chaque champ important
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

        IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
            PERFORM public.log_task_change(NEW.id, 'updated', 'start_date', OLD.start_date::TEXT, NEW.start_date::TEXT);
        END IF;

        IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
            PERFORM public.log_task_change(NEW.id, 'updated', 'due_date', OLD.due_date::TEXT, NEW.due_date::TEXT);
        END IF;

        IF OLD.progress IS DISTINCT FROM NEW.progress THEN
            PERFORM public.log_task_change(NEW.id, 'updated', 'progress', OLD.progress::TEXT, NEW.progress::TEXT);
        END IF;

        IF OLD.effort_estimate_h IS DISTINCT FROM NEW.effort_estimate_h THEN
            PERFORM public.log_task_change(NEW.id, 'updated', 'effort_estimate_h', OLD.effort_estimate_h::TEXT, NEW.effort_estimate_h::TEXT);
        END IF;

        IF OLD.description IS DISTINCT FROM NEW.description THEN
            PERFORM public.log_task_change(NEW.id, 'updated', 'description', OLD.description, NEW.description);
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$;

-- 7. Créer le trigger sur la table tasks
DROP TRIGGER IF EXISTS tasks_audit_trigger ON public.tasks;
CREATE TRIGGER tasks_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.tasks_audit_trigger();

-- 8. Fonction pour récupérer l'historique d'une tâche
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
    ORDER BY th.changed_at DESC;
END;
$$;

-- 9. Fonction pour obtenir un résumé des activités récentes
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
    WHERE th.tenant_id IN (
        SELECT tenant_id FROM public.profiles 
        WHERE user_id = auth.uid()
    )
    ORDER BY th.changed_at DESC
    LIMIT p_limit;
END;
$$;

-- 10. Vue pour faciliter les requêtes d'historique
CREATE OR REPLACE VIEW public.task_history_view AS
SELECT 
    th.id,
    th.task_id,
    t.title as task_title,
    th.action_type,
    th.field_name,
    th.old_value,
    th.new_value,
    th.changed_by,
    th.changed_at,
    COALESCE(au.email, 'Système') as user_email,
    th.metadata,
    th.tenant_id
FROM public.task_history th
LEFT JOIN public.tasks t ON th.task_id = t.id
LEFT JOIN auth.users au ON th.changed_by = au.id;

-- 11. Politique RLS pour la vue
ALTER VIEW public.task_history_view SET (security_invoker = true);

-- 12. Fonction pour nettoyer l'historique ancien (optionnel)
CREATE OR REPLACE FUNCTION public.cleanup_old_task_history(p_days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.task_history
    WHERE changed_at < NOW() - INTERVAL '1 day' * p_days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- 13. Insérer quelques entrées d'historique pour les tâches existantes
INSERT INTO public.task_history (task_id, action_type, new_value, tenant_id, changed_at)
SELECT 
    id,
    'created',
    row_to_json(tasks)::TEXT,
    tenant_id,
    created_at
FROM public.tasks
WHERE NOT EXISTS (
    SELECT 1 FROM public.task_history 
    WHERE task_id = tasks.id AND action_type = 'created'
);

-- 14. Commentaires pour documentation
COMMENT ON TABLE public.task_history IS 'Historique de toutes les modifications des tâches';
COMMENT ON COLUMN public.task_history.action_type IS 'Type d''action: created, updated, deleted, status_changed, etc.';
COMMENT ON COLUMN public.task_history.field_name IS 'Nom du champ modifié';
COMMENT ON COLUMN public.task_history.old_value IS 'Ancienne valeur du champ';
COMMENT ON COLUMN public.task_history.new_value IS 'Nouvelle valeur du champ';
COMMENT ON FUNCTION public.log_task_change IS 'Fonction pour enregistrer manuellement une modification';
COMMENT ON FUNCTION public.get_task_history IS 'Récupère l''historique complet d''une tâche';
COMMENT ON FUNCTION public.get_recent_task_activities IS 'Récupère les activités récentes sur les tâches';
