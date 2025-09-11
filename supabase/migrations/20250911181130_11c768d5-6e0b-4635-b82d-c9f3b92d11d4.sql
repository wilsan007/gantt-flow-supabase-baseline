-- Lier les types d'alertes aux solutions recommandées (version corrigée)
INSERT INTO public.alert_type_solutions (alert_type_id, solution_id, priority_order)
SELECT 
  at.id,
  s.id,
  1 as priority_order
FROM public.alert_types at
JOIN public.alert_solutions s ON 
  CASE 
    WHEN at.code = 'WORKLOAD_HIGH' AND s.title IN ('Redistribution des tâches', 'Pause forcée', 'Assistance temporaire') THEN TRUE
    WHEN at.code = 'ABSENCE_PATTERN' AND s.title IN ('Planification d''entretien individuel', 'Support psychologique', 'Programme de bien-être') THEN TRUE
    WHEN at.code = 'PERFORMANCE_DROP' AND s.title IN ('Formation ciblée', 'Mentorat et coaching', 'Revue de performance') THEN TRUE
    WHEN at.code = 'DEADLINE_RISK' AND s.title IN ('Extension de délai', 'Révision des objectifs', 'Communication renforcée') THEN TRUE
    WHEN at.code = 'TEAM_TURNOVER' AND s.title IN ('Plan de rétention', 'Amélioration de l''engagement', 'Programme de reconnaissance') THEN TRUE
    WHEN at.code = 'OVERTIME_EXCESSIVE' AND s.title IN ('Redistribution des tâches', 'Recrutement d''urgence', 'Optimisation des ressources') THEN TRUE
    WHEN at.code = 'STRESS_INDICATOR' AND s.title IN ('Support psychologique', 'Gestion du stress', 'Pause forcée') THEN TRUE
    WHEN at.code = 'BUDGET_OVERRUN' AND s.title IN ('Ajustement budgétaire', 'Optimisation des coûts', 'Révision des objectifs') THEN TRUE
    WHEN at.code = 'SKILL_GAP' AND s.title IN ('Formation ciblée', 'Formation technique', 'Mentorat et coaching') THEN TRUE
    WHEN at.code = 'QUALITY_DECLINE' AND s.title IN ('Contrôle qualité renforcé', 'Formation technique', 'Révision des processus') THEN TRUE
    ELSE FALSE
  END;

-- Créer quelques instances d'alertes d'exemple avec des profils existants ou fictifs
INSERT INTO public.alert_instances (alert_type_id, title, description, severity, entity_type, entity_name, status)
SELECT 
  at.id,
  at.name || ' détectée',
  at.description,
  at.severity,
  'employee',
  'Employé Test ' || (ROW_NUMBER() OVER ()),
  'active'
FROM public.alert_types at
WHERE at.code IN ('WORKLOAD_HIGH', 'ABSENCE_PATTERN', 'DEADLINE_RISK', 'STRESS_INDICATOR', 'QUALITY_DECLINE')
LIMIT 8;