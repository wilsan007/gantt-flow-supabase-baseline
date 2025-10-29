-- FONCTION SQL ONBOARD_TENANT_OWNER
-- Basée sur votre baseline existant
-- À exécuter dans Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION public.onboard_tenant_owner(
  p_user_id uuid,
  p_email text,
  p_slug text,
  p_tenant_name text,
  p_invite_code uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_role_id uuid;
  v_employee_id_counter integer;
  v_employee_id text;
BEGIN
  -- 1) Valider l'invitation
  PERFORM 1
  FROM public.invitations
  WHERE id = p_invite_code  -- Votre table utilise 'id' comme code
    AND lower(email) = lower(p_email)
    AND accepted_at IS NULL  -- Votre table utilise 'accepted_at' au lieu de 'used_at'
    AND expires_at > now()
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired_invite';
  END IF;

  -- 2) Créer ou récupérer le tenant par slug
  SELECT id INTO v_tenant_id
  FROM public.tenants
  WHERE slug = p_slug;

  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      slug, 
      name, 
      status,
      subscription_plan,
      max_users,
      max_projects,
      created_at,
      updated_at
    )
    VALUES (
      p_slug, 
      p_tenant_name, 
      'active',
      'basic',  -- Plan par défaut
      10,       -- Max users par défaut
      5,        -- Max projects par défaut
      now(),
      now()
    )
    RETURNING id INTO v_tenant_id;
  END IF;

  -- 3) Upsert profil utilisateur
  INSERT INTO public.profiles (
    user_id, 
    tenant_id,
    full_name,
    email, 
    role,
    job_title,
    hire_date,
    contract_type,
    weekly_hours,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id, 
    v_tenant_id,
    (SELECT full_name FROM public.invitations WHERE id = p_invite_code),
    p_email,
    'tenant_admin',
    'Tenant Owner',
    now()::date,
    'CDI',
    40,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = now();

  -- 4) Associer le rôle tenant_admin dans user_roles
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'role_tenant_admin_missing';
  END IF;

  INSERT INTO public.user_roles (
    user_id, 
    role_id, 
    tenant_id,
    context_type,
    context_id,
    assigned_by,
    assigned_at,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id, 
    v_role_id, 
    v_tenant_id,
    'tenant',
    v_tenant_id,
    p_user_id,  -- Auto-assigné
    now(),
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
    is_active = true,
    updated_at = now();

  -- 5) Créer l'employé avec employee_id auto-généré
  -- Générer employee_id unique (EMP001, EMP002, etc.)
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1
  INTO v_employee_id_counter
  FROM public.employees
  WHERE tenant_id = v_tenant_id
    AND employee_id ~ '^EMP[0-9]+$';

  v_employee_id := 'EMP' || LPAD(v_employee_id_counter::text, 3, '0');

  INSERT INTO public.employees (
    user_id,
    tenant_id,
    employee_id,
    full_name,
    email,
    job_title,
    hire_date,
    contract_type,
    weekly_hours,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    v_tenant_id,
    v_employee_id,
    (SELECT full_name FROM public.invitations WHERE id = p_invite_code),
    p_email,
    'Tenant Owner',
    now()::date,
    'CDI',
    40,
    'active',
    now(),
    now()
  )
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    job_title = EXCLUDED.job_title,
    updated_at = now();

  -- 6) Consommer l'invitation
  UPDATE public.invitations
     SET accepted_at = now(),
         status = 'accepted'
   WHERE id = p_invite_code
     AND accepted_at IS NULL;

  -- 7) Retourner les informations du tenant
  RETURN json_build_object(
    'tenant_id', v_tenant_id, 
    'slug', p_slug, 
    'employee_id', v_employee_id,
    'status', 'ok'
  );
END;
$$;

-- Test de la fonction (optionnel)
-- SELECT public.onboard_tenant_owner(
--   'test-user-id'::uuid,
--   'test@example.com',
--   'test-company',
--   'Test Company',
--   'invitation-id'::uuid
-- );
