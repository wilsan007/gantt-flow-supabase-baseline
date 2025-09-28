-- 1. Ajouter colonne tenant_id à profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- 2. Nettoyer employé existant avec EMP001
DELETE FROM public.employees WHERE employee_id = 'EMP001';

-- 3. Créer le profil maintenant que tenant_id existe
INSERT INTO public.profiles (
    user_id, 
    tenant_id, 
    full_name, 
    email, 
    role
)
VALUES (
    '3edb2a4f-7faf-439c-b512-e9d70c7ba34a',
    '115d5fa0-006a-4978-8776-c19b4157731a',
    'Med Osman',
    'test212@yahoo.com',
    'tenant_admin'
)
ON CONFLICT (user_id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- 4. Créer l'employé
INSERT INTO public.employees (
    user_id,
    employee_id,
    full_name,
    email,
    job_title,
    hire_date,
    contract_type,
    status,
    tenant_id
)
VALUES (
    '3edb2a4f-7faf-439c-b512-e9d70c7ba34a',
    'EMP001',
    'Med Osman',
    'test212@yahoo.com',
    'Directeur Général',
    CURRENT_DATE,
    'CDI',
    'active',
    '115d5fa0-006a-4978-8776-c19b4157731a'
);

-- 5. Marquer invitation comme acceptée
UPDATE public.invitations
SET status = 'accepted',
    accepted_at = NOW()
WHERE token = '758ac777fb6d8ae23436bd1802c890ef9300b1dafb4559661337f990';

-- Vérification finale
SELECT 'SUCCESS' as result, p.tenant_id::text, p.full_name, p.role
FROM public.profiles p
WHERE p.user_id = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
