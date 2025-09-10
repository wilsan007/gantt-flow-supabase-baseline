-- Add sample data to training_enrollments table
INSERT INTO training_enrollments (employee_id, employee_name, program_id, enrollment_date, completion_date, status, score, certificate_url) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Marie Dupont', 'a50e8400-e29b-41d4-a716-446655440001', '2024-01-15', '2024-01-30', 'completed', 95, 'https://example.com/cert1'),
('650e8400-e29b-41d4-a716-446655440002', 'Jean Martin', 'a50e8400-e29b-41d4-a716-446655440002', '2024-01-20', NULL, 'in_progress', NULL, NULL),
('650e8400-e29b-41d4-a716-446655440003', 'Sophie Bernard', 'a50e8400-e29b-41d4-a716-446655440001', '2024-02-01', '2024-02-15', 'completed', 88, 'https://example.com/cert2'),
('650e8400-e29b-41d4-a716-446655440004', 'Pierre Moreau', 'a50e8400-e29b-41d4-a716-446655440003', '2024-02-10', NULL, 'enrolled', NULL, NULL),
('650e8400-e29b-41d4-a716-446655440005', 'Lucas Moreau', 'a50e8400-e29b-41d4-a716-446655440002', '2024-02-15', '2024-03-01', 'completed', 92, 'https://example.com/cert3'),
('650e8400-e29b-41d4-a716-446655440006', 'Admin User', 'a50e8400-e29b-41d4-a716-446655440004', '2024-03-01', NULL, 'in_progress', NULL, NULL),
('650e8400-e29b-41d4-a716-446655440007', 'Camille Rousseau', 'a50e8400-e29b-41d4-a716-446655440001', '2024-03-10', '2024-03-25', 'completed', 90, 'https://example.com/cert4'),
('650e8400-e29b-41d4-a716-446655440001', 'Marie Dupont', 'a50e8400-e29b-41d4-a716-446655440003', '2024-03-15', NULL, 'enrolled', NULL, NULL),
('650e8400-e29b-41d4-a716-446655440002', 'Jean Martin', 'a50e8400-e29b-41d4-a716-446655440004', '2024-04-01', '2024-04-20', 'completed', 87, 'https://example.com/cert5'),
('650e8400-e29b-41d4-a716-446655440003', 'Sophie Bernard', 'a50e8400-e29b-41d4-a716-446655440002', '2024-04-05', NULL, 'in_progress', NULL, NULL),
('650e8400-e29b-41d4-a716-446655440004', 'Pierre Moreau', 'a50e8400-e29b-41d4-a716-446655440001', '2024-04-10', '2024-04-25', 'completed', 94, 'https://example.com/cert6'),
('650e8400-e29b-41d4-a716-446655440005', 'Lucas Moreau', 'a50e8400-e29b-41d4-a716-446655440003', '2024-05-01', NULL, 'enrolled', NULL, NULL),
('650e8400-e29b-41d4-a716-446655440006', 'Admin User', 'a50e8400-e29b-41d4-a716-446655440002', '2024-05-10', NULL, 'in_progress', NULL, NULL),
('650e8400-e29b-41d4-a716-446655440007', 'Camille Rousseau', 'a50e8400-e29b-41d4-a716-446655440004', '2024-05-15', '2024-06-01', 'completed', 96, 'https://example.com/cert7');

-- Add sample data to timesheets table  
INSERT INTO timesheets (employee_id, employee_name, week_ending, regular_hours, overtime_hours, total_hours, status, submitted_at, approved_by) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Marie Dupont', '2024-01-07', 40, 2, 42, 'approved', '2024-01-05', 'Admin User'),
('650e8400-e29b-41d4-a716-446655440002', 'Jean Martin', '2024-01-07', 37, 0, 37, 'approved', '2024-01-05', 'Admin User'),
('650e8400-e29b-41d4-a716-446655440003', 'Sophie Bernard', '2024-01-07', 40, 5, 45, 'approved', '2024-01-06', 'Admin User'),
('650e8400-e29b-41d4-a716-446655440004', 'Pierre Moreau', '2024-01-07', 35, 0, 35, 'submitted', '2024-01-07', NULL),
('650e8400-e29b-41d4-a716-446655440005', 'Lucas Moreau', '2024-01-14', 40, 3, 43, 'approved', '2024-01-12', 'Admin User'),
('650e8400-e29b-41d4-a716-446655440006', 'Admin User', '2024-01-14', 45, 0, 45, 'approved', '2024-01-12', 'Admin User'),
('650e8400-e29b-41d4-a716-446655440007', 'Camille Rousseau', '2024-01-14', 38, 2, 40, 'approved', '2024-01-13', 'Admin User'),
('650e8400-e29b-41d4-a716-446655440001', 'Marie Dupont', '2024-01-21', 40, 1, 41, 'submitted', '2024-01-19', NULL),
('650e8400-e29b-41d4-a716-446655440002', 'Jean Martin', '2024-01-21', 39, 0, 39, 'draft', NULL, NULL),
('650e8400-e29b-41d4-a716-446655440003', 'Sophie Bernard', '2024-01-21', 40, 4, 44, 'approved', '2024-01-20', 'Admin User'),
('650e8400-e29b-41d4-a716-446655440004', 'Pierre Moreau', '2024-01-28', 36, 0, 36, 'submitted', '2024-01-26', NULL),
('650e8400-e29b-41d4-a716-446655440005', 'Lucas Moreau', '2024-01-28', 40, 2, 42, 'approved', '2024-01-27', 'Admin User'),
('650e8400-e29b-41d4-a716-446655440006', 'Admin User', '2024-02-04', 42, 0, 42, 'draft', NULL, NULL),
('650e8400-e29b-41d4-a716-446655440007', 'Camille Rousseau', '2024-02-04', 38, 1, 39, 'submitted', '2024-02-02', NULL);

