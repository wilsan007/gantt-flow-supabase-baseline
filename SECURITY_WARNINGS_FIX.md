# 🔒 Correction des Avertissements de Sécurité Supabase

## 📋 5 Avertissements Détectés

### **⚠️ WARN (4)** + **🚨 ERROR (1)** déjà corrigé

---

## ✅ Solution Rapide

### **Étape 1 : SQL Editor**

1. **Supabase Dashboard** → SQL Editor
2. **New Query**
3. **Copier-coller ce SQL** :

```sql
-- FIX: function_search_path_mutable (3 fonctions)
ALTER FUNCTION public.get_action_dependencies_graph()
  SET search_path = '';

ALTER FUNCTION public.validate_action_dependency_graph()
  SET search_path = '';

ALTER FUNCTION public.is_tenant_admin(uuid)
  SET search_path = '';

-- FIX: extension_in_public (pg_net)
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_net SET SCHEMA extensions;
```

4. **Run** (Ctrl+Enter)
5. ✅ Vérifier le succès

---

### **Étape 2 : Protection Mots de Passe (Dashboard)**

1. **Supabase Dashboard** → **Authentication**
2. Menu gauche → **Policies**
3. Chercher **"Password Protection"** ou **"Security"**
4. **Activer** : ☑️ Leaked Password Protection
5. **Save**

**Description** : Active la vérification contre la base HaveIBeenPwned pour bloquer les mots de passe compromis.

---

## 📊 Détail des Corrections

### **1. Function Search Path Mutable (3 fonctions)**

**⚠️ Risque** : Sans `search_path` fixe, une fonction peut être vulnérable à des attaques par injection de schéma.

**🔧 Correction** : Ajouter `SET search_path = ''` à chaque fonction.

**Fonctions corrigées** :
- ✅ `get_action_dependencies_graph()`
- ✅ `validate_action_dependency_graph()`
- ✅ `is_tenant_admin(uuid)`

**Avant** :
```sql
CREATE FUNCTION is_tenant_admin(user_id uuid)
RETURNS boolean
AS $$
  -- fonction
$$ LANGUAGE sql;
```

**Après** :
```sql
CREATE FUNCTION is_tenant_admin(user_id uuid)
RETURNS boolean
SET search_path = ''  -- ← Ajouté
AS $$
  -- fonction
$$ LANGUAGE sql;
```

---

### **2. Extension in Public (pg_net)**

**⚠️ Risque** : Les extensions dans le schéma `public` sont exposées via PostgREST.

**🔧 Correction** : Déplacer `pg_net` vers le schéma `extensions`.

**Commandes** :
```sql
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_net SET SCHEMA extensions;
```

**Résultat** :
- ❌ Avant : `public.pg_net`
- ✅ Après : `extensions.pg_net`

---

### **3. Leaked Password Protection (Auth Config)**

**⚠️ Risque** : Les utilisateurs peuvent créer des comptes avec des mots de passe compromis connus.

**🔧 Correction** : Activer dans Dashboard (pas SQL).

**Chemin** :
```
Dashboard → Authentication → Policies → Leaked Password Protection
```

**Fonctionnement** :
- Vérifie chaque nouveau mot de passe contre HaveIBeenPwned
- Bloque automatiquement si le mot de passe est dans la base de données de fuites
- ✅ Améliore considérablement la sécurité des comptes

---

## 🎯 Résultat Attendu

Après les corrections :

| Alerte | Type | Status |
|--------|------|--------|
| `rls_disabled_in_public` (debug_logs) | ERROR | ✅ Corrigé |
| `function_search_path_mutable` (3×) | WARN | ✅ Corrigé |
| `extension_in_public` (pg_net) | WARN | ✅ Corrigé |
| `auth_leaked_password_protection` | WARN | ✅ Corrigé (Dashboard) |

**Total** : **0 erreurs**, **0 avertissements** 🎉

---

## 🧪 Validation

### **1. Vérifier les fonctions** :

```sql
SELECT 
  proname as function_name,
  prosecdef as security_definer,
  proconfig as config
FROM pg_proc 
WHERE proname IN (
  'get_action_dependencies_graph',
  'validate_action_dependency_graph',
  'is_tenant_admin'
);
```

**Résultat attendu** :
- `config` contient `{search_path=}`

---

### **2. Vérifier l'extension** :

```sql
SELECT 
  extname as extension_name,
  nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'pg_net';
```

**Résultat attendu** :
```
extension_name | schema_name
---------------|-------------
pg_net         | extensions
```

---

### **3. Re-lancer le Linter Supabase** :

1. **Dashboard** → **Database** → **Linter**
2. **Run Checks**
3. ✅ Toutes les alertes devraient avoir disparu

---

## 📚 Pourquoi Ces Corrections ?

### **search_path** :

**Problème** :
```sql
-- Sans search_path fixe
CREATE FUNCTION check_admin() 
AS $$ SELECT is_admin FROM users $$;

-- Un attaquant peut créer :
CREATE SCHEMA attacker;
CREATE TABLE attacker.users (is_admin BOOLEAN DEFAULT true);
SET search_path = attacker, public;

-- La fonction utilise maintenant la table de l'attaquant !
```

**Solution** :
```sql
CREATE FUNCTION check_admin() 
SET search_path = ''  -- Force à utiliser les noms qualifiés
AS $$ SELECT is_admin FROM public.users $$;
```

---

### **Extension in Public** :

**Problème** :
- Les extensions dans `public` sont exposées via l'API PostgREST
- Risque d'appels non autorisés aux fonctions de l'extension

**Solution** :
- Déplacer vers un schéma séparé (`extensions`)
- PostgREST n'expose que le schéma `public` par défaut

---

### **Leaked Password Protection** :

**Statistiques** :
- 📊 **11+ milliards** de comptes compromis dans HaveIBeenPwned
- 🔒 Bloquer ces mots de passe réduit **drastiquement** les risques

**Exemple** :
- User essaie : `password123`
- ✅ HaveIBeenPwned dit : "Vu 7,008,816 fois dans des fuites"
- ❌ Supabase bloque : "Mot de passe compromis, choisissez-en un autre"

---

## 🚀 Action Immédiate

**Exécutez MAINTENANT** :

1. ✅ SQL dans SQL Editor (2 minutes)
2. ✅ Activer Leaked Password Protection dans Dashboard (30 secondes)
3. ✅ Re-lancer le Linter pour vérifier

**Total** : **< 3 minutes** pour sécuriser votre application ! 🔒

---

## 📞 Support

Si une commande SQL échoue :

**Erreur possible : fonction introuvable**
```sql
-- Lister toutes les fonctions
SELECT proname, pg_get_function_identity_arguments(oid)
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace;
```

Adaptez la syntaxe `ALTER FUNCTION` selon la signature exacte.

---

**Fichier migration** : `supabase/migrations/fix_security_warnings.sql` ✅
