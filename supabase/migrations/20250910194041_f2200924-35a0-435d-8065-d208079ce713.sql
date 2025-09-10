-- Add sample data to training_enrollments table (using valid status values)
INSERT INTO training_enrollments (employee_id, employee_name, training_id, enrollment_date, completion_date, status, score, certificate_url, hours_completed) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Marie Dupont', 'f0603fd4-b038-4b5f-bf87-0c0132c07f40', '2024-01-15', '2024-01-30', 'completed', 95, 'https://example.com/cert1', 20),
('650e8400-e29b-41d4-a716-446655440002', 'Jean Martin', '85c49ffd-701b-4066-89e3-d7b205cecf72', '2024-01-20', NULL, 'enrolled', NULL, NULL, 8),
('650e8400-e29b-41d4-a716-446655440003', 'Sophie Bernard', 'f0603fd4-b038-4b5f-bf87-0c0132c07f40', '2024-02-01', '2024-02-15', 'completed', 88, 'https://example.com/cert2', 20),
('650e8400-e29b-41d4-a716-446655440004', 'Pierre Moreau', 'e1d89471-cd34-4d6b-8b8e-f0f20db2e949', '2024-02-10', NULL, 'enrolled', NULL, NULL, 0),
('650e8400-e29b-41d4-a716-446655440005', 'Lucas Moreau', '85c49ffd-701b-4066-89e3-d7b205cecf72', '2024-02-15', '2024-03-01', 'completed', 92, 'https://example.com/cert3', 16),
('650e8400-e29b-41d4-a716-446655440006', 'Admin User', 'f0603fd4-b038-4b5f-bf87-0c0132c07f40', '2024-03-01', NULL, 'enrolled', NULL, NULL, 5),
('650e8400-e29b-41d4-a716-446655440007', 'Camille Rousseau', 'f0603fd4-b038-4b5f-bf87-0c0132c07f40', '2024-03-10', '2024-03-25', 'completed', 90, 'https://example.com/cert4', 20),
('650e8400-e29b-41d4-a716-446655440001', 'Marie Dupont', 'e1d89471-cd34-4d6b-8b8e-f0f20db2e949', '2024-03-15', NULL, 'enrolled', NULL, NULL, 0),
('650e8400-e29b-41d4-a716-446655440002', 'Jean Martin', '85c49ffd-701b-4066-89e3-d7b205cecf72', '2024-04-01', '2024-04-20', 'completed', 87, 'https://example.com/cert5', 12),
('650e8400-e29b-41d4-a716-446655440003', 'Sophie Bernard', '85c49ffd-701b-4066-89e3-d7b205cecf72', '2024-04-05', NULL, 'enrolled', NULL, NULL, 10),
('650e8400-e29b-41d4-a716-446655440004', 'Pierre Moreau', 'f0603fd4-b038-4b5f-bf87-0c0132c07f40', '2024-04-10', '2024-04-25', 'completed', 94, 'https://example.com/cert6', 20),
('650e8400-e29b-41d4-a716-446655440005', 'Lucas Moreau', 'e1d89471-cd34-4d6b-8b8e-f0f20db2e949', '2024-05-01', NULL, 'enrolled', NULL, NULL, 0),
('650e8400-e29b-41d4-a716-446655440006', 'Admin User', '85c49ffd-701b-4066-89e3-d7b205cecf72', '2024-05-10', NULL, 'enrolled', NULL, NULL, 7),
('650e8400-e29b-41d4-a716-446655440007', 'Camille Rousseau', 'e1d89471-cd34-4d6b-8b8e-f0f20db2e949', '2024-05-15', '2024-06-01', 'completed', 96, 'https://example.com/cert7', 12);

