# 🔐 Stratégie RLS (Row Level Security) - Guide Complet

## ⚠️ **PROBLÈME CRITIQUE DÉTECTÉ**

**35 tables ont RLS activé mais AUCUNE policy** → **Toutes les données sont BLOQUÉES** !

Quand RLS est activé sans policies, PostgreSQL **refuse TOUS les accès** par défaut.

---

## 📊 **Tables Concernées (35)**

### **Module RH (10 tables)**
```
❌ absences
❌ employee_access_logs
❌ employee_documents
❌ employee_insights
❌ employee_payrolls
❌ employees
❌ skill_assessments
❌ tardiness
❌ training_enrollments
❌ training_programs
```

### **Module Évaluations (4 tables)**
```
❌ evaluations
❌ key_results
❌ objectives
❌ hr_analytics
```

### **Module Recrutement (6 tables)**
```
❌ candidates
❌ interviews
❌ job_applications
❌ job_offers
❌ job_posts
❌ capacity_planning
```

### **Module Finances (5 tables)**
```
❌ expense_items
❌ expense_reports
❌ payroll_components
❌ payroll_periods
❌ timesheets
```

### **Module Onboarding (4 tables)**
```
❌ onboarding_processes
❌ onboarding_tasks
❌ offboarding_processes
❌ offboarding_tasks
```

### **Module Sécurité (4 tables)**
```
❌ corrective_actions
❌ safety_documents
❌ safety_incidents
❌ task_audit_logs
```

### **Autres (2 tables)**
```
❌ country_policies
❌ (autres modules)
```

---

## 🎯 **Stratégies de Résolution**

### **Option 1 : DÉSACTIVER RLS (Recommandé pour développement)**

**Avantages** :
- ✅ Déblocage immédiat de toutes les données
- ✅ Pas de complexité de policies
- ✅ Idéal pour développement/prototypage
- ✅ Sécurité assurée par les hooks (useHRMinimal, etc.)

**Inconvénients** :
- ⚠️ Pas de sécurité au niveau base de données
- ⚠️ Dépend de la sécurité applicative

**Quand utiliser** :
- Application en développement
- Sécurité gérée au niveau applicatif
- Pas d'accès direct à la base de données

---

### **Option 2 : CRÉER DES POLICIES (Recommandé pour production)**

**Avantages** :
- ✅ Sécurité maximale au niveau base de données
- ✅ Protection même en cas de bug applicatif
- ✅ Audit trail complet
- ✅ Conforme aux standards enterprise

**Inconvénients** :
- ⚠️ Complexité de configuration
- ⚠️ Maintenance des policies
- ⚠️ Risque de blocage si mal configuré

**Quand utiliser** :
- Application en production
- Données sensibles (RH, paie, etc.)
- Conformité réglementaire requise

---

## ✅ **MIGRATION CRÉÉE : Option 3 - Policies Granulaires**

**Fichier** : `20250111000200_configure_rls_policies_granular.sql`

### **Contenu de la Migration**

#### **1. Fonction Helper**
```sql
CREATE FUNCTION auth.has_role(role_names TEXT[])
-- Vérifie si l'utilisateur a un des rôles spécifiés
```

#### **2. Policies Créées (50+ policies)**

**Employees (4 policies)** :
- Lecture pour tous du tenant
- Lecture de son propre profil
- Écriture pour RH uniquement
- Mise à jour limitée de son profil

**Absences (3 policies)** :
- Lecture pour tous
- Création pour soi-même
- Gestion pour RH uniquement

**Documents (3 policies)** :
- Lecture de ses documents
- Lecture tous pour RH
- Gestion pour RH uniquement

**Payrolls (2 policies)** :
- Lecture de son propre salaire
- Accès complet pour Payroll/RH

**Expenses (5 policies)** :
- Lecture de ses rapports
- Création de ses rapports
- Gestion pour Finance
- Items liés aux rapports

**Timesheets (3 policies)** :
- Lecture de ses timesheets
- Gestion de ses timesheets
- Accès complet pour Managers

