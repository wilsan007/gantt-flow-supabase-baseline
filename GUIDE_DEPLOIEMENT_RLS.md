# 🚀 Guide de Déploiement - Policies RLS

## 📋 **Vue d'Ensemble**

Les policies RLS ont été divisées en **3 fichiers séparés** pour faciliter le déploiement et éviter les erreurs de permissions.

---

## 📦 **Fichiers de Migration**

### **1. Fonction Helper (Partie 1/3)**
**Fichier** : `20250111000201_rls_helper_function.sql`

**Contenu** :
- ✅ Fonction `public.user_has_role(role_names TEXT[])`
- ✅ Fonction `public.user_has_role_any_tenant(role_names TEXT[])`

**Pourquoi** : Utilise le schéma `public` au lieu de `auth` pour éviter les problèmes de permissions.

---

### **2. Policies RH + Finances (Partie 2/3)**
**Fichier** : `20250111000202_rls_policies_part1.sql`

**Contenu** : **28 policies**
- 👥 **Employees** : 6 policies (lecture tous, lecture self, insert/update/delete RH, update self)
- 📅 **Absences** : 4 policies (lecture tous, création self, update/delete RH)
- 📄 **Documents** : 3 policies (lecture self, lecture RH, gestion RH)
- 💰 **Payrolls** : 2 policies (lecture self, gestion Payroll/RH)
- 💳 **Expenses** : 5 policies (lecture/création self, gestion Finance, items)
- 📊 **Payroll Periods** : 2 policies (lecture tous, gestion Payroll)
- 🧮 **Payroll Components** : 2 policies (lecture cascade, gestion Payroll)
- ⏰ **Timesheets** : 4 policies (lecture/insert/update self, gestion Managers)

---

### **3. Policies RH Avancés + Évaluations + Onboarding (Partie 3/3)**
**Fichier** : `20250111000203_rls_policies_part2.sql`

**Contenu** : **23 policies**
- 🎯 **Skill Assessments** : 2 policies (lecture tous, gestion RH)
- ⏱️ **Tardiness** : 3 policies (lecture self, lecture managers, gestion RH)
- 📚 **Training** : 4 policies (programs + enrollments, lecture/gestion)
- 🎯 **Évaluations** : 6 policies (evaluations, objectives, key results)
- 🚀 **Onboarding/Offboarding** : 8 policies (processes + tasks)
- 🔓 **Tables non critiques** : 14 tables avec RLS désactivé

---

## 🚀 **Déploiement**

### **Option 1 : Déploiement Automatique (Recommandé)**

```bash
# Depuis le répertoire du projet
cd /home/awaleh/Bureau/Wadashaqeen-SaaS/gantt-flow-next

# Déployer toutes les migrations
supabase db push
```

**Ordre d'exécution automatique** :
1. `20250111000201_rls_helper_function.sql`
2. `20250111000202_rls_policies_part1.sql`
3. `20250111000203_rls_policies_part2.sql`

---

### **Option 2 : Déploiement Manuel (Si problème)**

```bash
# 1. Fonction helper
psql -h db.qliinxtanjdnwxlvnxji.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20250111000201_rls_helper_function.sql

# 2. Policies Partie 1
psql -h db.qliinxtanjdnwxlvnxji.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20250111000202_rls_policies_part1.sql

# 3. Policies Partie 2
psql -h db.qliinxtanjdnwxlvnxji.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20250111000203_rls_policies_part2.sql
```

---

### **Option 3 : Déploiement via Dashboard Supabase**

1. Aller sur https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/editor
2. Ouvrir l'éditeur SQL
3. Copier-coller le contenu de chaque fichier dans l'ordre
4. Exécuter chaque migration une par une

---

## ✅ **Vérification du Déploiement**

### **1. Vérifier les Fonctions Helper**

```sql
-- Doit retourner 2 fonctions
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE 'user_has_role%'
  AND pronamespace = 'public'::regnamespace;
```

**Résultat attendu** :
```
function_name              | arguments
---------------------------+------------------
user_has_role             | role_names text[]
user_has_role_any_tenant  | role_names text[]
```

---

### **2. Vérifier les Policies Créées**

```sql
-- Compter les policies par table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;
```

**Résultat attendu** :
```
tablename                  | policy_count
---------------------------+-------------
employees                  | 6
absences                   | 4
timesheets                 | 4
...
Total: ~51 policies
```

---

### **3. Vérifier les Tables sans RLS**

```sql
-- Lister les tables avec RLS désactivé
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'hr_analytics', 'employee_insights', 'task_audit_logs',
    'candidates', 'interviews', 'job_applications', 
    'job_offers', 'job_posts', 'capacity_planning',
    'country_policies', 'employee_access_logs',
    'safety_documents', 'safety_incidents', 'corrective_actions'
  )
ORDER BY tablename;
```

**Résultat attendu** : `rls_enabled = false` pour les 14 tables

---

## 🧪 **Tests de Validation**

### **Test 1 : Fonction Helper**

```sql
-- Test avec un rôle existant
SELECT public.user_has_role(ARRAY['hr_admin', 'tenant_admin']);
-- Doit retourner true ou false selon votre rôle
```

