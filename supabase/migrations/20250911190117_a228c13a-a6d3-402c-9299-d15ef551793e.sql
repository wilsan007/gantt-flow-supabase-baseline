-- Corriger le trigger log_task_change pour utiliser assigned_name au lieu de assignee

CREATE OR REPLACE FUNCTION public.log_task_change()
RETURNS TRIGGER AS $$
DECLARE
    tenant_uuid UUID;
    user_uuid UUID;
    user_profile_name TEXT;
BEGIN
    -- Get tenant ID
    SELECT get_user_tenant_id() INTO tenant_uuid;
    
    -- Get user info
    SELECT auth.uid() INTO user_uuid;
    SELECT full_name INTO user_profile_name 
    FROM public.profiles 
    WHERE user_id = user_uuid AND tenant_id = tenant_uuid
    LIMIT 1;
    
    -- Si pas de profil, utiliser un nom par défaut
    IF user_profile_name IS NULL THEN
        user_profile_name := 'Utilisateur';
    END IF;
    
    -- For UPDATE operations, log the changes
    IF TG_OP = 'UPDATE' THEN
        -- Check each field for changes and log them
        IF OLD.title IS DISTINCT FROM NEW.title THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'title', OLD.title, NEW.title, 'Titre modifié de "' || COALESCE(OLD.title, '') || '" vers "' || COALESCE(NEW.title, '') || '"', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.assigned_name IS DISTINCT FROM NEW.assigned_name THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'assigned_name', OLD.assigned_name, NEW.assigned_name, 'Assigné modifié de "' || COALESCE(OLD.assigned_name, '') || '" vers "' || COALESCE(NEW.assigned_name, '') || '"', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'status', OLD.status, NEW.status, 'Statut modifié de "' || COALESCE(OLD.status, '') || '" vers "' || COALESCE(NEW.status, '') || '"', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.priority IS DISTINCT FROM NEW.priority THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'priority', OLD.priority, NEW.priority, 'Priorité modifiée de "' || COALESCE(OLD.priority, '') || '" vers "' || COALESCE(NEW.priority, '') || '"', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.progress IS DISTINCT FROM NEW.progress THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'progress', OLD.progress::TEXT, NEW.progress::TEXT, 'Progression modifiée de ' || COALESCE(OLD.progress, 0) || '% vers ' || COALESCE(NEW.progress, 0) || '%', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'start_date', OLD.start_date::TEXT, NEW.start_date::TEXT, 'Date de début modifiée de ' || COALESCE(OLD.start_date::TEXT, '') || ' vers ' || COALESCE(NEW.start_date::TEXT, ''), user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'due_date', OLD.due_date::TEXT, NEW.due_date::TEXT, 'Date d''échéance modifiée de ' || COALESCE(OLD.due_date::TEXT, '') || ' vers ' || COALESCE(NEW.due_date::TEXT, ''), user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
        IF OLD.effort_estimate_h IS DISTINCT FROM NEW.effort_estimate_h THEN
            INSERT INTO public.task_audit_logs (task_id, action_type, field_name, old_value, new_value, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'update', 'effort_estimate_h', OLD.effort_estimate_h::TEXT, NEW.effort_estimate_h::TEXT, 'Estimation d''effort modifiée de ' || COALESCE(OLD.effort_estimate_h, 0) || 'h vers ' || COALESCE(NEW.effort_estimate_h, 0) || 'h', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
    ELSIF TG_OP = 'INSERT' THEN
        -- Log task creation
        IF NEW.parent_id IS NOT NULL THEN
            -- C'est une sous-tâche
            INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'create_subtask', 'Sous-tâche créée: "' || NEW.title || '"', user_uuid, user_profile_name, tenant_uuid);
            
            -- Log aussi sur la tâche parent
            INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id, related_entity_id, related_entity_type)
            VALUES (NEW.parent_id, 'add_subtask', 'Sous-tâche ajoutée: "' || NEW.title || '"', user_uuid, user_profile_name, tenant_uuid, NEW.id, 'task');
        ELSE
            -- C'est une tâche principale
            INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id)
            VALUES (NEW.id, 'create', 'Tâche créée: "' || NEW.title || '"', user_uuid, user_profile_name, tenant_uuid);
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Log task deletion
        INSERT INTO public.task_audit_logs (task_id, action_type, description, user_id, user_name, tenant_id)
        VALUES (OLD.id, 'delete', 'Tâche supprimée: "' || OLD.title || '"', user_uuid, user_profile_name, tenant_uuid);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Maintenant procéder avec la correction des colonnes de noms
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