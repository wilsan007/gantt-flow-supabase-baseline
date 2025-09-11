-- Migration pour corriger et finaliser les colonnes de noms dans la table tasks

-- Étape 1: S'assurer que assigned_name peut être temporairement null pour la mise à jour
ALTER TABLE public.tasks ALTER COLUMN assigned_name DROP NOT NULL;

-- Étape 2: Ajouter department_name si elle n'existe pas
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS department_name TEXT;

-- Étape 3: Mettre à jour toutes les tâches existantes pour remplir les noms
UPDATE public.tasks SET
    assigned_name = e.full_name,
    project_name = p.name,
    department_name = d.name
FROM public.employees e, public.projects p, public.departments d
WHERE tasks.assignee_id = e.id
AND tasks.project_id = p.id
AND tasks.department_id = d.id
AND tasks.tenant_id = get_user_tenant_id();

-- Étape 4: Pour les tâches qui n'ont pas encore d'assignee_id, project_id ou department_id, les assigner
DO $$
DECLARE
    default_employee_id uuid;
    default_project_id uuid;
    default_department_id uuid;
BEGIN
    -- Récupérer ou créer un employé par défaut
    SELECT id INTO default_employee_id FROM public.employees WHERE tenant_id = get_user_tenant_id() LIMIT 1;
    IF default_employee_id IS NULL THEN
        INSERT INTO public.employees (full_name, email, employee_id, tenant_id)
        VALUES ('Utilisateur Défaut', 'default@company.com', 'EMP001', get_user_tenant_id())
        RETURNING id INTO default_employee_id;
    END IF;
    
    -- Récupérer ou créer un projet par défaut
    SELECT id INTO default_project_id FROM public.projects WHERE tenant_id = get_user_tenant_id() LIMIT 1;
    IF default_project_id IS NULL THEN
        INSERT INTO public.projects (name, description, tenant_id)
        VALUES ('Projet Général', 'Projet général par défaut', get_user_tenant_id())
        RETURNING id INTO default_project_id;
    END IF;
    
    -- Récupérer ou créer un département par défaut
    SELECT id INTO default_department_id FROM public.departments WHERE tenant_id = get_user_tenant_id() LIMIT 1;
    IF default_department_id IS NULL THEN
        INSERT INTO public.departments (name, description, tenant_id)
        VALUES ('Département Général', 'Département général par défaut', get_user_tenant_id())
        RETURNING id INTO default_department_id;
    END IF;
    
    -- Mettre à jour les tâches sans assignation
    UPDATE public.tasks SET
        assignee_id = COALESCE(assignee_id, default_employee_id),
        project_id = COALESCE(project_id, default_project_id),
        department_id = COALESCE(department_id, default_department_id)
    WHERE tenant_id = get_user_tenant_id()
    AND (assignee_id IS NULL OR project_id IS NULL OR department_id IS NULL);
    
    -- Mettre à jour les noms pour ces tâches
    UPDATE public.tasks SET
        assigned_name = COALESCE(assigned_name, e.full_name),
        project_name = COALESCE(project_name, p.name),
        department_name = COALESCE(department_name, d.name)
    FROM public.employees e, public.projects p, public.departments d
    WHERE tasks.assignee_id = e.id
    AND tasks.project_id = p.id
    AND tasks.department_id = d.id
    AND tasks.tenant_id = get_user_tenant_id()
    AND (tasks.assigned_name IS NULL OR tasks.project_name IS NULL OR tasks.department_name IS NULL);
END $$;

-- Étape 5: Maintenant que toutes les tâches ont des noms, remettre les contraintes NOT NULL
ALTER TABLE public.tasks ALTER COLUMN assigned_name SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN project_name SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN department_name SET NOT NULL;

-- Étape 6: Créer ou remplacer la fonction pour synchroniser tous les noms
CREATE OR REPLACE FUNCTION public.sync_all_task_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchroniser le nom de l'employé
    IF NEW.assignee_id IS NOT NULL THEN
        SELECT full_name INTO NEW.assigned_name
        FROM public.employees
        WHERE id = NEW.assignee_id;
        
        -- Si aucun employé trouvé, garder l'ancien nom ou utiliser une valeur par défaut
        IF NEW.assigned_name IS NULL THEN
            NEW.assigned_name := COALESCE(OLD.assigned_name, 'Utilisateur Inconnu');
        END IF;
    ELSE
        NEW.assigned_name := COALESCE(OLD.assigned_name, 'Non Assigné');
    END IF;
    
    -- Synchroniser le nom du projet
    IF NEW.project_id IS NOT NULL THEN
        SELECT name INTO NEW.project_name
        FROM public.projects
        WHERE id = NEW.project_id;
        
        IF NEW.project_name IS NULL THEN
            NEW.project_name := COALESCE(OLD.project_name, 'Projet Inconnu');
        END IF;
    ELSE
        NEW.project_name := COALESCE(OLD.project_name, 'Aucun Projet');
    END IF;
    
    -- Synchroniser le nom du département
    IF NEW.department_id IS NOT NULL THEN
        SELECT name INTO NEW.department_name
        FROM public.departments
        WHERE id = NEW.department_id;
        
        IF NEW.department_name IS NULL THEN
            NEW.department_name := COALESCE(OLD.department_name, 'Département Inconnu');
        END IF;
    ELSE
        NEW.department_name := COALESCE(OLD.department_name, 'Aucun Département');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Étape 7: Supprimer les anciens triggers et créer le nouveau
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