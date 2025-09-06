-- Create audit trail table for task modifications
CREATE TABLE public.task_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'add_action', 'add_subtask', 'add_comment', 'upload_document', etc.
  field_name TEXT, -- which field was changed (assignee, status, progress, etc.)
  old_value TEXT, -- previous value (JSON string if complex)
  new_value TEXT, -- new value (JSON string if complex)
  description TEXT NOT NULL, -- human readable description
  user_id UUID, -- who made the change
  user_name TEXT, -- name of the user who made the change
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID,
  related_entity_id UUID, -- ID of related entity (action_id, comment_id, document_id, etc.)
  related_entity_type TEXT -- 'action', 'comment', 'document', 'subtask', etc.
);

-- Enable RLS
ALTER TABLE public.task_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view tenant task audit logs" 
ON public.task_audit_logs 
FOR SELECT 
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create tenant task audit logs" 
ON public.task_audit_logs 
FOR INSERT 
WITH CHECK (tenant_id = get_user_tenant_id());

-- Index for performance
CREATE INDEX idx_task_audit_logs_task_id ON public.task_audit_logs(task_id);
CREATE INDEX idx_task_audit_logs_created_at ON public.task_audit_logs(created_at DESC);

-- Create function to log task changes
CREATE OR REPLACE FUNCTION public.log_task_change()
RETURNS TRIGGER AS $$
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
        INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id)
        VALUES (NEW.id, 'create', 'Tâche créée: "' || NEW.title || '"', user_uuid, user_profile_name, tenant_uuid);
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Log task deletion
        INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id)
        VALUES (OLD.id, 'delete', 'Tâche supprimée: "' || OLD.title || '"', user_uuid, user_profile_name, tenant_uuid);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for tasks
CREATE TRIGGER task_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.log_task_change();

-- Create function to log task action changes
CREATE OR REPLACE FUNCTION public.log_task_action_change()
RETURNS TRIGGER AS $$
DECLARE
    tenant_uuid UUID;
    user_uuid UUID;
    user_profile_name TEXT;
    task_title TEXT;
BEGIN
    -- Get tenant ID
    SELECT get_user_tenant_id() INTO tenant_uuid;
    
    -- Get user info
    SELECT auth.uid() INTO user_uuid;
    SELECT full_name INTO user_profile_name 
    FROM public.profiles 
    WHERE user_id = user_uuid AND tenant_id = tenant_uuid
    LIMIT 1;
    
    -- Get task title
    IF TG_OP = 'DELETE' THEN
        SELECT title INTO task_title FROM public.tasks WHERE id = OLD.task_id;
    ELSE
        SELECT title INTO task_title FROM public.tasks WHERE id = NEW.task_id;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id, related_entity_id, related_entity_type)
        VALUES (NEW.task_id, 'add_action', 'Action ajoutée: "' || NEW.title || '"', user_uuid, user_profile_name, tenant_uuid, NEW.id, 'action');
        
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_done IS DISTINCT FROM NEW.is_done THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id, related_entity_id, related_entity_type)
            VALUES (NEW.task_id, 'update', 'action_status', OLD.is_done::TEXT, NEW.is_done::TEXT, 
                CASE WHEN NEW.is_done THEN 'Action "' || NEW.title || '" marquée comme terminée'
                     ELSE 'Action "' || NEW.title || '" marquée comme non terminée' END,
                user_uuid, user_profile_name, tenant_uuid, NEW.id, 'action');
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id, related_entity_id, related_entity_type)
        VALUES (OLD.task_id, 'delete_action', 'Action supprimée: "' || OLD.title || '"', user_uuid, user_profile_name, tenant_uuid, OLD.id, 'action');
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for task actions
CREATE TRIGGER task_action_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.task_actions
    FOR EACH ROW EXECUTE FUNCTION public.log_task_action_change();

-- Create function to log task comment changes
CREATE OR REPLACE FUNCTION public.log_task_comment_change()
RETURNS TRIGGER AS $$
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
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id, related_entity_id, related_entity_type)
        VALUES (NEW.task_id, 'add_comment', 'Commentaire ajouté', user_uuid, user_profile_name, tenant_uuid, NEW.id, 'comment');
        
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id, related_entity_id, related_entity_type)
        VALUES (OLD.task_id, 'delete_comment', 'Commentaire supprimé', user_uuid, user_profile_name, tenant_uuid, OLD.id, 'comment');
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for task comments
CREATE TRIGGER task_comment_audit_trigger
    AFTER INSERT OR DELETE ON public.task_comments
    FOR EACH ROW EXECUTE FUNCTION public.log_task_comment_change();

-- Create function to log task document changes
CREATE OR REPLACE FUNCTION public.log_task_document_change()
RETURNS TRIGGER AS $$
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
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id, related_entity_id, related_entity_type)
        VALUES (NEW.task_id, 'upload_document', 'Document ajouté: "' || NEW.file_name || '"', user_uuid, user_profile_name, tenant_uuid, NEW.id, 'document');
        
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id, related_entity_id, related_entity_type)
        VALUES (OLD.task_id, 'delete_document', 'Document supprimé: "' || OLD.file_name || '"', user_uuid, user_profile_name, tenant_uuid, OLD.id, 'document');
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for task documents
CREATE TRIGGER task_document_audit_trigger
    AFTER INSERT OR DELETE ON public.task_documents
    FOR EACH ROW EXECUTE FUNCTION public.log_task_document_change();