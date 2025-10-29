# 🔍 Explication : Fonction `user_has_role()` et Problème RLS

## 📋 **Comment Fonctionne `user_has_role()`**

### **Définition de la Fonction**

```sql
CREATE OR REPLACE FUNCTION public.user_has_role(role_names TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = (SELECT auth.uid())        -- 1. Récupère l'ID utilisateur connecté
      AND r.name = ANY(role_names)                -- 2. Vérifie si le rôle est dans la liste
      AND ur.tenant_id = public.get_current_tenant_id()  -- 3. Vérifie le tenant actuel
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔄 **Flux d'Exécution (3 Étapes)**

### **Étape 1 : Identification de l'Utilisateur**
```sql
ur.user_id = (SELECT auth.uid())
```
- Récupère l'ID de l'utilisateur **actuellement connecté**
- Utilise la fonction Supabase `auth.uid()`
- Pour votre utilisateur : `5c5731ce-75d0-4455-8184-bc42c626cb17`

### **Étape 2 : Vérification du Rôle**
```sql
r.name = ANY(role_names)
```
- Vérifie si l'utilisateur a **un des rôles demandés**
- Exemple : `['tenant_admin', 'hr_manager']`
- **Problème actuel** : Votre utilisateur n'a **AUCUN rôle** dans `user_roles`

### **Étape 3 : Vérification du Tenant**
```sql
ur.tenant_id = public.get_current_tenant_id()
```
- Vérifie que le rôle appartient au **tenant actuel**
- `get_current_tenant_id()` lit : `current_setting('app.current_tenant_id', true)::uuid`
- **Problème actuel** : Pas de tenant_id car pas de rôle

---

## 🚨 **Pourquoi Votre Utilisateur N'a Pas Accès**

### **Diagnostic des Logs**

```javascript
🎯 Rôles récupérés pour l'utilisateur: Array []
📋 Détail du rôle: Aucun rôle
Aucun profil trouvé - possiblement un nouveau tenant owner
```

### **Problème Identifié : Utilisateur Incomplet**

| Élément | Statut | Impact |
|---------|--------|--------|
| **auth.users** | ✅ Existe | Utilisateur authentifié |
| **profiles** | ❌ Manquant | Erreur HTTP 406 |
| **user_roles** | ❌ Vide | `user_has_role()` retourne FALSE |
| **employees** | ❓ Inconnu | Possiblement manquant |
| **tenant** | ❓ Inconnu | Pas de tenant associé |

---

## 🔒 **Impact sur les Policies RLS**

### **Exemple de Policy sur `tasks`**

```sql
CREATE POLICY "Users can view tasks in their tenant"
ON public.tasks
FOR SELECT
USING (
  tenant_id = public.get_current_tenant_id()
  OR public.user_has_role(ARRAY['super_admin'])
);
```

### **Évaluation pour Votre Utilisateur**

1. **`tenant_id = get_current_tenant_id()`**
   - ❌ FAUX : Pas de tenant_id défini
   
2. **`user_has_role(['super_admin'])`**
   - ❌ FAUX : Aucun rôle dans `user_roles`

3. **Résultat Final**
   - ❌ **ACCÈS REFUSÉ** : Les deux conditions sont fausses
   - HTTP 406 : Not Acceptable

---

## 🛠️ **Causes Possibles du Problème**

### **1. Invitation Non Complétée**
```sql
-- Vérifier si une invitation existe
SELECT * FROM invitations 
WHERE email = (SELECT email FROM auth.users WHERE id = '5c5731ce-75d0-4455-8184-bc42c626cb17');
```

**Si invitation existe mais status = 'pending'** :
- L'utilisateur a créé un compte mais le processus d'onboarding n'est pas terminé
- Les tables `profiles`, `user_roles`, `employees` n'ont pas été créées

### **2. Échec du Trigger `auto_create_tenant_owner`**
```sql
-- Le trigger devrait créer automatiquement :
-- 1. Tenant
-- 2. Profile
-- 3. User_role (tenant_admin)
-- 4. Employee
```

**Si le trigger a échoué** :
- Utilisateur créé dans `auth.users`
- Mais aucune donnée dans les tables publiques

### **3. Utilisateur Créé Manuellement**
- Créé via dashboard Supabase sans passer par le flow d'invitation
- Aucun processus d'onboarding exécuté

---

## ✅ **Solution : Réparer l'Utilisateur**

### **Option 1 : Utiliser la Fonction de Réparation**

```sql
-- Exécuter dans SQL Editor Supabase
SELECT repair_incomplete_users('5c5731ce-75d0-4455-8184-bc42c626cb17');
```

**Cette fonction va** :
1. Vérifier si un profil existe → Créer si manquant
2. Vérifier si un rôle existe → Créer si manquant
3. Vérifier si un employé existe → Créer si manquant
4. Vérifier si un tenant existe → Créer si manquant

### **Option 2 : Créer Manuellement les Données**

```sql
-- 1. Créer un tenant
INSERT INTO tenants (name, slug, owner_id)
VALUES ('Mon Entreprise', 'mon-entreprise', '5c5731ce-75d0-4455-8184-bc42c626cb17')
RETURNING id;

