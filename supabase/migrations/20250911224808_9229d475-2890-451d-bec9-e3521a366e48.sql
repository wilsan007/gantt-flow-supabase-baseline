-- Créer une vue pour calculer toutes les alertes en temps réel
CREATE OR REPLACE VIEW current_alerts_view AS

-- 1. OVERLOAD_90 - Surcharge critique ≥90%
SELECT 
  'overload-90-' || cp.employee_id as id,
  'OVERLOAD_90' as type,
  'OVERLOAD_90' as code,
  'Surcharge critique détectée' as title,
  e.full_name || ' a une utilisation critique de ' || cp.capacity_utilization || '% (≥90%)' as description,
  'critical' as severity,
  'capacity' as category,
  'employee' as entity_type,
  cp.employee_id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('utilization', cp.capacity_utilization, 'threshold', 90) as context_data,
  now() as triggered_at,
  cp.tenant_id
FROM capacity_planning cp
JOIN employees e ON cp.employee_id = e.id
WHERE cp.capacity_utilization >= 90
  AND cp.period_start >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

-- 2. WORKLOAD_HIGH - Surcharge de travail (>15 tâches)
SELECT 
  'workload-' || e.id as id,
  'WORKLOAD_HIGH' as type,
  'WORKLOAD_HIGH' as code,
  'Surcharge de travail détectée' as title,
  e.full_name || ' a ' || COALESCE(task_counts.task_count, 0) || ' tâches assignées' as description,
  CASE 
    WHEN COALESCE(task_counts.task_count, 0) > 25 THEN 'critical'
    WHEN COALESCE(task_counts.task_count, 0) > 20 THEN 'high'
    ELSE 'medium'
  END as severity,
  'capacity' as category,
  'employee' as entity_type,
  e.id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('taskCount', COALESCE(task_counts.task_count, 0), 'threshold', 15) as context_data,
  now() as triggered_at,
  e.tenant_id
FROM employees e
LEFT JOIN (
  SELECT assignee_id, COUNT(*) as task_count
  FROM tasks
  WHERE status != 'done'
  GROUP BY assignee_id
) task_counts ON e.id = task_counts.assignee_id
WHERE e.status = 'active' 
  AND COALESCE(task_counts.task_count, 0) > 15

UNION ALL

-- 3. HIGH_UTILIZATION_ABOVE_AVG - Utilisation élevée vs moyenne (+25%)
SELECT 
  'high-util-vs-avg-' || cp.employee_id as id,
  'HIGH_UTILIZATION_ABOVE_AVG' as type,
  'HIGH_UTILIZATION_ABOVE_AVG' as code,
  'Utilisation élevée vs moyenne' as title,
  e.full_name || ' a ' || cp.capacity_utilization || '% d''utilisation (+25% vs moyenne)' as description,
  'medium' as severity,
  'capacity' as category,
  'employee' as entity_type,
  cp.employee_id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('utilization', cp.capacity_utilization, 'threshold', 25) as context_data,
  now() as triggered_at,
  cp.tenant_id
FROM capacity_planning cp
JOIN employees e ON cp.employee_id = e.id
WHERE cp.capacity_utilization > (
  SELECT AVG(capacity_utilization) * 1.25 
  FROM capacity_planning 
  WHERE period_start >= CURRENT_DATE - INTERVAL '30 days'
    AND tenant_id = cp.tenant_id
) AND cp.capacity_utilization < 90
  AND cp.period_start >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

-- 4. UNDERUTILIZATION - Sous-utilisation <30%
SELECT 
  'underutilization-' || cp.employee_id as id,
  'UNDERUTILIZATION' as type,
  'UNDERUTILIZATION' as code,
  'Sous-utilisation détectée' as title,
  e.full_name || ' a une utilisation de ' || cp.capacity_utilization || '% (inférieure à 30%)' as description,
  'low' as severity,
  'capacity' as category,
  'employee' as entity_type,
  cp.employee_id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('utilization', cp.capacity_utilization, 'threshold', 30) as context_data,
  now() as triggered_at,
  cp.tenant_id
FROM capacity_planning cp
JOIN employees e ON cp.employee_id = e.id
WHERE cp.capacity_utilization < 30 
  AND cp.capacity_utilization > 0
  AND cp.period_start >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

