-- Migration pour nettoyer et optimiser les alertes HR
-- Supprimer les doublons et alertes similaires
DELETE FROM alert_types WHERE code IN (
  'ABSENCE_PATTERN', -- Doublon de ABSENCE_SPIKE
  'SICK_LEAVE_SPIKE', -- Doublon de SICK_LEAVE_PATTERN  
  'WORKLOAD_HIGH', -- Doublon de OVERLOAD_90
  'OVERTIME_EXCESSIVE', -- Couvert par OVERLOAD_90
  'CAPACITY_UNDERUSED', -- Doublon de UNDERUTILIZATION
  'PERFORMANCE_DROP', -- Doublon de PERFORMANCE_DECLINE
  'TEAM_TURNOVER' -- Couvert par RETENTION_RISK
);

-- Ajouter l'alerte incidents récurrents si elle n'existe pas
INSERT INTO alert_types (code, name, category, severity, description, auto_trigger_conditions)
VALUES (
  'INCIDENT_RECURRING',
  'Incidents sécurité récurrents',
  'safety',
  'high',
  '2+ incidents de sécurité par mois',
  '{"incidents_per_month": {"operator": ">=", "value": 2}}'::jsonb
) ON CONFLICT (code) DO NOTHING;

-- Ajouter auto-triggers pour les alertes manquantes
UPDATE alert_types SET auto_trigger_conditions = '{"capacity_mismatch_ratio": {"operator": ">", "value": 20}}'::jsonb
WHERE code = 'CAPACITY_MISMATCH' AND auto_trigger_conditions IS NULL;

UPDATE alert_types SET auto_trigger_conditions = '{"meeting_hours_per_week": {"operator": ">", "value": 20}}'::jsonb
WHERE code = 'MEETING_OVERLOAD' AND auto_trigger_conditions IS NULL;

UPDATE alert_types SET auto_trigger_conditions = '{"resource_conflicts": {"operator": ">", "value": 0}}'::jsonb
WHERE code = 'RESOURCE_CONFLICT' AND auto_trigger_conditions IS NULL;

UPDATE alert_types SET auto_trigger_conditions = '{"months_since_evaluation": {"operator": ">=", "value": 12}}'::jsonb
WHERE code = 'NO_EVALUATION' AND auto_trigger_conditions IS NULL;

UPDATE alert_types SET auto_trigger_conditions = '{"stress_indicators": {"operator": ">", "value": 3}}'::jsonb
WHERE code = 'STRESS_INDICATOR' AND auto_trigger_conditions IS NULL;

UPDATE alert_types SET auto_trigger_conditions = '{"training_overdue_days": {"operator": ">", "value": 90}}'::jsonb
WHERE code = 'TRAINING_OVERDUE' AND auto_trigger_conditions IS NULL;

UPDATE alert_types SET auto_trigger_conditions = '{"vacation_backlog_days": {"operator": ">", "value": 30}}'::jsonb
WHERE code = 'VACATION_BACKLOG' AND auto_trigger_conditions IS NULL;

UPDATE alert_types SET auto_trigger_conditions = '{"workplace_conflicts": {"operator": ">", "value": 0}}'::jsonb
WHERE code = 'WORKPLACE_CONFLICT' AND auto_trigger_conditions IS NULL;

UPDATE alert_types SET auto_trigger_conditions = '{"succession_risk_score": {"operator": ">", "value": 70}}'::jsonb
WHERE code = 'SUCCESSION_RISK' AND auto_trigger_conditions IS NULL;

UPDATE alert_types SET auto_trigger_conditions = '{"change_resistance_score": {"operator": ">", "value": 60}}'::jsonb
WHERE code = 'CHANGE_RESISTANCE' AND auto_trigger_conditions IS NULL;

-- Créer des associations manquantes entre alert_types et solutions
-- Associer les alertes de capacité aux solutions appropriées
INSERT INTO alert_type_solutions (alert_type_id, solution_id, priority_order, context_conditions)
SELECT 
  at.id, 
  as_sol.id, 
  ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY as_sol.effectiveness_score DESC),
  NULL
FROM alert_types at
CROSS JOIN alert_solutions as_sol
WHERE at.category = 'capacity' 
  AND as_sol.category IN ('capacity', 'workload', 'productivity')
  AND NOT EXISTS (
    SELECT 1 FROM alert_type_solutions ats 
    WHERE ats.alert_type_id = at.id AND ats.solution_id = as_sol.id
  );

-- Associer les alertes d'absence aux solutions appropriées  
INSERT INTO alert_type_solutions (alert_type_id, solution_id, priority_order, context_conditions)
SELECT 
  at.id, 
  as_sol.id, 
  ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY as_sol.effectiveness_score DESC),
  NULL
FROM alert_types at
CROSS JOIN alert_solutions as_sol
WHERE at.category = 'absence' 
  AND as_sol.category IN ('absence', 'leave_management', 'health')
  AND NOT EXISTS (
    SELECT 1 FROM alert_type_solutions ats 
    WHERE ats.alert_type_id = at.id AND ats.solution_id = as_sol.id
  );

-- Associer les alertes de performance aux solutions appropriées
INSERT INTO alert_type_solutions (alert_type_id, solution_id, priority_order, context_conditions)
SELECT 
  at.id, 
  as_sol.id, 
  ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY as_sol.effectiveness_score DESC),
  NULL
FROM alert_types at
CROSS JOIN alert_solutions as_sol
WHERE at.category = 'performance' 
  AND as_sol.category IN ('performance', 'training', 'coaching')
  AND NOT EXISTS (
    SELECT 1 FROM alert_type_solutions ats 
    WHERE ats.alert_type_id = at.id AND ats.solution_id = as_sol.id
  );

-- Associer les alertes de sécurité aux solutions appropriées
INSERT INTO alert_type_solutions (alert_type_id, solution_id, priority_order, context_conditions)
SELECT 
  at.id, 
  as_sol.id, 
  ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY ats.effectiveness_score DESC),
  NULL
FROM alert_types at
CROSS JOIN alert_solutions as_sol
WHERE at.category = 'safety' 
  AND as_sol.category IN ('safety', 'security', 'compliance')
  AND NOT EXISTS (
    SELECT 1 FROM alert_type_solutions ats 
    WHERE ats.alert_type_id = at.id AND ats.solution_id = as_sol.id
  );

-- Nettoyer les solutions non utilisées (garder seulement celles qui ont des associations)
DELETE FROM alert_solutions 
WHERE id NOT IN (SELECT DISTINCT solution_id FROM alert_type_solutions);

-- Nettoyer les alert_types qui n'ont toujours pas de solutions après les associations
DELETE FROM alert_types 
WHERE id NOT IN (SELECT DISTINCT alert_type_id FROM alert_type_solutions)
  AND category NOT IN ('capacity', 'absence', 'performance', 'safety', 'compliance', 'engagement', 'cost');