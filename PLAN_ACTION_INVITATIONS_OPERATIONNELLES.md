# 🚀 PLAN D'ACTION - Invitations 100% Opérationnelles

**Date** : 31 octobre 2025 18:01 UTC+03:00  
**État** : Triggers supprimés ✅  
**Objectif** : Invitations parfaitement fonctionnelles

---

## ✅ ÉTAPE 1 - VÉRIFICATION (2 minutes)

### 1.1 Vérifier qu'il n'y a Plus de Triggers

**SQL à exécuter** :
```sql
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
```

**Résultat attendu** : `0 lignes` ✅

**Si des triggers apparaissent encore** :
```sql
DROP TRIGGER IF EXISTS "[nom_exact_du_trigger]" ON auth.users;
```

---

### 1.2 Vérifier Webhooks Dashboard (IMPORTANT)

1. Aller sur : https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji
2. **Database** → **Webhooks**
3. Chercher webhooks sur table `auth.users`
4. **Si trouvés** → **Désactiver** ou **Supprimer**

---

## 🚀 ÉTAPE 2 - DÉPLOIEMENT DES EDGE FUNCTIONS (5 minutes)

### 2.1 Vérifier les Fonctions Existantes

**Fonctions requises** :
- ✅ `send-invitation` (tenant owner)
- ✅ `send-collaborator-invitation` (collaborateur)
- ✅ `onboard-tenant-owner` (création tenant)
- ✅ `handle-collaborator-confirmation` (création profile collaborateur)

**Commande pour lister** :
```bash
cd /home/awaleh/Bureau/Wadashaqeen-SaaS/gantt-flow-next
supabase functions list
```

---

### 2.2 Redéployer les Fonctions (Si nécessaire)

**Si une fonction n'est pas déployée ou a été modifiée** :

```bash
# Pour send-invitation
supabase functions deploy send-invitation --no-verify-jwt

# Pour send-collaborator-invitation
supabase functions deploy send-collaborator-invitation --no-verify-jwt

# Pour onboard-tenant-owner
supabase functions deploy onboard-tenant-owner --no-verify-jwt

# Pour handle-collaborator-confirmation
supabase functions deploy handle-collaborator-confirmation --no-verify-jwt
```

**Note** : `--no-verify-jwt` permet d'appeler ces fonctions depuis le frontend

---

## 🧪 ÉTAPE 3 - TESTS COMPLETS (10 minutes)

### Test 1 : Invitation Collaborateur

**Procédure** :

1. **Se connecter en tant que Tenant Admin**
   - Email : [votre tenant admin]
   - Aller sur la page RH ou invitations

2. **Envoyer invitation collaborateur**
   - Email : `test-collaborateur@example.com`
   - Rôle : Collaborateur
   - Cliquer "Envoyer invitation"

3. **Vérifications** :
   ```
   ✅ Message "Invitation envoyée avec succès"
   ✅ AUCUNE erreur "Database error"
   ✅ Logs propres (F12 → Console)
   ```

4. **Vérifier en base de données** :
   ```sql
   -- Vérifier que l'invitation a été créée
   SELECT 
     email,
     invitation_type,
     status,
     tenant_id
   FROM invitations
   WHERE email = 'test-collaborateur@example.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   
   **Résultat attendu** :
   ```
   email: test-collaborateur@example.com
   invitation_type: collaborator
   status: pending
   tenant_id: [id du tenant]
   ```

5. **Vérifier que le user temporaire a été créé** :
   ```sql
   -- Vérifier user dans auth.users
   SELECT 
     id,
     email,
     email_confirmed_at,
     raw_user_meta_data
   FROM auth.users
   WHERE email = 'test-collaborateur@example.com';
   ```
   
   **Résultat attendu** :
   ```
   email: test-collaborateur@example.com
   email_confirmed_at: [une date] ✅
   raw_user_meta_data: {"temp_user": true, "invitation_type": "collaborator"}
   ```

6. **Simuler clic Magic Link** :
   - Ouvrir l'URL : `http://localhost:8080/auth/callback?invitation=collaborator&email=test-collaborateur@example.com`
   - Ou si email reçu, cliquer le lien

7. **Vérifications après clic** :
   ```
   ✅ Redirection vers /dashboard
   ✅ User connecté
   ✅ Profile créé
   ```

