-- Ajouter la colonne department_name à la table tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS department_name TEXT;

-- Créer une fonction combinée pour synchroniser tous les noms
CREATE OR REPLACE FUNCTION public.sync_all_task_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchroniser le nom de l'employé
    IF NEW.assignee_id IS NOT NULL THEN
        SELECT full_name INTO NEW.assigned_name
        FROM public.employees
        WHERE id = NEW.assignee_id;
    END IF;
    
    -- Synchroniser le nom du projet
    IF NEW.project_id IS NOT NULL THEN
        SELECT name INTO NEW.project_name
        FROM public.projects
        WHERE id = NEW.project_id;
    END IF;
    
    -- Synchroniser le nom du département
    IF NEW.department_id IS NOT NULL THEN
        SELECT name INTO NEW.department_name
        FROM public.departments
        WHERE id = NEW.department_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour synchroniser tous les noms
DROP TRIGGER IF EXISTS sync_all_task_names_trigger ON public.tasks;
CREATE TRIGGER sync_all_task_names_trigger
    BEFORE INSERT OR UPDATE OF assignee_id, project_id, department_id
    ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_all_task_names();

-- Mettre à jour les tâches existantes avec une répartition aléatoire en utilisant les IDs existants
DO $$
DECLARE
    task_record RECORD;
    employees_array uuid[];
    projects_array uuid[];
    departments_array uuid[];
    random_employee_id uuid;
    random_project_id uuid;
    random_department_id uuid;
BEGIN
    -- Récupérer tous les employés, projets et départements existants
    SELECT array_agg(id) INTO employees_array FROM public.employees WHERE tenant_id = get_user_tenant_id();
    SELECT array_agg(id) INTO projects_array FROM public.projects WHERE tenant_id = get_user_tenant_id();
    SELECT array_agg(id) INTO departments_array FROM public.departments WHERE tenant_id = get_user_tenant_id();
    
    -- Vérifier qu'il y a des données
    IF array_length(employees_array, 1) > 0 AND array_length(projects_array, 1) > 0 AND array_length(departments_array, 1) > 0 THEN
        -- Mettre à jour toutes les tâches avec répartition aléatoire
        FOR task_record IN SELECT id FROM public.tasks WHERE tenant_id = get_user_tenant_id() LOOP
            -- Sélectionner aléatoirement un employé, projet et département
            random_employee_id := employees_array[1 + floor(random() * array_length(employees_array, 1))::int];
            random_project_id := projects_array[1 + floor(random() * array_length(projects_array, 1))::int];
            random_department_id := departments_array[1 + floor(random() * array_length(departments_array, 1))::int];
            
            UPDATE public.tasks SET
                assignee_id = random_employee_id,
                project_id = random_project_id,
                department_id = random_department_id
            WHERE id = task_record.id;
        END LOOP;
        
        -- Synchroniser tous les noms pour les tâches existantes
        UPDATE public.tasks SET
            assigned_name = e.full_name,
            project_name = p.name,
            department_name = d.name
        FROM public.employees e, public.projects p, public.departments d
        WHERE tasks.assignee_id = e.id
        AND tasks.project_id = p.id
        AND tasks.department_id = d.id
        AND tasks.tenant_id = get_user_tenant_id();
        
        RAISE NOTICE 'Mise à jour réussie de % tâches avec répartition aléatoire', (SELECT COUNT(*) FROM public.tasks WHERE tenant_id = get_user_tenant_id());
    ELSE
        RAISE NOTICE 'Données insuffisantes - Employés: %, Projets: %, Départements: %', 
            array_length(employees_array, 1), 
            array_length(projects_array, 1), 
            array_length(departments_array, 1);
    END IF;
END $$;