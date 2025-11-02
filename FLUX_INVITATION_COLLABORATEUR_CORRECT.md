# 📧 Flux Invitation Collaborateur - DOCUMENTATION CORRECTE

**Date** : 30 octobre 2025  
**Contexte** : Tenant Admin invite ses employés/collaborateurs

---

## ⚠️ DIFFÉRENCE IMPORTANTE

### Deux Flux Distincts

| Type | Fonction | Quand | Action |
|------|----------|-------|--------|
| **Tenant Owner** | `onboard-tenant-owner` | Première personne qui crée l'organisation | ✅ **Crée le tenant** |
| **Collaborateur** | `handle-collaborator-confirmation` | Employés invités par le tenant admin | ❌ **Ne crée PAS de tenant** |

**Cette documentation concerne uniquement les COLLABORATEURS.**

---

## 🔄 Flux Complet Collaborateur

```
┌──────────────────────────────────────────────────────────┐
│  1. TENANT ADMIN (dans son dashboard)                    │
│     → Module RH                                          │
│     → Invite Collaborateur                               │
│     → Remplit formulaire (nom, email, rôle, poste...)   │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  2. SYSTÈME                                              │
│     → Crée record dans table 'invitations'              │
│       - status: 'pending'                                │
│       - invitation_type: 'collaborator'                  │
│       - tenant_id: ID du tenant existant                 │
│       - role_to_assign: rôle spécifié                    │
│     → Envoie email au collaborateur                      │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  3. COLLABORATEUR                                        │
│     → Reçoit email                                       │
│     → Clique sur magic link                              │
│     → Authentifié automatiquement (Supabase)             │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  4. WEBHOOK SUPABASE                                     │
│     → Détecte auth.users UPDATE                          │
│     → Déclenche Edge Function automatiquement            │
│     → handle-collaborator-confirmation                   │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  5. EDGE FUNCTION                                        │
│     → Valide type 'collaborator'                         │
│     → Vérifie 6 éléments d'invitation                    │
│     → Confirme email automatiquement                     │
│     → Lance processus de création profil                 │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  6. CRÉATION PROFIL COLLABORATEUR                        │
│     ✅ Vérifie tenant existe (pas de création)           │
│     ✅ Attribution rôle spécifié (user_roles)            │
│     ✅ Création profile                                  │
│     ✅ Génération employee_id unique (EMP001...)         │
│     ✅ Création employee                                 │
│     ✅ Marque invitation acceptée                        │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  7. COLLABORATEUR CONNECTÉ                               │
│     → Accès à son dashboard                              │
│     → Permissions selon son rôle                         │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Étapes Détaillées de la Fonction

### Étape 1 : Protection Anti-Boucle ⚠️

**Code** :
```typescript
// Vérifier si déjà traité
const alreadyProcessed = user?.raw_user_meta_data?.collaborator_confirmed_automatically;
const hasValidatedElements = user?.raw_user_meta_data?.validated_elements;

if (alreadyProcessed && hasValidatedElements) {
  console.log('🛑 PROTECTION ANTI-BOUCLE ACTIVÉE');
  return { already_processed: true };
}
```

**Pourquoi ?**
- Les webhooks Supabase peuvent se déclencher plusieurs fois
- Évite la création de doublons
- Si déjà traité → Arrêt immédiat

---

### Étape 2 : Vérification Type Invitation

**Code** :
```typescript
const invitationType = user?.raw_user_meta_data?.invitation_type;

// Cette fonction ne traite QUE les collaborateurs
if (invitationType !== 'collaborator') {
  return { message: 'Type invitation non géré' };
}
```

**Types possibles** :
- `tenant_owner` → Traité par `handle-email-confirmation`
- `collaborator` → Traité par `handle-collaborator-confirmation` ✅

---

### Étape 3 : Validation 6 Éléments Critiques

**Éléments validés** :

```typescript
1. ✅ Nom complet (full_name)
   - Doit exister
   - Minimum 2 caractères

2. ✅ Type invitation = 'collaborator'
   - Doit être exactement 'collaborator'

3. ✅ Flag temp_user = true
   - Indique compte temporaire

4. ✅ Mot de passe temporaire (temp_password)
   - Minimum 8 caractères
   - Généré par le système

