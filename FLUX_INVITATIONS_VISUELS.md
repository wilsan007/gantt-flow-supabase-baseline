# 📊 FLUX INVITATIONS - DIAGRAMMES VISUELS

**Date** : 31 octobre 2025 16:30 UTC+03:00

---

## 🎨 LÉGENDE

```
✅ = Étape réussie
❌ = Étape échouée
⚠️ = Étape problématique
🔄 = Traitement en cours
⏭️ = Étape ignorée volontairement
```

---

# 1️⃣ FLUX COLLABORATEUR (Tenant Admin → Employé)

## AVANT (❌ Ne fonctionnait pas)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 1: Tenant Admin                            ┃
┃  Action: Inviter Collaborateur                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 2: send-collaborator-invitation            ┃
┃  createUser({                                     ┃
┃    email: 'collab@example.com',                   ┃
┃    password: 'tempXXX',                           ┃
┃    email_confirm: false  ❌                       ┃
┃  })                                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 3: webhook-auth-handler                    ┃
┃  ❌ SE DÉCLENCHE AUTOMATIQUEMENT                  ┃
┃  ❌ Appelle onboard_tenant_owner()                ┃
┃  ❌ Essaie de créer NOUVEAU tenant                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 4: ERREUR                                  ┃
┃  ❌ "Database error creating new user"            ┃
┃  ❌ Transaction rollback                          ┃
┃  ❌ Utilisateur PAS créé                          ┃
┃  ❌ Email PAS envoyé                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## APRÈS (✅ Fonctionne)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 1: Tenant Admin                            ┃
┃  Action: Inviter Collaborateur                    ┃
┃  Formulaire: email, nom, rôle, département        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 2: send-collaborator-invitation            ┃
┃  ✅ createUser({                                  ┃
┃    email: 'collab@example.com',                   ┃
┃    password: 'tempXXX',                           ┃
┃    email_confirm: true,  ✅                       ┃
┃    user_metadata: {                               ┃
┃      temp_user: true,  ✅ FLAG IMPORTANT          ┃
┃      invitation_type: 'collaborator',  ✅         ┃
┃      tenant_id: 'xxx-existant',  ✅               ┃
┃      role_to_assign: 'employee'                   ┃
┃    }                                              ┃
┃  })                                               ┃
┃  ✅ generateLink avec:                            ┃
┃     invitation=collaborator  ✅                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 3: webhook-auth-handler                    ┃
┃  ✅ DÉTECTE temp_user: true                       ┃
┃  ⏭️ IGNORE l'utilisateur                          ┃
┃  ✅ Retourne: "Traitement manuel"                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 4: Email envoyé ✅                         ┃
┃  URL: /auth/callback?email=xxx                    ┃
┃       &type=magiclink                             ┃
┃       &invitation=collaborator  ✅                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 5: Collaborateur clique Magic Link         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 6: AuthCallback                            ┃
┃  ✅ DÉTECTE invitation='collaborator'             ┃
┃  console.log('👥 TYPE: COLLABORATEUR')            ┃
┃  ✅ Appelle waitForProfileCreation()              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 7: Polling (toutes les 2s, max 15x)       ┃
┃  🔄 SELECT * FROM profiles WHERE user_id='xxx'    ┃
┃  🔄 Attente que le webhook crée le profile        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 8: handle-collaborator-confirmation        ┃
┃  ✅ Récupère user_metadata                        ┃
┃  ✅ INSERT profile (tenant_id existant)           ┃
┃  ✅ INSERT employee (EMP001...)                   ┃
┃  ✅ INSERT user_roles (role spécifié)             ┃
┃  ✅ UPDATE invitation status='accepted'           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 9: AuthCallback détecte profile            ┃
┃  ✅ Profile trouvé !                              ┃
┃  console.log('✅ PROFIL CRÉÉ PAR LE WEBHOOK !')   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 10: Redirection /dashboard ✅              ┃
┃  Collaborateur connecté dans l'organisation       ┃
┃  Accès selon son rôle (employee, manager, etc.)   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

# 2️⃣ FLUX TENANT OWNER (Super Admin → Propriétaire)

