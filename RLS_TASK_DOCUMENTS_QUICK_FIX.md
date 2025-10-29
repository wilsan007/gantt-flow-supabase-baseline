# 🔒 FIX RLS - Upload Documents (Action Immédiate)

## 🚨 Problème

**Erreur 42501** : La politique RLS bloque l'insertion dans `task_documents`.

---

## ✅ Solution Rapide

### **Étape 1 : Ouvrir Supabase Dashboard**

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet : **qliinxtanjdnwxlvnxji**
3. Menu gauche → **SQL Editor**
4. Cliquez sur **New Query**

---

### **Étape 2 : Copier-Coller ce SQL**

```sql
-- ============================================
-- FIX RLS POUR task_documents
-- ============================================

-- 1. Activer RLS
ALTER TABLE task_documents ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer anciennes politiques
DROP POLICY IF EXISTS "task_documents_select_policy" ON task_documents;
DROP POLICY IF EXISTS "task_documents_insert_policy" ON task_documents;
DROP POLICY IF EXISTS "task_documents_update_policy" ON task_documents;
DROP POLICY IF EXISTS "task_documents_delete_policy" ON task_documents;

-- 3. SELECT : Voir documents de son tenant
CREATE POLICY "task_documents_select_policy"
ON task_documents
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  )
);

-- 4. INSERT : Créer documents (POLITIQUE SIMPLIFIÉE)
CREATE POLICY "task_documents_insert_policy"
ON task_documents
FOR INSERT
WITH CHECK (
  -- Vérifier que l'utilisateur appartient au tenant
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  )
  AND
  -- Vérifier que uploader_id = user actuel
  uploader_id = auth.uid()
);

-- 5. UPDATE : Modifier ses propres documents
CREATE POLICY "task_documents_update_policy"
ON task_documents
FOR UPDATE
USING (uploader_id = auth.uid());

-- 6. DELETE : Supprimer ses propres documents
CREATE POLICY "task_documents_delete_policy"
ON task_documents
FOR DELETE
USING (uploader_id = auth.uid());
```

---

### **Étape 3 : Exécuter**

1. Cliquez sur **Run** (ou Ctrl+Enter)
2. Vérifiez que tout est ✅ (Success)
3. Fermez l'éditeur SQL

---

### **Étape 4 : Tester l'Upload**

1. **Retournez sur votre application**
2. **Rafraîchir la page** (F5)
3. **Aller sur une tâche**
4. **Cliquer sur "Documents"**
5. **Ajouter un fichier**
6. **Résultat attendu** :
   - ✅ Upload réussi
   - ✅ Toast "Document uploadé"
   - ✅ **Plus d'erreur 42501 !**

---

## 🔍 Diagnostic Alternatif

### **Si l'erreur persiste**, vérifier que :

#### **1. La table `profiles` a un `tenant_id`**

```sql
-- Vérifier la structure de profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('id', 'tenant_id');
```

**Résultat attendu** :
```
column_name | data_type
------------|----------
id          | uuid
tenant_id   | uuid
```

Si `tenant_id` manque :
```sql
ALTER TABLE profiles ADD COLUMN tenant_id UUID;
```

---

#### **2. L'utilisateur a bien un `tenant_id` dans `profiles`**

```sql
-- Vérifier votre profil
SELECT id, email, tenant_id 
FROM profiles 
WHERE id = auth.uid();
```

**Si `tenant_id` est NULL**, le remplir :
```sql
-- Remplacer YOUR_TENANT_ID par l'ID réel
UPDATE profiles 
SET tenant_id = 'YOUR_TENANT_ID' 
WHERE id = auth.uid();
```

---

#### **3. La table `task_documents` a les bonnes colonnes**

```sql
-- Vérifier la structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'task_documents';
```

**Colonnes requises** :
- ✅ `id` (uuid)
- ✅ `task_id` (uuid)
- ✅ `tenant_id` (uuid) ← **CRUCIAL**
- ✅ `uploader_id` (uuid) ← **CRUCIAL**
- ✅ `file_name` (text)
- ✅ `file_path` (text)

Si `tenant_id` ou `uploader_id` manquent :
```sql
ALTER TABLE task_documents 
ADD COLUMN tenant_id UUID,
ADD COLUMN uploader_id UUID;
```

---

## 🎯 Pourquoi ça bloquait ?

### **Scénario probable** :

