#!/bin/bash

# Script pour tester medtest1@yahoo.com avec psql directement
# Utilise les informations du fichier .env

# Extraire les variables du .env
source .env

# Construire l'URL de connexion
DB_HOST="db.${VITE_SUPABASE_PROJECT_ID}.supabase.co"
DB_URL="postgresql://postgres:bykg4k993NDF1!@${DB_HOST}:5432/postgres"

echo "🔗 Connexion à Supabase..."
echo "📍 Host: $DB_HOST"
echo "📧 Test: medtest1@yahoo.com"
echo ""

# Exécuter le test SQL
psql "$DB_URL" << 'EOF'
-- Test complet pour medtest1@yahoo.com

\echo '=== 1. INSTALLATION DU TRIGGER ==='
\i fix-trigger-on-email-confirmation.sql

\echo ''
\echo '=== 2. ÉTAT INITIAL ==='
SELECT 
  'UTILISATEUR' as type,
  id::text as id,
  email,
  CASE WHEN email_confirmed_at IS NULL THEN 'NON CONFIRMÉ' ELSE 'CONFIRMÉ' END as status
FROM auth.users 
WHERE email = 'medtest1@yahoo.com'
UNION ALL
SELECT 
  'INVITATION' as type,
  id::text,
  email,
  status
FROM public.invitations 
WHERE email = 'medtest1@yahoo.com';

\echo ''
\echo '=== 3. TRIGGERS INSTALLÉS ==='
SELECT 
  trigger_name,
  event_manipulation || ' ' || action_timing as event_type
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name LIKE '%confirmation%';

\echo ''
\echo '=== 4. SIMULATION CONFIRMATION ==='
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'medtest1@yahoo.com';

-- Attendre le trigger
SELECT pg_sleep(3);

\echo ''
\echo '=== 5. RÉSULTATS APRÈS TRIGGER ==='
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'medtest1@yahoo.com') 
    THEN '✅ PROFIL CRÉÉ'
    ELSE '❌ PROFIL MANQUANT'
  END as profil_status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'medtest1@yahoo.com') 
    THEN '✅ EMPLOYÉ CRÉÉ'
    ELSE '❌ EMPLOYÉ MANQUANT'
  END as employee_status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.invitations WHERE email = 'medtest1@yahoo.com' AND status = 'accepted') 
    THEN '✅ INVITATION ACCEPTÉE'
    ELSE '❌ INVITATION NON ACCEPTÉE'
  END as invitation_status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN auth.users u ON u.id = ur.user_id
      WHERE u.email = 'medtest1@yahoo.com'
    ) 
    THEN '✅ RÔLES CRÉÉS'
    ELSE '❌ RÔLES MANQUANTS'
  END as roles_status;

\echo ''
\echo '=== 6. SCORE FINAL ==='
SELECT 
  (
    CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'medtest1@yahoo.com') THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'medtest1@yahoo.com') THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM public.invitations WHERE email = 'medtest1@yahoo.com' AND status = 'accepted') THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN auth.users u ON u.id = ur.user_id
      WHERE u.email = 'medtest1@yahoo.com'
    ) THEN 1 ELSE 0 END
  )::text || '/4' as score,
  CASE 
    WHEN (
      CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'medtest1@yahoo.com') THEN 1 ELSE 0 END +
      CASE WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'medtest1@yahoo.com') THEN 1 ELSE 0 END +
      CASE WHEN EXISTS (SELECT 1 FROM public.invitations WHERE email = 'medtest1@yahoo.com' AND status = 'accepted') THEN 1 ELSE 0 END +
      CASE WHEN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN auth.users u ON u.id = ur.user_id
        WHERE u.email = 'medtest1@yahoo.com'
      ) THEN 1 ELSE 0 END
    ) = 4 THEN '🎉 TRIGGER PARFAIT!'
    ELSE '⚠️ TRIGGER INCOMPLET'
  END as status;

\echo ''
\echo '=== 7. DÉTAILS SI CRÉÉS ==='
SELECT 
  'PROFIL' as type,
  p.id::text as id,
  p.email,
  p.full_name,
  p.role
FROM public.profiles p
WHERE p.email = 'medtest1@yahoo.com'
UNION ALL
SELECT 
  'EMPLOYÉ' as type,
  e.id::text,
  e.email,
  e.full_name,
  e.employee_id
FROM public.employees e
WHERE e.email = 'medtest1@yahoo.com'
UNION ALL
SELECT 
  'INVITATION' as type,
  i.id::text,
  i.email,
  i.full_name,
  i.status
FROM public.invitations i
WHERE i.email = 'medtest1@yahoo.com';

EOF

echo ""
echo "✅ Test terminé!"
