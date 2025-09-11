-- Insérer les types d'alertes RH prédéfinis
INSERT INTO public.alert_types (code, name, description, category, severity, auto_trigger_conditions) VALUES
-- CAPACITÉ ET CHARGE DE TRAVAIL
('OVERLOAD_90', 'Surcharge critique d''employé', 'Employé avec un taux d''utilisation ≥ 90%', 'capacity', 'high', '{"capacity_utilization": {"operator": ">=", "value": 90}}'),
('HIGH_UTILIZATION_ABOVE_AVG', 'Utilisation élevée par rapport à la moyenne', 'Employé avec un taux supérieur de 25% à la moyenne équipe', 'capacity', 'medium', '{"capacity_utilization_vs_avg": {"operator": ">", "value": 25}}'),
('UNDERUTILIZATION', 'Sous-utilisation d''employé', 'Employé avec un taux d''utilisation < 30%', 'capacity', 'low', '{"capacity_utilization": {"operator": "<", "value": 30}}'),
('OVERTIME_EXCESSIVE', 'Heures supplémentaires excessives', 'Plus de 15h supplémentaires par mois', 'capacity', 'high', '{"overtime_hours_monthly": {"operator": ">", "value": 15}}'),

-- ABSENCES ET CONGÉS
('ABSENCE_SPIKE', 'Pic d''absences', 'Augmentation de +50% des absences par rapport au mois précédent', 'absence', 'medium', '{"absence_increase_percentage": {"operator": ">", "value": 50}}'),
('SICK_LEAVE_PATTERN', 'Modèle d''arrêts maladie', 'Plus de 3 arrêts maladie courts en 3 mois', 'absence', 'medium', '{"sick_leaves_3months": {"operator": ">", "value": 3}}'),
('VACATION_OVERDUE', 'Congés en retard', 'Employé n''a pas pris de congés depuis 6 mois', 'absence', 'low', '{"days_since_last_vacation": {"operator": ">", "value": 180}}'),
('LEAVE_BALANCE_LOW', 'Solde de congés bas', 'Moins de 5 jours de congés restants', 'absence', 'low', '{"remaining_leave_days": {"operator": "<", "value": 5}}'),

-- PERFORMANCE ET ÉVALUATION
('PERFORMANCE_DECLINE', 'Baisse de performance', 'Score d''évaluation en baisse de 20% ou plus', 'performance', 'high', '{"performance_decline_percentage": {"operator": ">=", "value": 20}}'),
('OBJECTIVES_OVERDUE', 'Objectifs en retard', 'Plus de 50% d''objectifs en retard', 'performance', 'medium', '{"overdue_objectives_percentage": {"operator": ">", "value": 50}}'),
('NO_EVALUATION', 'Évaluation manquante', 'Pas d''évaluation depuis 12 mois', 'performance', 'medium', '{"months_since_evaluation": {"operator": ">", "value": 12}}'),

-- FORMATION ET DÉVELOPPEMENT
('TRAINING_OVERDUE', 'Formation obligatoire en retard', 'Formation obligatoire non complétée dans les délais', 'training', 'high', '{"overdue_mandatory_training": {"operator": ">", "value": 0}}'),
('SKILL_GAP', 'Écart de compétences', 'Compétences requises non maîtrisées', 'training', 'medium', '{"skill_gap_percentage": {"operator": ">", "value": 30}}'),
('NO_DEVELOPMENT', 'Pas de développement', 'Aucune formation suivie depuis 12 mois', 'training', 'low', '{"months_since_training": {"operator": ">", "value": 12}}'),

-- TURNOVER ET RÉTENTION
('RESIGNATION_RISK', 'Risque de démission', 'Employé à haut risque de départ', 'retention', 'high', '{"resignation_risk_score": {"operator": ">", "value": 80}}'),
('EXIT_INTERVIEW_NEGATIVE', 'Entretien de sortie négatif', 'Score de satisfaction < 3/5 lors du départ', 'retention', 'medium', '{"exit_satisfaction_score": {"operator": "<", "value": 3}}'),
('PROBATION_ISSUES', 'Problèmes en période d''essai', 'Performance insuffisante en période d''essai', 'retention', 'high', '{"probation_performance_score": {"operator": "<", "value": 3}}'),

