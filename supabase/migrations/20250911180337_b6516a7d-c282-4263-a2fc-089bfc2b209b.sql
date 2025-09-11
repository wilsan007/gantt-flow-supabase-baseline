-- Tables pour le système d'alertes et solutions
CREATE TABLE public.alert_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL, -- 'hr', 'project', 'capacity', 'performance', 'safety'
  severity text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  auto_trigger_conditions jsonb, -- Conditions pour déclencher automatiquement
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid DEFAULT get_user_tenant_id()
);

CREATE TABLE public.alert_solutions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  action_steps jsonb, -- Array de steps détaillés
  effectiveness_score integer DEFAULT 70, -- Score d'efficacité 1-100
  implementation_time text, -- 'immediate', 'short_term', 'long_term'
  required_roles text[], -- Rôles nécessaires pour implémenter
  cost_level text DEFAULT 'low', -- 'low', 'medium', 'high'
  category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id uuid DEFAULT get_user_tenant_id()
);

CREATE TABLE public.alert_type_solutions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type_id uuid NOT NULL REFERENCES public.alert_types(id) ON DELETE CASCADE,
  solution_id uuid NOT NULL REFERENCES public.alert_solutions(id) ON DELETE CASCADE,
  priority_order integer DEFAULT 1,
  context_conditions jsonb, -- Conditions spécifiques pour recommander cette solution
  tenant_id uuid DEFAULT get_user_tenant_id(),
  UNIQUE(alert_type_id, solution_id)
);

CREATE TABLE public.alert_instances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type_id uuid NOT NULL REFERENCES public.alert_types(id),
  title text NOT NULL,
  description text,
  severity text NOT NULL,
  status text NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
  entity_type text, -- 'employee', 'project', 'task', 'department'
  entity_id uuid,
  entity_name text,
  context_data jsonb, -- Données spécifiques du contexte
  triggered_at timestamp with time zone NOT NULL DEFAULT now(),
  acknowledged_at timestamp with time zone,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  tenant_id uuid DEFAULT get_user_tenant_id(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.alert_instance_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_instance_id uuid NOT NULL REFERENCES public.alert_instances(id) ON DELETE CASCADE,
  solution_id uuid NOT NULL REFERENCES public.alert_solutions(id),
  recommended_score integer, -- Score calculé pour cette instance
  is_primary boolean DEFAULT false,
  tenant_id uuid DEFAULT get_user_tenant_id(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_type_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_instance_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage tenant alert types" ON public.alert_types
FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage tenant alert solutions" ON public.alert_solutions
FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage tenant alert type solutions" ON public.alert_type_solutions
FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage tenant alert instances" ON public.alert_instances
FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage tenant alert recommendations" ON public.alert_instance_recommendations
FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- Trigger pour updated_at
CREATE TRIGGER update_alert_instances_updated_at
BEFORE UPDATE ON public.alert_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour calculer les recommandations de solutions
CREATE OR REPLACE FUNCTION public.calculate_alert_recommendations(p_alert_instance_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    alert_rec RECORD;
    solution_rec RECORD;
    score INTEGER;
BEGIN
    -- Récupérer l'instance d'alerte
    SELECT * INTO alert_rec FROM public.alert_instances WHERE id = p_alert_instance_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Supprimer les anciennes recommandations
    DELETE FROM public.alert_instance_recommendations WHERE alert_instance_id = p_alert_instance_id;
    
    -- Calculer les scores pour chaque solution applicable
    FOR solution_rec IN 
        SELECT s.*, ats.priority_order, ats.context_conditions
        FROM public.alert_solutions s
        JOIN public.alert_type_solutions ats ON s.id = ats.solution_id
        WHERE ats.alert_type_id = alert_rec.alert_type_id
        ORDER BY ats.priority_order
    LOOP
        -- Score de base basé sur l'efficacité et la priorité
        score := solution_rec.effectiveness_score - (solution_rec.priority_order * 5);
        
        -- Ajustements selon la sévérité
        CASE alert_rec.severity
            WHEN 'critical' THEN
                IF solution_rec.implementation_time = 'immediate' THEN score := score + 20; END IF;
            WHEN 'high' THEN
                IF solution_rec.implementation_time IN ('immediate', 'short_term') THEN score := score + 10; END IF;
            WHEN 'medium' THEN
                IF solution_rec.cost_level = 'low' THEN score := score + 5; END IF;
        END CASE;
        
        -- Insérer la recommandation
        INSERT INTO public.alert_instance_recommendations (
            alert_instance_id, solution_id, recommended_score, 
            is_primary, tenant_id
        ) VALUES (
            p_alert_instance_id, solution_rec.id, score,
            solution_rec.priority_order = 1, alert_rec.tenant_id
        );
    END LOOP;
END;
$$;