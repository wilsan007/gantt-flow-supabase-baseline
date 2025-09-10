-- Add more training programs
INSERT INTO public.training_programs (title, description, category, format, duration_hours, start_date, end_date, max_participants, participants_count, status, provider, rating) VALUES
('Cybersécurité avancée', 'Formation complète sur la sécurité informatique et la protection des données', 'Sécurité', 'hybrid', 24, '2024-04-01', '2024-04-10', 25, 18, 'available', 'CyberSec Institute', 4.7),
('Gestion de projet Agile', 'Maîtrisez les méthodologies agiles et Scrum pour une gestion de projet efficace', 'Management', 'online', 30, '2024-03-15', '2024-04-15', 30, 22, 'available', 'Agile Academy', 4.6),
('Communication interpersonnelle', 'Améliorez vos compétences de communication en entreprise', 'Soft Skills', 'classroom', 12, '2024-03-20', '2024-03-22', 20, 16, 'available', 'People Skills Pro', 4.4),
('DevOps et CI/CD', 'Apprenez les pratiques DevOps et l''intégration continue', 'Technique', 'online', 28, '2024-04-05', '2024-05-05', 15, 12, 'available', 'DevOps Masters', 4.8),
('Comptabilité analytique', 'Formation aux principes de la comptabilité analytique et contrôle de gestion', 'Finance', 'classroom', 18, '2024-03-25', '2024-03-27', 18, 14, 'available', 'Finance Institute', 4.3);

-- Add training enrollments (14 rows)
INSERT INTO public.training_enrollments (employee_id, training_id, status, enrollment_date, completion_date, score, certificate_url) VALUES
('54aa6b55-d898-4e14-a337-2ee4477e55db', 'f0603fd4-b038-4b5f-bf87-0c0132c07f40', 'completed', '2024-02-10', '2024-03-20', 85, 'https://certificates.example.com/cert1'),
('dbf36b51-76ec-474c-981c-be9f4f8e1fb8', 'f0603fd4-b038-4b5f-bf87-0c0132c07f40', 'in_progress', '2024-02-12', NULL, NULL, NULL),
('8e8263b2-1040-4f6d-bc82-5b634323759e', '85c49ffd-701b-4066-89e3-d7b205cecf72', 'completed', '2024-02-15', '2024-02-25', 92, 'https://certificates.example.com/cert2'),
('89624fb2-b86f-47f1-8f32-d2e89c1bcec1', '85c49ffd-701b-4066-89e3-d7b205cecf72', 'enrolled', '2024-02-18', NULL, NULL, NULL),
('c08609d4-bc6d-4921-b0c7-ef69ed09c16d', 'e1d89471-cd34-4d6b-8b8e-f0f20db2e949', 'completed', '2024-02-28', '2024-03-01', 96, 'https://certificates.example.com/cert3'),
('7ba6f266-340b-4904-8503-0670d6534e0a', 'e1d89471-cd34-4d6b-8b8e-f0f20db2e949', 'completed', '2024-02-28', '2024-03-01', 88, 'https://certificates.example.com/cert4'),
('a035dcb3-71d8-40d5-a72e-db0be4d399f1', 'f0603fd4-b038-4b5f-bf87-0c0132c07f40', 'enrolled', '2024-03-01', NULL, NULL, NULL),
('54aa6b55-d898-4e14-a337-2ee4477e55db', '85c49ffd-701b-4066-89e3-d7b205cecf72', 'in_progress', '2024-03-05', NULL, NULL, NULL),
('dbf36b51-76ec-474c-981c-be9f4f8e1fb8', 'e1d89471-cd34-4d6b-8b8e-f0f20db2e949', 'completed', '2024-02-25', '2024-03-01', 90, 'https://certificates.example.com/cert5'),
('8e8263b2-1040-4f6d-bc82-5b634323759e', 'f0603fd4-b038-4b5f-bf87-0c0132c07f40', 'dropped', '2024-02-20', NULL, NULL, NULL),
('89624fb2-b86f-47f1-8f32-d2e89c1bcec1', 'e1d89471-cd34-4d6b-8b8e-f0f20db2e949', 'enrolled', '2024-03-10', NULL, NULL, NULL),
('c08609d4-bc6d-4921-b0c7-ef69ed09c16d', 'f0603fd4-b038-4b5f-bf87-0c0132c07f40', 'in_progress', '2024-03-12', NULL, NULL, NULL),
('7ba6f266-340b-4904-8503-0670d6534e0a', '85c49ffd-701b-4066-89e3-d7b205cecf72', 'completed', '2024-02-10', '2024-02-22', 87, 'https://certificates.example.com/cert6'),
('a035dcb3-71d8-40d5-a72e-db0be4d399f1', 'e1d89471-cd34-4d6b-8b8e-f0f20db2e949', 'completed', '2024-02-28', '2024-03-01', 94, 'https://certificates.example.com/cert7');

