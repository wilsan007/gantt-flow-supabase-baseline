# 📧 Flux Invitation Collaborateur - Analyse Complète

**Date** : 30 octobre 2025  
**Objectif** : Documenter le flux complet d'invitation et d'acceptation collaborateur

---

## 🔄 Flux Complet : Invitation → Acceptation

### Vue d'Ensemble

```
┌──────────────────────────────────────────────────────┐
│  1. TENANT ADMIN                                     │
│     Envoie invitation via Interface RH               │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│  2. SYSTÈME                                          │
│     Crée record dans table invitations               │
│     Envoie email avec lien unique                    │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│  3. COLLABORATEUR                                    │
│     Clique sur lien dans email                       │
│     → Redirigé vers /invite?code=XXX                 │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│  4. InvitePage.tsx                                   │
│     Vérifie authentification                         │
│     Appelle Edge Function onboard-tenant-owner       │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│  5. EDGE FUNCTION                                    │
│     Valide invitation + email                        │
│     Appelle RPC onboard_tenant_owner()               │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│  6. FONCTION SQL                                     │
│     Crée/vérifie tenant                             │
│     Crée profile collaborateur                       │
│     Assigne rôle tenant_admin                        │
│     Marque invitation acceptée                       │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│  7. REDIRECTION                                      │
│     → /dashboard (utilisateur connecté)              │
└──────────────────────────────────────────────────────┘
```

---

## 📄 Composants du Flux

### 1. Page Invitation (`InvitePage.tsx`)

**Fichier** : `/src/pages/InvitePage.tsx`

**Rôle** : Point d'entrée quand le collaborateur clique sur le lien

**Flux** :
```typescript
useEffect(() => {
  // 1. Récupérer le code depuis l'URL
  const code = searchParams.get('code')
  
  // 2. Vérifier authentification
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session) {
    setError("Veuillez vous connecter pour poursuivre.")
    return
  }
  
  // 3. Appeler Edge Function
  const resp = await fetch(
    `${SUPABASE_URL}/functions/v1/onboard-tenant-owner`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    }
  )
  
  // 4. Rediriger vers dashboard
  navigate(`/dashboard`, { replace: true })
}, [code])
```

**États** :
- `idle` : Initial
- `auth` : Vérification authentification
- `calling` : Appel Edge Function
- `error` : Erreur

**Gestion Erreurs** :
- ❌ Pas de code → "Lien invalide"
- ❌ Pas de session → "Veuillez vous connecter" + Formulaire Auth
- ❌ Erreur serveur → Message d'erreur

---

### 2. Edge Function (`onboard-tenant-owner`)

**Fichier** : `/supabase/functions/onboard-tenant-owner/index.ts`

**Rôle** : Validation et orchestration du processus d'onboarding

**Sécurité** :
```typescript
// 1. Vérifier token d'authentification
const { data: { user }, error: userError } = 
  await supabaseAdmin.auth.getUser(token)

if (userError || !user) {
  return new Response('Unauthorized', { status: 401 })
}

// 2. Vérifier invitation valide
const { data: invitation, error: invitationError } = await supabaseAdmin
  .from('invitations')
  .select('*')
  .eq('id', code)
  .eq('status', 'pending')
  .is('accepted_at', null)
  .gt('expires_at', new Date().toISOString())
  .single()

// 3. Vérifier correspondance email
if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
  return new Response('Email mismatch', { status: 403 })
}
```

**Traitement** :
```typescript
// Appeler fonction SQL transactionnelle
const { data: result, error: rpcError } = await supabaseAdmin.rpc(
  'onboard_tenant_owner', 
  {
    p_user_id: user.id,
    p_email: user.email,
    p_slug: invitation.tenant_id,
    p_tenant_name: invitation.tenant_name || `Entreprise ${invitation.full_name}`,
    p_invite_code: invitation.id
  }
)
```

**Réponse** :
```json
{
  "success": true,
  "message": "Tenant owner onboarded successfully",
  "tenant_id": "uuid",
  "user_id": "uuid",
  "employee_id": "0001",
  "role_id": "uuid",
  "role_name": "tenant_admin",
  "job_title": "Propriétaire",
  "invitation_id": "uuid"
}
```

---

### 3. Fonction SQL (`onboard_tenant_owner`)

**Fichier** : `/fix-onboard-function-correct-columns.sql`

**Rôle** : Création transactionnelle du collaborateur

#### Étape 1 : Validation Invitation

```sql
-- Vérifier que l'invitation existe et est valide
SELECT * INTO v_invitation_record
FROM invitations
WHERE id = p_invite_code
AND status = 'pending'
AND expires_at > NOW();

IF NOT FOUND THEN
  RAISE EXCEPTION 'invalid_or_expired_invite';
END IF;

-- Vérifier que l'email correspond
IF v_invitation_record.email != p_email THEN
  RAISE EXCEPTION 'email_mismatch';
END IF;
```

#### Étape 2 : Vérifier Utilisateur Existant

