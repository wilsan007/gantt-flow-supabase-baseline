CREATE OR REPLACE FUNCTION "public"."generate_next_employee_id"("p_tenant_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  max_number INTEGER := 0;
  next_number INTEGER;
  candidate_id TEXT;
BEGIN
  -- Find the maximum existing number for this tenant
  SELECT COALESCE(
    MAX(
      CASE
        WHEN employee_id ~ '^EMP[0-9]{3}$'
        THEN CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)
        ELSE 0
      END
    ), 0
  ) INTO max_number
  FROM public.employees
  WHERE tenant_id = p_tenant_id;

  -- Start from the maximum + 1
  next_number := max_number + 1;

  -- Loop to ensure uniqueness (rarely needed, but safe)
  LOOP
    candidate_id := 'EMP' || LPAD(next_number::TEXT, 3, '0');

    -- Check if this ID already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.employees
      WHERE tenant_id = p_tenant_id
      AND employee_id = candidate_id
    ) THEN
      RETURN candidate_id;
    END IF;

    -- If the ID exists, try the next one
    next_number := next_number + 1;

    -- Safety break to prevent infinite loops
    IF next_number > 9999 THEN
      RAISE EXCEPTION 'Employee ID limit reached for tenant %', p_tenant_id;
    END IF;
  END LOOP;
END;
$_$;