5. ✅ Tenant ID (tenant_id)
   - ID du tenant EXISTANT
   - ❌ PAS de création de tenant

6. ✅ Rôle à assigner (role_to_assign)
   - Nom du rôle spécifié par l'admin
   - Ex: 'employee', 'hr_manager', etc.
```

**Si validation échoue** :
```json
{
  "success": false,
  "error": "Données d'invitation invalides",
  "validation_errors": [
    "1. Nom complet manquant",
    "5. ID tenant manquant"
  ]
}
```

---

### Étape 4 : Recherche Invitation Correspondante

**Code** :
```typescript
const { data: pendingInvitation } = await supabaseAdmin
  .from('invitations')
  .select('*')
  .eq('email', user.email)
  .eq('invitation_type', 'collaborator')
  .eq('status', 'pending')
  .single();
```

**Données récupérées** :
```javascript
{
  id: "uuid",
  email: "collaborateur@example.com",
  full_name: "Jean Dupont",
  invitation_type: "collaborator",
  status: "pending",
  tenant_id: "uuid-tenant-existant",  // ⚠️ EXISTANT
  role_to_assign: "employee",
  department: "RH",
  job_position: "Responsable Recrutement",
  invited_by: "uuid-tenant-admin"
}
```

---

### Étape 5 : Confirmation Email Automatique

**Code** :
```typescript
await supabaseAdmin.auth.admin.updateUserById(user.id, {
  user_metadata: {
    ...user.raw_user_meta_data,
    collaborator_confirmed_automatically: true,  // ⚠️ FLAG ANTI-BOUCLE
    confirmation_method: 'collaborator_auto_confirm',
    confirmed_at: new Date().toISOString(),
    validation_completed: true,
    invitation_processed: true,
    simulated_email_confirmed_at: new Date().toISOString(),
    validated_elements: {
      full_name,
      invitation_type: 'collaborator',
      tenant_id,
      role_to_assign,
      invited_by_id
    }
  }
});
```

**Résultat** :
- Email considéré comme confirmé
- Flag anti-boucle activé
- Métadonnées sauvegardées

---

### Étape 6 : Vérification Profil Existant

**Code** :
```typescript
const { data: existingProfile } = await supabaseAdmin
  .from('profiles')
  .select('id, tenant_id')
  .eq('user_id', user.id)
  .single();

if (existingProfile) {
  // Profil existe déjà → Arrêt (évite doublon)
  return {
    success: true,
    message: 'Profil déjà existant',
    already_completed: true
  };
}
```

**Protection supplémentaire** contre doublons.

---

### Étape 7 : Vérification Tenant Existe

**Code** :
```typescript
const { data: tenantData, error: tenantError } = await supabaseAdmin
  .from('tenants')
  .select('id, name, status')
  .eq('id', pendingInvitation.tenant_id)
  .single();

if (tenantError || !tenantData) {
  return {
    success: false,
    error: 'Le tenant n\'existe pas'
  };
}
```

**⚠️ IMPORTANT** :
- Le tenant DOIT déjà exister
- Cette fonction NE CRÉE PAS de tenant
- Si tenant n'existe pas → Erreur

---

### Étape 8 : Récupération Rôle à Assigner

**Code** :
```typescript
const { data: role } = await supabaseAdmin
  .from('roles')
  .select('id, name, display_name')
  .eq('name', pendingInvitation.role_to_assign)
  .single();
```

**Rôles possibles** :
- `employee` - Employé basique
- `hr_manager` - Manager RH
- `project_manager` - Chef de projet
- `finance_manager` - Manager Finance
- ❌ PAS `tenant_admin` (réservé au propriétaire)
- ❌ PAS `super_admin` (système uniquement)

---

### Étape 9 : Attribution du Rôle

**Code** :
```typescript
// Vérifier si rôle existe déjà
const { data: existingRole } = await supabaseAdmin
  .from('user_roles')
  .select('id')
  .eq('user_id', user.id)
  .eq('role_id', role.id)
  .eq('tenant_id', pendingInvitation.tenant_id)
  .single();

