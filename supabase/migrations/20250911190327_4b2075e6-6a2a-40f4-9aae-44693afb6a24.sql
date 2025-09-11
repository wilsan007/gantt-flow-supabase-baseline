-- Nettoyer et corriger les assignations de tâches avec les vrais UUIDs

-- Étape 1: Temporairement supprimer les contraintes de clé étrangère pour nettoyer
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_department_id_fkey;

-- Étape 2: Supprimer la contrainte NOT NULL temporairement
ALTER TABLE public.tasks ALTER COLUMN assigned_name DROP NOT NULL;

-- Étape 3: Ajouter department_name si elle n'existe pas
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS department_name TEXT;

-- Étape 4: Nettoyer les assignations invalides en les remettant à NULL
UPDATE public.tasks SET 
    assignee_id = NULL, 
    project_id = NULL, 
    department_id = NULL
WHERE tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default-org' LIMIT 1);

-- Étape 5: Créer ou récupérer les entités par défaut
DO $$
DECLARE
    default_employee_id uuid;
    default_project_id uuid;
    default_department_id uuid;
    tenant_uuid uuid;
BEGIN
    -- Récupérer le tenant ID
    SELECT id INTO tenant_uuid FROM public.tenants WHERE slug = 'default-org' LIMIT 1;
    
    -- Récupérer ou créer un employé par défaut
    SELECT id INTO default_employee_id FROM public.employees WHERE tenant_id = tenant_uuid LIMIT 1;
    IF default_employee_id IS NULL THEN
        INSERT INTO public.employees (full_name, email, employee_id, tenant_id)
        VALUES ('Utilisateur Défaut', 'default@company.com', 'EMP001', tenant_uuid)
        RETURNING id INTO default_employee_id;
    END IF;
    
    -- Récupérer ou créer un projet par défaut
    SELECT id INTO default_project_id FROM public.projects WHERE tenant_id = tenant_uuid LIMIT 1;
    IF default_project_id IS NULL THEN
        INSERT INTO public.projects (name, description, tenant_id)
        VALUES ('Projet Général', 'Projet général par défaut', tenant_uuid)
        RETURNING id INTO default_project_id;
    END IF;
    
    -- Récupérer ou créer un département par défaut
    SELECT id INTO default_department_id FROM public.departments WHERE tenant_id = tenant_uuid LIMIT 1;
    IF default_department_id IS NULL THEN
        INSERT INTO public.departments (name, description, tenant_id)
        VALUES ('Département Général', 'Département général par défaut', tenant_uuid)
        RETURNING id INTO default_department_id;
    END IF;
    
    -- Assigner les valeurs par défaut à toutes les tâches
    UPDATE public.tasks SET
        assignee_id = default_employee_id,
        project_id = default_project_id,
        department_id = default_department_id
    WHERE tenant_id = tenant_uuid;
    
    -- Mettre à jour les noms correspondants
    UPDATE public.tasks SET
        assigned_name = e.full_name,
        project_name = p.name,
        department_name = d.name
    FROM public.employees e, public.projects p, public.departments d
    WHERE tasks.assignee_id = e.id
    AND tasks.project_id = p.id
    AND tasks.department_id = d.id
    AND tasks.tenant_id = tenant_uuid;
END $$;

-- Étape 6: Remettre les contraintes NOT NULL
ALTER TABLE public.tasks ALTER COLUMN assigned_name SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN project_name SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN department_name SET NOT NULL;

-- Étape 7: Remettre les contraintes de clé étrangère
ALTER TABLE public.tasks ADD CONSTRAINT tasks_assignee_id_fkey 
    FOREIGN KEY (assignee_id) REFERENCES public.employees(id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- Étape 8: Créer la fonction pour synchroniser tous les noms
CREATE OR REPLACE FUNCTION public.sync_all_task_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchroniser le nom de l'employé
    IF NEW.assignee_id IS NOT NULL THEN
        SELECT full_name INTO NEW.assigned_name
        FROM public.employees
        WHERE id = NEW.assignee_id;
        
        -- Si aucun employé trouvé, utiliser une valeur par défaut
        IF NEW.assigned_name IS NULL THEN
            NEW.assigned_name := 'Utilisateur Inconnu';
        END IF;
    ELSE
        NEW.assigned_name := 'Non Assigné';
    END IF;
    
    -- Synchroniser le nom du projet
    IF NEW.project_id IS NOT NULL THEN
        SELECT name INTO NEW.project_name
        FROM public.projects
        WHERE id = NEW.project_id;
        
        IF NEW.project_name IS NULL THEN
            NEW.project_name := 'Projet Inconnu';
        END IF;
    ELSE
        NEW.project_name := 'Aucun Projet';
    END IF;
    
    -- Synchroniser le nom du département
    IF NEW.department_id IS NOT NULL THEN
        SELECT name INTO NEW.department_name
        FROM public.departments
        WHERE id = NEW.department_id;
        
        IF NEW.department_name IS NULL THEN
            NEW.department_name := 'Département Inconnu';
        END IF;
    ELSE
        NEW.department_name := 'Aucun Département';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Étape 9: Créer le trigger pour synchroniser tous les noms
DROP TRIGGER IF EXISTS sync_all_task_names_trigger ON public.tasks;

CREATE TRIGGER sync_all_task_names_trigger
    BEFORE INSERT OR UPDATE OF assignee_id, project_id, department_id
    ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_all_task_names();