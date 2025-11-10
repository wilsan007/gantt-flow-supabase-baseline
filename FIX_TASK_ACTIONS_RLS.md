# 🔧 FIX: Row Level Security pour task_actions

## 🚨 PROBLÈME IDENTIFIÉ

**52 actions existent** dans la base mais la requête retourne `[]` → **RLS bloque l'accès**

---

## ✅ SOLUTION: Créer les policies RLS

### Exécutez ce script dans **Supabase SQL Editor:**

```sql
-- =============================================================================
-- FIX: Row Level Security pour task_actions
-- =============================================================================

BEGIN;

-- 1️⃣ Supprimer les anciennes policies (si elles existent)
DROP POLICY IF EXISTS "task_actions_select_policy" ON task_actions;
DROP POLICY IF EXISTS "task_actions_insert_policy" ON task_actions;
DROP POLICY IF EXISTS "task_actions_update_policy" ON task_actions;
DROP POLICY IF EXISTS "task_actions_delete_policy" ON task_actions;

-- 2️⃣ Activer RLS sur la table (si pas déjà fait)
ALTER TABLE task_actions ENABLE ROW LEVEL SECURITY;

-- 3️⃣ Policy SELECT - Lecture des actions
CREATE POLICY "task_actions_select_policy" ON task_actions
  FOR SELECT
  TO authenticated
  USING (
    -- Super Admin: Accès à tout
    public.is_super_admin()
    OR
    -- Utilisateur du même tenant que la tâche liée
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_actions.task_id
        AND t.tenant_id = public.get_current_tenant_id()
    )
  );

-- 4️⃣ Policy INSERT - Création d'actions
CREATE POLICY "task_actions_insert_policy" ON task_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Super Admin: Peut tout créer
    public.is_super_admin()
    OR
    -- Utilisateur peut créer une action si la tâche est dans son tenant
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_actions.task_id
        AND t.tenant_id = public.get_current_tenant_id()
    )
  );

-- 5️⃣ Policy UPDATE - Modification d'actions
CREATE POLICY "task_actions_update_policy" ON task_actions
  FOR UPDATE
  TO authenticated
  USING (
    -- Super Admin: Peut tout modifier
    public.is_super_admin()
    OR
    -- Utilisateur peut modifier une action si la tâche est dans son tenant
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_actions.task_id
        AND t.tenant_id = public.get_current_tenant_id()
    )
  );

-- 6️⃣ Policy DELETE - Suppression d'actions
CREATE POLICY "task_actions_delete_policy" ON task_actions
  FOR DELETE
  TO authenticated
  USING (
    -- Super Admin: Peut tout supprimer
    public.is_super_admin()
    OR
    -- Utilisateur peut supprimer une action si la tâche est dans son tenant
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_actions.task_id
        AND t.tenant_id = public.get_current_tenant_id()
    )
  );

COMMIT;

-- =============================================================================
-- TESTS DE VÉRIFICATION
-- =============================================================================

-- Test 1: Vérifier que les policies sont créées
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'task_actions'
ORDER BY policyname;

-- Test 2: Compter les actions visibles (devrait retourner 52)
SELECT COUNT(*) as visible_actions FROM task_actions;

-- Test 3: Vérifier les actions d'une tâche spécifique
SELECT
  id,
  task_id,
  title,
  is_done
FROM task_actions
WHERE task_id = 'cda9cd43-d85f-4ff9-9176-e7c42cca9ade'
LIMIT 5;

-- Test 4: Tester la jointure (comme dans l'app)
SELECT
  t.id,
  t.title,
  COUNT(ta.id) as actions_count
FROM tasks t
LEFT JOIN task_actions ta ON ta.task_id = t.id
GROUP BY t.id, t.title
HAVING COUNT(ta.id) > 0
ORDER BY actions_count DESC
LIMIT 10;
```

---

## 📋 ÉTAPES À SUIVRE

1. **Copiez tout le script SQL ci-dessus**

2. **Allez sur Supabase Dashboard**
   - https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji

3. **SQL Editor** (menu gauche)

4. **Nouvelle requête** → Collez le script

5. **Exécutez** (Ctrl+Enter ou bouton Run)

6. **Vérifiez les résultats des tests:**
   - Test 1: Doit montrer 4 policies
   - Test 2: Doit retourner `52`
   - Test 3: Doit montrer des actions
   - Test 4: Doit montrer les tâches avec leurs counts

---

## ✅ RÉSULTAT ATTENDU

Après exécution:

- ✅ **4 policies RLS** créées
- ✅ **52 actions visibles** via SELECT
- ✅ **Jointures fonctionnelles** avec tasks
- ✅ **App affichera les colonnes d'actions** après refresh

---

## 🎯 APRÈS LA FIX

Une fois le script exécuté:

1. **Rechargez l'application** (Ctrl+R)
2. **Vérifiez la console:**
   ```
   🔍 DEBUG useTasksEnterprise: {
     firstTaskActions: [...] // ← Doit avoir des données!
   }
   ```
3. **Les colonnes d'actions apparaîtront** dans la table

---

## ⚠️ SI ÇA NE FONCTIONNE TOUJOURS PAS

Vérifiez que les fonctions SQL existent:

```sql
-- Vérifier is_super_admin()
SELECT public.is_super_admin();

-- Vérifier get_current_tenant_id()
SELECT public.get_current_tenant_id();
```

Si ces fonctions n'existent pas, créez-les:

```sql
-- Fonction is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
      AND ur.is_active = true
  );
$$;

-- Fonction get_current_tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;
```

---

## 📞 SUPPORT

Si le problème persiste après avoir exécuté le script, partagez:

1. Le résultat des 4 tests
2. Les erreurs éventuelles dans la console SQL
3. Les logs de la console navigateur après refresh
