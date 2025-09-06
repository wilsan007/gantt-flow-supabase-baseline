-- Clear existing data and add real Gantt tasks
DELETE FROM public.task_actions;
DELETE FROM public.tasks;

-- Insert real Gantt tasks with proper dates and assignees
INSERT INTO public.tasks (title, assignee, assignee_id, start_date, due_date, priority, status, effort_estimate_h, progress) 
SELECT 
    task_data.title,
    p.full_name,
    p.id,
    task_data.start_date::date,
    task_data.due_date::date,
    task_data.priority,
    task_data.status,
    task_data.effort_estimate_h,
    task_data.progress
FROM (
    VALUES 
    ('Design UI/UX', 'Marie Dupont', '2024-01-01', '2024-01-15', 'high', 'doing', 40, 60),
    ('Développement Frontend', 'Jean Martin', '2024-01-10', '2024-02-05', 'medium', 'todo', 80, 0),
    ('Backend API', 'Sophie Bernard', '2024-01-20', '2024-02-10', 'high', 'todo', 60, 0),
    ('Tests et Déploiement', 'Lucas Moreau', '2024-02-05', '2024-02-20', 'medium', 'todo', 30, 0),
    ('Documentation', 'Camille Laurent', '2024-02-15', '2024-03-01', 'low', 'todo', 20, 0)
) AS task_data(title, assignee_name, start_date, due_date, priority, status, effort_estimate_h, progress)
JOIN public.profiles p ON p.full_name = task_data.assignee_name;