-- COÛTS ET BUDGET
('SALARY_BUDGET_EXCEEDED', 'Budget salarial dépassé', 'Dépassement du budget salarial départemental', 'cost', 'high', '{"salary_budget_percentage": {"operator": ">", "value": 100}}'),
('EXPENSE_ANOMALY', 'Anomalie de frais', 'Frais exceptionnellement élevés par employé', 'cost', 'medium', '{"expense_anomaly_factor": {"operator": ">", "value": 2}}'),
('RECRUITMENT_COST_HIGH', 'Coût de recrutement élevé', 'Coût de recrutement > 2x salaire mensuel', 'cost', 'medium', '{"recruitment_cost_ratio": {"operator": ">", "value": 2}}'),

-- SANTÉ ET SÉCURITÉ
('INCIDENT_RECURRING', 'Incidents récurrents', 'Plus de 2 incidents de sécurité par mois', 'safety', 'high', '{"monthly_incidents": {"operator": ">", "value": 2}}'),
('ERGONOMIC_COMPLAINTS', 'Plaintes ergonomiques', 'Plaintes répétées sur les conditions de travail', 'safety', 'medium', '{"ergonomic_complaints": {"operator": ">", "value": 1}}'),
('STRESS_INDICATORS', 'Indicateurs de stress', 'Signaux de stress ou burnout détectés', 'safety', 'high', '{"stress_score": {"operator": ">", "value": 70}}'),

-- COMPLIANCE ET LÉGAL
('CONTRACT_EXPIRING', 'Contrat expirant', 'Contrat expire dans moins de 30 jours', 'compliance', 'medium', '{"days_to_contract_expiry": {"operator": "<", "value": 30}}'),
('DOCUMENT_MISSING', 'Document manquant', 'Documents obligatoires manquants', 'compliance', 'high', '{"missing_documents": {"operator": ">", "value": 0}}'),
('VISA_EXPIRING', 'Visa expirant', 'Visa de travail expire dans moins de 60 jours', 'compliance', 'high', '{"days_to_visa_expiry": {"operator": "<", "value": 60}}'),

-- ENGAGEMENT ET SATISFACTION
('LOW_ENGAGEMENT', 'Engagement faible', 'Score d''engagement < 60%', 'engagement', 'medium', '{"engagement_score": {"operator": "<", "value": 60}}'),
('SURVEY_NO_RESPONSE', 'Pas de réponse aux enquêtes', 'N''a pas répondu aux 3 dernières enquêtes', 'engagement', 'low', '{"missed_surveys": {"operator": ">=", "value": 3}}'),
('TEAM_CONFLICT', 'Conflit d''équipe', 'Signalements de conflits interpersonnels', 'engagement', 'medium', '{"conflict_reports": {"operator": ">", "value": 0}}');

-- Insérer les solutions prédéfinies
INSERT INTO public.alert_solutions (title, description, category, cost_level, implementation_time, effectiveness_score, required_roles, action_steps) VALUES
-- Solutions pour surcharge
('Redistribution des tâches', 'Redistribuer les tâches vers des collègues moins chargés', 'workload', 'low', 'immediate', 85, ARRAY['manager', 'team_lead'], '[{"step": 1, "action": "Analyser la charge de travail de l''équipe"}, {"step": 2, "action": "Identifier les tâches redistributables"}, {"step": 3, "action": "Assigner les tâches aux membres disponibles"}]'),
('Embauche temporaire', 'Recruter un intérimaire ou freelance', 'workload', 'high', 'short_term', 90, ARRAY['hr', 'manager'], '[{"step": 1, "action": "Définir le profil recherché"}, {"step": 2, "action": "Lancer le processus de recrutement"}, {"step": 3, "action": "Intégrer la ressource temporaire"}]'),
('Formation en gestion du temps', 'Améliorer l''efficacité par la formation', 'workload', 'medium', 'medium_term', 70, ARRAY['hr', 'training'], '[{"step": 1, "action": "Évaluer les besoins en formation"}, {"step": 2, "action": "Organiser une formation"}, {"step": 3, "action": "Suivre les progrès"}]'),