8. **Vérifier profile créé** :
   ```sql
   SELECT 
     user_id,
     full_name,
     tenant_id,
     role_name
   FROM profiles
   WHERE user_id IN (
     SELECT id FROM auth.users 
     WHERE email = 'test-collaborateur@example.com'
   );
   ```
   
   **Résultat attendu** :
   ```
   user_id: [id du user]
   tenant_id: [id du tenant] ✅
   role_name: collaborator ou employee
   ```

---

### Test 2 : Invitation Tenant Owner

**Procédure** :

1. **Se connecter en tant que Super Admin**
   - Email : [votre super admin]
   - Aller sur page invitations

2. **Envoyer invitation tenant owner**
   - Email : `test-owner@example.com`
   - Nom entreprise : "Test Company"
   - Cliquer "Envoyer invitation"

3. **Vérifications** :
   ```
   ✅ Message "Invitation envoyée avec succès"
   ✅ AUCUNE erreur "Database error"
   ✅ Logs propres
   ```

4. **Vérifier invitation créée** :
   ```sql
   SELECT 
     email,
     invitation_type,
     status,
     metadata
   FROM invitations
   WHERE email = 'test-owner@example.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   
   **Résultat attendu** :
   ```
   email: test-owner@example.com
   invitation_type: tenant_owner
   status: pending
   metadata: {"company_name": "Test Company"}
   ```

5. **Vérifier user temporaire** :
   ```sql
   SELECT 
     email,
     raw_user_meta_data
   FROM auth.users
   WHERE email = 'test-owner@example.com';
   ```
   
   **Résultat attendu** :
   ```
   raw_user_meta_data: {"temp_user": true, "invitation_type": "tenant_owner"}
   ```

6. **Simuler clic Magic Link** :
   - URL : `http://localhost:8080/auth/callback?invitation=tenant_owner&email=test-owner@example.com`

7. **Vérifications après clic** :
   ```
   ✅ Redirection vers /dashboard
   ✅ User connecté
   ✅ Nouveau tenant créé
   ✅ Profile créé
   ```

8. **Vérifier tenant créé** :
   ```sql
   -- Trouver le tenant
   SELECT 
     t.id,
     t.name,
     t.slug,
     p.user_id,
     p.role_name
   FROM tenants t
   JOIN profiles p ON p.tenant_id = t.id
   WHERE p.user_id IN (
     SELECT id FROM auth.users 
     WHERE email = 'test-owner@example.com'
   );
   ```
   
   **Résultat attendu** :
   ```
   name: Test Company ✅
   slug: test-company
   role_name: tenant_admin ✅
   ```

---

## 📊 ÉTAPE 4 - MONITORING (Continu)

### 4.1 Logs à Surveiller

**Console navigateur (F12)** :
```
✅ Rechercher : "TYPE: COLLABORATEUR" ou "TYPE: TENANT OWNER"
✅ Rechercher : "PROFIL CRÉÉ" ou "TENANT CRÉÉ"
❌ Pas d'erreur rouge
```

**Supabase Logs** :
1. Aller sur : https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/logs/edge-functions
2. Filtrer par fonction :
   - `send-collaborator-invitation`
   - `handle-collaborator-confirmation`
   - `send-invitation`
   - `onboard-tenant-owner`
3. Vérifier :
   ```
   ✅ Status 200
   ❌ Pas d'erreur 500
   ❌ Pas de "Database error"
   ```

---

### 4.2 Métriques de Succès

**Invitation collaborateur** :
- ✅ User temporaire créé
- ✅ Email envoyé
- ✅ Magic Link fonctionne
- ✅ Profile créé avec bon tenant_id
- ✅ Accès dashboard
- ✅ Pas d'erreur "Database error"

**Invitation tenant owner** :
- ✅ User temporaire créé
- ✅ Email envoyé
- ✅ Magic Link fonctionne
- ✅ Nouveau tenant créé
- ✅ Profile créé avec role tenant_admin
- ✅ Accès dashboard
- ✅ Pas d'erreur

---

## 🔧 ÉTAPE 5 - OPTIMISATIONS (Optionnel)

### 5.1 Améliorer les Messages d'Erreur