**Évaluations (6 policies)** :
- Objectives, Key Results, Evaluations
- Lecture/Écriture selon rôle

**Onboarding/Offboarding (8 policies)** :
- Accès RH uniquement

**Tables non critiques (14)** :
- RLS désactivé

---

## 🚀 **Solution Recommandée : Approche Hybride (ALTERNATIVE)**

### **Phase 1 : Développement (Maintenant)**

**Désactiver RLS sur les tables non critiques** :

```sql
-- Tables de développement/prototypage
ALTER TABLE capacity_planning DISABLE ROW LEVEL SECURITY;
ALTER TABLE country_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE hr_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_audit_logs DISABLE ROW LEVEL SECURITY;

-- Tables recrutement (si pas encore utilisées)
ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts DISABLE ROW LEVEL SECURITY;
```

**Créer des policies simples pour les tables critiques** :

```sql
-- Employees : Accès par tenant
CREATE POLICY "tenant_isolation" ON employees
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Absences : Accès par tenant
CREATE POLICY "tenant_isolation" ON absences
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Payrolls : Accès par tenant (données sensibles)
CREATE POLICY "tenant_isolation" ON employee_payrolls
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
```

---

### **Phase 2 : Production (Plus tard)**

**Policies granulaires par rôle** :

```sql
-- Employees : Lecture pour tous, écriture pour RH uniquement
CREATE POLICY "employees_read" ON employees
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

CREATE POLICY "employees_write" ON employees
  FOR INSERT, UPDATE, DELETE
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role_id IN (
          SELECT id FROM roles WHERE name IN ('hr_admin', 'tenant_admin')
        )
    )
  );

-- Payrolls : Accès RH uniquement
CREATE POLICY "payrolls_hr_only" ON employee_payrolls
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role_id IN (
          SELECT id FROM roles WHERE name IN ('hr_admin', 'payroll_admin')
        )
    )
  );
```

---

## 📝 **Migration Proposée**

### **Approche Pragmatique : Désactiver RLS Temporairement**