-- Solutions pour absences
('Entretien de retour', 'Organiser un entretien pour comprendre les absences', 'absence', 'low', 'immediate', 75, ARRAY['manager', 'hr'], '[{"step": 1, "action": "Planifier un entretien individuel"}, {"step": 2, "action": "Discuter des causes d''absence"}, {"step": 3, "action": "Définir un plan d''action"}]'),
('Aménagement de poste', 'Adapter le poste de travail aux besoins', 'absence', 'medium', 'short_term', 80, ARRAY['hr', 'manager'], '[{"step": 1, "action": "Évaluer les besoins d''aménagement"}, {"step": 2, "action": "Mettre en place les modifications"}, {"step": 3, "action": "Suivre l''efficacité"}]'),
('Programme de bien-être', 'Lancer un programme de santé au travail', 'absence', 'medium', 'medium_term', 85, ARRAY['hr', 'management'], '[{"step": 1, "action": "Concevoir le programme"}, {"step": 2, "action": "Communiquer auprès des équipes"}, {"step": 3, "action": "Mesurer l''impact"}]'),

-- Solutions pour performance
('Plan d''amélioration', 'Mettre en place un plan d''amélioration personnalisé', 'performance', 'low', 'immediate', 80, ARRAY['manager'], '[{"step": 1, "action": "Définir les objectifs d''amélioration"}, {"step": 2, "action": "Établir un planning de suivi"}, {"step": 3, "action": "Évaluer les progrès mensuellement"}]'),
('Coaching individuel', 'Accompagnement par un coach professionnel', 'performance', 'high', 'medium_term', 90, ARRAY['hr', 'management'], '[{"step": 1, "action": "Sélectionner un coach"}, {"step": 2, "action": "Définir les objectifs de coaching"}, {"step": 3, "action": "Suivre l''évolution"}]'),
('Formation technique', 'Renforcer les compétences techniques', 'performance', 'medium', 'short_term', 85, ARRAY['hr', 'training'], '[{"step": 1, "action": "Identifier les compétences à développer"}, {"step": 2, "action": "Organiser la formation"}, {"step": 3, "action": "Évaluer l''acquisition"}]'),

-- Solutions pour rétention
('Entretien de carrière', 'Discuter des perspectives d''évolution', 'retention', 'low', 'immediate', 75, ARRAY['manager', 'hr'], '[{"step": 1, "action": "Planifier l''entretien"}, {"step": 2, "action": "Discuter des aspirations"}, {"step": 3, "action": "Définir un plan de carrière"}]'),
('Augmentation salariale', 'Revoir la rémunération', 'retention', 'high', 'short_term', 95, ARRAY['management', 'hr'], '[{"step": 1, "action": "Analyser la grille salariale"}, {"step": 2, "action": "Proposer une augmentation"}, {"step": 3, "action": "Finaliser l''accord"}]'),
('Mobilité interne', 'Proposer un nouveau poste en interne', 'retention', 'medium', 'medium_term', 85, ARRAY['hr', 'management'], '[{"step": 1, "action": "Identifier les postes disponibles"}, {"step": 2, "action": "Évaluer l''adéquation"}, {"step": 3, "action": "Organiser la transition"}]'),

-- Solutions pour coûts
('Audit budgétaire', 'Analyser les dépassements de budget', 'cost', 'low', 'immediate', 70, ARRAY['finance', 'hr'], '[{"step": 1, "action": "Analyser les écarts"}, {"step": 2, "action": "Identifier les causes"}, {"step": 3, "action": "Proposer des corrections"}]'),
('Renégociation fournisseurs', 'Revoir les contrats avec les prestataires', 'cost', 'low', 'short_term', 75, ARRAY['finance', 'procurement'], '[{"step": 1, "action": "Analyser les contrats actuels"}, {"step": 2, "action": "Négocier de nouveaux tarifs"}, {"step": 3, "action": "Mettre à jour les contrats"}]'),
('Optimisation des processus', 'Améliorer l''efficacité des processus RH', 'cost', 'medium', 'medium_term', 85, ARRAY['hr', 'management'], '[{"step": 1, "action": "Cartographier les processus"}, {"step": 2, "action": "Identifier les améliorations"}, {"step": 3, "action": "Implémenter les changements"}]'),

