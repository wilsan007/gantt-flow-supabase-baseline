-- ==============================================
-- Script de vérification complet pour l'utilisateur test99@yahoo.com
-- ==============================================
-- Ce script vérifie l'état de toutes les données associées à l'utilisateur.

SELECT
  'test99@yahoo.com' AS email_recherche,
  u.id AS user_id,
  u.email_confirmed_at IS NOT NULL AS email_confirme,
  i.id AS invitation_id,
  i.tenant_id AS invitation_tenant_id,
  i.status AS invitation_status,
  EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = i.tenant_id) AS tenant_existe,
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id) AS profil_existe,
  EXISTS (SELECT 1 FROM public.employees e WHERE e.user_id = u.id) AS employe_existe,
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id) AS role_assigne
FROM auth.users u
LEFT JOIN public.invitations i ON u.email = i.email
WHERE u.email = 'test99@yahoo.com';
