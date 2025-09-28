-- Drop the existing view
DROP VIEW IF EXISTS public.current_alerts_view;

-- Function to get overload alerts
CREATE OR REPLACE FUNCTION get_overload_alerts(p_tenant_id UUID)
RETURNS TABLE(alert JSON) AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'id', 'overload-90-' || cp.employee_id,
    'type', 'OVERLOAD_90',
    'code', 'OVERLOAD_90',
    'title', 'Surcharge critique détectée',
    'description', e.full_name || ' a une utilisation critique de ' || cp.capacity_utilization || '% (≥90%)',
    'severity', 'critical',
    'category', 'capacity',
    'entity_type', 'employee',
    'entity_id', cp.employee_id,
    'entity_name', e.full_name,
    'context_data', jsonb_build_object('utilization', cp.capacity_utilization, 'threshold', 90),
    'triggered_at', now(),
    'tenant_id', cp.tenant_id,
    'application_domain', 'hr'
  )
  FROM public.capacity_planning cp
  JOIN public.employees e ON cp.employee_id = e.id
  WHERE cp.capacity_utilization >= 90 AND cp.period_start >= (CURRENT_DATE - '30 days'::interval)
  AND cp.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get high workload alerts
CREATE OR REPLACE FUNCTION get_workload_high_alerts(p_tenant_id UUID)
RETURNS TABLE(alert JSON) AS $$
BEGIN
  RETURN QUERY
  WITH task_counts AS (
    SELECT
      tasks.assignee_id,
      count(*) AS task_count
    FROM public.tasks
    WHERE tasks.status <> 'done'::text AND tasks.tenant_id = p_tenant_id
    GROUP BY tasks.assignee_id
  )
  SELECT json_build_object(
    'id', 'workload-' || e.id,
    'type', 'WORKLOAD_HIGH',
    'code', 'WORKLOAD_HIGH',
    'title', 'Surcharge de travail détectée',
    'description', e.full_name || ' a ' || COALESCE(tc.task_count, 0) || ' tâches assignées',
    'severity', CASE
        WHEN COALESCE(tc.task_count, 0) > 25 THEN 'critical'
        WHEN COALESCE(tc.task_count, 0) > 20 THEN 'high'
        ELSE 'medium'
    END,
    'category', 'capacity',
    'entity_type', 'employee',
    'entity_id', e.id,
    'entity_name', e.full_name,
    'context_data', jsonb_build_object('taskCount', COALESCE(tc.task_count, 0), 'threshold', 15),
    'triggered_at', now(),
    'tenant_id', e.tenant_id,
    'application_domain', 'hr'
  )
  FROM public.employees e
  LEFT JOIN task_counts tc ON e.id = tc.assignee_id
  WHERE e.status = 'active'::text
  AND COALESCE(tc.task_count, 0) > 15
  AND e.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get deadline risk alerts
CREATE OR REPLACE FUNCTION get_deadline_risk_alerts(p_tenant_id UUID)
RETURNS TABLE(alert JSON) AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'id', 'late-task-' || t.id,
    'type', 'DEADLINE_RISK',
    'code', 'DEADLINE_RISK',
    'title', 'Tâche en retard',
    'description', '"' || t.title || '" est en retard de ' || (CURRENT_DATE - t.due_date) || ' jour(s)',
    'severity', CASE
        WHEN (CURRENT_DATE - t.due_date) > 14 THEN 'critical'
        WHEN (CURRENT_DATE - t.due_date) > 7 THEN 'high'
        ELSE 'medium'
    END,
    'category', 'project',
    'entity_type', 'task',
    'entity_id', t.id,
    'entity_name', t.title,
    'context_data', jsonb_build_object('daysLate', (CURRENT_DATE - t.due_date), 'dueDate', t.due_date),
    'triggered_at', now(),
    'tenant_id', t.tenant_id,
    'application_domain', 'project'
  )
  FROM public.tasks t
  WHERE t.due_date < CURRENT_DATE
  AND t.status <> 'done'::text
  AND t.parent_id IS NULL
  AND t.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get performance drop alerts (stuck tasks)
CREATE OR REPLACE FUNCTION get_performance_drop_alerts(p_tenant_id UUID)
RETURNS TABLE(alert JSON) AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'id', 'stuck-task-' || t.id,
    'type', 'PERFORMANCE_DROP',
    'code', 'PERFORMANCE_DROP',
    'title', 'Tâche bloquée',
    'description', '"' || t.title || '" (' || COALESCE(t.progress, 0) || '%) n''a pas progressé depuis ' || (CURRENT_DATE - (t.updated_at)::date) || ' jours',
    'severity', CASE
        WHEN (CURRENT_DATE - (t.updated_at)::date) > 14 THEN 'high'
        ELSE 'medium'
    END,
    'category', 'performance',
    'entity_type', 'task',
    'entity_id', t.id,
    'entity_name', t.title,
    'context_data', jsonb_build_object('daysSinceUpdate', (CURRENT_DATE - (t.updated_at)::date), 'progress', t.progress),
    'triggered_at', now(),
    'tenant_id', t.tenant_id,
    'application_domain', 'project'
  )
  FROM public.tasks t
  WHERE t.status = 'doing'::text
  AND t.updated_at < (CURRENT_DATE - '7 days'::interval)
  AND COALESCE(t.progress, 0) < 50
  AND t.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Main function to aggregate all alerts
CREATE OR REPLACE FUNCTION get_all_alerts(p_tenant_id UUID)
RETURNS TABLE(alert JSON) AS $$
BEGIN
  RETURN QUERY
  SELECT get_overload_alerts.alert FROM get_overload_alerts(p_tenant_id)
  UNION ALL
  SELECT get_workload_high_alerts.alert FROM get_workload_high_alerts(p_tenant_id)
  UNION ALL
  SELECT get_deadline_risk_alerts.alert FROM get_deadline_risk_alerts(p_tenant_id)
  UNION ALL
  SELECT get_performance_drop_alerts.alert FROM get_performance_drop_alerts(p_tenant_id);
END;
$$ LANGUAGE plpgsql;