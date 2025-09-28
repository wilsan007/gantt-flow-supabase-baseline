-- Ajouter des colonnes pour améliorer la gestion des projets

-- Compétences requises pour le projet
ALTER TABLE public.projects ADD COLUMN skills_required JSONB DEFAULT '[]';

-- Membres de l'équipe du projet (complément au manager)
ALTER TABLE public.projects ADD COLUMN team_members JSONB DEFAULT '[]';

-- Progression du projet (calculée automatiquement)
ALTER TABLE public.projects ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- Heures estimées totales pour le projet
ALTER TABLE public.projects ADD COLUMN estimated_hours DECIMAL(10,2) DEFAULT 0;

-- Heures réellement passées sur le projet
ALTER TABLE public.projects ADD COLUMN actual_hours DECIMAL(10,2) DEFAULT 0;

-- Date de fin réelle du projet (différente de end_date qui est planifiée)
ALTER TABLE public.projects ADD COLUMN completion_date DATE;

-- Commentaires sur les projets
CREATE TABLE public.project_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Enable RLS sur project_comments
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- Policies pour project_comments
CREATE POLICY "Users can view tenant project comments" 
  ON public.project_comments 
  FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can create tenant project comments" 
  ON public.project_comments 
  FOR INSERT 
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());

CREATE POLICY "Users can update their own project comments" 
  ON public.project_comments 
  FOR UPDATE 
  USING (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());

CREATE POLICY "Users can delete their own project comments" 
  ON public.project_comments 
  FOR DELETE 
  USING (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());

-- Index pour les performances
CREATE INDEX idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX idx_project_comments_tenant_id ON public.project_comments(tenant_id);

-- Trigger pour updated_at sur project_comments
CREATE TRIGGER update_project_comments_updated_at
  BEFORE UPDATE ON public.project_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour calculer automatiquement la progression d'un projet
CREATE OR REPLACE FUNCTION public.calculate_project_progress(p_project_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_effort DECIMAL := 0;
    completed_effort DECIMAL := 0;
    progress_percentage INTEGER := 0;
BEGIN
    -- Calculer l'effort total et l'effort complété
    SELECT 
        COALESCE(SUM(effort_estimate_h), 0),
        COALESCE(SUM(effort_estimate_h * progress / 100.0), 0)
    INTO total_effort, completed_effort
    FROM public.tasks 
    WHERE project_id = p_project_id;
    
    -- Calculer le pourcentage
    IF total_effort > 0 THEN
        progress_percentage := ROUND(completed_effort / total_effort * 100);
    END IF;
    
    -- Mettre à jour le projet
    UPDATE public.projects 
    SET 
        progress = progress_percentage,
        estimated_hours = total_effort,
        updated_at = now()
    WHERE id = p_project_id;
    
    RETURN progress_percentage;
END;
$$;

-- Trigger pour recalculer automatiquement la progression quand une tâche change
CREATE OR REPLACE FUNCTION public.update_project_progress_on_task_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Recalculer pour l'ancien projet si la tâche a changé de projet
    IF TG_OP = 'UPDATE' AND OLD.project_id IS NOT NULL AND OLD.project_id != NEW.project_id THEN
        PERFORM public.calculate_project_progress(OLD.project_id);
    END IF;
    
    -- Recalculer pour le nouveau projet
    IF NEW.project_id IS NOT NULL THEN
        PERFORM public.calculate_project_progress(NEW.project_id);
    END IF;
    
    -- Recalculer pour l'ancien projet en cas de suppression
    IF TG_OP = 'DELETE' AND OLD.project_id IS NOT NULL THEN
        PERFORM public.calculate_project_progress(OLD.project_id);
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Créer les triggers
DROP TRIGGER IF EXISTS update_project_progress_on_task_insert ON public.tasks;
DROP TRIGGER IF EXISTS update_project_progress_on_task_update ON public.tasks;
DROP TRIGGER IF EXISTS update_project_progress_on_task_delete ON public.tasks;

CREATE TRIGGER update_project_progress_on_task_insert
    AFTER INSERT ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_progress_on_task_change();

CREATE TRIGGER update_project_progress_on_task_update
    AFTER UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_progress_on_task_change();

CREATE TRIGGER update_project_progress_on_task_delete
    AFTER DELETE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_progress_on_task_change();

-- Recalculer la progression pour tous les projets existants
DO $$
DECLARE
    project_record RECORD;
BEGIN
    FOR project_record IN SELECT id FROM public.projects LOOP
        PERFORM public.calculate_project_progress(project_record.id);
    END LOOP;
END $$;
