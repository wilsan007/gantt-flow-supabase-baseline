-- ═══════════════════════════════════════════════════════════════════════════
-- ANALYSE COMPLÈTE DE LA TABLE user_roles
-- ═══════════════════════════════════════════════════════════════════════════

\echo '🔍 ANALYSE DE LA TABLE user_roles'
\echo ''
\echo '═══════════════════════════════════════════════════════════════════════════'

-- 1. STATISTIQUES GLOBALES
\echo ''
\echo '📊 STATISTIQUES GLOBALES:'
\echo '───────────────────────────────────────────────────────────────────────────'

SELECT 
  COUNT(*) as "Nombre total de lignes",
  COUNT(DISTINCT user_id) as "Utilisateurs uniques",
  ROUND(COUNT(*)::numeric / COUNT(DISTINCT user_id), 2) as "Moyenne rôles/utilisateur",
  COUNT(*) FILTER (WHERE is_active = true) as "Rôles actifs",
  COUNT(*) FILTER (WHERE is_active = false) as "Rôles inactifs",
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_active = false) / COUNT(*), 2) as "% inactifs"
FROM user_roles;

-- 2. TOP 10 UTILISATEURS AVEC LE PLUS DE RÔLES
\echo ''
\echo '👥 TOP 10 UTILISATEURS AVEC LE PLUS DE RÔLES:'
\echo '───────────────────────────────────────────────────────────────────────────'

SELECT 
  user_id,
  COUNT(*) as "Total rôles",
  COUNT(*) FILTER (WHERE is_active = true) as "Actifs",
  COUNT(*) FILTER (WHERE is_active = false) as "Inactifs",
  COUNT(DISTINCT tenant_id) as "Tenants",
  STRING_AGG(DISTINCT r.name, ', ' ORDER BY r.name) as "Rôles"
FROM user_roles ur
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY user_id
ORDER BY COUNT(*) DESC
LIMIT 10;

-- 3. DÉTAIL DES UTILISATEURS AVEC MULTIPLES RÔLES
\echo ''
\echo '🔍 DÉTAIL DES UTILISATEURS AVEC 3+ RÔLES:'
\echo '───────────────────────────────────────────────────────────────────────────'

WITH user_role_counts AS (
  SELECT user_id, COUNT(*) as role_count
  FROM user_roles
  GROUP BY user_id
  HAVING COUNT(*) >= 3
)
SELECT 
  ur.user_id,
  ur.id as "user_role_id",
  r.name as "Rôle",
  r.display_name as "Nom affiché",
  ur.is_active as "Actif",
  ur.tenant_id,
  ur.created_at as "Créé le"
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id IN (SELECT user_id FROM user_role_counts)
ORDER BY ur.user_id, ur.created_at DESC;

-- 4. ANALYSE DES DOUBLONS (même user + même rôle + même tenant)
\echo ''
\echo '⚠️  ANALYSE DES DOUBLONS:'
\echo '───────────────────────────────────────────────────────────────────────────'

WITH duplicates AS (
  SELECT 
    user_id,
    role_id,
    tenant_id,
    COUNT(*) as count
  FROM user_roles
  GROUP BY user_id, role_id, tenant_id
  HAVING COUNT(*) > 1
)
SELECT 
  d.user_id,
  r.name as "Rôle",
  d.tenant_id,
  d.count as "Nombre d'entrées",
  STRING_AGG(
    ur.id::text || ' (' || 
    CASE WHEN ur.is_active THEN '✅ ACTIF' ELSE '❌ INACTIF' END || 
    ', créé: ' || ur.created_at::date::text || ')',
    E'\n    '
    ORDER BY ur.created_at DESC
  ) as "Détails"
FROM duplicates d
JOIN user_roles ur ON d.user_id = ur.user_id 
  AND d.role_id = ur.role_id 
  AND (d.tenant_id = ur.tenant_id OR (d.tenant_id IS NULL AND ur.tenant_id IS NULL))
JOIN roles r ON d.role_id = r.id
GROUP BY d.user_id, r.name, d.tenant_id, d.count
ORDER BY d.count DESC;

-- 5. DISTRIBUTION DES RÔLES PAR TYPE
\echo ''
\echo '📊 DISTRIBUTION DES RÔLES PAR TYPE:'
\echo '───────────────────────────────────────────────────────────────────────────'

SELECT 
  r.name as "Rôle",
  r.display_name as "Nom affiché",
  COUNT(*) as "Total utilisateurs",
  COUNT(*) FILTER (WHERE ur.is_active = true) as "Actifs",
  COUNT(*) FILTER (WHERE ur.is_active = false) as "Inactifs"
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
GROUP BY r.name, r.display_name
ORDER BY COUNT(*) DESC;

-- 6. UTILISATEURS AVEC RÔLES DANS MULTIPLES TENANTS
\echo ''
\echo '🏢 UTILISATEURS AVEC RÔLES DANS MULTIPLES TENANTS:'
\echo '───────────────────────────────────────────────────────────────────────────'

SELECT 
  user_id,
  COUNT(DISTINCT tenant_id) as "Nombre de tenants",
  COUNT(*) as "Total rôles",
  STRING_AGG(DISTINCT tenant_id::text, ', ') as "Tenant IDs"
FROM user_roles
WHERE tenant_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(DISTINCT tenant_id) > 1
ORDER BY COUNT(DISTINCT tenant_id) DESC;

-- 7. RÔLES CRÉÉS RÉCEMMENT (30 derniers jours)
\echo ''
\echo '🆕 RÔLES CRÉÉS DANS LES 30 DERNIERS JOURS:'
\echo '───────────────────────────────────────────────────────────────────────────'

SELECT 
  COUNT(*) as "Nouveaux rôles",
  COUNT(DISTINCT user_id) as "Utilisateurs concernés",
  STRING_AGG(DISTINCT r.name, ', ') as "Types de rôles"
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.created_at >= NOW() - INTERVAL '30 days';

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════════'
