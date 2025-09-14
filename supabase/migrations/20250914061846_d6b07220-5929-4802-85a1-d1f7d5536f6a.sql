-- Create notifications system
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID DEFAULT get_user_tenant_id(),
  recipient_id UUID NOT NULL, -- User who should receive the notification
  sender_id UUID, -- User who triggered the notification (can be system)
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'task_update', 'leave_request', 'expense_report', etc.
  entity_type TEXT, -- 'task', 'leave_request', 'expense_report', etc.
  entity_id UUID, -- ID of the related entity
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}' -- Additional context data
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID DEFAULT get_user_tenant_id(),
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id() AND recipient_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update their notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id() AND recipient_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- RLS Policies for notification preferences
CREATE POLICY "Users can manage their preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id() AND user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_entity ON public.notifications(entity_type, entity_id);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX idx_notifications_unread ON public.notifications(recipient_id, read_at) WHERE read_at IS NULL;

-- Function to create smart notifications
CREATE OR REPLACE FUNCTION public.create_smart_notification(
  p_notification_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_sender_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_record RECORD;
  tenant_uuid UUID;
BEGIN
  -- Get tenant ID
  SELECT get_user_tenant_id() INTO tenant_uuid;
  
  -- Determine recipients based on notification type and entity
  FOR recipient_record IN 
    SELECT DISTINCT recipient_id, should_notify
    FROM public.get_notification_recipients(p_notification_type, p_entity_type, p_entity_id, p_metadata)
    WHERE should_notify = true
  LOOP
    -- Check if user has this notification type enabled
    IF EXISTS (
      SELECT 1 FROM public.notification_preferences 
      WHERE user_id = recipient_record.recipient_id 
      AND notification_type = p_notification_type 
      AND in_app_enabled = true
    ) OR NOT EXISTS (
      SELECT 1 FROM public.notification_preferences 
      WHERE user_id = recipient_record.recipient_id 
      AND notification_type = p_notification_type
    ) THEN
      -- Insert notification
      INSERT INTO public.notifications (
        tenant_id, recipient_id, sender_id, title, message, 
        notification_type, entity_type, entity_id, priority, metadata
      ) VALUES (
        tenant_uuid, recipient_record.recipient_id, p_sender_id, p_title, p_message,
        p_notification_type, p_entity_type, p_entity_id, p_priority, p_metadata
      );
    END IF;
  END LOOP;
END;
$$;

-- Function to determine notification recipients
CREATE OR REPLACE FUNCTION public.get_notification_recipients(
  p_notification_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB DEFAULT '{}'
) RETURNS TABLE(recipient_id UUID, should_notify BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE p_notification_type
    WHEN 'task_assigned' THEN
      RETURN QUERY
      SELECT t.assignee_id::UUID, true
      FROM public.tasks t 
      WHERE t.id = p_entity_id AND t.assignee_id IS NOT NULL;
      
    WHEN 'task_updated' THEN
      RETURN QUERY
      -- Notify assignee
      SELECT t.assignee_id::UUID, true
      FROM public.tasks t 
      WHERE t.id = p_entity_id AND t.assignee_id IS NOT NULL
      UNION
      -- Notify project managers if task is part of a project
      SELECT p.manager_id, true
      FROM public.tasks t
      JOIN public.projects p ON t.project_id = p.id
      WHERE t.id = p_entity_id AND p.manager_id IS NOT NULL
      UNION
      -- Notify parent task assignee if this is a subtask
      SELECT pt.assignee_id::UUID, true
      FROM public.tasks t
      JOIN public.tasks pt ON t.parent_id = pt.id
      WHERE t.id = p_entity_id AND pt.assignee_id IS NOT NULL;
      
    WHEN 'task_comment_added' THEN
      RETURN QUERY
      -- Notify task assignee and all previous commenters
      SELECT t.assignee_id::UUID, true
      FROM public.tasks t 
      WHERE t.id = p_entity_id AND t.assignee_id IS NOT NULL
      UNION
      SELECT DISTINCT tc.author_id::UUID, true
      FROM public.task_comments tc
      WHERE tc.task_id = p_entity_id AND tc.author_id IS NOT NULL;
      
    WHEN 'leave_request_submitted' THEN
      RETURN QUERY
      -- Notify HR and manager
      SELECT e.manager_id, true
      FROM public.employees e
      JOIN public.leave_requests lr ON e.id = lr.employee_id
      WHERE lr.id = p_entity_id AND e.manager_id IS NOT NULL
      UNION
      -- Notify HR representatives (users with hr role)
      SELECT p.id, true
      FROM public.profiles p
      WHERE p.role = 'hr' OR p.role = 'admin';
      
    WHEN 'leave_request_approved', 'leave_request_rejected' THEN
      RETURN QUERY
      -- Notify the employee who made the request
      SELECT lr.employee_id, true
      FROM public.leave_requests lr
      WHERE lr.id = p_entity_id;
      
    WHEN 'expense_report_submitted' THEN
      RETURN QUERY
      -- Notify manager
      SELECT e.manager_id, true
      FROM public.employees e
      JOIN public.expense_reports er ON e.id = er.employee_id
      WHERE er.id = p_entity_id AND e.manager_id IS NOT NULL
      UNION
      -- If expense is related to a project, notify project managers
      SELECT p.manager_id, true
      FROM public.projects p
      WHERE p.id = (p_metadata->>'project_id')::UUID AND p.manager_id IS NOT NULL;
      
    WHEN 'expense_report_approved', 'expense_report_rejected' THEN
      RETURN QUERY
      -- Notify the employee who submitted the report
      SELECT er.employee_id, true
      FROM public.expense_reports er
      WHERE er.id = p_entity_id;
      
    WHEN 'task_deadline_approaching' THEN
      RETURN QUERY
      -- Notify assignee and project manager
      SELECT t.assignee_id::UUID, true
      FROM public.tasks t 
      WHERE t.id = p_entity_id AND t.assignee_id IS NOT NULL
      UNION
      SELECT p.manager_id, true
      FROM public.tasks t
      JOIN public.projects p ON t.project_id = p.id
      WHERE t.id = p_entity_id AND p.manager_id IS NOT NULL;
      
    WHEN 'workload_alert' THEN
      RETURN QUERY
      -- Notify the overloaded employee and their manager
      SELECT (p_metadata->>'employee_id')::UUID, true
      WHERE (p_metadata->>'employee_id') IS NOT NULL
      UNION
      SELECT e.manager_id, true
      FROM public.employees e
      WHERE e.id = (p_metadata->>'employee_id')::UUID AND e.manager_id IS NOT NULL;
      
    ELSE
      -- Default: no recipients
      RETURN;
  END CASE;
END;
$$;

-- Trigger function for task changes
CREATE OR REPLACE FUNCTION public.notify_task_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
  sender_uuid UUID;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO sender_uuid;
  
  IF TG_OP = 'INSERT' THEN
    IF NEW.assignee_id IS NOT NULL THEN
      notification_type := 'task_assigned';
      notification_title := 'Nouvelle tâche assignée';
      notification_message := 'La tâche "' || NEW.title || '" vous a été assignée.';
      
      PERFORM public.create_smart_notification(
        notification_type, 'task', NEW.id, notification_title, notification_message, 
        CASE NEW.priority WHEN 'urgent' THEN 'urgent' WHEN 'high' THEN 'high' ELSE 'medium' END,
        sender_uuid, jsonb_build_object('task_title', NEW.title, 'due_date', NEW.due_date)
      );
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check for significant changes
    IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id OR 
       OLD.status IS DISTINCT FROM NEW.status OR
       OLD.priority IS DISTINCT FROM NEW.priority OR
       OLD.due_date IS DISTINCT FROM NEW.due_date THEN
       
      notification_type := 'task_updated';
      notification_title := 'Tâche modifiée';
      notification_message := 'La tâche "' || NEW.title || '" a été mise à jour.';
      
      PERFORM public.create_smart_notification(
        notification_type, 'task', NEW.id, notification_title, notification_message,
        CASE NEW.priority WHEN 'urgent' THEN 'urgent' WHEN 'high' THEN 'high' ELSE 'medium' END,
        sender_uuid, jsonb_build_object('task_title', NEW.title, 'changes', 'status_priority_assignee_or_date')
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for task notifications
CREATE TRIGGER task_notification_trigger
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_changes();

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(notification_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications 
  SET read_at = now()
  WHERE id = ANY(notification_ids) 
  AND recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND read_at IS NULL;
END;
$$;

-- Add updated_at trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();