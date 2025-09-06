-- Améliorer la fonction de logging des tâches pour capturer les sous-tâches
CREATE OR REPLACE FUNCTION public.log_task_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    tenant_uuid UUID;
    user_uuid UUID;
    user_profile_name TEXT;
BEGIN
    -- Get tenant ID
    SELECT get_user_tenant_id() INTO tenant_uuid;
    
    -- Get user info
    SELECT auth.uid() INTO user_uuid;
    SELECT full_name INTO user_profile_name 
    FROM public.profiles 
    WHERE user_id = user_uuid AND tenant_id = tenant_uuid
    LIMIT 1;
    
    -- Si pas de profil, utiliser un nom par défaut
    IF user_profile_name IS NULL THEN
        user_profile_name := 'Utilisateur';
    END IF;
    
    -- For UPDATE operations, log the changes
    IF TG_OP = 'UPDATE' THEN
        -- Check each field for changes and log them
        IF OLD.title IS DISTINCT FROM NEW.title THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'title', OLD.title, NEW.title, 'Titre modifié de "' || COALESCE(OLD.title, '') || '" vers "' || COALESCE(NEW.title, '') || '"', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.assignee IS DISTINCT FROM NEW.assignee THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'assignee', OLD.assignee, NEW.assignee, 'Assigné modifié de "' || COALESCE(OLD.assignee, '') || '" vers "' || COALESCE(NEW.assignee, '') || '"', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'status', OLD.status, NEW.status, 'Statut modifié de "' || COALESCE(OLD.status, '') || '" vers "' || COALESCE(NEW.status, '') || '"', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.priority IS DISTINCT FROM NEW.priority THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'priority', OLD.priority, NEW.priority, 'Priorité modifiée de "' || COALESCE(OLD.priority, '') || '" vers "' || COALESCE(NEW.priority, '') || '"', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.progress IS DISTINCT FROM NEW.progress THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'progress', OLD.progress::TEXT, NEW.progress::TEXT, 'Progression modifiée de ' || COALESCE(OLD.progress, 0) || '% vers ' || COALESCE(NEW.progress, 0) || '%', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'start_date', OLD.start_date::TEXT, NEW.start_date::TEXT, 'Date de début modifiée de ' || COALESCE(OLD.start_date::TEXT, '') || ' vers ' || COALESCE(NEW.start_date::TEXT, ''), user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'due_date', OLD.due_date::TEXT, NEW.due_date::TEXT, 'Date d''échéance modifiée de ' || COALESCE(OLD.due_date::TEXT, '') || ' vers ' || COALESCE(NEW.due_date::TEXT, ''), user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.effort_estimate_h IS DISTINCT FROM NEW.effort_estimate_h THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'effort_estimate_h', OLD.effort_estimate_h::TEXT, NEW.effort_estimate_h::TEXT, 'Estimation d''effort modifiée de ' || COALESCE(OLD.effort_estimate_h, 0) || 'h vers ' || COALESCE(NEW.effort_estimate_h, 0) || 'h', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
    ELSIF TG_OP = 'INSERT' THEN
        -- Log task creation
        IF NEW.parent_id IS NOT NULL THEN
            -- C'est une sous-tâche
            INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'create_subtask', 'Sous-tâche créée: "' || NEW.title || '"', user_uuid, user_profile_name, tenant_uuid);
            
            -- Log aussi sur la tâche parent
            INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id, related_entity_id, related_entity_type)
            VALUES (NEW.parent_id, 'add_subtask', 'Sous-tâche ajoutée: "' || NEW.title || '"', user_uuid, user_profile_name, tenant_uuid, NEW.id, 'task');
        ELSE
            -- C'est une tâche principale
            INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'create', 'Tâche créée: "' || NEW.title || '"', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Log task deletion
        INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id)
        VALUES (OLD.id, 'delete', 'Tâche supprimée: "' || OLD.title || '"', user_uuid, user_profile_name, tenant_uuid);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;