// Si n'existe pas, créer
if (!existingRole) {
  await supabaseAdmin
    .from('user_roles')
    .insert({
      user_id: user.id,
      role_id: role.id,
      tenant_id: pendingInvitation.tenant_id,
      is_active: true
    });
}
```

**Résultat** :
- L'utilisateur obtient le rôle spécifié
- Lié au tenant existant
- `is_active: true`

---

### Étape 10 : Création Profile

**Code** :
```typescript
await supabaseAdmin
  .from('profiles')
  .upsert({
    user_id: user.id,
    tenant_id: pendingInvitation.tenant_id,
    full_name: pendingInvitation.full_name,
    email: user.email,
    role: pendingInvitation.role_to_assign
  }, {
    onConflict: 'user_id'  // Si existe → Update
  });
```

**Données créées** :

| Champ | Valeur |
|-------|--------|
| `user_id` | UUID utilisateur |
| `tenant_id` | UUID tenant **EXISTANT** |
| `full_name` | "Jean Dupont" |
| `email` | "jean@example.com" |
| `role` | "employee" |

---

### Étape 11 : Génération employee_id Unique

**Code** :
```typescript
// Récupérer tous les employee_id existants
const { data: existingEmployees } = await supabaseAdmin
  .from('employees')
  .select('employee_id')
  .like('employee_id', 'EMP%');

// Extraire les numéros utilisés
const usedNumbers = new Set();
existingEmployees.forEach(emp => {
  const match = emp.employee_id.match(/^EMP(\d{3})$/);
  if (match) {
    usedNumbers.add(parseInt(match[1]));
  }
});

// Trouver le prochain numéro libre
let nextNumber = 1;
while (usedNumbers.has(nextNumber)) {
  nextNumber++;
}

// Générer employee_id
const employeeId = `EMP${String(nextNumber).padStart(3, '0')}`;
// Résultat: EMP001, EMP002, EMP003, etc.
```

**Algorithme** :
1. Liste tous les IDs existants (EMP001, EMP002...)
2. Trouve les trous (si EMP002 supprimé, réutilise ce numéro)
3. Génère le prochain ID unique

---

### Étape 12 : Création Employee

**Code** :
```typescript
await supabaseAdmin
  .from('employees')
  .insert({
    user_id: user.id,
    tenant_id: pendingInvitation.tenant_id,
    employee_id: employeeId,                    // EMP001
    full_name: pendingInvitation.full_name,
    email: user.email,
    department: pendingInvitation.department,    // "RH"
    job_position: pendingInvitation.job_position, // "Responsable Recrutement"
    status: 'active',
    hire_date: new Date().toISOString().split('T')[0]
  });
```

**Données créées** :

| Champ | Valeur |
|-------|--------|
| `employee_id` | "EMP001" |
| `full_name` | "Jean Dupont" |
| `department` | "RH" (depuis invitation) |
| `job_position` | "Responsable Recrutement" |
| `status` | "active" |
| `hire_date` | Date du jour |

---

### Étape 13 : Marquer Invitation Acceptée

**Code** :
```typescript
await supabaseAdmin
  .from('invitations')
  .update({
    status: 'accepted',
    accepted_at: new Date().toISOString()
  })
  .eq('id', pendingInvitation.id);
```

**Résultat** :
- `status: 'pending'` → `'accepted'`
- `accepted_at` renseigné
- Invitation ne peut plus être réutilisée

---

## 📊 Données Créées - Résumé

### Table `profiles`

```sql
INSERT INTO profiles (
  user_id,                  -- UUID utilisateur
  tenant_id,                -- UUID tenant EXISTANT
  full_name,                -- "Jean Dupont"
  email,                    -- "jean@example.com"
  role                      -- "employee"
);
```

### Table `user_roles`

```sql
INSERT INTO user_roles (
  user_id,                  -- UUID utilisateur
  role_id,                  -- UUID du rôle 'employee'
  tenant_id,                -- UUID tenant EXISTANT
  is_active                 -- true
);
```

### Table `employees`

```sql
INSERT INTO employees (
  user_id,                  -- UUID utilisateur
  tenant_id,                -- UUID tenant EXISTANT
  employee_id,              -- "EMP001" (auto-généré)
  full_name,                -- "Jean Dupont"
  email,                    -- "jean@example.com"
  department,               -- "RH" (depuis invitation)
  job_position,             -- "Responsable Recrutement"
  status,                   -- "active"
  hire_date                 -- Date du jour
);
```

### Table `invitations` (Update)

```sql
UPDATE invitations
SET 
  status = 'accepted',      -- 'pending' → 'accepted'
  accepted_at = NOW()
