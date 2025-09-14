-- Insertion des types d'alertes pour la gestion de projet
INSERT INTO public.alert_types (code, name, description, severity, category, application_domain, auto_trigger_conditions) VALUES
-- Alertes de délais et échéances
('DEADLINE_RISK', 'Risque d''échéance', 'Tâche approchant de sa date limite', 'high', 'Timeline', 'project', '{"conditions": [{"field": "due_date", "operator": "<=", "value": "DATE_ADD(NOW(), INTERVAL 3 DAY)"}]}'),
('OVERDUE_TASK', 'Tâche en retard', 'Tâche dépassant sa date d''échéance', 'critical', 'Timeline', 'project', '{"conditions": [{"field": "due_date", "operator": "<", "value": "NOW()"}, {"field": "status", "operator": "!=", "value": "done"}]}'),
('PROJECT_DELAY', 'Retard de projet', 'Projet en retard par rapport au planning', 'high', 'Planning', 'project', '{"conditions": [{"field": "progress", "operator": "<", "value": 50}, {"field": "time_elapsed_percentage", "operator": ">", "value": 60}]}'),
('MILESTONE_MISSED', 'Jalon manqué', 'Jalon important non atteint dans les délais', 'critical', 'Planning', 'project', '{"conditions": [{"field": "milestone_due_date", "operator": "<", "value": "NOW()"}, {"field": "milestone_status", "operator": "!=", "value": "completed"}]}'),

-- Alertes de performance et productivité
('PERFORMANCE_DROP', 'Baisse de performance', 'Diminution significative des performances d''équipe', 'medium', 'Performance', 'project', '{"conditions": [{"field": "weekly_completion_rate", "operator": "<", "value": 70}]}'),
('LOW_PRODUCTIVITY', 'Productivité faible', 'Productivité de l''équipe en dessous des standards', 'medium', 'Performance', 'project', '{"conditions": [{"field": "tasks_completed_per_day", "operator": "<", "value": 2}]}'),
('VELOCITY_DECLINE', 'Déclin de vélocité', 'Vélocité d''équipe en baisse constante', 'high', 'Performance', 'project', '{"conditions": [{"field": "sprint_velocity_trend", "operator": "<", "value": -20}]}'),

-- Alertes de ressources et capacité
('OVERALLOCATION', 'Surallocation de ressources', 'Membre d''équipe surchargé de travail', 'high', 'Resources', 'project', '{"conditions": [{"field": "workload_percentage", "operator": ">", "value": 120}]}'),
('RESOURCE_SHORTAGE', 'Pénurie de ressources', 'Manque de ressources pour les tâches à venir', 'high', 'Resources', 'project', '{"conditions": [{"field": "available_capacity", "operator": "<", "value": 50}]}'),
('SKILL_GAP', 'Manque de compétences', 'Compétences requises non disponibles dans l''équipe', 'medium', 'Resources', 'project', '{"conditions": [{"field": "required_skills_coverage", "operator": "<", "value": 80}]}'),

-- Alertes de qualité et risques
('HIGH_BUG_RATE', 'Taux d''erreurs élevé', 'Nombre important de bugs ou problèmes qualité', 'high', 'Quality', 'project', '{"conditions": [{"field": "bug_rate_percentage", "operator": ">", "value": 15}]}'),
('SCOPE_CREEP', 'Dérive du périmètre', 'Augmentation non contrôlée du périmètre projet', 'medium', 'Quality', 'project', '{"conditions": [{"field": "scope_change_percentage", "operator": ">", "value": 20}]}'),
('BUDGET_OVERRUN', 'Dépassement budgétaire', 'Coût du projet dépassant le budget alloué', 'critical', 'Budget', 'project', '{"conditions": [{"field": "budget_spent_percentage", "operator": ">", "value": 90}]}'),

-- Alertes de collaboration et communication
('BLOCKED_TASKS', 'Tâches bloquées', 'Plusieurs tâches bloquées en attente', 'high', 'Workflow', 'project', '{"conditions": [{"field": "blocked_tasks_count", "operator": ">", "value": 3}]}'),
('COMMUNICATION_GAP', 'Manque de communication', 'Absence de mises à jour ou communications', 'medium', 'Communication', 'project', '{"conditions": [{"field": "days_since_last_update", "operator": ">", "value": 5}]}'),
('TEAM_UNAVAILABILITY', 'Indisponibilité d''équipe', 'Membres clés de l''équipe indisponibles', 'high', 'Team', 'project', '{"conditions": [{"field": "key_members_absent_percentage", "operator": ">", "value": 30}]}');

