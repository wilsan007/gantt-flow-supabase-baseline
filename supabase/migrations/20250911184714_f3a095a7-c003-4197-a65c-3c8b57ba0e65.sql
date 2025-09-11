-- Ajouter la colonne department_name à la table tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS department_name TEXT;

-- Créer la fonction pour synchroniser le nom de l'employé
CREATE OR REPLACE FUNCTION public.sync_assigned_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assignee_id IS NOT NULL THEN
        SELECT full_name INTO NEW.assigned_name
        FROM public.employees
        WHERE id = NEW.assignee_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer la fonction pour synchroniser le nom du projet
CREATE OR REPLACE FUNCTION public.sync_project_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NOT NULL THEN
        SELECT name INTO NEW.project_name
        FROM public.projects
        WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer la fonction pour synchroniser le nom du département
CREATE OR REPLACE FUNCTION public.sync_department_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.department_id IS NOT NULL THEN
        SELECT name INTO NEW.department_name
        FROM public.departments
        WHERE id = NEW.department_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS sync_assigned_name_trigger ON public.tasks;
DROP TRIGGER IF EXISTS sync_project_name_trigger ON public.tasks;
DROP TRIGGER IF EXISTS sync_department_name_trigger ON public.tasks;

-- Créer le trigger pour synchroniser tous les noms
CREATE TRIGGER sync_all_task_names_trigger
    BEFORE INSERT OR UPDATE OF assignee_id, project_id, department_id
    ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_all_task_names();

-- Mettre à jour les tâches existantes avec une répartition aléatoire
DO $$
DECLARE
    task_record RECORD;
    random_employee RECORD;
    random_project RECORD;
    random_department RECORD;
    employees_array uuid[];
    projects_array uuid[];
    departments_array uuid[];
BEGIN
    -- Récupérer tous les employés, projets et départements
    SELECT array_agg(id) INTO employees_array FROM public.employees WHERE tenant_id = get_user_tenant_id();
    SELECT array_agg(id) INTO projects_array FROM public.projects WHERE tenant_id = get_user_tenant_id();
    SELECT array_agg(id) INTO departments_array FROM public.departments WHERE tenant_id = get_user_tenant_id();
    
    -- Vérifier qu'il y a des données
    IF array_length(employees_array, 1) IS NULL OR array_length(projects_array, 1) IS NULL OR array_length(departments_array, 1) IS NULL THEN
        RAISE NOTICE 'Certaines tables sont vides. Création de données par défaut...';
        
        -- Créer un département par défaut si nécessaire
        IF array_length(departments_array, 1) IS NULL THEN
            INSERT INTO public.departments (name, description, tenant_id)
            VALUES ('Général', 'Département général par défaut', get_user_tenant_id())
            RETURNING id INTO random_department;
            departments_array := ARRAY[random_department.id];
        END IF;
        
        -- Créer un projet par défaut si nécessaire
        IF array_length(projects_array, 1) IS NULL THEN
            INSERT INTO public.projects (name, description, tenant_id)
            VALUES ('Projet Général', 'Projet général par défaut', get_user_tenant_id())
            RETURNING id INTO random_project;
            projects_array := ARRAY[random_project.id];
        END IF;
        
        -- Créer un employé par défaut si nécessaire
        IF array_length(employees_array, 1) IS NULL THEN
            INSERT INTO public.employees (full_name, email, employee_id, tenant_id)
            VALUES ('Utilisateur Défaut', 'default@company.com', 'EMP001', get_user_tenant_id())
            RETURNING id INTO random_employee;
            employees_array := ARRAY[random_employee.id];
        END IF;
    END IF;
    
    -- Mettre à jour toutes les tâches
    FOR task_record IN SELECT id FROM public.tasks WHERE tenant_id = get_user_tenant_id() LOOP
        -- Sélectionner aléatoirement un employé, projet et département
        UPDATE public.tasks SET
            assignee_id = employees_array[1 + floor(random() * array_length(employees_array, 1))::int],
            project_id = projects_array[1 + floor(random() * array_length(projects_array, 1))::int],
            department_id = departments_array[1 + floor(random() * array_length(departments_array, 1))::int]
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
END $$;