-- Créer un trigger pour auto-remplir le tenant_id lors de l'insertion de documents

CREATE OR REPLACE FUNCTION public.auto_fill_document_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Récupérer le tenant_id de la tâche associée
  SELECT tenant_id INTO NEW.tenant_id
  FROM public.tasks
  WHERE id = NEW.task_id;
  
  -- Si pas de tenant_id trouvé, utiliser celui de l'utilisateur actuel
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := get_user_tenant_id();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_auto_fill_document_tenant_id ON public.task_documents;
CREATE TRIGGER trigger_auto_fill_document_tenant_id
  BEFORE INSERT ON public.task_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_document_tenant_id();