-- Add sample data to task_risks table
INSERT INTO task_risks (task_id, risk_type, description, probability, impact, mitigation_plan, status, identified_by, identified_date) VALUES
('b50e8400-e29b-41d4-a716-446655440001', 'technical', 'Intégration API complexe avec système externe', 'medium', 'high', 'Prévoir du temps supplémentaire et tests approfondis', 'active', 'Marie Dupont', '2024-01-15'),
('b50e8400-e29b-41d4-a716-446655440002', 'resource', 'Disponibilité limitée du développeur senior', 'high', 'medium', 'Former un développeur junior en parallèle', 'mitigated', 'Jean Martin', '2024-01-20'),
('b50e8400-e29b-41d4-a716-446655440003', 'schedule', 'Dépendance externe retardée', 'medium', 'high', 'Identifier des solutions alternatives', 'active', 'Sophie Bernard', '2024-02-01'),
('b50e8400-e29b-41d4-a716-446655440004', 'technical', 'Performance insuffisante sur mobile', 'low', 'medium', 'Optimisation du code et tests de performance', 'resolved', 'Pierre Moreau', '2024-02-10'),
('b50e8400-e29b-41d4-a716-446655440005', 'budget', 'Dépassement budgétaire potentiel', 'medium', 'high', 'Révision du scope et priorisation des fonctionnalités', 'active', 'Lucas Moreau', '2024-02-15'),
('b50e8400-e29b-41d4-a716-446655440001', 'resource', 'Manque de compétences UX dans l équipe', 'high', 'medium', 'Recrutement consultant UX externe', 'mitigated', 'Camille Rousseau', '2024-03-01'),
('b50e8400-e29b-41d4-a716-446655440002', 'technical', 'Compatibilité navigateurs anciens', 'low', 'low', 'Polyfills et tests cross-browser', 'active', 'Marie Dupont', '2024-03-10'),
('b50e8400-e29b-41d4-a716-446655440003', 'schedule', 'Retard livraison composants tiers', 'medium', 'high', 'Développement de composants alternatifs', 'active', 'Jean Martin', '2024-03-15'),
('b50e8400-e29b-41d4-a716-446655440004', 'quality', 'Tests automatisés insuffisants', 'high', 'medium', 'Mise en place pipeline CI/CD complet', 'resolved', 'Sophie Bernard', '2024-04-01'),
('b50e8400-e29b-41d4-a716-446655440005', 'security', 'Vulnérabilités potentielles RGPD', 'medium', 'high', 'Audit sécurité et mise en conformité', 'active', 'Pierre Moreau', '2024-04-05'),
('b50e8400-e29b-41d4-a716-446655440001', 'resource', 'Turnover équipe développement', 'low', 'high', 'Documentation approfondie et knowledge transfer', 'mitigated', 'Lucas Moreau', '2024-04-10'),
('b50e8400-e29b-41d4-a716-446655440002', 'technical', 'Scalabilité base de données', 'medium', 'medium', 'Optimisation requêtes et indexation', 'active', 'Admin User', '2024-05-01'),
('b50e8400-e29b-41d4-a716-446655440003', 'schedule', 'Validation client tardive', 'high', 'medium', 'Sessions de validation régulières', 'resolved', 'Camille Rousseau', '2024-05-10');

-- Add sample data to skill_assessments table
INSERT INTO skill_assessments (skill_id, employee_id, employee_name, position, department, current_level, target_level, assessor, last_assessed) VALUES
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Marie Dupont', 'Développeuse Frontend', 'Développement', 4, 5, 'Tech Lead', '2024-01-15'),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'Marie Dupont', 'Développeuse Frontend', 'Développement', 3, 4, 'Tech Lead', '2024-01-15'),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', 'Jean Martin', 'Chef de Projet', 'Développement', 5, 5, 'Manager', '2024-01-20'),
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', 'Jean Martin', 'Chef de Projet', 'Développement', 4, 5, 'Manager', '2024-01-20'),
('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440003', 'Sophie Bernard', 'Responsable Marketing', 'Marketing', 4, 5, 'Directeur Marketing', '2024-02-01'),
('750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440003', 'Sophie Bernard', 'Responsable Marketing', 'Marketing', 5, 5, 'Directeur Marketing', '2024-02-01'),
('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440004', 'Pierre Moreau', 'Analyste Financier', 'Finance', 3, 4, 'Directeur Financier', '2024-02-10'),
('750e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440005', 'Lucas Moreau', 'Développeur Backend', 'Développement', 3, 4, 'Tech Lead', '2024-02-15'),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440005', 'Lucas Moreau', 'Développeur Backend', 'Développement', 4, 5, 'Tech Lead', '2024-02-15'),
('750e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440006', 'Admin User', 'Administrateur', 'IT', 5, 5, 'CTO', '2024-03-01'),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440007', 'Camille Rousseau', 'Responsable RH', 'Ressources Humaines', 4, 5, 'Directeur RH', '2024-03-10'),
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440007', 'Camille Rousseau', 'Responsable RH', 'Ressources Humaines', 5, 5, 'Directeur RH', '2024-03-10'),
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440004', 'Pierre Moreau', 'Analyste Financier', 'Finance', 2, 3, 'Directeur Financier', '2024-03-15'),
('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440001', 'Marie Dupont', 'Développeuse Frontend', 'Développement', 3, 4, 'Manager', '2024-04-01');