-- 5. ABSENCE_PATTERN - Pattern d'absences anormal
SELECT 
  'absence-' || abs_data.employee_id as id,
  'ABSENCE_PATTERN' as type,
  'ABSENCE_PATTERN' as code,
  'Pattern d''absences anormal' as title,
  e.full_name || ' a ' || abs_data.total_days || ' jours d''absence en 30 jours' as description,
  CASE WHEN abs_data.total_days > 20 THEN 'high' ELSE 'medium' END as severity,
  'hr' as category,
  'employee' as entity_type,
  abs_data.employee_id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('totalDays', abs_data.total_days, 'absenceCount', abs_data.count) as context_data,
  now() as triggered_at,
  e.tenant_id
FROM (
  SELECT 
    employee_id, 
    SUM(total_days) as total_days,
    COUNT(*) as count
  FROM absences 
  WHERE start_date >= CURRENT_DATE - INTERVAL '30 days'
    AND status = 'approved'
  GROUP BY employee_id
  HAVING SUM(total_days) > 10 OR COUNT(*) > 5
) abs_data
JOIN employees e ON abs_data.employee_id = e.id

UNION ALL

-- 6. DEADLINE_RISK - Tâches en retard
SELECT 
  'late-task-' || t.id as id,
  'DEADLINE_RISK' as type,
  'DEADLINE_RISK' as code,
  'Tâche en retard' as title,
  '"' || t.title || '" est en retard de ' || (CURRENT_DATE - t.due_date) || ' jour(s)' as description,
  CASE 
    WHEN (CURRENT_DATE - t.due_date) > 14 THEN 'critical'
    WHEN (CURRENT_DATE - t.due_date) > 7 THEN 'high'
    ELSE 'medium'
  END as severity,
  'project' as category,
  'task' as entity_type,
  t.id as entity_id,
  t.title as entity_name,
  jsonb_build_object('daysLate', (CURRENT_DATE - t.due_date), 'dueDate', t.due_date) as context_data,
  now() as triggered_at,
  t.tenant_id
FROM tasks t
WHERE t.due_date < CURRENT_DATE
  AND t.status != 'done'
  AND t.parent_id IS NULL

UNION ALL

-- 7. PERFORMANCE_DROP - Tâches bloquées
SELECT 
  'stuck-task-' || t.id as id,
  'PERFORMANCE_DROP' as type,
  'PERFORMANCE_DROP' as code,
  'Tâche bloquée' as title,
  '"' || t.title || '" (' || COALESCE(t.progress, 0) || '%) n''a pas progressé depuis ' || 
  (CURRENT_DATE - t.updated_at::date) || ' jours' as description,
  CASE WHEN (CURRENT_DATE - t.updated_at::date) > 14 THEN 'high' ELSE 'medium' END as severity,
  'performance' as category,
  'task' as entity_type,
  t.id as entity_id,
  t.title as entity_name,
  jsonb_build_object('daysSinceUpdate', (CURRENT_DATE - t.updated_at::date), 'progress', t.progress) as context_data,
  now() as triggered_at,
  t.tenant_id
FROM tasks t
WHERE t.status = 'doing'
  AND t.updated_at < CURRENT_DATE - INTERVAL '7 days'
  AND COALESCE(t.progress, 0) < 50

UNION ALL

-- 8. UNUSED_LEAVE - Congés non utilisés
SELECT 
  'unused-leave-' || lb.employee_id || '-' || lb.absence_type_id as id,
  'UNUSED_LEAVE' as type,
  'UNUSED_LEAVE' as code,
  'Congés non utilisés' as title,
  e.full_name || ' a encore ' || lb.remaining_days || ' jours de ' || at.name as description,
  CASE WHEN lb.remaining_days > 30 THEN 'medium' ELSE 'low' END as severity,
  'hr' as category,
  'employee' as entity_type,
  lb.employee_id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('remainingDays', lb.remaining_days, 'leaveType', at.name) as context_data,
  now() as triggered_at,
  lb.tenant_id
FROM leave_balances lb
JOIN employees e ON lb.employee_id = e.id
JOIN absence_types at ON lb.absence_type_id = at.id
WHERE lb.year = EXTRACT(year FROM CURRENT_DATE)
  AND lb.remaining_days > 20

UNION ALL