-- Add timesheets (14 rows)
INSERT INTO public.timesheets (employee_id, date, regular_hours, overtime_hours, break_duration, notes, status) VALUES
('54aa6b55-d898-4e14-a337-2ee4477e55db', '2024-03-01', 8.0, 0, 60, 'Journée productive', 'approved'),
('54aa6b55-d898-4e14-a337-2ee4477e55db', '2024-03-02', 7.5, 1.0, 45, 'Réunion client prolongée', 'approved'),
('dbf36b51-76ec-474c-981c-be9f4f8e1fb8', '2024-03-01', 8.0, 0, 60, 'Développement feature', 'approved'),
('dbf36b51-76ec-474c-981c-be9f4f8e1fb8', '2024-03-02', 8.0, 2.0, 30, 'Correction bugs urgents', 'pending'),
('8e8263b2-1040-4f6d-bc82-5b634323759e', '2024-03-01', 7.0, 0, 90, 'Formation interne', 'approved'),
('8e8263b2-1040-4f6d-bc82-5b634323759e', '2024-03-02', 8.0, 0.5, 60, 'Campagne marketing', 'approved'),
('89624fb2-b86f-47f1-8f32-d2e89c1bcec1', '2024-03-01', 8.0, 0, 60, 'Analyse financière', 'approved'),
('89624fb2-b86f-47f1-8f32-d2e89c1bcec1', '2024-03-02', 6.0, 0, 60, 'Rendez-vous médical', 'approved'),
('c08609d4-bc6d-4921-b0c7-ef69ed09c16d', '2024-03-01', 8.0, 1.5, 45, 'Négociation contrat', 'approved'),
('c08609d4-bc6d-4921-b0c7-ef69ed09c16d', '2024-03-02', 8.0, 0, 60, 'Prospection clients', 'pending'),
('7ba6f266-340b-4904-8503-0670d6534e0a', '2024-03-01', 8.0, 0, 60, 'Gestion équipe', 'approved'),
('7ba6f266-340b-4904-8503-0670d6534e0a', '2024-03-02', 7.0, 0, 75, 'Formation management', 'approved'),
('a035dcb3-71d8-40d5-a72e-db0be4d399f1', '2024-03-01', 8.0, 0.5, 30, 'Administration système', 'approved'),
('a035dcb3-71d8-40d5-a72e-db0be4d399f1', '2024-03-02', 8.0, 0, 60, 'Maintenance serveurs', 'pending');

-- Add task risks (13 rows)
INSERT INTO public.task_risks (task_id, risk_type, severity, description, mitigation_strategy, owner, status, identified_date, review_date) VALUES
('3dd8c548-6393-4755-a405-bb6c5e177068', 'technique', 'high', 'Risque de régression lors de la mise à jour', 'Tests automatisés complets avant déploiement', 'Jean Martin', 'active', '2024-03-01', '2024-03-15'),
('f5ae1645-e34c-4e08-be18-4d666cce9aae', 'délai', 'medium', 'Retard possible sur les livrables', 'Augmentation de l''équipe et priorisation', 'Sophie Bernard', 'active', '2024-03-02', '2024-03-16'),
('46c853bc-657e-43d2-8798-bfcac716c012', 'budget', 'low', 'Dépassement budgétaire mineur possible', 'Suivi hebdomadaire des coûts', 'Pierre Moreau', 'monitored', '2024-03-03', '2024-03-17'),
('2111b5e8-2187-4a9d-b566-17c8487d9a0f', 'qualité', 'high', 'Non-conformité aux standards de sécurité', 'Audit de sécurité complet', 'Marie Dupont', 'active', '2024-03-04', '2024-03-18'),
('24d58517-cf61-4030-90c1-93a69a49c0a9', 'ressource', 'medium', 'Indisponibilité d''un expert clé', 'Formation d''un expert de backup', 'Camille Rousseau', 'active', '2024-03-05', '2024-03-19'),
('a0e627b2-e6a5-4e0e-a4c5-d2b1292b2f65', 'technique', 'low', 'Problème de compatibilité browser', 'Tests multi-navigateurs', 'Lucas Moreau', 'resolved', '2024-03-06', '2024-03-20'),
('37b92e01-7f3e-491a-80fe-1690bf6b977a', 'délai', 'high', 'Dépendance externe critique', 'Développement d''une solution alternative', 'Admin User', 'active', '2024-03-07', '2024-03-21'),
('8eb5803e-4038-4cce-b283-d56b79a77894', 'budget', 'medium', 'Coût des licences plus élevé', 'Négociation avec le fournisseur', 'Jean Martin', 'monitored', '2024-03-08', '2024-03-22'),
('80b4afc0-ef4f-456d-a739-e2e1196ceab5', 'qualité', 'medium', 'Risque de bugs dans le module critique', 'Code review renforcé', 'Sophie Bernard', 'active', '2024-03-09', '2024-03-23'),
('757927a7-40ea-4bf3-a7ee-28138e4f63aa', 'ressource', 'low', 'Congés simultanés d''équipe', 'Planification anticipée des congés', 'Pierre Moreau', 'monitored', '2024-03-10', '2024-03-24'),
('3dd8c548-6393-4755-a405-bb6c5e177068', 'technique', 'medium', 'Performance dégradée en production', 'Optimisation et monitoring', 'Marie Dupont', 'active', '2024-03-11', '2024-03-25'),
('f5ae1645-e34c-4e08-be18-4d666cce9aae', 'délai', 'low', 'Validation client retardée', 'Communication proactive avec le client', 'Camille Rousseau', 'resolved', '2024-03-12', '2024-03-26'),
('46c853bc-657e-43d2-8798-bfcac716c012', 'budget', 'high', 'Inflation des coûts matériel', 'Recherche de fournisseurs alternatifs', 'Lucas Moreau', 'active', '2024-03-13', '2024-03-27');