```
User essaie d'insérer un document
  ↓
Code envoie : { tenant_id: "abc", uploader_id: "xyz", ... }
  ↓
RLS vérifie : tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  ↓
❌ PROBLÈME : Soit pas de politique, soit tenant_id NULL dans profiles
  ↓
Erreur 42501 : new row violates row-level security policy
```

### **Avec le fix** :

```
User essaie d'insérer un document
  ↓
Code envoie : { tenant_id: "abc", uploader_id: "xyz", ... }
  ↓
RLS vérifie : 
  ✅ tenant_id = tenant_id du user dans profiles
  ✅ uploader_id = auth.uid()
  ↓
✅ SUCCESS : Insertion autorisée
```

---

## 📋 Checklist de Validation

### **Après avoir exécuté le SQL** :

- [ ] SQL exécuté sans erreur dans Supabase Dashboard
- [ ] Rafraîchi la page de l'application
- [ ] Testé l'upload d'un fichier
- [ ] ✅ Upload réussi
- [ ] ✅ Document visible dans la liste
- [ ] ✅ Plus d'erreur 42501

---

## 🆘 Si Ça Ne Marche Toujours Pas

### **Option 1 : Politique Permissive Temporaire (DEV ONLY)**

**⚠️ ATTENTION : À utiliser UNIQUEMENT en développement !**

```sql
-- Politique ultra-permissive (DANGEREUX en prod)
DROP POLICY IF EXISTS "task_documents_insert_policy" ON task_documents;

CREATE POLICY "task_documents_insert_policy"
ON task_documents
FOR INSERT
WITH CHECK (true); -- ⚠️ Autorise TOUT LE MONDE
```

Si ça marche, le problème est dans la logique de vérification du tenant.

**ENSUITE, remettre la vraie politique** :
```sql
DROP POLICY IF EXISTS "task_documents_insert_policy" ON task_documents;

CREATE POLICY "task_documents_insert_policy"
ON task_documents
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  )
  AND uploader_id = auth.uid()
);
```

---

### **Option 2 : Vérifier le JWT Token**

Dans la console du navigateur (F12) :

```javascript
// Voir le token actuel
const { data: { session } } = await supabase.auth.getSession();
console.log('User ID:', session?.user?.id);

// Voir le profil
const { data: profile } = await supabase
  .from('profiles')
  .select('id, tenant_id')
  .eq('id', session?.user?.id)
  .single();
console.log('Profile:', profile);
```

**Vérifier** :
- ✅ `session.user.id` existe
- ✅ `profile.tenant_id` existe et n'est pas NULL
- ✅ Les deux correspondent

---

### **Option 3 : Logs SQL (Debugging Avancé)**

Dans Supabase Dashboard → **Logs** → **Database** :

Rechercher les erreurs RLS récentes pour voir exactement ce qui bloque.

---

## 💡 Bonnes Pratiques RLS

### **1. Toujours tester avec un vrai utilisateur**

Ne pas tester avec :
- ❌ Service Role Key (bypass RLS)
- ❌ API Key anonyme (pas d'auth)

Tester avec :
- ✅ Un utilisateur authentifié
- ✅ Via l'application frontend

### **2. Politique INSERT simplifiée**

```sql
-- ✅ Bonne pratique : Vérifications minimales mais suffisantes
WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND uploader_id = auth.uid()
)

-- ❌ Trop complexe : Vérifie trop de choses
WITH CHECK (
  tenant_id IN (...)
  AND uploader_id = auth.uid()
  AND EXISTS (SELECT 1 FROM tasks ...)
  AND EXISTS (SELECT 1 FROM projects ...)
  -- Trop de checks = risque d'erreurs
)
```

### **3. Index pour performance**

```sql
-- Accélère les requêtes RLS
CREATE INDEX idx_task_documents_tenant_id ON task_documents(tenant_id);
CREATE INDEX idx_task_documents_uploader_id ON task_documents(uploader_id);
```

---

## 🎉 Résultat Attendu

Après le fix :

```
User upload un document
  ↓
✅ Pas d'erreur RLS
  ↓
✅ Document inséré dans la DB
  ↓
✅ Toast "Document uploadé"
  ↓
✅ Document visible dans la liste
```

---

## 📞 Support

Si le problème persiste après tout ça :

1. **Exporter le schéma de `task_documents`** :
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'task_documents';
   ```

2. **Exporter les politiques RLS** :
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'task_documents';
   ```

3. **Partager les résultats** pour diagnostic approfondi

---

**Exécutez le SQL maintenant et testez ! 🚀**