## AVANT (⚠️ Fonctionnait par hasard)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 1: Super Admin                             ┃
┃  Action: Inviter Tenant Owner                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 2: send-invitation                         ┃
┃  createUser({                                     ┃
┃    email: 'owner@example.com',                    ┃
┃    password: 'tempXXX',                           ┃
┃    email_confirm: false  ❌                       ┃
┃  })                                               ┃
┃  ❌ URL: /auth/callback?email=xxx (sans params)  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 3: webhook-auth-handler                    ┃
┃  ⚠️ SE DÉCLENCHE AUTOMATIQUEMENT                  ┃
┃  ⚠️ Appelle onboard_tenant_owner()                ┃
┃  ✅ Fonctionne (par chance pour tenant_owner)     ┃
┃  ✅ Crée tenant + profile                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 4: Email envoyé                            ┃
┃  ❌ URL: /auth/callback?email=xxx (incomplet)    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 5: Owner clique Magic Link                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 6: AuthCallback                            ┃
┃  ⚠️ invitation = undefined                        ┃
┃  ⚠️ Tombe dans flux générique (else)              ┃
┃  ⚠️ Appelle processUserSession()                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 7: Redirection /dashboard ✅               ┃
┃  ✅ Fonctionne (tenant déjà créé à l'étape 3)     ┃
┃  ⚠️ Mais flux pas optimal                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## APRÈS (✅ Fonctionne mieux)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 1: Super Admin                             ┃
┃  Action: Inviter Tenant Owner                     ┃
┃  Formulaire: email, nom, nom entreprise           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 2: send-invitation                         ┃
┃  ✅ createUser({                                  ┃
┃    email: 'owner@example.com',                    ┃
┃    password: 'tempXXX',                           ┃
┃    email_confirm: true,  ✅                       ┃
┃    user_metadata: {                               ┃
┃      temp_user: true,  ✅ FLAG IMPORTANT          ┃
┃      invitation_type: 'tenant_owner',  ✅         ┃
┃      tenant_id: 'future-xxx',  ✅                 ┃
┃      company_name: 'Acme Corp'                    ┃
┃    }                                              ┃
┃  })                                               ┃
┃  ✅ generateLink avec:                            ┃
┃     invitation=tenant_owner  ✅                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 3: webhook-auth-handler                    ┃
┃  ✅ DÉTECTE temp_user: true                       ┃
┃  ⏭️ IGNORE l'utilisateur                          ┃
┃  ✅ Retourne: "Traitement manuel"                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 4: Email envoyé ✅                         ┃
┃  URL: /auth/callback?email=xxx                    ┃
┃       &type=magiclink                             ┃
┃       &invitation=tenant_owner  ✅                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 5: Tenant Owner clique Magic Link          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 6: AuthCallback                            ┃
┃  ✅ DÉTECTE invitation='tenant_owner'             ┃
┃  console.log('👑 TYPE: TENANT OWNER')             ┃
┃  ✅ Appelle handleTenantOwnerOnboarding()         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 7: Cherche invitation en base              ┃
┃  ✅ SELECT * FROM invitations                     ┃
┃      WHERE email='xxx'                            ┃
┃      AND invitation_type='tenant_owner'           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 8: Appel Edge Function                     ┃
┃  ✅ POST /functions/v1/onboard-tenant-owner       ┃
┃  Body: { user_id, email, tenant_name, ... }       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 9: onboard_tenant_owner (SQL Function)     ┃
┃  ✅ INSERT tenant (NOUVEAU)                       ┃
┃  ✅ INSERT profile (role: tenant_admin)           ┃
┃  ✅ INSERT employee (employee_id: 0001)           ┃
┃  ✅ INSERT user_roles (role_id: tenant_admin)     ┃
┃  ✅ UPDATE invitation status='accepted'           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 10: AuthCallback reçoit résultat           ┃
┃  ✅ console.log('✅ TENANT CRÉÉ AVEC SUCCÈS !')    ┃
┃  ✅ console.log('   - Tenant ID: xxx')            ┃
┃  ✅ console.log('   - User ID: xxx')              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ÉTAPE 11: Redirection /dashboard ✅              ┃
┃  Tenant Owner connecté avec son organisation      ┃
┃  Accès complet administrateur                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 🎯 RÉSUMÉ VISUEL DES CHANGEMENTS

### Collaborateur

```
AVANT:  Créer → ❌ Webhook auto → ❌ Erreur
APRÈS:  Créer (temp) → ⏭️ Webhook ignoré → Magic Link → Polling → ✅ Profile créé
```

### Tenant Owner

```
AVANT:  Créer → ⚠️ Webhook auto → ⚠️ Fonctionne → URL incomplète → ⚠️ Flux générique
APRÈS:  Créer (temp) → ⏭️ Webhook ignoré → Magic Link → Routing → ✅ Edge Function → ✅ Tenant créé
```

---

## 📋 POINTS CLÉS

### ✅ Ce qui marche maintenant

1. **Flag temp_user** → Webhook sait quand ignorer
2. **URL avec paramètres** → AuthCallback sait quoi faire
3. **email_confirm: true** → Pas d'erreur connexion
4. **Routing intelligent** → Chaque type a son flux
5. **Logs clairs** → Facile à debugger

### 🔄 Flux des données

```
User Metadata (création)
  ↓
temp_user: true → Webhook ignore
  ↓
Magic Link avec &invitation=type
  ↓
AuthCallback lit paramètre
  ↓
Route vers bonne fonction
  ↓
Profile créé dans bon contexte
```

---

**Conclusion** : Le système est maintenant **robuste**, **prévisible** et **facile à maintenir**. ✅