WHERE id = invitation_id;
```

---

## 🔐 Sécurité & Validations

### 6 Validations Critiques

| # | Validation | Détail |
|---|------------|--------|
| 1 | **Nom complet** | Minimum 2 caractères |
| 2 | **Type invitation** | Exactement 'collaborator' |
| 3 | **Flag temp_user** | Doit être `true` |
| 4 | **Mot de passe** | Minimum 8 caractères |
| 5 | **Tenant ID** | Doit exister en base |
| 6 | **Rôle** | Doit exister en base |

### Protections Multiples

1. ✅ **Anti-boucle** : Flag `collaborator_confirmed_automatically`
2. ✅ **Anti-doublon** : Vérification profil existant
3. ✅ **Tenant existe** : Erreur si tenant introuvable
4. ✅ **Rôle valide** : Erreur si rôle invalide
5. ✅ **Invitation unique** : Status changed to 'accepted'

---

## 🆚 Différences avec Tenant Owner

| Aspect | Tenant Owner | Collaborateur |
|--------|--------------|---------------|
| **Fonction** | `onboard-tenant-owner` | `handle-collaborator-confirmation` |
| **Crée tenant** | ✅ OUI | ❌ NON (doit exister) |
| **Rôle** | `tenant_admin` (fixe) | Variable (spécifié) |
| **Employee ID** | `0001` (premier) | `EMP001, EMP002...` |
| **Déclenchement** | Click lien manuel | Webhook automatique |
| **Tables créées** | tenants, profiles, user_roles | profiles, user_roles, employees |

---

## 🧪 Cas de Tests

### Test 1 : Invitation Valide ✅

```
✅ Invitation type 'collaborator'
✅ Status 'pending'
✅ Tenant existe
✅ Rôle valide
✅ 6 validations passées
→ SUCCÈS : Profil créé, employee_id EMP001
```

### Test 2 : Tenant Inexistant ❌

```
✅ Invitation valide
❌ Tenant ID n'existe pas en base
→ ERREUR : "Le tenant n'existe pas"
```

### Test 3 : Rôle Invalide ❌

```
✅ Invitation valide
✅ Tenant existe
❌ role_to_assign = "role_inexistant"
→ ERREUR : "Rôle invalide"
```

### Test 4 : Profil Déjà Existant ✅

```
✅ Invitation valide
✅ Profil existe déjà pour cet user_id
→ SUCCÈS : Retourne infos existantes (pas de doublon)
```

### Test 5 : Protection Anti-Boucle ✅

```
✅ Flag collaborator_confirmed_automatically = true
✅ validated_elements présent
→ ARRÊT : "Déjà traité - Protection anti-boucle"
```

---

## 📝 Logs Attendus

### Succès Complet

```
🚀 Edge Function: handle-collaborator-confirmation démarrée
🔒 VÉRIFICATION ANTI-BOUCLE...
   - Déjà traité: NON
✅ Protection anti-boucle OK
📋 Type d'invitation: collaborator
✅ Type collaborateur confirmé
🔍 VALIDATION DES DONNÉES...
   - Nom complet: Jean Dupont
   - Tenant ID: uuid-tenant
   - Rôle: employee
✅ Toutes les validations passées
🔄 CONFIRMATION EMAIL AUTOMATIQUE...
✅ Email confirmé (simulation)
🔍 Vérification profil existant...
✅ Aucun doublon
🏢 Vérification tenant...
✅ Tenant trouvé: Acme Corp
🔍 Recherche rôle: employee
✅ Rôle trouvé: Employé
👤 Attribution du rôle...
✅ Rôle attribué
📋 Création profil...
✅ Profil créé
🔢 Génération employee_id...
✅ Employee ID: EMP001
👔 Création employé...
✅ Employé créé
✔️ Marquage invitation...
✅ Invitation acceptée

