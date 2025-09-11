-- Corriger la migration pour utiliser les UUIDs existants dans la base

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

-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS sync_assigned_name_trigger ON public.tasks;
DROP TRIGGER IF EXISTS sync_project_name_trigger ON public.tasks;
DROP TRIGGER IF EXISTS sync_department_name_trigger ON public.tasks;
DROP TRIGGER IF EXISTS sync_all_task_names_trigger ON public.tasks;

-- Créer le trigger pour synchroniser tous les noms
CREATE TRIGGER sync_all_task_names_trigger
    BEFORE INSERT OR UPDATE OF assignee_id, project_id, department_id
    ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_all_task_names();

-- Mettre à jour les tâches existantes en utilisant les UUIDs existants
DO $$
DECLARE
    task_record RECORD;
    first_employee_id uuid;
    first_project_id uuid;
    first_department_id uuid;
    employees_array uuid[];
    projects_array uuid[];
    departments_array uuid[];
BEGIN
    -- Récupérer tous les employés, projets et départements existants
    SELECT array_agg(id) INTO employees_array FROM public.employees WHERE tenant_id = get_user_tenant_id();
    SELECT array_agg(id) INTO projects_array FROM public.projects WHERE tenant_id = get_user_tenant_id();
    SELECT array_agg(id) INTO departments_array FROM public.departments WHERE tenant_id = get_user_tenant_id();
    
    -- Si aucune donnée n'existe, créer des entrées par défaut
    IF array_length(departments_array, 1) IS NULL THEN
        INSERT INTO public.departments (name, description, tenant_id)
        VALUES ('Département Général', 'Département général par défaut', get_user_tenant_id())
        RETURNING id INTO first_department_id;
        departments_array := ARRAY[first_department_id];
    END IF;
    
    IF array_length(projects_array, 1) IS NULL THEN
        INSERT INTO public.projects (name, description, tenant_id)
        VALUES ('Projet Général', 'Projet général par défaut', get_user_tenant_id())
        RETURNING id INTO first_project_id;
        projects_array := ARRAY[first_project_id];
    END IF;
    
    IF array_length(employees_array, 1) IS NULL THEN
        INSERT INTO public.employees (full_name, email, employee_id, tenant_id)
        VALUES ('Utilisateur Défaut', 'default@company.com', 'EMP001', get_user_tenant_id())
        RETURNING id INTO first_employee_id;
        employees_array := ARRAY[first_employee_id];
    END IF;
    
    -- Mettre à jour toutes les tâches existantes avec le premier élément de chaque type
    UPDATE public.tasks SET
        assignee_id = COALESCE(assignee_id, employees_array[1]),
        project_id = COALESCE(project_id, projects_array[1]),
        department_id = COALESCE(department_id, departments_array[1])
    WHERE tenant_id = get_user_tenant_id()
    AND (assignee_id IS NULL OR project_id IS NULL OR department_id IS NULL);
    
    -- Synchroniser tous les noms pour les tâches existantes
    UPDATE public.tasks SET
        assigned_name = COALESCE(assigned_name, e.full_name),
        project_name = COALESCE(project_name, p.name),
        department_name = COALESCE(department_name, d.name)
    FROM public.employees e, public.projects p, public.departments d
    WHERE tasks.assignee_id = e.id
    AND tasks.project_id = p.id
    AND tasks.department_id = d.id
    AND tasks.tenant_id = get_user_tenant_id();
    
END $$;