-- 9. NO_EVALUATION - Pas d'évaluation depuis 12 mois
SELECT 
  'no-evaluation-' || e.id as id,
  'NO_EVALUATION' as type,
  'NO_EVALUATION' as code,
  'Évaluation en retard' as title,
  e.full_name || ' n''a pas eu d''évaluation depuis plus de 12 mois' as description,
  'medium' as severity,
  'performance' as category,
  'employee' as entity_type,
  e.id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('monthsSinceEvaluation', 12) as context_data,
  now() as triggered_at,
  e.tenant_id
FROM employees e
WHERE e.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM evaluations ev 
    WHERE ev.employee_id = e.id 
      AND ev.created_at >= CURRENT_DATE - INTERVAL '12 months'
  )

UNION ALL

-- 10. VACATION_OVERDUE - Congés en retard
SELECT 
  'vacation-overdue-' || lb.employee_id as id,
  'VACATION_OVERDUE' as type,
  'VACATION_OVERDUE' as code,
  'Congés en retard' as title,
  e.full_name || ' n''a pas pris ' || lb.remaining_days || ' jours de congés' as description,
  'low' as severity,
  'hr' as category,
  'employee' as entity_type,
  lb.employee_id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('remainingDays', lb.remaining_days, 'threshold', 180) as context_data,
  now() as triggered_at,
  lb.tenant_id
FROM leave_balances lb
JOIN employees e ON lb.employee_id = e.id
JOIN absence_types at ON lb.absence_type_id = at.id
WHERE lb.year = EXTRACT(year FROM CURRENT_DATE)
  AND lb.remaining_days > 25

UNION ALL

-- 11. SUCCESSION_RISK - Risque de succession (managers sans remplaçants)
SELECT 
  'succession-risk-' || e.id as id,
  'SUCCESSION_RISK' as type,
  'SUCCESSION_RISK' as code,
  'Risque de succession élevé' as title,
  e.full_name || ' (manager) n''a pas de remplaçant identifié' as description,
  'critical' as severity,
  'hr' as category,
  'employee' as entity_type,
  e.id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('role', 'manager', 'hasSuccessor', false) as context_data,
  now() as triggered_at,
  e.tenant_id
FROM employees e
WHERE e.status = 'active'
  AND e.id IN (SELECT DISTINCT manager_id FROM employees WHERE manager_id IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM employees e2 
    WHERE e2.manager_id = e.id 
      AND e2.job_title LIKE '%senior%' 
      AND e2.status = 'active'
  )

UNION ALL

-- 12. DOCUMENT_MISSING - Documents employés manquants
SELECT 
  'document-missing-' || e.id as id,
  'DOCUMENT_MISSING' as type,
  'DOCUMENT_MISSING' as code,
  'Documents manquants' as title,
  e.full_name || ' n''a pas de documents requis dans son dossier' as description,
  'critical' as severity,
  'compliance' as category,
  'employee' as entity_type,
  e.id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('missingDocs', true) as context_data,
  now() as triggered_at,
  e.tenant_id
FROM employees e
WHERE e.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM employee_documents ed 
    WHERE ed.employee_id = e.id 
      AND ed.document_type IN ('contract', 'id_card')
  )

UNION ALL

-- 13. SALARY_BUDGET_EXCEEDED - Budget salaire dépassé
SELECT 
  'salary-budget-' || d.id as id,
  'SALARY_BUDGET_EXCEEDED' as type,
  'SALARY_BUDGET_EXCEEDED' as code,
  'Budget salaire dépassé' as title,
  'Le département ' || d.name || ' dépasse son budget salaire' as description,
  'critical' as severity,
  'budget' as category,
  'department' as entity_type,
  d.id as entity_id,
  d.name as entity_name,
  jsonb_build_object('budgetUsed', salary_data.total_salary, 'budget', d.budget) as context_data,
  now() as triggered_at,
  d.tenant_id
FROM departments d
JOIN (
  SELECT department_id, SUM(salary) as total_salary
  FROM employees 
  WHERE status = 'active' AND salary IS NOT NULL
  GROUP BY department_id
) salary_data ON d.id = salary_data.department_id
WHERE d.budget IS NOT NULL 
  AND salary_data.total_salary > d.budget

UNION ALL