-- Solutions pour engagement
('Enquête de satisfaction', 'Comprendre les sources d''insatisfaction', 'engagement', 'low', 'immediate', 65, ARRAY['hr'], '[{"step": 1, "action": "Concevoir l''enquête"}, {"step": 2, "action": "Collecter les réponses"}, {"step": 3, "action": "Analyser et communiquer"}]'),
('Team building', 'Renforcer la cohésion d''équipe', 'engagement', 'medium', 'short_term', 70, ARRAY['manager', 'hr'], '[{"step": 1, "action": "Planifier l''événement"}, {"step": 2, "action": "Organiser l''activité"}, {"step": 3, "action": "Recueillir les retours"}]'),
('Programme de reconnaissance', 'Mettre en place un système de reconnaissance', 'engagement', 'medium', 'medium_term', 80, ARRAY['hr', 'management'], '[{"step": 1, "action": "Définir les critères"}, {"step": 2, "action": "Communiquer le programme"}, {"step": 3, "action": "Récompenser régulièrement"}]');

-- Associer les solutions aux types d'alertes
INSERT INTO public.alert_type_solutions (alert_type_id, solution_id, priority_order, context_conditions) 
SELECT 
  at.id as alert_type_id,
  s.id as solution_id,
  ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY s.effectiveness_score DESC) as priority_order,
  CASE 
    WHEN at.code IN ('OVERLOAD_90', 'HIGH_UTILIZATION_ABOVE_AVG', 'UNDERUTILIZATION', 'OVERTIME_EXCESSIVE') AND s.category = 'workload' THEN '{"applicable": true}'
    WHEN at.code IN ('ABSENCE_SPIKE', 'SICK_LEAVE_PATTERN', 'VACATION_OVERDUE', 'LEAVE_BALANCE_LOW') AND s.category = 'absence' THEN '{"applicable": true}'
    WHEN at.code IN ('PERFORMANCE_DECLINE', 'OBJECTIVES_OVERDUE', 'NO_EVALUATION') AND s.category = 'performance' THEN '{"applicable": true}'
    WHEN at.code IN ('RESIGNATION_RISK', 'EXIT_INTERVIEW_NEGATIVE', 'PROBATION_ISSUES') AND s.category = 'retention' THEN '{"applicable": true}'
    WHEN at.code IN ('SALARY_BUDGET_EXCEEDED', 'EXPENSE_ANOMALY', 'RECRUITMENT_COST_HIGH') AND s.category = 'cost' THEN '{"applicable": true}'
    WHEN at.code IN ('LOW_ENGAGEMENT', 'SURVEY_NO_RESPONSE', 'TEAM_CONFLICT') AND s.category = 'engagement' THEN '{"applicable": true}'
    ELSE '{"applicable": false}'
  END as context_conditions
FROM public.alert_types at
CROSS JOIN public.alert_solutions s
WHERE 
  (at.code IN ('OVERLOAD_90', 'HIGH_UTILIZATION_ABOVE_AVG', 'UNDERUTILIZATION', 'OVERTIME_EXCESSIVE') AND s.category = 'workload') OR
  (at.code IN ('ABSENCE_SPIKE', 'SICK_LEAVE_PATTERN', 'VACATION_OVERDUE', 'LEAVE_BALANCE_LOW') AND s.category = 'absence') OR
  (at.code IN ('PERFORMANCE_DECLINE', 'OBJECTIVES_OVERDUE', 'NO_EVALUATION') AND s.category = 'performance') OR
  (at.code IN ('RESIGNATION_RISK', 'EXIT_INTERVIEW_NEGATIVE', 'PROBATION_ISSUES') AND s.category = 'retention') OR
  (at.code IN ('SALARY_BUDGET_EXCEEDED', 'EXPENSE_ANOMALY', 'RECRUITMENT_COST_HIGH') AND s.category = 'cost') OR
  (at.code IN ('LOW_ENGAGEMENT', 'SURVEY_NO_RESPONSE', 'TEAM_CONFLICT') AND s.category = 'engagement');