-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID,
  budget DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES public.departments(id),
  manager_id UUID,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'planning',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_dependencies table
CREATE TABLE public.task_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'finish_to_start',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID,
  content TEXT NOT NULL,
  comment_type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_risks table
CREATE TABLE public.task_risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  risk_description TEXT NOT NULL,
  impact TEXT NOT NULL DEFAULT 'medium',
  probability TEXT NOT NULL DEFAULT 'medium',
  mitigation_plan TEXT,
  status TEXT NOT NULL DEFAULT 'identified',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to existing tasks table
ALTER TABLE public.tasks 
ADD COLUMN description TEXT,
ADD COLUMN acceptance_criteria TEXT,
ADD COLUMN budget DECIMAL(10,2),
ADD COLUMN department_id UUID REFERENCES public.departments(id);

-- Enable RLS on new tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_risks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for departments
CREATE POLICY "Anyone can view departments" 
ON public.departments FOR SELECT USING (true);

CREATE POLICY "Anyone can create departments" 
ON public.departments FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update departments" 
ON public.departments FOR UPDATE USING (true);

-- Create RLS policies for projects
CREATE POLICY "Anyone can view projects" 
ON public.projects FOR SELECT USING (true);

CREATE POLICY "Anyone can create projects" 
ON public.projects FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update projects" 
ON public.projects FOR UPDATE USING (true);

-- Create RLS policies for task_dependencies
CREATE POLICY "Anyone can view task_dependencies" 
ON public.task_dependencies FOR SELECT USING (true);

CREATE POLICY "Anyone can create task_dependencies" 
ON public.task_dependencies FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete task_dependencies" 
ON public.task_dependencies FOR DELETE USING (true);

-- Create RLS policies for task_comments
CREATE POLICY "Anyone can view task_comments" 
ON public.task_comments FOR SELECT USING (true);

CREATE POLICY "Anyone can create task_comments" 
ON public.task_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update task_comments" 
ON public.task_comments FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete task_comments" 
ON public.task_comments FOR DELETE USING (true);

-- Create RLS policies for task_risks
CREATE POLICY "Anyone can view task_risks" 
ON public.task_risks FOR SELECT USING (true);

CREATE POLICY "Anyone can create task_risks" 
ON public.task_risks FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update task_risks" 
ON public.task_risks FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete task_risks" 
ON public.task_risks FOR DELETE USING (true);

-- Add update triggers for updated_at columns
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_risks_updated_at
  BEFORE UPDATE ON public.task_risks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();