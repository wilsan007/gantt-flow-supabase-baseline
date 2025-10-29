-- DÉSACTIVER TEMPORAIREMENT RLS POUR DIAGNOSTIC
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Désactiver RLS sur les tables principales
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;

-- 2. Vérifier l'état RLS des tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  hasrls as has_rls_policies
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('projects', 'tasks', 'profiles', 'user_roles', 'departments')
ORDER BY tablename;

-- 3. Lister les politiques existantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- IMPORTANT: Après avoir testé que les données s'affichent,
-- réactiver RLS avec les bonnes politiques :
-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
