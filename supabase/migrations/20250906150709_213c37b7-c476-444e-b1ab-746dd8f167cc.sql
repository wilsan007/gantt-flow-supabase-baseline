-- Add real users data to existing profiles table
INSERT INTO public.profiles (full_name, role) VALUES
('Marie Dupont', 'Designer'),
('Jean Martin', 'Développeur Frontend'),
('Sophie Bernard', 'Développeur Backend'),
('Pierre Dubois', 'DevOps'),
('Camille Laurent', 'Chef de projet'),
('Lucas Moreau', 'Testeur QA')
ON CONFLICT (full_name) DO NOTHING;

-- Check if assignee_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='assignee_id') THEN
        ALTER TABLE public.tasks ADD COLUMN assignee_id UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- Clear existing sample data and add real Gantt tasks
DELETE FROM public.task_actions;
DELETE FROM public.tasks;

-- Insert real Gantt tasks with proper dates and assignees
DO $$
DECLARE
    marie_id UUID;
    jean_id UUID;
    sophie_id UUID;
    pierre_id UUID;
    camille_id UUID;
    lucas_id UUID;
    task1_id UUID;
    task2_id UUID;
    task3_id UUID;
    task4_id UUID;
    task5_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO marie_id FROM public.profiles WHERE full_name = 'Marie Dupont';
    SELECT id INTO jean_id FROM public.profiles WHERE full_name = 'Jean Martin';
    SELECT id INTO sophie_id FROM public.profiles WHERE full_name = 'Sophie Bernard';
    SELECT id INTO pierre_id FROM public.profiles WHERE full_name = 'Pierre Dubois';
    SELECT id INTO camille_id FROM public.profiles WHERE full_name = 'Camille Laurent';
    SELECT id INTO lucas_id FROM public.profiles WHERE full_name = 'Lucas Moreau';
    
    -- Insert tasks with real data
    INSERT INTO public.tasks (title, assignee, assignee_id, start_date, due_date, priority, status, effort_estimate_h, progress) VALUES
    ('Design UI/UX', 'Marie Dupont', marie_id, '2024-01-01', '2024-01-15', 'high', 'doing', 40, 60),
    ('Développement Frontend', 'Jean Martin', jean_id, '2024-01-10', '2024-02-05', 'medium', 'todo', 80, 0),
    ('Backend API', 'Sophie Bernard', sophie_id, '2024-01-20', '2024-02-10', 'high', 'todo', 60, 0),
    ('Tests & Déploiement', 'Lucas Moreau', lucas_id, '2024-02-05', '2024-02-20', 'medium', 'todo', 30, 0),
    ('Documentation', 'Camille Laurent', camille_id, '2024-02-15', '2024-03-01', 'low', 'todo', 20, 0);
    
    -- Get the inserted task IDs properly
    SELECT id INTO task1_id FROM public.tasks WHERE title = 'Design UI/UX' LIMIT 1;
    SELECT id INTO task2_id FROM public.tasks WHERE title = 'Développement Frontend' LIMIT 1;
    SELECT id INTO task3_id FROM public.tasks WHERE title = 'Backend API' LIMIT 1;
    SELECT id INTO task4_id FROM public.tasks WHERE title = 'Tests & Déploiement' LIMIT 1;
    SELECT id INTO task5_id FROM public.tasks WHERE title = 'Documentation' LIMIT 1;
    
    -- Insert actions for Design UI/UX
    INSERT INTO public.task_actions (task_id, title, is_done, position) VALUES
    (task1_id, 'Wireframes', true, 1),
    (task1_id, 'Maquettes', true, 2),
    (task1_id, 'Prototype', false, 3),
    (task1_id, 'Tests utilisateurs', false, 4),
    (task1_id, 'Validation finale', false, 5);
    
    -- Insert actions for Développement Frontend
    INSERT INTO public.task_actions (task_id, title, is_done, position) VALUES
    (task2_id, 'Setup projet', false, 1),
    (task2_id, 'Composants UI', false, 2),
    (task2_id, 'Pages principales', false, 3),
    (task2_id, 'Intégration API', false, 4),
    (task2_id, 'Tests unitaires', false, 5);
    
    -- Insert actions for Backend API
    INSERT INTO public.task_actions (task_id, title, is_done, position) VALUES
    (task3_id, 'Architecture API', false, 1),
    (task3_id, 'Endpoints base', false, 2),
    (task3_id, 'Authentification', false, 3),
    (task3_id, 'Base de données', false, 4),
    (task3_id, 'Documentation API', false, 5);
    
    -- Insert actions for Tests & Déploiement
    INSERT INTO public.task_actions (task_id, title, is_done, position) VALUES
    (task4_id, 'Tests d\'intégration', false, 1),
    (task4_id, 'Tests de performance', false, 2),
    (task4_id, 'Setup CI/CD', false, 3),
    (task4_id, 'Déploiement staging', false, 4),
    (task4_id, 'Déploiement production', false, 5);
    
    -- Insert actions for Documentation
    INSERT INTO public.task_actions (task_id, title, is_done, position) VALUES
    (task5_id, 'Guide utilisateur', false, 1),
    (task5_id, 'Documentation technique', false, 2),
    (task5_id, 'Guide déploiement', false, 3),
    (task5_id, 'Formation équipe', false, 4),
    (task5_id, 'Validation finale', false, 5);
END $$;