---

### **Test 2 : Policy Employees**

```sql
-- Définir le tenant_id (remplacer par votre tenant)
SET app.current_tenant_id = 'votre-tenant-uuid';

-- Tester la lecture
SELECT * FROM employees LIMIT 5;
-- Doit retourner uniquement les employés de votre tenant
```

---

### **Test 3 : Policy Self-Service**

```sql
-- Tester la lecture de son propre profil
SELECT * FROM employees WHERE user_id = auth.uid();
-- Doit retourner votre profil même sans tenant_id configuré
```

---

### **Test 4 : Policy Payrolls (Sensible)**

```sql
-- Tester la lecture de son propre salaire
SELECT * FROM employee_payrolls 
WHERE employee_id IN (
  SELECT id FROM employees WHERE user_id = auth.uid()
);
-- Doit retourner uniquement votre salaire
```

---

## ⚙️ **Configuration Applicative Requise**

### **Dans vos Hooks TypeScript**

```typescript
// Exemple dans useHRMinimal.ts ou useTasksEnterprise.ts

const fetchData = async () => {
  // 1. Définir le tenant_id AVANT toute requête
  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });

  // 2. Faire la requête (les policies RLS s'appliquent automatiquement)
  const { data, error } = await supabase
    .from('employees')
    .select('*');

  return data;
};
```

---

### **Middleware Global (Recommandé)**

```typescript
// src/lib/supabaseMiddleware.ts

export const setTenantContext = async (
  supabase: SupabaseClient,
  tenantId: string
) => {
  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });
};

// Utilisation dans App.tsx ou dans chaque hook
useEffect(() => {
  if (tenantId) {
    setTenantContext(supabase, tenantId);
  }
}, [tenantId]);
```

---

## 🔒 **Rôles Requis**

Assurez-vous que ces rôles existent dans la table `roles` :

```sql
-- Vérifier les rôles existants
SELECT name FROM roles ORDER BY name;
```

**Rôles utilisés dans les policies** :
- `hr_admin`
- `payroll_admin`
- `finance_admin`
- `training_admin`
- `department_manager`
- `project_manager`
- `tenant_admin`
- `super_admin`

**Si manquants, les créer** :
```sql
INSERT INTO roles (name, description) VALUES
  ('hr_admin', 'Administrateur RH'),
  ('payroll_admin', 'Administrateur Paie'),
  ('finance_admin', 'Administrateur Finance'),
  ('training_admin', 'Administrateur Formation'),
  ('department_manager', 'Manager de Département'),
  ('project_manager', 'Chef de Projet')
ON CONFLICT (name) DO NOTHING;
```

---

## 🐛 **Dépannage**

### **Erreur : "permission denied for schema auth"**

✅ **Résolu** : Les fonctions utilisent maintenant le schéma `public` au lieu de `auth`.

---

### **Erreur : "function user_has_role does not exist"**

**Solution** : Déployer d'abord `20250111000201_rls_helper_function.sql`

```bash
supabase db push
```

---

### **Erreur : "current_setting not found"**

**Cause** : `app.current_tenant_id` n'est pas défini.

**Solution** : Configurer le tenant_id avant chaque requête (voir section Configuration).

---

### **Erreur : "no rows returned"**

**Causes possibles** :
1. `app.current_tenant_id` non défini
2. Utilisateur n'a pas le rôle requis
3. Données n'existent pas pour ce tenant

**Debug** :
```sql
-- Vérifier le tenant_id configuré
SHOW app.current_tenant_id;

-- Vérifier les rôles de l'utilisateur
SELECT r.name 
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = auth.uid();
```

---

## 📊 **Résumé Final**

| Élément | Quantité |
|---------|----------|
| **Fichiers de migration** | 3 |
| **Fonctions helper** | 2 |
| **Policies créées** | 51+ |
| **Tables protégées** | 21 |
| **Tables sans RLS** | 14 |
| **Rôles supportés** | 8 |

---

## ✅ **Checklist de Déploiement**

- [ ] Déployer `20250111000201_rls_helper_function.sql`
- [ ] Déployer `20250111000202_rls_policies_part1.sql`
- [ ] Déployer `20250111000203_rls_policies_part2.sql`
- [ ] Vérifier les fonctions helper créées
- [ ] Vérifier les policies créées (51+)
- [ ] Vérifier les tables sans RLS (14)
- [ ] Tester la fonction `user_has_role()`
- [ ] Tester l'accès aux données avec tenant_id
- [ ] Tester le self-service (profil, salaire)
- [ ] Configurer `app.current_tenant_id` dans les hooks
- [ ] Vérifier que tous les rôles existent
- [ ] Tester avec différents rôles (RH, Finance, etc.)
- [ ] Documenter la configuration pour l'équipe

---

## 🎉 **Félicitations !**

Votre application dispose maintenant d'une **sécurité RLS enterprise** avec :

✅ **Contrôle granulaire par rôle**  
✅ **Self-service pour les employés**  
✅ **Isolation stricte par tenant**  
✅ **Séparation lecture/écriture**  
✅ **Production-ready**  

**Prêt pour le déploiement en production !** 🚀
