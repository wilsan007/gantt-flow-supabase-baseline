-- AUDIT DE SÉCURITÉ ET DIAGNOSTIC

-- 1. VÉRIFIER RLS SUR TOUTES LES TABLES
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Activé'
    ELSE '❌ RLS Manquant'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- 2. LISTER LES POLITIQUES EXISTANTES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. VÉRIFIER LES INDEX MANQUANTS
SELECT 
  t.table_name,
  c.column_name,
  CASE 
    WHEN i.indexname IS NOT NULL THEN '✅ Index présent'
    ELSE '⚠️ Index manquant'
  END as index_status
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN pg_indexes i ON t.table_name = i.tablename AND c.column_name = ANY(string_to_array(replace(i.indexdef, '"', ''), ' '))
WHERE t.table_schema = 'public'
AND c.column_name IN ('tenant_id', 'project_id', 'task_id', 'user_id', 'assignee_id')
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.column_name;

-- 4. STATISTIQUES DES TABLES
SELECT 
  schemaname,
  relname as table_name,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 5. REQUÊTES LENTES (si pg_stat_statements est activé)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    RAISE NOTICE 'Extension pg_stat_statements détectée - Analyse des requêtes lentes';
  ELSE
    RAISE NOTICE 'Extension pg_stat_statements non disponible';
  END IF;
END $$;
