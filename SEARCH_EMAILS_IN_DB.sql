-- ═══════════════════════════════════════════════════════════════════════════
-- RECHERCHE D'EMAILS DANS TOUTE LA BASE DE DONNÉES
-- ═══════════════════════════════════════════════════════════════════════════
-- Emails recherchés:
--   1. wilwaalnabad@gmail.com
--   2. wilwaalshaqo@gmail.com
-- ═══════════════════════════════════════════════════════════════════════════

-- 1️⃣ RECHERCHE DANS auth.users
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
  'auth.users' as table_name,
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- 2️⃣ RECHERCHE DANS public.profiles
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
  'public.profiles' as table_name,
  id,
  user_id,
  email,
  full_name,
  tenant_id,
  created_at
FROM public.profiles
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- 3️⃣ RECHERCHE DANS public.invitations
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
  'public.invitations' as table_name,
  id,
  email,
  full_name,
  invitation_type,
  status,
  tenant_id,
  invited_by,
  token,
  created_at,
  expires_at,
  metadata
FROM public.invitations
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com')
ORDER BY created_at DESC;

-- 4️⃣ RECHERCHE DANS public.employees
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
  'public.employees' as table_name,
  id,
  user_id,
  email,
  full_name,
  tenant_id,
  status,
  created_at
FROM public.employees
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- 5️⃣ RECHERCHE DANS public.user_roles
-- ═══════════════════════════════════════════════════════════════════════════
-- (Pas de colonne email directe, mais on cherche via user_id)
SELECT 
  'public.user_roles' as table_name,
  ur.id,
  ur.user_id,
  ur.role_id,
  ur.tenant_id,
  p.email,
  r.name as role_name,
  ur.created_at
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
LEFT JOIN public.roles r ON r.id = ur.role_id
WHERE p.email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- 6️⃣ RECHERCHE DANS public.tenants (invited_by ou metadata)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
  'public.tenants' as table_name,
  t.id,
  t.name,
  t.owner_id,
  p.email as owner_email,
  t.created_at,
  t.metadata
FROM public.tenants t
LEFT JOIN public.profiles p ON p.user_id = t.owner_id
WHERE p.email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- 7️⃣ RECHERCHE DANS public.audit_logs (user_email)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
  'public.audit_logs' as table_name,
  id,
  user_id,
  user_email,
  action,
  table_name as affected_table,
  created_at
FROM public.audit_logs
WHERE user_email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com')
ORDER BY created_at DESC
LIMIT 50;

-- ═══════════════════════════════════════════════════════════════════════════
-- RÉSUMÉ : Comptage par table
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 'RÉSUMÉ' as section;

SELECT 
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com')
UNION ALL
SELECT 
  'public.profiles',
  COUNT(*)
FROM public.profiles
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com')
UNION ALL
SELECT 
  'public.invitations',
  COUNT(*)
FROM public.invitations
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com')
UNION ALL
SELECT 
  'public.employees',
  COUNT(*)
FROM public.employees
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com')
UNION ALL
SELECT 
  'public.audit_logs',
  COUNT(*)
FROM public.audit_logs
WHERE user_email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- ═══════════════════════════════════════════════════════════════════════════
-- RECHERCHE DANS LES COLONNES JSONB (metadata, raw_user_meta_data, etc.)
-- ═══════════════════════════════════════════════════════════════════════════

-- Recherche dans auth.users.raw_user_meta_data
SELECT 
  'auth.users (metadata)' as table_name,
  id,
  email,
  raw_user_meta_data::text
FROM auth.users
WHERE raw_user_meta_data::text LIKE '%wilwaalnabad@gmail.com%'
   OR raw_user_meta_data::text LIKE '%wilwaalshaqo@gmail.com%';

-- Recherche dans invitations.metadata
SELECT 
  'invitations (metadata)' as table_name,
  id,
  email,
  metadata::text
FROM public.invitations
WHERE metadata::text LIKE '%wilwaalnabad@gmail.com%'
   OR metadata::text LIKE '%wilwaalshaqo@gmail.com%';

-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT DE NETTOYAGE (SI NÉCESSAIRE)
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️ NE PAS EXÉCUTER SANS CONFIRMATION !
-- ═══════════════════════════════════════════════════════════════════════════

/*
-- Supprimer de auth.users
DELETE FROM auth.users 
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- Supprimer de profiles
DELETE FROM public.profiles 
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- Supprimer de invitations
DELETE FROM public.invitations 
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');

-- Supprimer de employees
DELETE FROM public.employees 
WHERE email IN ('wilwaalnabad@gmail.com', 'wilwaalshaqo@gmail.com');
*/
