-- Insertion des types d'alertes pour la gestion de projet
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

-- Insertion des solutions pour les alertes projet
INSERT INTO public.alert_solutions (title, description, category, effectiveness_score, cost_level, implementation_time, action_steps, required_roles) VALUES
('Repriorisation des tâches', 'Réorganiser les priorités pour respecter les échéances critiques', 'Timeline', 85, 'low', 'immediate', ARRAY['Identifier les tâches critiques', 'Réaffecter les ressources', 'Communiquer les nouveaux priorités'], ARRAY['project_manager', 'team_lead']),
('Extension d''équipe temporaire', 'Ajouter des ressources temporaires pour rattraper le retard', 'Resources', 75, 'high', 'short_term', ARRAY['Évaluer les besoins', 'Recruter des freelances', 'Former rapidement', 'Intégrer à l''équipe'], ARRAY['project_manager', 'hr_manager']),
('Négociation d''échéances', 'Renégocier les dates limites avec les parties prenantes', 'Planning', 70, 'low', 'immediate', ARRAY['Préparer la justification', 'Contacter les stakeholders', 'Proposer nouvelles dates', 'Formaliser l''accord'], ARRAY['project_manager', 'client_manager']),
('Formation d''équipe ciblée', 'Formation spécifique pour améliorer les compétences', 'Performance', 80, 'medium', 'medium_term', ARRAY['Identifier les lacunes', 'Planifier la formation', 'Organiser les sessions', 'Mesurer l''amélioration'], ARRAY['hr_manager', 'team_lead']),
('Optimisation des processus', 'Améliorer les méthodes de travail et outils', 'Process', 85, 'medium', 'short_term', ARRAY['Analyser les goulots', 'Proposer améliorations', 'Implémenter changements', 'Suivre les résultats'], ARRAY['process_manager', 'team_lead']),
('Motivation et reconnaissance', 'Mettre en place des mesures de motivation', 'Team', 75, 'low', 'immediate', ARRAY['Identifier les démotivations', 'Organiser reconnaissances', 'Améliorer conditions', 'Suivre moral équipe'], ARRAY['team_lead', 'hr_manager']),
('Réallocation des ressources', 'Redistribuer la charge de travail dans l''équipe', 'Resources', 80, 'low', 'immediate', ARRAY['Analyser la charge actuelle', 'Identifier les disponibilités', 'Réaffecter les tâches', 'Communiquer les changements'], ARRAY['project_manager', 'team_lead']),
('Recrutement d''urgence', 'Embaucher rapidement de nouvelles ressources', 'Resources', 70, 'high', 'medium_term', ARRAY['Définir les besoins', 'Lancer recrutement express', 'Sélectionner candidats', 'Intégrer rapidement'], ARRAY['hr_manager', 'project_manager']),
('Automatisation des tâches', 'Automatiser les tâches répétitives', 'Process', 90, 'medium', 'medium_term', ARRAY['Identifier tâches automatisables', 'Choisir outils', 'Implémenter automatisation', 'Former équipe'], ARRAY['tech_lead', 'process_manager']),
('Révision qualité renforcée', 'Mettre en place des contrôles qualité supplémentaires', 'Quality', 85, 'low', 'immediate', ARRAY['Définir critères qualité', 'Organiser revues', 'Former aux standards', 'Suivre métriques'], ARRAY['quality_manager', 'team_lead']),
('Refactoring et correction', 'Corriger les problèmes identifiés', 'Quality', 80, 'medium', 'short_term', ARRAY['Lister les problèmes', 'Prioriser corrections', 'Planifier interventions', 'Tester solutions'], ARRAY['tech_lead', 'developer']),
('Mise en place de rituels', 'Organiser des points réguliers et structurés', 'Communication', 85, 'low', 'immediate', ARRAY['Définir fréquence meetings', 'Créer agenda type', 'Assigner responsabilités', 'Suivre participation'], ARRAY['project_manager', 'team_lead']),
('Outils de collaboration', 'Implémenter des outils de communication efficaces', 'Communication', 80, 'medium', 'short_term', ARRAY['Évaluer besoins comm', 'Choisir outils adaptés', 'Former équipe', 'Monitorer usage'], ARRAY['tech_lead', 'project_manager'])
ON CONFLICT (title) DO NOTHING;