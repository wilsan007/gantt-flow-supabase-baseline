-- ==============================================
-- Script de réparation pour l'utilisateur test66@yahoo.com
-- ==============================================

DO $$
DECLARE
  target_user_email TEXT := 'test66@yahoo.com';
  target_user_id UUID := 'bbe267bf-abdb-4c8f-9f9f-810e2dd5f27a';
  target_full_name TEXT := 'Test 66';
  invitation_data RECORD;
  new_tenant_id UUID;
  tenant_admin_role_id UUID;
  new_employee_id TEXT;
BEGIN
  RAISE NOTICE 'Vérification de l''utilisateur %...', target_user_email;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = target_user_id) THEN
    RAISE NOTICE 'Profil déjà existant.';
    RETURN;
  END IF;

  RAISE NOTICE 'Profil manquant. Début de la réparation...';

  SELECT * INTO invitation_data FROM public.invitations WHERE email = target_user_email;
  IF invitation_data.id IS NULL THEN
    RAISE NOTICE 'Création d''une nouvelle invitation...';
    new_tenant_id := gen_random_uuid();
    INSERT INTO public.invitations (email, full_name, status, invitation_type, tenant_id)
    VALUES (target_user_email, target_full_name, 'pending', 'tenant_owner', new_tenant_id)
    RETURNING * INTO invitation_data;
  ELSE
    new_tenant_id := invitation_data.tenant_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = new_tenant_id) THEN
    RAISE NOTICE 'Création du tenant...';
    INSERT INTO public.tenants (id, name) VALUES (new_tenant_id, target_full_name || '''s Company');
  END IF;

  RAISE NOTICE 'Création du profil...';
  INSERT INTO public.profiles (user_id, email, full_name, tenant_id, role)
  VALUES (target_user_id, target_user_email, target_full_name, new_tenant_id, 'tenant_admin');

  RAISE NOTICE 'Création de l''employé...';
  SELECT 'EMP' || LPAD((COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1)::TEXT, 3, '0')
  INTO new_employee_id
  FROM public.employees;
  INSERT INTO public.employees (user_id, email, full_name, tenant_id, employee_id, job_title)
  VALUES (target_user_id, target_user_email, target_full_name, new_tenant_id, new_employee_id, 'Tenant Administrateur');

  RAISE NOTICE 'Assignation du rôle...';
  INSERT INTO public.roles (name, description) VALUES ('tenant_admin', 'Administrateur de tenant') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO tenant_admin_role_id FROM public.roles WHERE name = 'tenant_admin';
  INSERT INTO public.user_roles (user_id, role_id) VALUES (target_user_id, tenant_admin_role_id);

  RAISE NOTICE 'Mise à jour de l''invitation...';
  UPDATE public.invitations SET status = 'accepted', accepted_at = now() WHERE id = invitation_data.id;

  RAISE NOTICE 'Réparation terminée.';
END $$;