-- 14. ABSENCE_SPIKE - Pic d'absences (+50% vs mois précédent)
SELECT 
  'absence-spike-' || dept_abs.department_id as id,
  'ABSENCE_SPIKE' as type,
  'ABSENCE_SPIKE' as code,
  'Pic d''absences détecté' as title,
  'Augmentation de ' || ROUND((dept_abs.current_month::numeric / GREATEST(dept_abs.previous_month, 1) - 1) * 100) || 
  '% des absences ce mois vs le précédent' as description,
  'medium' as severity,
  'hr' as category,
  'department' as entity_type,
  dept_abs.department_id as entity_id,
  d.name as entity_name,
  jsonb_build_object('currentMonth', dept_abs.current_month, 'previousMonth', dept_abs.previous_month) as context_data,
  now() as triggered_at,
  d.tenant_id
FROM (
  SELECT 
    e.department_id,
    COUNT(CASE WHEN a.start_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as current_month,
    COUNT(CASE WHEN a.start_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
               AND a.start_date < DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as previous_month
  FROM absences a
  JOIN employees e ON a.employee_id = e.id
  WHERE a.start_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  GROUP BY e.department_id
) dept_abs
JOIN departments d ON dept_abs.department_id = d.id
WHERE dept_abs.previous_month > 0 
  AND dept_abs.current_month::numeric / dept_abs.previous_month >= 1.5

UNION ALL

-- 15. CAPACITY_MISMATCH - Décalage capacité >20%
SELECT 
  'capacity-mismatch-' || cp.employee_id as id,
  'CAPACITY_MISMATCH' as type,
  'CAPACITY_MISMATCH' as code,
  'Décalage de capacité' as title,
  e.full_name || ' a un décalage entre capacité allouée et disponible' as description,
  'medium' as severity,
  'capacity' as category,
  'employee' as entity_type,
  cp.employee_id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('allocated', cp.allocated_hours, 'available', cp.available_hours) as context_data,
  now() as triggered_at,
  cp.tenant_id
FROM capacity_planning cp
JOIN employees e ON cp.employee_id = e.id
WHERE cp.available_hours > 0
  AND ABS(cp.allocated_hours - cp.available_hours)::numeric / cp.available_hours > 0.2
  AND cp.period_start >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

-- 16. OBJECTIVES_OVERDUE - >50% objectifs en retard
SELECT 
  'objectives-overdue-' || obj_data.employee_id as id,
  'OBJECTIVES_OVERDUE' as type,
  'OBJECTIVES_OVERDUE' as code,
  'Objectifs en retard' as title,
  e.full_name || ' a ' || obj_data.overdue_count || ' objectifs en retard sur ' || obj_data.total_count as description,
  'medium' as severity,
  'performance' as category,
  'employee' as entity_type,
  obj_data.employee_id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('overdueCount', obj_data.overdue_count, 'totalCount', obj_data.total_count) as context_data,
  now() as triggered_at,
  e.tenant_id
FROM (
  SELECT 
    employee_id,
    COUNT(*) as total_count,
    COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as overdue_count
  FROM objectives
  WHERE status IN ('draft', 'active', 'in_progress')
  GROUP BY employee_id
  HAVING COUNT(*) > 0 
    AND COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END)::numeric / COUNT(*) > 0.5
) obj_data
JOIN employees e ON obj_data.employee_id = e.id

UNION ALL

-- 17. LEAVE_BALANCE_LOW - Solde congés bas <5 jours
SELECT 
  'leave-balance-low-' || lb.employee_id as id,
  'LEAVE_BALANCE_LOW' as type,
  'LEAVE_BALANCE_LOW' as code,
  'Solde de congés bas' as title,
  e.full_name || ' n''a plus que ' || lb.remaining_days || ' jours de ' || at.name as description,
  'low' as severity,
  'hr' as category,
  'employee' as entity_type,
  lb.employee_id as entity_id,
  e.full_name as entity_name,
  jsonb_build_object('remainingDays', lb.remaining_days, 'leaveType', at.name) as context_data,
  now() as triggered_at,
  lb.tenant_id
FROM leave_balances lb
JOIN employees e ON lb.employee_id = e.id
JOIN absence_types at ON lb.absence_type_id = at.id
WHERE lb.year = EXTRACT(year FROM CURRENT_DATE)
  AND lb.remaining_days < 5
  AND lb.remaining_days > 0;