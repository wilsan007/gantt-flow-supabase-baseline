-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('task-documents', 'task-documents', false);

-- Create documents table
CREATE TABLE public.task_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  subtask_id UUID NULL,
  project_id UUID NULL,
  uploader_id UUID NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Anyone can view task documents" 
ON public.task_documents 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can upload task documents" 
ON public.task_documents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete task documents" 
ON public.task_documents 
FOR DELETE 
USING (true);

-- Create storage policies for task documents
CREATE POLICY "Anyone can view task documents in storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'task-documents');

CREATE POLICY "Anyone can upload task documents to storage" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'task-documents');

CREATE POLICY "Anyone can delete task documents from storage" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'task-documents');

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_task_documents_updated_at
BEFORE UPDATE ON public.task_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE public.task_documents 
ADD CONSTRAINT task_documents_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES public.tasks(id);

ALTER TABLE public.task_documents 
ADD CONSTRAINT task_documents_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id);