```sql
-- Migration: Désactiver RLS sur tables non critiques
-- Date: 2025-01-11
-- Description: Déblocage temporaire pour développement

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '🔓 Désactivation temporaire RLS pour développement...';
END $$;

-- ============================================
-- TABLES NON CRITIQUES (Désactiver RLS)
-- ============================================

-- Analytics & Insights (pas de données sensibles)
ALTER TABLE hr_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_audit_logs DISABLE ROW LEVEL SECURITY;

-- Recrutement (fonctionnalité pas encore active)
ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts DISABLE ROW LEVEL SECURITY;

-- Planning & Configuration
ALTER TABLE capacity_planning DISABLE ROW LEVEL SECURITY;
ALTER TABLE country_policies DISABLE ROW LEVEL SECURITY;

-- Sécurité (logs uniquement)
ALTER TABLE employee_access_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE safety_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents DISABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '✅ RLS désactivé sur 14 tables non critiques';
END $$;

-- ============================================
-- TABLES CRITIQUES (Créer policies simples)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Création de policies pour tables critiques...';
END $$;

-- Employees (données RH sensibles)
CREATE POLICY "tenant_isolation_employees" ON employees
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Absences
CREATE POLICY "tenant_isolation_absences" ON absences
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Employee Documents (documents sensibles)
CREATE POLICY "tenant_isolation_employee_documents" ON employee_documents
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Employee Payrolls (données financières sensibles)
CREATE POLICY "tenant_isolation_payrolls" ON employee_payrolls
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Skill Assessments
CREATE POLICY "tenant_isolation_skill_assessments" ON skill_assessments
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Tardiness
CREATE POLICY "tenant_isolation_tardiness" ON tardiness
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Training Enrollments
CREATE POLICY "tenant_isolation_training_enrollments" ON training_enrollments
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Training Programs
CREATE POLICY "tenant_isolation_training_programs" ON training_programs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Evaluations
CREATE POLICY "tenant_isolation_evaluations" ON evaluations
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Key Results
CREATE POLICY "tenant_isolation_key_results" ON key_results
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Objectives
CREATE POLICY "tenant_isolation_objectives" ON objectives
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Expense Items
CREATE POLICY "tenant_isolation_expense_items" ON expense_items
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Expense Reports
CREATE POLICY "tenant_isolation_expense_reports" ON expense_reports
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Payroll Components
CREATE POLICY "tenant_isolation_payroll_components" ON payroll_components
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Payroll Periods
CREATE POLICY "tenant_isolation_payroll_periods" ON payroll_periods
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Timesheets
CREATE POLICY "tenant_isolation_timesheets" ON timesheets
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Onboarding Processes
CREATE POLICY "tenant_isolation_onboarding_processes" ON onboarding_processes
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Onboarding Tasks
CREATE POLICY "tenant_isolation_onboarding_tasks" ON onboarding_tasks
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Offboarding Processes
CREATE POLICY "tenant_isolation_offboarding_processes" ON offboarding_processes
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Offboarding Tasks
CREATE POLICY "tenant_isolation_offboarding_tasks" ON offboarding_tasks
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DO $$
BEGIN
  RAISE NOTICE '✅ Policies créées sur 21 tables critiques';
END $$;

-- ============================================
-- RÉSUMÉ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CONFIGURATION RLS COMPLÉTÉE';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résumé:';
  RAISE NOTICE '   • Tables RLS désactivé: 14 (non critiques)';
  RAISE NOTICE '   • Tables avec policies: 21 (critiques)';
  RAISE NOTICE '   • Total traité: 35 tables';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Sécurité:';
  RAISE NOTICE '   ✅ Isolation par tenant sur toutes les tables critiques';
  RAISE NOTICE '   ✅ Données RH/Paie protégées';
  RAISE NOTICE '   ✅ Accès déblo qué pour développement';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Prochaines étapes:';
  RAISE NOTICE '   1. Tester l''accès aux données';
  RAISE NOTICE '   2. Configurer app.current_tenant_id dans les requêtes';
  RAISE NOTICE '   3. Implémenter policies granulaires en production';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

COMMIT;
```

---

## ⚙️ **Configuration Applicative Requise**

### **Définir le Tenant ID dans les Requêtes**

```typescript
// Dans votre hook useSupabase ou middleware
const setTenantContext = async (tenantId: string) => {
  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });
};

// Ou directement dans les requêtes
const { data } = await supabase
  .rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  })
  .then(() => supabase.from('employees').select('*'));
```

---

## 🎯 **Recommandation Finale**

### **Pour MAINTENANT (Développement)**

1. ✅ **Appliquer la migration proposée**
   - Désactive RLS sur tables non critiques
   - Crée policies simples sur tables critiques

2. ✅ **Configurer app.current_tenant_id**
   - Dans les hooks (useHRMinimal, useTasks, etc.)
   - Au niveau du middleware Supabase

3. ✅ **Tester l'accès aux données**
   - Vérifier que les requêtes fonctionnent
   - Confirmer l'isolation par tenant

### **Pour PLUS TARD (Production)**

1. **Policies granulaires par rôle**
   - Lecture/écriture séparées
   - Permissions basées sur user_roles

2. **Audit et monitoring**
   - Logs d'accès RLS
   - Métriques de sécurité

3. **Tests de sécurité**
   - Tentatives d'accès cross-tenant
   - Validation des permissions

---

## 📚 **Ressources**

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Best Practices Multi-Tenant](https://supabase.com/docs/guides/auth/row-level-security#multi-tenancy)

---

## ✅ **Checklist**

- [ ] Décider de la stratégie (désactiver vs policies)
- [ ] Appliquer la migration
- [ ] Configurer app.current_tenant_id
- [ ] Tester l'accès aux données
- [ ] Documenter la configuration
- [ ] Planifier les policies production

**Cette approche hybride débloque le développement tout en protégeant les données critiques !** 🔐