```sql
-- Vérifier si l'utilisateur n'est pas déjà onboardé
IF EXISTS (SELECT 1 FROM profiles WHERE user_id = p_user_id) THEN
  -- Retourner les informations existantes
  SELECT tenant_id INTO v_tenant_id
  FROM profiles
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'User already onboarded',
    'tenant_id', v_tenant_id,
    'already_exists', true
  );
END IF;
```

#### Étape 3 : Créer/Vérifier Tenant

```sql
-- Utiliser le tenant_id de l'invitation ou créer un nouveau tenant
IF v_invitation_record.tenant_id IS NOT NULL THEN
  v_tenant_id := v_invitation_record.tenant_id;
  
  -- Vérifier si le tenant existe, sinon le créer
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = v_tenant_id) THEN
    INSERT INTO tenants (id, name, slug, status, settings)
    VALUES (
      v_tenant_id,
      COALESCE(v_invitation_record.tenant_name, p_tenant_name),
      p_slug,
      'active',
      '{}'
    );
  END IF;
ELSE
  -- Créer un nouveau tenant
  INSERT INTO tenants (name, slug, status, settings)
  VALUES (p_tenant_name, p_slug, 'active', '{}')
  RETURNING id INTO v_tenant_id;
END IF;
```

#### Étape 4 : Générer employee_id

```sql
-- Générer un employee_id unique (0001, 0002, etc.)
SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM '[0-9]+') AS INTEGER)), 0) + 1
INTO v_employee_id_counter
FROM profiles
WHERE tenant_id = v_tenant_id
AND employee_id IS NOT NULL
AND employee_id ~ '^[0-9]+$';

v_employee_id := LPAD(v_employee_id_counter::text, 4, '0');
-- Résultat: "0001", "0002", "0003"...
```

#### Étape 5 : Créer Profile

```sql
INSERT INTO profiles (
  id,                    -- = user_id
  user_id,
  tenant_id,
  full_name,
  email,
  employee_id,
  job_title,            -- "Propriétaire"
  hire_date,            -- CURRENT_DATE
  contract_type,        -- "CDI"
  weekly_hours,         -- 35
  role,                 -- "tenant_admin"
  created_at,
  updated_at
) VALUES (
  p_user_id,
  p_user_id,
  v_tenant_id,
  v_invitation_record.full_name,
  p_email,
  v_employee_id,
  'Propriétaire',
  CURRENT_DATE,
  'CDI',
  35,
  'tenant_admin',
  NOW(),
  NOW()
);
```

#### Étape 6 : Assigner Rôle

```sql
-- Obtenir l'ID du rôle tenant_admin
SELECT id INTO v_role_id
FROM roles
WHERE name = 'tenant_admin'
LIMIT 1;

-- Assigner le rôle dans user_roles
INSERT INTO user_roles (
  user_id,
  role_id,
  tenant_id,
  assigned_by,
  assigned_at,
  is_active
) VALUES (
  p_user_id,
  v_role_id,
  v_tenant_id,
  v_invitation_record.invited_by,
  NOW(),
  true
);
```

#### Étape 7 : Marquer Invitation Acceptée

```sql
UPDATE invitations
SET 
  status = 'accepted',
  accepted_at = NOW(),
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'onboarded_at', NOW(),
    'tenant_id', v_tenant_id,
    'profile_created', true
  )
WHERE id = p_invite_code;
```

---

## 🔐 Sécurité

### Validations Multiples

1. **Token JWT** : Utilisateur doit être authentifié
2. **Code invitation** : Doit exister et être valide
3. **Email matching** : Email invitation = Email utilisateur
4. **Status invitation** : Doit être `pending`
5. **Expiration** : `expires_at > NOW()`
6. **Accepted_at** : Doit être `NULL` (pas déjà acceptée)

### Protection Contre Abus

- ✅ **Idempotence** : Si déjà onboardé, retourne infos existantes
- ✅ **Transaction atomique** : Tout ou rien
- ✅ **Service Role Key** : Edge Function utilise service_role
- ✅ **RLS Bypass** : Fonction SQL en `SECURITY DEFINER`

---

## 📊 Données Créées

### Table `profiles`

| Champ | Valeur | Source |
|-------|--------|--------|
| `id` | UUID | = `user_id` |
| `user_id` | UUID | Utilisateur authentifié |
| `tenant_id` | UUID | Depuis invitation ou créé |
| `full_name` | String | Depuis invitation |
| `email` | String | Utilisateur authentifié |
| `employee_id` | String | Auto-généré (0001, 0002...) |
| `job_title` | String | "Propriétaire" |
| `hire_date` | Date | CURRENT_DATE |
| `contract_type` | String | "CDI" |
| `weekly_hours` | Integer | 35 |
| `role` | String | "tenant_admin" |

### Table `user_roles`

| Champ | Valeur | Source |
|-------|--------|--------|
| `user_id` | UUID | Utilisateur authentifié |
| `role_id` | UUID | ID du rôle "tenant_admin" |
| `tenant_id` | UUID | Tenant créé/existant |
| `assigned_by` | UUID | Inviteur (depuis invitation) |
| `assigned_at` | Timestamp | NOW() |
| `is_active` | Boolean | `true` |

