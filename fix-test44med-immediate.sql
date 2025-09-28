-- ==============================================
-- Script de réparation pour l'utilisateur test44med@yahoo.com
-- ==============================================
-- Ce script corrige le problème de profil manquant pour un utilisateur existant
-- en créant une invitation, un tenant, un profil, un rôle et un employé.

DO $$
DECLARE
  -- Définir les informations de l'utilisateur
  target_user_email TEXT := 'test44med@yahoo.com';
  target_user_id UUID := '05d1db0f-f122-409d-8694-633c2cb735b5';
  target_full_name TEXT := 'Test 44 Med'; -- Nom par défaut, peut être ajusté

  -- Variables
  invitation_data RECORD;
  new_tenant_id UUID;
  tenant_admin_role_id UUID;
  new_employee_id TEXT;
BEGIN
  -- Étape 1: Vérifier si l'utilisateur existe dans auth.users
  RAISE NOTICE 'Vérification de l''utilisateur % (ID: %)', target_user_email, target_user_id;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé dans auth.users. Le script ne peut pas continuer.';
  END IF;

  -- Étape 2: Vérifier si un profil existe déjà
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = target_user_id) THEN
    RAISE NOTICE 'Un profil existe déjà pour cet utilisateur. Aucune action n''est nécessaire.';
    RETURN;
  END IF;

  RAISE NOTICE 'Aucun profil trouvé. Début du processus de réparation...';

  -- Étape 3: Vérifier ou créer une invitation
  RAISE NOTICE 'Vérification de l''invitation...';
  SELECT * INTO invitation_data FROM public.invitations WHERE email = target_user_email;

  IF invitation_data.id IS NULL THEN
    RAISE NOTICE 'Aucune invitation trouvée. Création d''une nouvelle invitation...';
    new_tenant_id := gen_random_uuid(); -- Créer un nouvel ID de tenant
    INSERT INTO public.invitations (email, full_name, status, invitation_type, tenant_id)
    VALUES (target_user_email, target_full_name, 'pending', 'tenant_owner', new_tenant_id)
    RETURNING * INTO invitation_data;
    RAISE NOTICE 'Invitation créée avec tenant_id: %', new_tenant_id;
  ELSE
    new_tenant_id := invitation_data.tenant_id;
    RAISE NOTICE 'Invitation existante trouvée avec tenant_id: %', new_tenant_id;
  END IF;

  -- Étape 4: Créer le tenant s'il n'existe pas
  RAISE NOTICE 'Vérification du tenant...';
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = new_tenant_id) THEN
    RAISE NOTICE 'Tenant non trouvé. Création du tenant...';
    INSERT INTO public.tenants (id, name) VALUES (new_tenant_id, target_full_name || '''s Company');
  END IF;

  -- Étape 5: Créer le profil
  RAISE NOTICE 'Création du profil...';
  INSERT INTO public.profiles (user_id, email, full_name, tenant_id, role)
  VALUES (target_user_id, target_user_email, target_full_name, new_tenant_id, 'tenant_admin');

  -- Étape 6: Créer l'employé
  RAISE NOTICE 'Création de l''employé...';
  -- Générer un ID d'employé unique
  SELECT 'EMP' || LPAD((COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1)::TEXT, 3, '0')
  INTO new_employee_id
  FROM public.employees;
  
  INSERT INTO public.employees (user_id, email, full_name, tenant_id, employee_id, job_title)
  VALUES (target_user_id, target_user_email, target_full_name, new_tenant_id, new_employee_id, 'Tenant Administrateur');

  -- Étape 7: Assigner le rôle 'tenant_admin'
  RAISE NOTICE 'Assignation du rôle...';
  -- S'assurer que le rôle existe
  INSERT INTO public.roles (name, description) VALUES ('tenant_admin', 'Administrateur de tenant') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO tenant_admin_role_id FROM public.roles WHERE name = 'tenant_admin';
  
  INSERT INTO public.user_roles (user_id, role_id) VALUES (target_user_id, tenant_admin_role_id);

  -- Étape 8: Mettre à jour le statut de l'invitation
  RAISE NOTICE 'Mise à jour de l''invitation...';
  UPDATE public.invitations SET status = 'accepted', accepted_at = now() WHERE id = invitation_data.id;

  RAISE NOTICE 'Réparation terminée avec succès pour l''utilisateur %.', target_user_email;

END $$;