**Frontend** - Afficher messages clairs :
```typescript
// Dans useCollaboratorInvitation.ts ou similaire
catch (error) {
  if (error.message.includes('Database error')) {
    toast.error('Erreur système. Contactez le support.');
  } else if (error.message.includes('email already exists')) {
    toast.error('Cet email est déjà invité.');
  } else {
    toast.error('Erreur lors de l\'invitation.');
  }
}
```

---

### 5.2 Ajouter Validation Email

**Avant envoi invitation** :
```typescript
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

if (!isValidEmail(email)) {
  toast.error('Email invalide');
  return;
}
```

---

### 5.3 Ajouter Feedback Visuel

**Pendant traitement** :
```typescript
const [sending, setSending] = useState(false);

const handleSendInvitation = async () => {
  setSending(true);
  try {
    await sendInvitation(email);
    toast.success('Invitation envoyée !');
  } finally {
    setSending(false);
  }
};
```

---

## ✅ CHECKLIST FINALE

### Vérifications Techniques

- [ ] Aucun trigger sur auth.users
- [ ] Aucun webhook Dashboard sur auth.users
- [ ] Edge Functions déployées
- [ ] Logs Supabase propres

### Tests Fonctionnels

- [ ] Invitation collaborateur testée
  - [ ] User créé
  - [ ] Email reçu
  - [ ] Magic Link fonctionne
  - [ ] Profile créé (tenant existant)
  - [ ] Accès dashboard

- [ ] Invitation tenant owner testée
  - [ ] User créé
  - [ ] Email reçu
  - [ ] Magic Link fonctionne
  - [ ] Tenant créé
  - [ ] Profile créé (role admin)
  - [ ] Accès dashboard

### Validation Production

- [ ] Tests avec vrais emails
- [ ] Vérifier emails reçus (boîte mail réelle)
- [ ] Tester sur différents navigateurs
- [ ] Tester sur mobile

---

## 🎯 RÉSULTAT FINAL ATTENDU

### Système Complètement Opérationnel

```
┌──────────────────────────────────────────────┐
│  ✅ INVITATIONS 100% FONCTIONNELLES          │
│                                              │
│  Collaborateur :                             │
│  - Invitation envoyée ✅                     │
│  - Email reçu ✅                             │
│  - Magic Link fonctionne ✅                  │
│  - Profile créé (tenant existant) ✅         │
│  - Accès dashboard ✅                        │
│                                              │
│  Tenant Owner :                              │
│  - Invitation envoyée ✅                     │
│  - Email reçu ✅                             │
│  - Magic Link fonctionne ✅                  │
│  - Tenant créé ✅                            │
│  - Profile créé (role admin) ✅              │
│  - Accès dashboard ✅                        │
│                                              │
│  ❌ Plus d'erreur "Database error" ✅        │
└──────────────────────────────────────────────┘
```

---

## 🆘 EN CAS DE PROBLÈME

### Problème : "Database error" persiste

**Solution** :
1. Vérifier à nouveau les triggers (SQL ci-dessus)
2. Vérifier webhooks Dashboard
3. Consulter logs Edge Functions

---

### Problème : Email non reçu

**Solution** :
1. Vérifier spam
2. Vérifier configuration Resend (secrets Supabase)
3. Consulter logs `send-invitation` ou `send-collaborator-invitation`

---

### Problème : Magic Link ne fonctionne pas

**Solution** :
1. Vérifier URL contient `?invitation=type`
2. Vérifier AuthCallback.tsx déployé
3. Consulter logs console navigateur (F12)

---

### Problème : Profile non créé

**Solution** :
1. Vérifier fonction `handle-collaborator-confirmation` déployée
2. Vérifier fonction `onboard-tenant-owner` déployée
3. Consulter logs Edge Functions

---

## 📞 SUPPORT

**Si problème persiste** :

1. **Consulter logs** :
   - Console navigateur (F12)
   - Logs Supabase Edge Functions
   - SQL : `SELECT * FROM invitations ORDER BY created_at DESC LIMIT 10;`

2. **Vérifier base de données** :
   - Triggers : 0
   - Users créés : ✅
   - Invitations : status pending → accepted

3. **Partager informations** :
   - Message d'erreur exact
   - Logs console
   - Logs Supabase

---

**Suivez ce plan étape par étape pour avoir des invitations 100% fonctionnelles !** 🚀
