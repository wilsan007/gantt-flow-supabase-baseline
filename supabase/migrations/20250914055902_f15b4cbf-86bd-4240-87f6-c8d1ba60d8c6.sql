-- Insertion simplifiée des types d'alertes projet
INSERT INTO public.alert_types (code, name, description, severity, category, application_domain, auto_trigger_conditions) VALUES
('OVERDUE_TASK', 'Tâche en retard', 'Tâche dépassant sa date d''échéance', 'critical', 'Timeline', 'project', '{}'),
('PROJECT_DELAY', 'Retard de projet', 'Projet en retard par rapport au planning', 'high', 'Planning', 'project', '{}'),
('MILESTONE_MISSED', 'Jalon manqué', 'Jalon important non atteint dans les délais', 'critical', 'Planning', 'project', '{}'),
('LOW_PRODUCTIVITY', 'Productivité faible', 'Productivité de l''équipe en dessous des standards', 'medium', 'Performance', 'project', '{}'),
('VELOCITY_DECLINE', 'Déclin de vélocité', 'Vélocité d''équipe en baisse constante', 'high', 'Performance', 'project', '{}'),
('OVERALLOCATION', 'Surallocation de ressources', 'Membre d''équipe surchargé de travail', 'high', 'Resources', 'project', '{}'),
('RESOURCE_SHORTAGE', 'Pénurie de ressources', 'Manque de ressources pour les tâches à venir', 'high', 'Resources', 'project', '{}'),
('SKILL_GAP', 'Manque de compétences', 'Compétences requises non disponibles dans l''équipe', 'medium', 'Resources', 'project', '{}'),
('HIGH_BUG_RATE', 'Taux d''erreurs élevé', 'Nombre important de bugs ou problèmes qualité', 'high', 'Quality', 'project', '{}'),
('SCOPE_CREEP', 'Dérive du périmètre', 'Augmentation non contrôlée du périmètre projet', 'medium', 'Quality', 'project', '{}'),
('BUDGET_OVERRUN', 'Dépassement budgétaire', 'Coût du projet dépassant le budget alloué', 'critical', 'Budget', 'project', '{}'),
('BLOCKED_TASKS', 'Tâches bloquées', 'Plusieurs tâches bloquées en attente', 'high', 'Workflow', 'project', '{}'),
('COMMUNICATION_GAP', 'Manque de communication', 'Absence de mises à jour ou communications', 'medium', 'Communication', 'project', '{}'),
('TEAM_UNAVAILABILITY', 'Indisponibilité d''équipe', 'Membres clés de l''équipe indisponibles', 'high', 'Team', 'project', '{}')
ON CONFLICT (code) DO NOTHING;