-- Add sample data to timesheets table  
INSERT INTO timesheets (employee_id, task_id, project_id, date, hours, description, billable, approved, approved_by) VALUES
('650e8400-e29b-41d4-a716-446655440001', '3dd8c548-6393-4755-a405-bb6c5e177068', '550e8400-e29b-41d4-a716-446655440001', '2024-01-05', 8, 'Développement interface utilisateur', true, true, 'Admin User'),
('650e8400-e29b-41d4-a716-446655440002', 'f5ae1645-e34c-4e08-be18-4d666cce9aae', '550e8400-e29b-41d4-a716-446655440002', '2024-01-05', 7, 'Gestion de projet et coordination équipe', true, true, 'Admin User'),
('650e8400-e29b-41d4-a716-446655440003', '46c853bc-657e-43d2-8798-bfcac716c012', '550e8400-e29b-41d4-a716-446655440003', '2024-01-06', 6, 'Campagne marketing digital', true, true, 'Admin User'),
('650e8400-e29b-41d4-a716-446655440004', '2111b5e8-2187-4a9d-b566-17c8487d9a0f', '550e8400-e29b-41d4-a716-446655440004', '2024-01-07', 7, 'Analyse financière trimestrielle', true, false, NULL),
('650e8400-e29b-41d4-a716-446655440005', '24d58517-cf61-4030-90c1-93a69a49c0a9', '550e8400-e29b-41d4-a716-446655440001', '2024-01-12', 8, 'Développement API backend', true, true, 'Admin User'),
('650e8400-e29b-41d4-a716-446655440006', '3dd8c548-6393-4755-a405-bb6c5e177068', '550e8400-e29b-41d4-a716-446655440002', '2024-01-12', 8, 'Administration système et DevOps', false, true, 'Admin User'),
('650e8400-e29b-41d4-a716-446655440007', 'f5ae1645-e34c-4e08-be18-4d666cce9aae', '550e8400-e29b-41d4-a716-446655440003', '2024-01-13', 7, 'Recrutement et formation RH', false, true, 'Admin User'),
('650e8400-e29b-41d4-a716-446655440001', '46c853bc-657e-43d2-8798-bfcac716c012', '550e8400-e29b-41d4-a716-446655440001', '2024-01-19', 6, 'Tests et débogage interface', true, false, NULL),
('650e8400-e29b-41d4-a716-446655440002', '2111b5e8-2187-4a9d-b566-17c8487d9a0f', '550e8400-e29b-41d4-a716-446655440002', '2024-01-20', 5, 'Réunion client et documentation', true, false, NULL),
('650e8400-e29b-41d4-a716-446655440003', '24d58517-cf61-4030-90c1-93a69a49c0a9', '550e8400-e29b-41d4-a716-446655440003', '2024-01-20', 8, 'Stratégie contenu et SEO', true, true, 'Admin User'),
('650e8400-e29b-41d4-a716-446655440004', '3dd8c548-6393-4755-a405-bb6c5e177068', '550e8400-e29b-41d4-a716-446655440004', '2024-01-26', 7, 'Budgeting et prévisions', true, false, NULL),
('650e8400-e29b-41d4-a716-446655440005', 'f5ae1645-e34c-4e08-be18-4d666cce9aae', '550e8400-e29b-41d4-a716-446655440001', '2024-01-27', 8, 'Optimisation base de données', true, true, 'Admin User'),
('650e8400-e29b-41d4-a716-446655440006', '46c853bc-657e-43d2-8798-bfcac716c012', '550e8400-e29b-41d4-a716-446655440002', '2024-02-02', 6, 'Maintenance serveurs', false, false, NULL),
('650e8400-e29b-41d4-a716-446655440007', '2111b5e8-2187-4a9d-b566-17c8487d9a0f', '550e8400-e29b-41d4-a716-446655440003', '2024-02-02', 7, 'Entretiens et évaluations', false, false, NULL);

-- Add sample data to task_risks table
INSERT INTO task_risks (task_id, risk_description, probability, impact, mitigation_plan, status) VALUES
('3dd8c548-6393-4755-a405-bb6c5e177068', 'Intégration API complexe avec système externe', 'medium', 'high', 'Prévoir du temps supplémentaire et tests approfondis', 'active'),
('f5ae1645-e34c-4e08-be18-4d666cce9aae', 'Disponibilité limitée du développeur senior', 'high', 'medium', 'Former un développeur junior en parallèle', 'mitigated'),
('46c853bc-657e-43d2-8798-bfcac716c012', 'Dépendance externe retardée', 'medium', 'high', 'Identifier des solutions alternatives', 'active'),
('2111b5e8-2187-4a9d-b566-17c8487d9a0f', 'Performance insuffisante sur mobile', 'low', 'medium', 'Optimisation du code et tests de performance', 'resolved'),
('24d58517-cf61-4030-90c1-93a69a49c0a9', 'Dépassement budgétaire potentiel', 'medium', 'high', 'Révision du scope et priorisation des fonctionnalités', 'active'),
('3dd8c548-6393-4755-a405-bb6c5e177068', 'Manque de compétences UX dans l équipe', 'high', 'medium', 'Recrutement consultant UX externe', 'mitigated'),
('f5ae1645-e34c-4e08-be18-4d666cce9aae', 'Compatibilité navigateurs anciens', 'low', 'low', 'Polyfills et tests cross-browser', 'active'),
('46c853bc-657e-43d2-8798-bfcac716c012', 'Retard livraison composants tiers', 'medium', 'high', 'Développement de composants alternatifs', 'active'),
('2111b5e8-2187-4a9d-b566-17c8487d9a0f', 'Tests automatisés insuffisants', 'high', 'medium', 'Mise en place pipeline CI/CD complet', 'resolved'),
('24d58517-cf61-4030-90c1-93a69a49c0a9', 'Vulnérabilités potentielles RGPD', 'medium', 'high', 'Audit sécurité et mise en conformité', 'active'),
('3dd8c548-6393-4755-a405-bb6c5e177068', 'Turnover équipe développement', 'low', 'high', 'Documentation approfondie et knowledge transfer', 'mitigated'),
('f5ae1645-e34c-4e08-be18-4d666cce9aae', 'Scalabilité base de données', 'medium', 'medium', 'Optimisation requêtes et indexation', 'active'),
('46c853bc-657e-43d2-8798-bfcac716c012', 'Validation client tardive', 'high', 'medium', 'Sessions de validation régulières', 'resolved');

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