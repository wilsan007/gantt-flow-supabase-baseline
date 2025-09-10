-- Add sample data to skill_assessments table with existing skill IDs
INSERT INTO skill_assessments (skill_id, employee_id, employee_name, position, department, current_level, target_level, assessor, last_assessed) VALUES
((SELECT id FROM skills WHERE name = 'React' LIMIT 1), '54aa6b55-d898-4e14-a337-2ee4477e55db', 'Marie Dupont', 'Développeuse Frontend', 'Développement', 4, 5, 'Tech Lead', '2024-01-15'),
((SELECT id FROM skills WHERE name = 'TypeScript' LIMIT 1), '54aa6b55-d898-4e14-a337-2ee4477e55db', 'Marie Dupont', 'Développeuse Frontend', 'Développement', 3, 4, 'Tech Lead', '2024-01-15'),
((SELECT id FROM skills WHERE name = 'Leadership' LIMIT 1), 'dbf36b51-76ec-474c-981c-be9f4f8e1fb8', 'Jean Martin', 'Chef de Projet', 'Développement', 5, 5, 'Manager', '2024-01-20'),
((SELECT id FROM skills WHERE name = 'Communication' LIMIT 1), 'dbf36b51-76ec-474c-981c-be9f4f8e1fb8', 'Jean Martin', 'Chef de Projet', 'Développement', 4, 5, 'Manager', '2024-01-20'),
((SELECT id FROM skills WHERE name = 'Project Management' LIMIT 1), '8e8263b2-1040-4f6d-bc82-5b634323759e', 'Sophie Bernard', 'Responsable Marketing', 'Marketing', 4, 5, 'Directeur Marketing', '2024-02-01'),
((SELECT id FROM skills WHERE name = 'Marketing Digital' LIMIT 1), '8e8263b2-1040-4f6d-bc82-5b634323759e', 'Sophie Bernard', 'Responsable Marketing', 'Marketing', 5, 5, 'Directeur Marketing', '2024-02-01'),
((SELECT id FROM skills WHERE name = 'SQL' LIMIT 1), '89624fb2-b86f-47f1-8f32-d2e89c1bcec1', 'Pierre Moreau', 'Analyste Financier', 'Finance', 3, 4, 'Directeur Financier', '2024-02-10'),
((SELECT id FROM skills WHERE name = 'JavaScript' LIMIT 1), 'c08609d4-bc6d-4921-b0c7-ef69ed09c16d', 'Lucas Moreau', 'Développeur Backend', 'Développement', 3, 4, 'Tech Lead', '2024-02-15'),
((SELECT id FROM skills WHERE name = 'TypeScript' LIMIT 1), 'c08609d4-bc6d-4921-b0c7-ef69ed09c16d', 'Lucas Moreau', 'Développeur Backend', 'Développement', 4, 5, 'Tech Lead', '2024-02-15'),
((SELECT id FROM skills WHERE name = 'Management' LIMIT 1), '7ba6f266-340b-4904-8503-0670d6534e0a', 'Admin User', 'Administrateur', 'IT', 5, 5, 'CTO', '2024-03-01'),
((SELECT id FROM skills WHERE name = 'Leadership' LIMIT 1), 'a035dcb3-71d8-40d5-a72e-db0be4d399f1', 'Camille Rousseau', 'Responsable RH', 'Ressources Humaines', 4, 5, 'Directeur RH', '2024-03-10'),
((SELECT id FROM skills WHERE name = 'Communication' LIMIT 1), 'a035dcb3-71d8-40d5-a72e-db0be4d399f1', 'Camille Rousseau', 'Responsable RH', 'Ressources Humaines', 5, 5, 'Directeur RH', '2024-03-10'),
((SELECT id FROM skills WHERE name = 'React' LIMIT 1), '89624fb2-b86f-47f1-8f32-d2e89c1bcec1', 'Pierre Moreau', 'Analyste Financier', 'Finance', 2, 3, 'Directeur Financier', '2024-03-15'),
((SELECT id FROM skills WHERE name = 'Project Management' LIMIT 1), '54aa6b55-d898-4e14-a337-2ee4477e55db', 'Marie Dupont', 'Développeuse Frontend', 'Développement', 3, 4, 'Manager', '2024-04-01');