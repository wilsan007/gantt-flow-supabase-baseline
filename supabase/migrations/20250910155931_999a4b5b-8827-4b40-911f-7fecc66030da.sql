-- Mettre à jour TOUTES les tables avec user_id et créer des données de test cohérentes

-- D'abord, récupérer les user_id des profils créés
DO $$
DECLARE
    user_ids UUID[];
    user1_id UUID;
    user2_id UUID;
    user3_id UUID;
    user4_id UUID;
    user5_id UUID;
    user6_id UUID;
    user7_id UUID;
    dept1_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    dept2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
    dept3_id UUID := '550e8400-e29b-41d4-a716-446655440003';
    dept4_id UUID := '550e8400-e29b-41d4-a716-446655440004';
    dept5_id UUID := '550e8400-e29b-41d4-a716-446655440005';
    project1_id UUID;
    project2_id UUID;
    project3_id UUID;
    task1_id UUID;
    task2_id UUID;
    task3_id UUID;
BEGIN
    -- Récupérer les user_id des profils
    SELECT ARRAY_AGG(user_id ORDER BY created_at) INTO user_ids
    FROM public.profiles 
    WHERE user_id IS NOT NULL
    LIMIT 7;
    
    IF array_length(user_ids, 1) >= 7 THEN
        user1_id := user_ids[1];
        user2_id := user_ids[2];
        user3_id := user_ids[3];
        user4_id := user_ids[4];
        user5_id := user_ids[5];
        user6_id := user_ids[6];
        user7_id := user_ids[7];
        
        -- Créer des projets avec les bons user_id
        INSERT INTO public.projects (id, name, description, status, priority, start_date, end_date, manager_id, department_id, budget, tenant_id) VALUES
        ('850e8400-e29b-41d4-a716-446655440001', 'Refonte Site Web', 'Modernisation complète du site web de l''entreprise', 'active', 'high', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '90 days', user2_id, dept2_id, 150000, get_user_tenant_id()),
        ('850e8400-e29b-41d4-a716-446655440002', 'Campagne Marketing Q2', 'Lancement de la campagne marketing pour le deuxième trimestre', 'planning', 'medium', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '120 days', user3_id, dept3_id, 80000, get_user_tenant_id()),
        ('850e8400-e29b-41d4-a716-446655440003', 'Formation Équipe', 'Programme de formation continue pour toute l''équipe', 'active', 'medium', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '60 days', user1_id, dept1_id, 25000, get_user_tenant_id())
        ON CONFLICT (id) DO NOTHING;
        
        project1_id := '850e8400-e29b-41d4-a716-446655440001';
        project2_id := '850e8400-e29b-41d4-a716-446655440002';
        project3_id := '850e8400-e29b-41d4-a716-446655440003';
        
        -- Créer des tâches avec les bons assignees (user_id)
        INSERT INTO public.tasks (id, title, description, status, priority, progress, assignee, start_date, due_date, effort_estimate_h, project_id, tenant_id, display_order, task_level) VALUES
        ('950e8400-e29b-41d4-a716-446655440001', 'Analyse des besoins', 'Analyser les besoins fonctionnels du nouveau site web', 'done', 'high', 100, user2_id::text, CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '20 days', 16, project1_id, get_user_tenant_id(), '1', 0),
        ('950e8400-e29b-41d4-a716-446655440002', 'Maquettes UI/UX', 'Création des maquettes et wireframes', 'doing', 'high', 75, user6_id::text, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '5 days', 24, project1_id, get_user_tenant_id(), '2', 0),
        ('950e8400-e29b-41d4-a716-446655440003', 'Développement Frontend', 'Développement de l''interface utilisateur', 'todo', 'high', 0, user2_id::text, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '30 days', 40, project1_id, get_user_tenant_id(), '3', 0),
        ('950e8400-e29b-41d4-a716-446655440004', 'Stratégie Marketing', 'Définir la stratégie marketing pour Q2', 'doing', 'medium', 60, user3_id::text, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', 20, project2_id, get_user_tenant_id(), '1', 0),
        ('950e8400-e29b-41d4-a716-446655440005', 'Création Contenu', 'Rédaction et création du contenu marketing', 'todo', 'medium', 0, user3_id::text, CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days', 32, project2_id, get_user_tenant_id(), '2', 0),
        ('950e8400-e29b-41d4-a716-446655440006', 'Plan Formation', 'Élaborer le plan de formation annuel', 'done', 'low', 100, user1_id::text, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '5 days', 12, project3_id, get_user_tenant_id(), '1', 0),
        ('950e8400-e29b-41d4-a716-446655440007', 'Sessions Formation', 'Organiser les sessions de formation', 'doing', 'medium', 40, user7_id::text, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 60, project3_id, get_user_tenant_id(), '2', 0)
        ON CONFLICT (id) DO NOTHING;
        
        task1_id := '950e8400-e29b-41d4-a716-446655440001';
        task2_id := '950e8400-e29b-41d4-a716-446655440002';
        task3_id := '950e8400-e29b-41d4-a716-446655440004';
        
        -- Créer des actions de tâches
        INSERT INTO public.task_actions (task_id, title, notes, weight_percentage, is_done, owner_id, due_date, tenant_id) VALUES
        (task1_id, 'Interviews utilisateurs', 'Mener des interviews avec 10 utilisateurs cibles', 40, true, user2_id::text, CURRENT_DATE - INTERVAL '22 days', get_user_tenant_id()),
        (task1_id, 'Documentation requirements', 'Rédiger le document de spécifications', 60, true, user2_id::text, CURRENT_DATE - INTERVAL '20 days', get_user_tenant_id()),
        (task2_id, 'Wireframes desktop', 'Créer les wireframes pour desktop', 50, true, user6_id::text, CURRENT_DATE - INTERVAL '15 days', get_user_tenant_id()),
        (task2_id, 'Wireframes mobile', 'Créer les wireframes pour mobile', 50, false, user6_id::text, CURRENT_DATE + INTERVAL '2 days', get_user_tenant_id()),
        (task3_id, 'Analyse concurrence', 'Étudier la concurrence marketing', 30, true, user3_id::text, CURRENT_DATE - INTERVAL '8 days', get_user_tenant_id()),
        (task3_id, 'Définition personas', 'Créer les personas clients', 40, true, user3_id::text, CURRENT_DATE - INTERVAL '5 days', get_user_tenant_id()),
        (task3_id, 'Stratégie contenus', 'Planifier la stratégie de contenus', 30, false, user3_id::text, CURRENT_DATE + INTERVAL '10 days', get_user_tenant_id())
        ON CONFLICT DO NOTHING;
        
        -- Créer des commentaires de tâches
        INSERT INTO public.task_comments (task_id, content, comment_type, author_id, tenant_id) VALUES
        (task1_id, 'Excellent travail sur l''analyse ! Les insights sont très pertinents.', 'general', user1_id, get_user_tenant_id()),
        (task2_id, 'Les wireframes desktop sont validés. Il faut maintenant se concentrer sur le mobile.', 'general', user2_id, get_user_tenant_id()),
        (task3_id, 'L''analyse concurrentielle révèle des opportunités intéressantes dans le segment PME.', 'general', user3_id, get_user_tenant_id()),
        (task2_id, 'Prévoir une révision UX avec l''équipe design la semaine prochaine.', 'general', user1_id, get_user_tenant_id())
        ON CONFLICT DO NOTHING;
        
        -- Créer des données de congés avec les bons employee_id (user_id)
        INSERT INTO public.leave_requests (employee_id, absence_type_id, start_date, end_date, total_days, status, reason, tenant_id) VALUES
        (user1_id, (SELECT id FROM public.absence_types WHERE code = 'CP' LIMIT 1), CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '34 days', 5, 'pending', 'Vacances été', get_user_tenant_id()),
        (user2_id, (SELECT id FROM public.absence_types WHERE code = 'FORMATION' LIMIT 1), CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '17 days', 3, 'approved', 'Formation React Avancé', get_user_tenant_id()),
        (user3_id, (SELECT id FROM public.absence_types WHERE code = 'CP' LIMIT 1), CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE + INTERVAL '54 days', 8, 'pending', 'Vacances famille', get_user_tenant_id()),
        (user4_id, (SELECT id FROM public.absence_types WHERE code = 'RTT' LIMIT 1), CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '10 days', 1, 'approved', 'RTT', get_user_tenant_id())
        ON CONFLICT DO NOTHING;
        
        -- Créer des présences avec les bons employee_id (user_id)
        INSERT INTO public.attendances (employee_id, date, check_in, check_out, total_hours, status, tenant_id) VALUES
        (user1_id, CURRENT_DATE - INTERVAL '1 day', '09:00', '17:30', 7.5, 'present', get_user_tenant_id()),
        (user2_id, CURRENT_DATE - INTERVAL '1 day', '08:30', '17:00', 8, 'present', get_user_tenant_id()),
        (user3_id, CURRENT_DATE - INTERVAL '1 day', '09:15', '18:00', 8.25, 'present', get_user_tenant_id()),
        (user4_id, CURRENT_DATE - INTERVAL '1 day', '09:00', '17:00', 7.5, 'present', get_user_tenant_id()),
        (user5_id, CURRENT_DATE - INTERVAL '1 day', '08:45', '17:15', 7.5, 'present', get_user_tenant_id()),
        (user1_id, CURRENT_DATE - INTERVAL '2 days', '09:00', '17:30', 7.5, 'present', get_user_tenant_id()),
        (user2_id, CURRENT_DATE - INTERVAL '2 days', '08:30', '17:00', 8, 'present', get_user_tenant_id()),
        (user3_id, CURRENT_DATE - INTERVAL '2 days', '09:00', '17:30', 7.5, 'present', get_user_tenant_id())
        ON CONFLICT (employee_id, date) DO NOTHING;
        
        -- Créer des évaluations de compétences
        INSERT INTO public.skill_assessments (employee_id, skill_id, employee_name, position, department, current_level, target_level, assessor, tenant_id)
        SELECT 
            user2_id,
            s.id,
            'Jean Martin',
            'Développeur Senior',
            'Développement',
            4,
            5,
            'Marie Dupont',
            get_user_tenant_id()
        FROM public.skills s
        WHERE s.name IN ('JavaScript', 'React')
        ON CONFLICT DO NOTHING;
        
        INSERT INTO public.skill_assessments (employee_id, skill_id, employee_name, position, department, current_level, target_level, assessor, tenant_id)
        SELECT 
            user3_id,
            s.id,
            'Sophie Bernard',
            'Chef Marketing',
            'Marketing',
            CASE WHEN s.name = 'Marketing Digital' THEN 5 ELSE 4 END,
            5,
            'Marie Dupont',
            get_user_tenant_id()
        FROM public.skills s
        WHERE s.name IN ('Marketing Digital', 'Communication')
        ON CONFLICT DO NOTHING;
        
        INSERT INTO public.skill_assessments (employee_id, skill_id, employee_name, position, department, current_level, target_level, assessor, tenant_id)
        SELECT 
            user1_id,
            s.id,
            'Marie Dupont',
            'Directrice RH',
            'RH',
            5,
            5,
            'Auto-évaluation',
            get_user_tenant_id()
        FROM public.skills s
        WHERE s.name IN ('Management', 'Communication')
        ON CONFLICT DO NOTHING;
        
        -- Créer des rapports de frais
        INSERT INTO public.expense_reports (employee_id, employee_name, title, status, total_amount, submission_date, tenant_id) VALUES
        (user2_id, 'Jean Martin', 'Déplacement client Lyon', 'approved', 285.50, CURRENT_DATE - INTERVAL '10 days', get_user_tenant_id()),
        (user3_id, 'Sophie Bernard', 'Salon Marketing Digital 2024', 'pending', 450.30, CURRENT_DATE - INTERVAL '5 days', get_user_tenant_id()),
        (user1_id, 'Marie Dupont', 'Conférence RH Paris', 'approved', 320.80, CURRENT_DATE - INTERVAL '15 days', get_user_tenant_id())
        ON CONFLICT DO NOTHING;
        
        -- Créer des processus d'onboarding
        INSERT INTO public.onboarding_processes (employee_id, employee_name, position, department, start_date, status, progress, tenant_id) VALUES
        (user6_id, 'Antoine Dubois', 'Développeur Junior', 'Développement', CURRENT_DATE - INTERVAL '90 days', 'completed', 100, get_user_tenant_id()),
        (user7_id, 'Camille Rousseau', 'Assistant RH', 'RH', CURRENT_DATE - INTERVAL '60 days', 'completed', 100, get_user_tenant_id())
        ON CONFLICT DO NOTHING;
        
        -- Créer des évaluations
        INSERT INTO public.evaluations (employee_id, employee_name, evaluator_id, evaluator_name, type, period, status, overall_score, tenant_id) VALUES
        (user2_id, 'Jean Martin', user1_id, 'Marie Dupont', 'annual', '2023', 'completed', 4.2, get_user_tenant_id()),
        (user3_id, 'Sophie Bernard', user1_id, 'Marie Dupont', 'annual', '2023', 'completed', 4.5, get_user_tenant_id()),
        (user4_id, 'Pierre Moreau', user1_id, 'Marie Dupont', 'annual', '2023', 'completed', 4.0, get_user_tenant_id())
        ON CONFLICT DO NOTHING;
        
        -- Créer des objectifs
        INSERT INTO public.objectives (employee_id, employee_name, department, title, description, type, status, progress, due_date, tenant_id) VALUES
        (user2_id, 'Jean Martin', 'Développement', 'Maîtriser React 18', 'Apprendre les nouvelles fonctionnalités de React 18', 'development', 'active', 75, CURRENT_DATE + INTERVAL '90 days', get_user_tenant_id()),
        (user3_id, 'Sophie Bernard', 'Marketing', 'Augmenter le taux de conversion', 'Améliorer le taux de conversion du site web de 15%', 'performance', 'active', 60, CURRENT_DATE + INTERVAL '180 days', get_user_tenant_id()),
        (user6_id, 'Antoine Dubois', 'Développement', 'Certification JavaScript', 'Obtenir la certification JavaScript ES6+', 'development', 'active', 30, CURRENT_DATE + INTERVAL '120 days', get_user_tenant_id())
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Données de test créées pour tous les utilisateurs avec les user_id: %, %, %, %, %, %, %', user1_id, user2_id, user3_id, user4_id, user5_id, user6_id, user7_id;
    ELSE
        RAISE NOTICE 'Pas assez de profils avec user_id trouvés. Nombre trouvé: %', COALESCE(array_length(user_ids, 1), 0);
    END IF;
END;
$$;