🎉 PROCESSUS TERMINÉ AVEC SUCCÈS !
   - User ID: uuid
   - Email: jean@example.com
   - Tenant: Acme Corp
   - Rôle: Employé
   - Employee ID: EMP001
```

### Échec Tenant Inexistant

```
🚀 Edge Function démarrée
✅ Validations passées
🏢 Vérification tenant...
❌ Tenant non trouvé: uuid-inexistant
→ Response: 400 Le tenant n'existe pas
```

---

## 🔄 Déclenchement Automatique

### Webhook Supabase

**Configuration** :
```sql
CREATE TRIGGER handle_collaborator_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at
    OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
  )
  EXECUTE FUNCTION handle_collaborator_confirmation_webhook();
```

**Flux** :
1. Collaborateur clique sur magic link
2. Supabase authentifie utilisateur
3. `auth.users` UPDATE → email_confirmed_at changé
4. Trigger se déclenche
5. Appel webhook → Edge Function
6. Fonction traite automatiquement

**Avantage** : Totalement automatique, collaborateur n'a rien à faire !

---

## 📄 Fichiers Concernés

### Backend
1. `/supabase/functions/handle-collaborator-confirmation/index.ts` - Edge Function principale
2. Trigger SQL - Webhook automatique

### Database
3. `invitations` - Table invitations (invitation_type: 'collaborator')
4. `profiles` - Profil collaborateur
5. `user_roles` - Attribution rôle
6. `employees` - Données RH complètes
7. `tenants` - Tenant EXISTANT (pas créé)

---

## 🎯 Points Clés à Retenir

### ✅ Pour les Collaborateurs

1. **Tenant doit déjà exister** - Pas de création
2. **Rôle variable** - Spécifié par l'admin inviteur
3. **Employee ID auto** - EMP001, EMP002, etc.
4. **Déclenchement automatique** - Via webhook
5. **Protection anti-boucle** - Évite doublons
6. **Département & poste** - Depuis invitation
7. **Validation stricte** - 6 éléments critiques

### ❌ Ce Que Cette Fonction NE FAIT PAS

1. ❌ Ne crée PAS de tenant
2. ❌ Ne donne PAS accès tenant_admin
3. ❌ N'envoie PAS d'email (déjà envoyé)
4. ❌ Ne gère PAS les tenant owners

---

## 🔧 Maintenance

### Vérifier Invitation Collaborateur

```sql
SELECT 
  id,
  email,
  full_name,
  invitation_type,
  status,
  tenant_id,
  role_to_assign,
  department,
  job_position,
  invited_by,
  expires_at,
  accepted_at
FROM invitations
WHERE 
  email = 'collaborateur@example.com'
  AND invitation_type = 'collaborator';
```

### Vérifier Profil Créé

```sql
SELECT 
  p.user_id,
  p.email,
  p.full_name,
  p.tenant_id,
  t.name as tenant_name,
  e.employee_id,
  e.department,
  e.job_position,
  ur.role_id,
  r.name as role_name
FROM profiles p
LEFT JOIN tenants t ON t.id = p.tenant_id
LEFT JOIN employees e ON e.user_id = p.user_id
LEFT JOIN user_roles ur ON ur.user_id = p.user_id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE p.email = 'collaborateur@example.com';
```

### Debug Webhook

```sql
-- Vérifier si webhook configuré
SELECT * FROM pg_trigger 
WHERE tgname LIKE '%collaborator%';

-- Logs Edge Function
-- Consulter Supabase Dashboard > Edge Functions > Logs
```

---

## 📌 Résumé Exécutif

**La fonction `handle-collaborator-confirmation` :**

1. ✅ **S'exécute automatiquement** via webhook
2. ✅ **Valide 6 éléments** critiques d'invitation
3. ✅ **Vérifie tenant existe** (ne le crée PAS)
4. ✅ **Attribue rôle spécifié** (variable)
5. ✅ **Crée profile + employee** avec données RH
6. ✅ **Génère employee_id unique** (EMP001...)
7. ✅ **Marque invitation acceptée**
8. ✅ **Protège contre doublons** et boucles

**C'est la fonction correcte pour les collaborateurs invités par le tenant admin !**