### Table `invitations` (Mise à jour)

| Champ | Avant | Après |
|-------|-------|-------|
| `status` | "pending" | "accepted" |
| `accepted_at` | NULL | NOW() |
| `metadata` | {} | `{ onboarded_at, tenant_id, profile_created }` |

---

## 🧪 Tests de Validation

### Test 1 : Lien Valide

```
✅ Code valide
✅ Invitation pending
✅ Pas expirée
✅ Email match
✅ User authentifié
→ SUCCÈS : Onboarding complet
```

### Test 2 : Lien Expiré

```
❌ expires_at < NOW()
→ ERREUR : "Invalid or expired invite"
```

### Test 3 : Email Mismatch

```
❌ invitation.email ≠ user.email
→ ERREUR : "Email mismatch"
```

### Test 4 : User Déjà Onboardé

```
✅ Profile existe déjà
→ SUCCÈS : Retourne infos existantes
```

### Test 5 : Invitation Déjà Acceptée

```
❌ status = "accepted"
→ ERREUR : "Invalid or expired invite"
```

---

## 🔄 Flux Alternatifs

### Cas 1 : User Pas Authentifié

```
User clique lien → /invite?code=XXX
→ InvitePage détecte pas de session
→ Affiche formulaire Auth
→ User se connecte
→ Page recharge
→ Processus continue normalement
```

### Cas 2 : User Déjà Onboardé

```
User clique lien → /invite?code=XXX
→ Edge Function valide
→ SQL détecte profile existant
→ Retourne tenant_id existant
→ Redirection dashboard
```

### Cas 3 : Invitation Invalide

```
User clique lien → /invite?code=INVALID
→ Edge Function valide
→ SQL ne trouve pas invitation
→ EXCEPTION "invalid_or_expired_invite"
→ Affiche erreur à l'utilisateur
```

---

## 📝 Logs Attendus

### Succès

```
🚀 Edge Function: onboard-tenant-owner démarrée
✅ Utilisateur authentifié: user@example.com
📧 Code d'invitation reçu: uuid
✅ Invitation trouvée: user@example.com
✅ Email vérifié, appel RPC onboard_tenant_owner...
✅ Onboarding réussi: { success: true, tenant_id: "uuid", ... }
```

### Échec Authentification

```
🚀 Edge Function: onboard-tenant-owner démarrée
❌ Token manquant
→ Response: 401 Unauthorized
```

### Échec Email Mismatch

```
🚀 Edge Function: onboard-tenant-owner démarrée
✅ Utilisateur authentifié: user@example.com
📧 Code d'invitation reçu: uuid
✅ Invitation trouvée: other@example.com
❌ Email ne correspond pas: other@example.com vs user@example.com
→ Response: 403 Email mismatch
```

---

## 🎯 Points Clés

### ✅ Sécurité Maximale
- Authentification requise
- Validation email stricte
- Protection contre réutilisation
- Transaction atomique

### ✅ Idempotence
- Peut être appelé plusieurs fois
- Si déjà onboardé, retourne infos
- Pas de duplication données

### ✅ Traçabilité
- Logs Edge Function
- Métadonnées invitation
- assigned_by dans user_roles

### ✅ Expérience Utilisateur
- Messages d'erreur clairs
- Formulaire auth si nécessaire
- Redirection automatique dashboard

---

## 🔧 Maintenance

### Vérifier Invitation

```sql
SELECT 
  id,
  email,
  full_name,
  status,
  tenant_id,
  expires_at,
  accepted_at
FROM invitations
WHERE email = 'user@example.com';
```

### Vérifier Onboarding

```sql
SELECT 
  p.user_id,
  p.email,
  p.tenant_id,
  p.employee_id,
  p.job_title,
  ur.role_id,
  r.name as role_name
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.user_id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE p.email = 'user@example.com';
```

### Réinitialiser Invitation

```sql
-- Si besoin de réenvoyer invitation
UPDATE invitations
SET 
  status = 'pending',
  accepted_at = NULL,
  expires_at = NOW() + INTERVAL '7 days'
WHERE id = 'invitation-uuid';
```

---

## 📄 Fichiers Concernés

### Frontend
1. `/src/pages/InvitePage.tsx` - Page acceptation invitation
2. `/src/components/Auth.tsx` - Formulaire authentification

### Backend
3. `/supabase/functions/onboard-tenant-owner/index.ts` - Edge Function
4. `/fix-onboard-function-correct-columns.sql` - Fonction SQL

### Database
5. `invitations` - Table invitations
6. `profiles` - Table profils collaborateurs
7. `user_roles` - Table rôles utilisateurs
8. `tenants` - Table organisations

---

**Résumé** : Le flux d'invitation collaborateur est **sécurisé**, **transactionnel**, et **traçable**. Toutes les validations sont en place pour garantir l'intégrité des données.