-- Add skill assessments (14 rows)
INSERT INTO public.skill_assessments (employee_id, employee_name, skill_id, department, position, current_level, target_level, assessor, last_assessed) VALUES
('54aa6b55-d898-4e14-a337-2ee4477e55db', 'Marie Dupont', 'a75981eb-769e-408a-a061-bcf0fbdf66f9', 'Ressources Humaines', 'RH Manager', 4, 5, 'Lucas Moreau', '2024-03-01'),
('dbf36b51-76ec-474c-981c-be9f4f8e1fb8', 'Jean Martin', '990ea84e-aa65-41a5-b321-ead76ac3d01c', 'Développement', 'Développeur Senior', 5, 5, 'Admin User', '2024-03-02'),
('8e8263b2-1040-4f6d-bc82-5b634323759e', 'Sophie Bernard', '660c814c-d8c0-4275-aac4-3deb6fdbcbf2', 'Marketing', 'Chef de projet', 3, 4, 'Marie Dupont', '2024-03-03'),
('89624fb2-b86f-47f1-8f32-d2e89c1bcec1', 'Pierre Moreau', '08b03f76-a350-40d4-8a51-0b586400e312', 'Finance', 'Contrôleur financier', 4, 5, 'Sophie Bernard', '2024-03-04'),
('c08609d4-bc6d-4921-b0c7-ef69ed09c16d', 'Camille Rousseau', '63c6f07c-ee8c-4a90-b195-9d244a2f4da7', 'Commercial', 'Commercial Senior', 4, 4, 'Pierre Moreau', '2024-03-05'),
('7ba6f266-340b-4904-8503-0670d6534e0a', 'Lucas Moreau', 'd2c2e88b-38f0-47cf-8bee-db0bb85adb38', 'Développement', 'Tech Lead', 5, 5, 'Camille Rousseau', '2024-03-06'),
('a035dcb3-71d8-40d5-a72e-db0be4d399f1', 'Admin User', 'cc530891-14ce-478d-8724-bb901fef500b', 'IT', 'Administrateur', 4, 5, 'Lucas Moreau', '2024-03-07'),
('54aa6b55-d898-4e14-a337-2ee4477e55db', 'Marie Dupont', '2c8d5b99-d9f2-4c7e-baa6-329ef1c54d50', 'Ressources Humaines', 'RH Manager', 3, 4, 'Admin User', '2024-03-08'),
('dbf36b51-76ec-474c-981c-be9f4f8e1fb8', 'Jean Martin', '90387389-93e4-411f-9934-3b37de07b473', 'Développement', 'Développeur Senior', 4, 5, 'Marie Dupont', '2024-03-09'),
('8e8263b2-1040-4f6d-bc82-5b634323759e', 'Sophie Bernard', 'a75981eb-769e-408a-a061-bcf0fbdf66f9', 'Marketing', 'Chef de projet', 3, 4, 'Sophie Bernard', '2024-03-10'),
('89624fb2-b86f-47f1-8f32-d2e89c1bcec1', 'Pierre Moreau', '990ea84e-aa65-41a5-b321-ead76ac3d01c', 'Finance', 'Contrôleur financier', 2, 3, 'Pierre Moreau', '2024-03-11'),
('c08609d4-bc6d-4921-b0c7-ef69ed09c16d', 'Camille Rousseau', '660c814c-d8c0-4275-aac4-3deb6fdbcbf2', 'Commercial', 'Commercial Senior', 4, 5, 'Camille Rousseau', '2024-03-12'),
('7ba6f266-340b-4904-8503-0670d6534e0a', 'Lucas Moreau', '08b03f76-a350-40d4-8a51-0b586400e312', 'Développement', 'Tech Lead', 5, 5, 'Lucas Moreau', '2024-03-13'),
('a035dcb3-71d8-40d5-a72e-db0be4d399f1', 'Admin User', '63c6f07c-ee8c-4a90-b195-9d244a2f4da7', 'IT', 'Administrateur', 3, 4, 'Admin User', '2024-03-14');