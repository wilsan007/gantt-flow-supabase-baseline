-- Réparer l'utilisateur test123@yahoo.com qui n'a pas de profil
-- ID utilisateur: f2a28e2e-991c-4377-9aa9-34b39a6b9b46

BEGIN;

-- Appeler directement la fonction de création tenant owner
SELECT create_tenant_owner_from_invitation(
  'dummy_token', -- Token fictif car l'utilisateur existe déjà
  'f2a28e2e-991c-4377-9aa9-34b39a6b9b46'::UUID,
  'Entreprise Test123',
  'test123-company'
) as result;

COMMIT;