-- 2. Créer le profil (remplacer <tenant_id>)
INSERT INTO profiles (user_id, role, full_name)
VALUES (
  '5c5731ce-75d0-4455-8184-bc42c626cb17',
  'tenant_admin',
  'Nom Utilisateur'
);

-- 3. Créer le rôle (remplacer <tenant_id>)
INSERT INTO user_roles (user_id, role, tenant_id)
VALUES (
  '5c5731ce-75d0-4455-8184-bc42c626cb17',
  'tenant_admin',
  '<tenant_id>'
);

-- 4. Créer l'employé (remplacer <tenant_id>)
INSERT INTO employees (
  user_id, 
  tenant_id, 
  employee_id, 
  email, 
  first_name, 
  last_name,
  status
)
VALUES (
  '5c5731ce-75d0-4455-8184-bc42c626cb17',
  '<tenant_id>',
  'EMP001',
  (SELECT email FROM auth.users WHERE id = '5c5731ce-75d0-4455-8184-bc42c626cb17'),
  'Prénom',
  'Nom',
  'active'
);
```

---

## 🔍 **Diagnostic Complet (À Exécuter)**

### **Étape 1 : Vérifier l'État Actuel**

```sql
-- Exécuter la fonction de diagnostic
SELECT * FROM diagnose_user_access('5c5731ce-75d0-4455-8184-bc42c626cb17');
```

**Résultats Attendus** :
- `AUTH_USER` : OK ✅
- `PROFILE` : MISSING ❌
- `USER_ROLES` : MISSING ❌
- `EMPLOYEE` : MISSING ❌
- `TENANT` : MISSING ❌
- `RECOMMENDATION` : ACTION_REQUIRED ⚠️

### **Étape 2 : Appliquer la Réparation**

```sql
-- Réparer automatiquement
SELECT repair_incomplete_users('5c5731ce-75d0-4455-8184-bc42c626cb17');
```

### **Étape 3 : Vérifier le Résultat**

```sql
-- Re-vérifier après réparation
SELECT * FROM diagnose_user_access('5c5731ce-75d0-4455-8184-bc42c626cb17');
```

**Résultats Attendus Après Réparation** :
- `AUTH_USER` : OK ✅
- `PROFILE` : OK ✅
- `USER_ROLES` : OK ✅
- `EMPLOYEE` : OK ✅
- `TENANT` : OK ✅
- `TASKS_ACCESS` : ACCÈS LIMITÉ - Tenant XXX ✅

---

## 📊 **Schéma de Dépendances**

```
auth.users (✅ Existe)
    │
    ├─→ profiles (❌ Manquant)
    │       └─→ role: 'tenant_admin'
    │
    ├─→ user_roles (❌ Manquant)
    │       ├─→ role: 'tenant_admin'
    │       └─→ tenant_id: <UUID>
    │
    ├─→ employees (❌ Manquant)
    │       ├─→ employee_id: 'EMP001'
    │       └─→ tenant_id: <UUID>
    │
    └─→ tenants (❌ Manquant)
            ├─→ owner_id: user_id
            └─→ name: 'Mon Entreprise'
```

**Sans ces données** :
- ❌ `user_has_role()` retourne toujours `FALSE`
- ❌ Toutes les policies RLS bloquent l'accès
- ❌ HTTP 406 sur toutes les requêtes

---

## 🎯 **Prochaines Étapes**

1. **Déployer la migration 224** (fonction de diagnostic)
   ```bash
   supabase db push
   ```

2. **Exécuter le diagnostic** dans SQL Editor
   ```sql
   SELECT * FROM diagnose_user_access('5c5731ce-75d0-4455-8184-bc42c626cb17');
   ```

3. **Réparer l'utilisateur**
   ```sql
   SELECT repair_incomplete_users('5c5731ce-75d0-4455-8184-bc42c626cb17');
   ```

4. **Tester l'accès** dans l'application
   - Rafraîchir la page
   - Vérifier les logs : `🎯 Rôles récupérés pour l'utilisateur: Array [...]`
   - Accès aux tâches devrait fonctionner ✅

---

## 💡 **Résumé**

**Fonction `user_has_role()`** :
- ✅ Vérifie si l'utilisateur a un rôle spécifique dans le tenant actuel
- ✅ Utilisée dans toutes les policies RLS
- ❌ Retourne FALSE si aucun rôle dans `user_roles`

**Problème Actuel** :
- ❌ Utilisateur existe dans `auth.users`
- ❌ Mais aucune donnée dans `profiles`, `user_roles`, `employees`
- ❌ Résultat : Accès refusé partout (HTTP 406)

**Solution** :
- ✅ Utiliser `repair_incomplete_users()` pour créer les données manquantes
- ✅ L'utilisateur aura alors accès à l'application
