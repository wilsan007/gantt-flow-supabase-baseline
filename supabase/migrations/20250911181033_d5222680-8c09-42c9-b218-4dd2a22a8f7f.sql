-- Lier les types d'alertes aux solutions recommandées
WITH alert_type_mapping AS (
  SELECT id, code FROM public.alert_types
),
solution_mapping AS (
  SELECT id, title FROM public.alert_solutions
)
INSERT INTO public.alert_type_solutions (alert_type_id, solution_id, priority_order)
SELECT 
  at.id,
  s.id,
  CASE 
    WHEN at.code = 'WORKLOAD_HIGH' AND s.title IN ('Redistribution des tâches', 'Pause forcée', 'Assistance temporaire') THEN ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY s.effectiveness_score DESC)
    WHEN at.code = 'ABSENCE_PATTERN' AND s.title IN ('Planification d''entretien individuel', 'Support psychologique', 'Programme de bien-être') THEN ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY s.effectiveness_score DESC)
    WHEN at.code = 'PERFORMANCE_DROP' AND s.title IN ('Formation ciblée', 'Mentorat et coaching', 'Revue de performance') THEN ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY s.effectiveness_score DESC)
    WHEN at.code = 'DEADLINE_RISK' AND s.title IN ('Extension de délai', 'Révision des objectifs', 'Communication renforcée') THEN ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY s.effectiveness_score DESC)
    WHEN at.code = 'TEAM_TURNOVER' AND s.title IN ('Plan de rétention', 'Amélioration de l''engagement', 'Programme de reconnaissance') THEN ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY s.effectiveness_score DESC)
    WHEN at.code = 'OVERTIME_EXCESSIVE' AND s.title IN ('Redistribution des tâches', 'Recrutement d''urgence', 'Optimisation des ressources') THEN ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY s.effectiveness_score DESC)
    WHEN at.code = 'STRESS_INDICATOR' AND s.title IN ('Support psychologique', 'Gestion du stress', 'Pause forcée') THEN ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY s.effectiveness_score DESC)
    WHEN at.code = 'BUDGET_OVERRUN' AND s.title IN ('Ajustement budgétaire', 'Optimisation des coûts', 'Révision des objectifs') THEN ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY s.effectiveness_score DESC)
    WHEN at.code = 'SKILL_GAP' AND s.title IN ('Formation ciblée', 'Formation technique', 'Mentorat et coaching') THEN ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY s.effectiveness_score DESC)
    WHEN at.code = 'QUALITY_DECLINE' AND s.title IN ('Contrôle qualité renforcé', 'Formation technique', 'Révision des processus') THEN ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY s.effectiveness_score DESC)
    ELSE NULL
  END as priority
FROM alert_type_mapping at
CROSS JOIN solution_mapping s
WHERE CASE 
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

-- Créer quelques instances d'alertes d'exemple
WITH sample_employees AS (
  SELECT id, full_name FROM public.profiles LIMIT 5
),
sample_alert_types AS (
  SELECT * FROM public.alert_types WHERE code IN ('WORKLOAD_HIGH', 'ABSENCE_PATTERN', 'DEADLINE_RISK', 'STRESS_INDICATOR', 'QUALITY_DECLINE')
)
INSERT INTO public.alert_instances (alert_type_id, title, description, severity, entity_type, entity_id, entity_name, status)
SELECT 
  sat.id,
  sat.name || ' - ' || se.full_name,
  sat.description,
  sat.severity,
  'employee',
  se.id,
  se.full_name,
  CASE WHEN RANDOM() < 0.8 THEN 'active' ELSE 'acknowledged' END
FROM sample_alert_types sat
CROSS JOIN sample_employees se
WHERE RANDOM() < 0.6  -- 60% de chance de créer une alerte pour chaque combinaison
LIMIT 15;