-- Insertion des solutions pour les alertes projet
INSERT INTO public.alert_solutions (title, description, category, effectiveness_score, cost_level, implementation_time, action_steps, required_roles) VALUES
-- Solutions pour délais et échéances
('Repriorisation des tâches', 'Réorganiser les priorités pour respecter les échéances critiques', 'Timeline', 85, 'low', 'immediate', '["Identifier les tâches critiques", "Réaffecter les ressources", "Communiquer les nouveaux priorités"]', '["project_manager", "team_lead"]'),
('Extension d''équipe temporaire', 'Ajouter des ressources temporaires pour rattraper le retard', 'Resources', 75, 'high', 'short_term', '["Évaluer les besoins", "Recruter des freelances", "Former rapidement", "Intégrer à l''équipe"]', '["project_manager", "hr_manager"]'),
('Négociation d''échéances', 'Renégocier les dates limites avec les parties prenantes', 'Planning', 70, 'low', 'immediate', '["Préparer la justification", "Contacter les stakeholders", "Proposer nouvelles dates", "Formaliser l''accord"]', '["project_manager", "client_manager"]'),

-- Solutions pour performance
('Formation d''équipe ciblée', 'Formation spécifique pour améliorer les compétences', 'Performance', 80, 'medium', 'medium_term', '["Identifier les lacunes", "Planifier la formation", "Organiser les sessions", "Mesurer l''amélioration"]', '["hr_manager", "team_lead"]'),
('Optimisation des processus', 'Améliorer les méthodes de travail et outils', 'Process', 85, 'medium', 'short_term', '["Analyser les goulots", "Proposer améliorations", "Implémenter changements", "Suivre les résultats"]', '["process_manager", "team_lead"]'),
('Motivation et reconnaissance', 'Mettre en place des mesures de motivation', 'Team', 75, 'low', 'immediate', '["Identifier les démotivations", "Organiser reconnaissances", "Améliorer conditions", "Suivre moral équipe"]', '["team_lead", "hr_manager"]'),

-- Solutions pour ressources
('Réallocation des ressources', 'Redistribuer la charge de travail dans l''équipe', 'Resources', 80, 'low', 'immediate', '["Analyser la charge actuelle", "Identifier les disponibilités", "Réaffecter les tâches", "Communiquer les changements"]', '["project_manager", "team_lead"]'),
('Recrutement d''urgence', 'Embaucher rapidement de nouvelles ressources', 'Resources', 70, 'high', 'medium_term', '["Définir les besoins", "Lancer recrutement express", "Sélectionner candidats", "Intégrer rapidement"]', '["hr_manager", "project_manager"]'),
('Automatisation des tâches', 'Automatiser les tâches répétitives', 'Process', 90, 'medium', 'medium_term', '["Identifier tâches automatisables", "Choisir outils", "Implémenter automatisation", "Former équipe"]', '["tech_lead", "process_manager"]'),

-- Solutions pour qualité
('Révision qualité renforcée', 'Mettre en place des contrôles qualité supplémentaires', 'Quality', 85, 'low', 'immediate', '["Définir critères qualité", "Organiser revues", "Former aux standards", "Suivre métriques"]', '["quality_manager", "team_lead"]'),
('Refactoring et correction', 'Corriger les problèmes identifiés', 'Quality', 80, 'medium', 'short_term', '["Lister les problèmes", "Prioriser corrections", "Planifier interventions", "Tester solutions"]', '["tech_lead", "developer"]'),

-- Solutions pour communication
('Mise en place de rituels', 'Organiser des points réguliers et structurés', 'Communication', 85, 'low', 'immediate', '["Définir fréquence meetings", "Créer agenda type", "Assigner responsabilités", "Suivre participation"]', '["project_manager", "team_lead"]'),
('Outils de collaboration', 'Implémenter des outils de communication efficaces', 'Communication', 80, 'medium', 'short_term', '["Évaluer besoins comm", "Choisir outils adaptés", "Former équipe", "Monitorer usage"]', '["tech_lead", "project_manager"]');

-- Liaison des solutions aux types d'alertes
INSERT INTO public.alert_type_solutions (alert_type_id, solution_id, priority_order, context_conditions) 
SELECT 
  at.id as alert_type_id,
  s.id as solution_id,
  ROW_NUMBER() OVER (PARTITION BY at.id ORDER BY s.effectiveness_score DESC) as priority_order,
  '{}' as context_conditions
FROM public.alert_types at
CROSS JOIN public.alert_solutions s
WHERE at.application_domain = 'project'
AND (
  (at.code IN ('DEADLINE_RISK', 'OVERDUE_TASK', 'PROJECT_DELAY', 'MILESTONE_MISSED') AND s.category IN ('Timeline', 'Resources', 'Planning')) OR
  (at.code IN ('PERFORMANCE_DROP', 'LOW_PRODUCTIVITY', 'VELOCITY_DECLINE') AND s.category IN ('Performance', 'Process', 'Team')) OR
  (at.code IN ('OVERALLOCATION', 'RESOURCE_SHORTAGE', 'SKILL_GAP') AND s.category IN ('Resources', 'Process')) OR
  (at.code IN ('HIGH_BUG_RATE', 'SCOPE_CREEP', 'BUDGET_OVERRUN') AND s.category IN ('Quality', 'Process')) OR
  (at.code IN ('BLOCKED_TASKS', 'COMMUNICATION_GAP', 'TEAM_UNAVAILABILITY') AND s.category IN ('Communication', 'Process', 'Team'))
);