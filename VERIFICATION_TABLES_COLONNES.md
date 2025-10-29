# 📋 Vérification Tables et Colonnes - Base de Données Réelle

## ✅ **Tables Vérifiées**

### **Module RH**
- ✅ `employees` (pas `employee`)
- ✅ `absences` (pas `absence`)
- ✅ `employee_documents` (pas `documents`)
- ✅ `employee_payrolls` (pas `payrolls`)
- ✅ `attendances` (pas `attendance`)

### **Module Projets**
- ✅ `projects` (OK)
- ✅ `tasks` (OK)

### **Module Core**
- ✅ `profiles` (OK)
- ✅ `user_roles` (OK)
- ✅ `tenants` (OK)
- ✅ `invitations` (OK)

### **Module Recrutement**
- ✅ `job_posts` (pas `job_postings`)
- ✅ `candidates` (OK)
- ✅ `interviews` (OK)
- ✅ `job_applications` (OK)
- ✅ `job_offers` (OK)

### **Module Formations**
- ✅ `training_programs` (OK)
- ✅ `training_enrollments` (OK)

### **Module Évaluations**
- ✅ `evaluations` (pas `performance_reviews`)

### **Module Finances**
- ✅ `expense_reports` (pas `expenses`)
- ✅ `expense_items` (OK)
- ✅ `budgets` (OK)
- ✅ `invoices` (OK)

---

## 📊 **Colonnes Critiques Vérifiées**

### **Table: tasks**
```sql
tasks {
  id: UUID
  title: TEXT
  assigned_name: TEXT
  assignee_id: UUID          ← PAS "assigned_to" !
  start_date: DATE
  due_date: DATE
  priority: TEXT
  status: TEXT
  parent_id: UUID
  project_id: UUID
  tenant_id: UUID
  ...
}
```

### **Table: employees**
```sql
employees {
  id: UUID
  user_id: UUID
  tenant_id: UUID
  employee_id: TEXT
  first_name: TEXT
  last_name: TEXT
  email: TEXT
  status: TEXT
  ...
}
```

### **Table: employee_documents**
```sql
employee_documents {
  id: UUID
  employee_id: UUID
  tenant_id: UUID
  document_type: TEXT
  file_path: TEXT
  ...
}
```

### **Table: employee_payrolls**
```sql
employee_payrolls {
  id: UUID
  period_id: UUID
  employee_id: UUID
  tenant_id: UUID
  ...
}
```

---

## 🔧 **Corrections à Appliquer**

### **Migration 227 : Noms de Tables Corrigés**

| Utilisé (Incorrect) | Correct | Status |
|---------------------|---------|--------|
| `job_postings` | `job_posts` | ✅ Corrigé |
| `applications` | `job_applications` | ✅ Corrigé |
| `expenses` | `expense_reports` | ✅ Corrigé |
| `performance_reviews` | `evaluations` | ✅ Corrigé |
| `attendance` | `attendances` | ✅ Corrigé |

---

## ✅ **Tables Déjà Corrigées dans Migration 226**

| Utilisé (Incorrect) | Correct | Status |
|---------------------|---------|--------|
| `documents` | `employee_documents` | ✅ Corrigé |
| `payrolls` | `employee_payrolls` | ✅ Corrigé |

---

## ✅ **Colonnes Déjà Corrigées dans Migration 226**

| Utilisé (Incorrect) | Correct | Status |
|---------------------|---------|--------|
| `assigned_to` | `assignee_id` | ✅ Corrigé |
| `p.category` | `p.resource` + `p.action` | ✅ Corrigé |

---

## 🎯 **Prochaines Corrections Nécessaires**

### **Migration 227 - À Vérifier et Corriger**

1. **job_postings** → **job_posts**
2. **applications** → **job_applications**  
3. **expenses** → **expense_reports**

---

## 📝 **Commande de Vérification Complète**

```bash
# Vérifier toutes les tables
grep -E "CREATE TABLE.*\"public\"\." baseline_schema.sql | grep -oP '"\K[^"]+(?=")' | sort | uniq

# Vérifier les colonnes d'une table spécifique
grep -A 30 'CREATE TABLE IF NOT EXISTS "public"."tasks"' baseline_schema.sql
```

---

## ✅ **Résumé des Corrections**

### **Migration 226** ✅
- ✅ `documents` → `employee_documents`
- ✅ `payrolls` → `employee_payrolls`
- ✅ `assigned_to` → `assignee_id`
- ✅ `p.category` → `p.resource` + `p.action`
- ✅ `DROP FUNCTION` → `CREATE OR REPLACE`
- ✅ `is_super_admin()` → Paramètre optionnel
- ✅ `has_global_access()` → Paramètre optionnel

### **Migration 227** ⚠️
- ⚠️ À vérifier : `job_postings`, `applications`, `expenses`
- ⚠️ À corriger si nécessaire

---

**Ce document servira de référence pour toutes les futures migrations !**
