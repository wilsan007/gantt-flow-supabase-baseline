-- Ajout des solutions spécifiques aux alertes projet existantes
INSERT INTO public.alert_type_solutions (alert_type_id, solution_id, priority_order, context_conditions) 
SELECT 
  at.id as alert_type_id,
  s.id as solution_id,
  1 as priority_order,
  '{}' as context_conditions
FROM public.alert_types at
JOIN public.alert_solutions s ON s.category IN ('Timeline', 'Resources', 'Planning', 'Process', 'Communication')
WHERE at.code = 'DEADLINE_RISK' AND at.application_domain = 'project'
AND NOT EXISTS (
  SELECT 1 FROM public.alert_type_solutions ats 
  WHERE ats.alert_type_id = at.id AND ats.solution_id = s.id
);