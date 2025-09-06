-- Create profiles table for real user names
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Add real users data
INSERT INTO public.profiles (full_name, role) VALUES
('Marie Dupont', 'Designer'),
('Jean Martin', 'Développeur Frontend'),
('Sophie Bernard', 'Développeur Backend'),
('Pierre Dubois', 'DevOps'),
('Camille Laurent', 'Chef de projet'),
('Lucas Moreau', 'Testeur QA');

-- Update tasks table to use profile references
ALTER TABLE public.tasks ADD COLUMN assignee_id UUID REFERENCES public.profiles(id);

-- Add trigger for profiles timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();