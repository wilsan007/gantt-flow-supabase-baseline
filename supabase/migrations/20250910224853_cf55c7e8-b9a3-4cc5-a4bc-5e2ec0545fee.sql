-- Add only missing sample data for advanced HR features

-- Sample employee insights (AI analysis) - only if not already present
INSERT INTO public.employee_insights (employee_id, insight_type, risk_level, score, description, recommendations, data_sources, is_active) VALUES
('54aa6b55-d898-4e14-a337-2ee4477e55db', 'attrition_risk', 'medium', 65, 'Augmentation des absences et baisse légère de performance détectées', 'Programmer un entretien individuel, proposer formation ou aménagement', '{"absences": true, "performance": true, "workload": false}'::jsonb, true),
('dbf36b51-76ec-474c-981c-be9f4f8e1fb8', 'performance_trend', 'low', 85, 'Tendance positive, objectifs atteints régulièrement', 'Maintenir l''engagement, proposer évolution de carrière', '{"objectives": true, "evaluations": true}'::jsonb, true),
('8e8263b2-1040-4f6d-bc82-5b634323759e', 'workload_analysis', 'high', 45, 'Surcharge détectée, risque de burnout', 'Redistribuer certaines tâches, planning plus flexible', '{"timesheet": true, "projects": true, "overtime": true}'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Sample capacity planning data - only if not already present
INSERT INTO public.capacity_planning (employee_id, period_start, period_end, allocated_hours, available_hours, project_hours, absence_hours, capacity_utilization) VALUES
('54aa6b55-d898-4e14-a337-2ee4477e55db', '2024-02-01', '2024-02-29', 160, 140, 135, 20, 85.0),
('dbf36b51-76ec-474c-981c-be9f4f8e1fb8', '2024-02-01', '2024-02-29', 160, 160, 150, 0, 93.75),
('8e8263b2-1040-4f6d-bc82-5b634323759e', '2024-02-01', '2024-02-29', 160, 145, 165, 15, 113.79),
('89624fb2-b86f-47f1-8f32-d2e89c1bcec1', '2024-02-01', '2024-02-29', 160, 155, 140, 5, 90.32)
ON CONFLICT DO NOTHING;

-- Sample HR analytics/KPIs - only if not already present
INSERT INTO public.hr_analytics (metric_name, metric_value, metric_type, period_start, period_end, metadata) VALUES
('headcount', 45, 'count', '2024-02-01', '2024-02-29', '{"department": "all"}'::jsonb),
('turnover_rate', 12.5, 'percentage', '2024-01-01', '2024-12-31', '{"annualized": true}'::jsonb),
('average_recruitment_time', 28, 'days', '2024-02-01', '2024-02-29', '{"positions_filled": 3}'::jsonb),
('absenteeism_rate', 3.2, 'percentage', '2024-02-01', '2024-02-29', '{"sick_leave_included": true}'::jsonb),
('capacity_utilization', 92, 'percentage', '2024-02-01', '2024-02-29', '{"all_departments": true}'::jsonb),
('performance_avg', 4.2, 'score', '2024-01-01', '2024-02-29', '{"scale": "1-5", "evaluations_count": 25}'::jsonb),
('approval_time_leaves', 2.1, 'days', '2024-02-01', '2024-02-29', '{"average_processing_time": true}'::jsonb),
('approval_time_expenses', 1.8, 'days', '2024-02-01', '2024-02-29', '{"average_processing_time": true}'::jsonb),
('onboarding_completion_time', 5.2, 'days', '2024-02-01', '2024-02-29', '{"new_hires": 2}'::jsonb)
ON CONFLICT DO NOTHING;