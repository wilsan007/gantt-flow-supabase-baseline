-- Add sample data for advanced HR features

-- Sample country policies
INSERT INTO public.country_policies (country_code, country_name, currency, language, working_hours_per_week, public_holidays, leave_policies, tax_rates, compliance_rules) VALUES
('FR', 'France', 'EUR', 'fr', 35, 
 '{"new_year": "2024-01-01", "easter": "2024-03-31", "labour_day": "2024-05-01", "victory_day": "2024-05-08", "ascension": "2024-05-09", "whit_monday": "2024-05-20", "bastille_day": "2024-07-14", "assumption": "2024-08-15", "all_saints": "2024-11-01", "armistice": "2024-11-11", "christmas": "2024-12-25"}'::jsonb,
 '{"annual_leave": 25, "sick_leave": 90, "maternity_leave": 112, "paternity_leave": 28}'::jsonb,
 '{"income_tax": {"brackets": [{"rate": 0, "threshold": 0}, {"rate": 11, "threshold": 10777}, {"rate": 30, "threshold": 27478}]}, "social_charges": 22}'::jsonb,
 'Code du travail français, conventions collectives applicables'),
('DE', 'Allemagne', 'EUR', 'de', 40,
 '{"new_year": "2024-01-01", "good_friday": "2024-03-29", "easter_monday": "2024-04-01", "labour_day": "2024-05-01", "ascension": "2024-05-09", "whit_monday": "2024-05-20", "german_unity": "2024-10-03", "christmas": "2024-12-25", "boxing_day": "2024-12-26"}'::jsonb,
 '{"annual_leave": 24, "sick_leave": 78, "maternity_leave": 98, "paternity_leave": 14}'::jsonb,
 '{"income_tax": {"brackets": [{"rate": 0, "threshold": 0}, {"rate": 14, "threshold": 9984}, {"rate": 42, "threshold": 58596}]}, "social_charges": 20}'::jsonb,
 'Arbeitsrecht Deutschland, Tarifverträge');

-- Sample job posts
INSERT INTO public.job_posts (title, description, requirements, status, salary_min, salary_max, location, employment_type, posted_date, closing_date) VALUES
('Développeur Full Stack Senior', 
 'Nous recherchons un développeur expérimenté pour rejoindre notre équipe technique. Vous travaillerez sur des projets innovants utilisant React, Node.js et TypeScript.',
 'Minimum 5 ans d''expérience en développement web, maîtrise de React, Node.js, TypeScript, MongoDB. Connaissance des méthodologies Agile appréciée.',
 'active', 45000, 65000, 'Paris, France', 'full_time', '2024-01-15', '2024-02-15'),
('Chef de Projet Marketing Digital', 
 'Poste de Chef de Projet pour piloter nos campagnes marketing digital et coordonner les équipes créatives.',
 'Minimum 3 ans d''expérience en marketing digital, maîtrise des outils Google Analytics, AdWords, réseaux sociaux. Formation supérieure en marketing.',
 'active', 40000, 55000, 'Lyon, France', 'full_time', '2024-01-20', '2024-02-20'),
('Analyste Financier Junior', 
 'Rejoignez notre équipe finance pour participer à l''analyse financière et au reporting de l''entreprise.',
 'Formation finance/comptabilité, maîtrise d''Excel, connaissances SAP appréciées. Première expérience souhaitée.',
 'draft', 32000, 38000, 'Remote', 'full_time', NULL, '2024-03-01');

-- Sample candidates
INSERT INTO public.candidates (first_name, last_name, email, phone, linkedin_url, status, source) VALUES
('Thomas', 'Dupont', 'thomas.dupont@email.com', '+33123456789', 'https://linkedin.com/in/thomas-dupont', 'applied', 'LinkedIn'),
('Sarah', 'Martin', 'sarah.martin@email.com', '+33198765432', 'https://linkedin.com/in/sarah-martin', 'screening', 'Site web'),
('Kevin', 'Bernard', 'kevin.bernard@email.com', '+33145678912', NULL, 'interview', 'Cooptation'),
('Emma', 'Rousseau', 'emma.rousseau@email.com', '+33167891234', 'https://linkedin.com/in/emma-rousseau', 'offer', 'Cabinet recrutement');

-- Sample job applications (linking candidates to job posts)
INSERT INTO public.job_applications (job_post_id, candidate_id, status, stage, score, notes) VALUES
((SELECT id FROM job_posts WHERE title = 'Développeur Full Stack Senior' LIMIT 1), 
 (SELECT id FROM candidates WHERE email = 'thomas.dupont@email.com' LIMIT 1), 
 'active', 'technical_test', 8, 'Candidat prometteur, bonnes compétences techniques'),
((SELECT id FROM job_posts WHERE title = 'Chef de Projet Marketing Digital' LIMIT 1), 
 (SELECT id FROM candidates WHERE email = 'sarah.martin@email.com' LIMIT 1), 
 'active', 'interview', 7, 'Profil intéressant, expérience pertinente'),
((SELECT id FROM job_posts WHERE title = 'Développeur Full Stack Senior' LIMIT 1), 
 (SELECT id FROM candidates WHERE email = 'kevin.bernard@email.com' LIMIT 1), 
 'active', 'final_interview', 9, 'Excellent candidat, forte recommandation'),
