-- ==============================================
-- Script de débogage pour l'utilisateur test66@yahoo.com
-- ==============================================
-- Ce script retourne les informations de débogage sous forme de tableau.

SELECT 
  'test66@yahoo.com' AS email_recherche,
  (SELECT id FROM auth.users WHERE email = 'test66@yahoo.com') AS user_id,
  (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE email = 'test66@yahoo.com') AS email_confirme,
  (SELECT id FROM public.invitations WHERE email = 'test66@yahoo.com') AS invitation_id,
  (SELECT tenant_id FROM public.invitations WHERE email = 'test66@yahoo.com') AS invitation_tenant_id,
  (SELECT status FROM public.invitations WHERE email = 'test66@yahoo.com') AS invitation_status,
  (SELECT COUNT(*) > 0 FROM public.tenants WHERE id = (SELECT tenant_id FROM public.invitations WHERE email = 'test66@yahoo.com')) AS tenant_existe,
  (SELECT COUNT(*) > 0 FROM public.profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test66@yahoo.com')) AS profil_existe;
