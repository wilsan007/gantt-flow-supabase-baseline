-- CORRECTIONS SUPPLÉMENTAIRES DE SÉCURITÉ

-- 1. VÉRIFIER ET CORRIGER LES POLITIQUES RLS MANQUANTES
DO $$
DECLARE
    table_name TEXT;
    tables_to_secure TEXT[] := ARRAY['departments', 'task_actions', 'task_comments', 'task_dependencies', 'task_documents', 'task_risks'];
BEGIN
    FOREACH table_name IN ARRAY tables_to_secure
    LOOP
        -- Supprimer les anciennes politiques dangereuses
        EXECUTE format('DROP POLICY IF EXISTS "super_admin_all_%s" ON public.%I', table_name, table_name);
        
        -- Créer des politiques sécurisées
        EXECUTE format('
            CREATE POLICY "Users can view %s in their tenant" 
            ON public.%I FOR SELECT 
            USING (tenant_id = public.get_user_tenant_id())
        ', table_name, table_name);
        
        EXECUTE format('
            CREATE POLICY "Users can create %s in their tenant" 
            ON public.%I FOR INSERT 
            WITH CHECK (tenant_id = public.get_user_tenant_id())
        ', table_name, table_name);
        
        EXECUTE format('
            CREATE POLICY "Users can update %s in their tenant" 
            ON public.%I FOR UPDATE 
            USING (tenant_id = public.get_user_tenant_id())
        ', table_name, table_name);
        
        EXECUTE format('
            CREATE POLICY "Users can delete %s in their tenant" 
            ON public.%I FOR DELETE 
            USING (tenant_id = public.get_user_tenant_id())
        ', table_name, table_name);
    END LOOP;
END $$;

-- 2. SÉCURISER LA FONCTION get_user_tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tm.tenant_id 
  FROM public.tenant_members tm
  WHERE tm.user_id = auth.uid() 
  AND tm.status = 'active'
  AND EXISTS (
    SELECT 1 FROM public.tenants t 
    WHERE t.id = tm.tenant_id 
    AND t.status = 'active'
  )
  LIMIT 1;
$$;

-- 3. AJOUTER DES CONTRAINTES DE VALIDATION
DO $$
BEGIN
    -- Contrainte pour task_actions weight_percentage
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_actions_weight_range' 
        AND table_name = 'task_actions'
    ) THEN
        ALTER TABLE public.task_actions 
        ADD CONSTRAINT task_actions_weight_range 
        CHECK (weight_percentage >= 0 AND weight_percentage <= 100);
    END IF;
    
    -- Contrainte pour projects progress
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_progress_range' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE public.projects 
        ADD CONSTRAINT projects_progress_range 
        CHECK (progress >= 0 AND progress <= 100);
    END IF;
    
    -- Contrainte pour tasks title
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_title_length' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_title_length 
        CHECK (char_length(title) BETWEEN 1 AND 200);
    END IF;
END $$;

-- 4. CRÉER UN TRIGGER DE VALIDATION GÉNÉRALE
CREATE OR REPLACE FUNCTION public.validate_tenant_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Vérifier que le tenant_id correspond à l'utilisateur connecté
    IF NEW.tenant_id IS NOT NULL AND NEW.tenant_id != public.get_user_tenant_id() THEN
        RAISE EXCEPTION 'Access denied: Invalid tenant_id for current user';
    END IF;
    
    -- Nettoyer les données d'entrée selon la table
    CASE TG_TABLE_NAME
        WHEN 'tasks' THEN
            NEW.title := trim(NEW.title);
            IF NEW.description IS NOT NULL THEN
                NEW.description := trim(NEW.description);
            END IF;
        WHEN 'projects' THEN
            NEW.name := trim(NEW.name);
            IF NEW.description IS NOT NULL THEN
                NEW.description := trim(NEW.description);
            END IF;
        WHEN 'task_actions' THEN
            NEW.title := trim(NEW.title);
    END CASE;
    
    RETURN NEW;
END;
$$;

-- 5. APPLIQUER LE TRIGGER AUX TABLES SENSIBLES
DROP TRIGGER IF EXISTS validate_tenant_access_trigger ON public.tasks;
DROP TRIGGER IF EXISTS validate_tenant_access_trigger ON public.projects;
DROP TRIGGER IF EXISTS validate_tenant_access_trigger ON public.task_actions;

CREATE TRIGGER validate_tenant_access_trigger
    BEFORE INSERT OR UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_access();

CREATE TRIGGER validate_tenant_access_trigger
    BEFORE INSERT OR UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_access();

CREATE TRIGGER validate_tenant_access_trigger
    BEFORE INSERT OR UPDATE ON public.task_actions
    FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_access();

-- 6. NETTOYER LES DONNÉES EXISTANTES
UPDATE public.tasks SET title = trim(title) WHERE title != trim(title);
UPDATE public.projects SET name = trim(name) WHERE name != trim(name);
UPDATE public.task_actions SET title = trim(title) WHERE title != trim(title);
