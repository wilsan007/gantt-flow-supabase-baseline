-- Create tasks table
CREATE TABLE public.tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    title TEXT NOT NULL,
    assignee TEXT NOT NULL,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'blocked', 'done')),
    effort_estimate_h INTEGER DEFAULT 0,
    effort_spent_h INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    parent_id UUID REFERENCES public.tasks(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_actions table
CREATE TABLE public.task_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_done BOOLEAN DEFAULT false,
    owner_id TEXT,
    due_date DATE,
    notes TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Anyone can view tasks" 
ON public.tasks 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update tasks" 
ON public.tasks 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete tasks" 
ON public.tasks 
FOR DELETE 
USING (true);

-- Create policies for task_actions
CREATE POLICY "Anyone can view task_actions" 
ON public.task_actions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create task_actions" 
ON public.task_actions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update task_actions" 
ON public.task_actions 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete task_actions" 
ON public.task_actions 
FOR DELETE 
USING (true);

-- Function to compute task progress
CREATE OR REPLACE FUNCTION public.compute_task_progress(p_task_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND((COUNT(*) FILTER (WHERE is_done = true)::NUMERIC / COUNT(*)) * 100)
  END::INTEGER
  FROM public.task_actions
  WHERE task_id = p_task_id;
$$;

-- Function to compute task status based on progress
CREATE OR REPLACE FUNCTION public.compute_task_status(p_task_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT CASE 
    WHEN public.compute_task_progress(p_task_id) = 100 THEN 'done'
    WHEN public.compute_task_progress(p_task_id) > 0 THEN 'doing'
    ELSE 'todo'
  END;
$$;

-- Trigger function to update task progress and status
CREATE OR REPLACE FUNCTION public.on_task_action_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update progress and status for the affected task
  UPDATE public.tasks 
  SET 
    progress = public.compute_task_progress(COALESCE(NEW.task_id, OLD.task_id)),
    status = public.compute_task_status(COALESCE(NEW.task_id, OLD.task_id)),
    updated_at = now()
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for task_actions changes
DROP TRIGGER IF EXISTS trg_task_action_change ON public.task_actions;
CREATE TRIGGER trg_task_action_change
  AFTER INSERT OR UPDATE OR DELETE ON public.task_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_task_action_change();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_actions_updated_at
    BEFORE UPDATE ON public.task_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.tasks (title, assignee, start_date, due_date, priority, status, effort_estimate_h) VALUES
('Design UI/UX', 'Marie Dupont', '2024-01-01', '2024-01-15', 'high', 'doing', 40),
('Développement Frontend', 'Jean Martin', '2024-01-10', '2024-02-05', 'medium', 'todo', 80);

-- Get the task IDs for inserting actions
DO $$
DECLARE
    design_task_id UUID;
    dev_task_id UUID;
BEGIN
    SELECT id INTO design_task_id FROM public.tasks WHERE title = 'Design UI/UX';
    SELECT id INTO dev_task_id FROM public.tasks WHERE title = 'Développement Frontend';
    
    -- Insert actions for Design task
    INSERT INTO public.task_actions (task_id, title, is_done, position) VALUES
    (design_task_id, 'Wireframes', true, 1),
    (design_task_id, 'Maquettes', true, 2),
    (design_task_id, 'Prototype', false, 3),
    (design_task_id, 'Tests utilisateurs', false, 4),
    (design_task_id, 'Validation finale', false, 5);
    
    -- Insert actions for Dev task
    INSERT INTO public.task_actions (task_id, title, is_done, position) VALUES
    (dev_task_id, 'Setup projet', false, 1),
    (dev_task_id, 'Composants UI', false, 2),
    (dev_task_id, 'Pages principales', false, 3),
    (dev_task_id, 'Intégration API', false, 4);
END $$;