((SELECT id FROM job_posts WHERE title = 'Analyste Financier Junior' LIMIT 1), 
 (SELECT id FROM candidates WHERE email = 'emma.rousseau@email.com' LIMIT 1), 
 'active', 'offer_made', 8, 'Profil junior mais très motivé');

-- Sample interviews
INSERT INTO public.interviews (application_id, interviewer_name, scheduled_date, scheduled_time, duration_minutes, type, status, feedback, score, recommendation) VALUES
((SELECT id FROM job_applications ja JOIN candidates c ON ja.candidate_id = c.id WHERE c.email = 'thomas.dupont@email.com' LIMIT 1), 
 'Jean Martin', '2024-02-01', '14:00', 60, 'technical', 'completed', 'Bonnes compétences techniques, à confirmer en situation', 8, 'Passer à l''étape suivante'),
((SELECT id FROM job_applications ja JOIN candidates c ON ja.candidate_id = c.id WHERE c.email = 'sarah.martin@email.com' LIMIT 1), 
 'Sophie Bernard', '2024-02-05', '10:30', 45, 'behavioral', 'completed', 'Excellente communication, esprit d''équipe', 9, 'Candidat à retenir'),
((SELECT id FROM job_applications ja JOIN candidates c ON ja.candidate_id = c.id WHERE c.email = 'kevin.bernard@email.com' LIMIT 1), 
 'Pierre Moreau', '2024-02-10', '16:00', 90, 'technical', 'scheduled', NULL, NULL, NULL);

-- Sample job offers
INSERT INTO public.job_offers (application_id, salary_offered, benefits, start_date, offer_date, expiry_date, status, terms_conditions) VALUES
((SELECT id FROM job_applications ja JOIN candidates c ON ja.candidate_id = c.id WHERE c.email = 'emma.rousseau@email.com' LIMIT 1), 
 36000, 'Tickets restaurant, mutuelle, télétravail 2j/semaine', '2024-03-01', '2024-02-15', '2024-02-29', 'sent', 'CDD 18 mois avec possibilité de CDI, période d''essai 3 mois');

-- Sample employee insights (AI analysis)
INSERT INTO public.employee_insights (employee_id, insight_type, risk_level, score, description, recommendations, data_sources, is_active) VALUES
('54aa6b55-d898-4e14-a337-2ee4477e55db', 'attrition_risk', 'medium', 65, 'Augmentation des absences et baisse légère de performance détectées', 'Programmer un entretien individuel, proposer formation ou aménagement', '{"absences": true, "performance": true, "workload": false}'::jsonb, true),
('dbf36b51-76ec-474c-981c-be9f4f8e1fb8', 'performance_trend', 'low', 85, 'Tendance positive, objectifs atteints régulièrement', 'Maintenir l''engagement, proposer évolution de carrière', '{"objectives": true, "evaluations": true}'::jsonb, true),
('8e8263b2-1040-4f6d-bc82-5b634323759e', 'workload_analysis', 'high', 45, 'Surcharge détectée, risque de burnout', 'Redistribuer certaines tâches, planning plus flexible', '{"timesheet": true, "projects": true, "overtime": true}'::jsonb, true);

-- Sample capacity planning data
INSERT INTO public.capacity_planning (employee_id, period_start, period_end, allocated_hours, available_hours, project_hours, absence_hours, capacity_utilization) VALUES
('54aa6b55-d898-4e14-a337-2ee4477e55db', '2024-02-01', '2024-02-29', 160, 140, 135, 20, 85.0),
('dbf36b51-76ec-474c-981c-be9f4f8e1fb8', '2024-02-01', '2024-02-29', 160, 160, 150, 0, 93.75),
('8e8263b2-1040-4f6d-bc82-5b634323759e', '2024-02-01', '2024-02-29', 160, 145, 165, 15, 113.79),
('89624fb2-b86f-47f1-8f32-d2e89c1bcec1', '2024-02-01', '2024-02-29', 160, 155, 140, 5, 90.32);

-- Sample HR analytics/KPIs
INSERT INTO public.hr_analytics (metric_name, metric_value, metric_type, period_start, period_end, metadata) VALUES
('headcount', 45, 'count', '2024-02-01', '2024-02-29', '{"department": "all"}'::jsonb),
('turnover_rate', 12.5, 'percentage', '2024-01-01', '2024-12-31', '{"annualized": true}'::jsonb),
('average_recruitment_time', 28, 'days', '2024-02-01', '2024-02-29', '{"positions_filled": 3}'::jsonb),
('absenteeism_rate', 3.2, 'percentage', '2024-02-01', '2024-02-29', '{"sick_leave_included": true}'::jsonb),
('capacity_utilization', 92, 'percentage', '2024-02-01', '2024-02-29', '{"all_departments": true}'::jsonb),
('performance_avg', 4.2, 'score', '2024-01-01', '2024-02-29', '{"scale": "1-5", "evaluations_count": 25}'::jsonb),
('approval_time_leaves', 2.1, 'days', '2024-02-01', '2024-02-29', '{"average_processing_time": true}'::jsonb),
('approval_time_expenses', 1.8, 'days', '2024-02-01', '2024-02-29', '{"average_processing_time": true}'::jsonb),
('onboarding_completion_time', 5.2, 'days', '2024-02-01', '2024-02-29', '{"new_hires": 2}'::jsonb);