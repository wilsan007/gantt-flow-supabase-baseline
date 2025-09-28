import pg from 'pg';

// WARNING: This is a security risk. Do not hardcode credentials in production.
// This is for a temporary, one-off migration script.
const connectionString = "postgresql://postgres:bykg4k993NDF1!@db.qliinxtanjdnwxlvnxji.supabase.co:5432/postgres";

const sqlCommands = [
  // From 05_create_generate_next_employee_id_function.sql
  `CREATE OR REPLACE FUNCTION "public"."generate_next_employee_id"("p_tenant_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  max_number INTEGER := 0;
  next_number INTEGER;
  candidate_id TEXT;
BEGIN
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

  next_number := max_number + 1;

  LOOP
    candidate_id := 'EMP' || LPAD(next_number::TEXT, 3, '0');
    IF NOT EXISTS (
      SELECT 1 FROM public.employees
      WHERE tenant_id = p_tenant_id
      AND employee_id = candidate_id
    ) THEN
      RETURN candidate_id;
    END IF;

    next_number := next_number + 1;

    IF next_number > 9999 THEN
      RAISE EXCEPTION 'Employee ID limit reached for tenant %', p_tenant_id;
    END IF;
  END LOOP;
END;
$_$;`,

  // From 06_refactor_tenant_creation_flow.sql
  `CREATE OR REPLACE FUNCTION public.create_tenant_owner_from_invitation(
    p_invitation_token TEXT,
    p_user_id UUID,
    p_company_name TEXT,
    p_company_slug TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  created_tenant_id UUID;
  generated_employee_id TEXT;
  result JSON;
BEGIN
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE token = p_invitation_token
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Token d''invitation invalide ou expiré');
  END IF;

  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';

  IF tenant_admin_role_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Rôle tenant_admin non trouvé');
  END IF;

  created_tenant_id := invitation_data.tenant_id;

  INSERT INTO public.tenants (id, name, slug, status, created_at, updated_at)
  VALUES (created_tenant_id, p_company_name, p_company_slug, 'active', now(), now());

  INSERT INTO public.profiles (user_id, tenant_id, full_name, email, role, created_at, updated_at)
  VALUES (p_user_id, created_tenant_id, invitation_data.full_name, invitation_data.email, 'tenant_admin', now(), now());

  INSERT INTO public.user_roles (user_id, role_id, tenant_id, is_active, created_at)
  VALUES (p_user_id, tenant_admin_role_id, created_tenant_id, true, now());

  generated_employee_id := generate_next_employee_id(created_tenant_id);

  INSERT INTO public.employees (user_id, employee_id, full_name, email, job_title, hire_date, contract_type, status, tenant_id, created_at, updated_at)
  VALUES (p_user_id, generated_employee_id, invitation_data.full_name, invitation_data.email, 'Directeur Général', CURRENT_DATE, 'CDI', 'active', created_tenant_id, now(), now());

  UPDATE public.invitations
  SET
    status = 'accepted',
    accepted_at = now(),
    metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{completed_by}', to_jsonb(p_user_id))
  WHERE id = invitation_data.id;

  result := json_build_object(
    'success', true,
    'tenant_id', created_tenant_id,
    'tenant_name', p_company_name,
    'user_id', p_user_id,
    'employee_id', generated_employee_id
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error during tenant owner creation: %', SQLERRM;
    RETURN json_build_object('success', false, 'error', 'Erreur lors de la création du tenant: ' || SQLERRM);
END;
$$;`
];

async function applyMigrations() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to the database.");

    for (const command of sqlCommands) {
      console.log("Executing command...");
      await client.query(command);
      console.log("Command executed successfully.");
    }

    console.log("All migrations applied successfully.");
  } catch (err) {
    console.error("Error applying migrations:", err);
  } finally {
    await client.end();
    console.log("Disconnected from the database.");
  }
}

applyMigrations();