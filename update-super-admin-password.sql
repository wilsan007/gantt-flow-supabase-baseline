-- Script pour modifier le mot de passe du Super Admin
-- UUID: 5c5731ce-75d0-4455-8184-bc42c626cb17
-- Nouveau mot de passe: Adnadmin@@

-- Mettre à jour le mot de passe dans auth.users
UPDATE auth.users 
SET 
  encrypted_password = crypt('Adnadmin@@', gen_salt('bf')),
  updated_at = now()
WHERE id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;

-- Vérifier que la mise à jour a été effectuée
SELECT 
  id,
  email,
  created_at,
  updated_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE id = '5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID;
