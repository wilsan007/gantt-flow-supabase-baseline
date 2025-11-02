# 📚 EXPLICATION LOGIQUE AuthCallback - Routing Intelligent

**Date** : 31 octobre 2025  
**Fichier** : `/src/pages/AuthCallback.tsx`

---

## 🎯 OBJECTIF

Distinguer automatiquement le type d'invitation et appliquer le traitement approprié :
- **Collaborateur** → Webhook automatique (pas d'appel manuel)
- **Tenant Owner** → Appel fonction Edge (création tenant)

---

## 📊 FLUX GÉNÉRAL

```
User clique lien email (Magic Link Supabase)
         ↓
/auth/callback?email=xxx&type=magiclink&invitation=TYPE
         ↓
AuthCallback détecte le TYPE
         ↓
    ┌──────────────┴──────────────┐
    ↓                             ↓
TYPE = 'collaborator'      TYPE = 'tenant_owner'
    ↓                             ↓
Webhook automatique         Appel onboard-tenant-owner
    ↓                             ↓
Polling profil              Création immédiate
    ↓                             ↓
        Redirection /dashboard
```

---

## 🔍 ÉTAPE 1 : Extraction des Paramètres URL

### Code

```typescript
const urlParams = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.substring(1));

const email = urlParams.get('email');
const type = urlParams.get('type');
const invitation = urlParams.get('invitation'); // 'collaborator' ou 'tenant_owner'
```

### Exemple d'URL Reçue

#### Collaborateur
```
https://app.com/auth/callback?email=jean@example.com&type=magiclink&invitation=collaborator
#access_token=xxx&refresh_token=yyy
```

#### Tenant Owner
```
https://app.com/auth/callback?email=owner@example.com&type=magiclink&invitation=tenant_owner
#access_token=xxx&refresh_token=yyy
```

### Logs Console

```javascript
console.log('📋 Paramètres URL:', { 
  email: 'jean@example.com',
  type: 'magiclink',
  invitation: 'collaborator' // ⬅️ C'EST CE PARAMÈTRE QUI FAIT LA DIFFÉRENCE
});
```

---

## 🔐 ÉTAPE 2 : Établissement de la Session

### Code

```typescript
const access_token = hashParams.get('access_token');
const refresh_token = hashParams.get('refresh_token');

if (access_token && refresh_token) {
  const { data: sessionData } = await supabase.auth.setSession({
    access_token,
    refresh_token
  });
  
  const session = sessionData.session;
  // Maintenant l'utilisateur est authentifié
}
```

### Pourquoi C'est Important

- Le Magic Link Supabase génère automatiquement les tokens
- On établit la session AVANT de traiter l'invitation
- Cela permet d'avoir `session.user.id` et `session.access_token`

### Logs Console

```javascript
console.log('🔑 Tokens trouvés, établissement de la session...');
console.log('✅ Session Magic Link établie');
```

---

## 🚦 ÉTAPE 3 : ROUTING selon le Type

C'est **LA PARTIE CRUCIALE** - le code analyse le paramètre `invitation` et route vers la bonne logique.

### Code Complet

```typescript
if (invitation === 'collaborator') {
  // ═══════════════════════════════════
  // BRANCHE COLLABORATEUR
  // ═══════════════════════════════════
  console.log('👥 TYPE: COLLABORATEUR');
  console.log('ℹ️  Le webhook handle-collaborator-confirmation');
  console.log('ℹ️  va créer automatiquement le profil');
  
  setStatus('Bienvenue ! Configuration de votre compte collaborateur...');
  
  // ⚠️ NE PAS APPELER DE FONCTION EDGE FUNCTION
  // Le webhook s'en charge automatiquement
  
  await waitForProfileCreation(session.user.id, 'collaborateur');
  return;
}
else if (invitation === 'tenant_owner') {
  // ═══════════════════════════════════
  // BRANCHE TENANT OWNER
  // ═══════════════════════════════════
  console.log('👑 TYPE: TENANT OWNER');
  console.log('🔄 Appel de la fonction onboard-tenant-owner');
  
  setStatus('Création de votre organisation...');
  
  // ✅ APPELER LA FONCTION EDGE FUNCTION
  await handleTenantOwnerOnboarding(session, email);
  return;
}
```

---

## 👥 BRANCHE 1 : COLLABORATEUR

### Principe

**PAS d'appel manuel** - Le webhook `handle-collaborator-confirmation` se déclenche automatiquement quand l'utilisateur s'authentifie.

### Fonction : waitForProfileCreation()

```typescript
const waitForProfileCreation = async (userId: string, userType: string) => {
  console.log('⏳ Attente création profil par le webhook...');
  
  let attempts = 0;
  const maxAttempts = 15; // 30 secondes max
  
  const checkProfile = async (): Promise<void> => {
    attempts++;
    console.log(`🔍 Vérification profil (${attempts}/${maxAttempts})...`);
    
    // POLLING : Vérifier si le profil existe
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, full_name, role')
      .eq('user_id', userId)
      .single();
    
    if (profile?.tenant_id) {
      // ✅ PROFIL TROUVÉ !
      console.log('✅ PROFIL CRÉÉ PAR LE WEBHOOK !');
      console.log('   - Tenant ID:', profile.tenant_id);
      console.log('   - Nom:', profile.full_name);
      console.log('   - Rôle:', profile.role);
      
      setStatus('✅ Configuration terminée ! Redirection...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
      return;
    }
    
    // Pas encore créé ? Réessayer dans 2 secondes
    if (attempts < maxAttempts) {
      setTimeout(() => checkProfile(), 2000);
    } else {
      // Timeout après 30s
      console.error('❌ TIMEOUT : Profil non créé après 30s');
      setStatus('⚠️ Configuration incomplète. Veuillez réessayer.');
      navigate('/');
    }
  };
  
  await checkProfile();
};
```

### Timeline Collaborateur

```
T+0s    User clique Magic Link
T+0.5s  AuthCallback détecte invitation='collaborator'
T+1s    Session établie
T+1.5s  Webhook se déclenche automatiquement (en parallèle)
T+2s    waitForProfileCreation() démarre
T+2s    Tentative 1 : Profil pas encore créé
T+4s    Tentative 2 : Profil pas encore créé
T+6s    Tentative 3 : Profil créé ! ✅
T+7.5s  Redirection /dashboard
```

### Pourquoi le Polling ?

Le webhook s'exécute **en arrière-plan**, on ne sait pas exactement quand il va finir. Donc on vérifie périodiquement si le profil a été créé.

**Analogie** : C'est comme commander un plat au restaurant. Vous ne cuisinez pas (= pas d'appel manuel), vous attendez juste que le chef termine (= webhook), et vous vérifiez de temps en temps si c'est prêt (= polling).

---

## 👑 BRANCHE 2 : TENANT OWNER

### Principe

**Appel manuel obligatoire** - Il faut appeler `onboard-tenant-owner` pour créer le tenant.

### Fonction : handleTenantOwnerOnboarding()

```typescript
const handleTenantOwnerOnboarding = async (session: any, email: string | null) => {
  try {
    console.log('🔄 Recherche de l\'invitation tenant_owner...');
    
    // ÉTAPE 1 : Récupérer l'invitation en base
    const { data: invitation } = await supabase
      .from('invitations')
      .select('id, tenant_name')
      .eq('email', email || session.user.email)
      .eq('invitation_type', 'tenant_owner')
      .eq('status', 'pending')
      .single();
    
    if (!invitation) {
      throw new Error('Invitation non trouvée ou expirée');
    }
    
    console.log('✅ Invitation trouvée:', invitation.id);
    console.log('🏢 Tenant à créer:', invitation.tenant_name);
    
    // ÉTAPE 2 : Appeler la fonction Edge Function
    console.log('📞 Appel Edge Function onboard-tenant-owner...');
    
    const resp = await fetch(
      `${SUPABASE_URL}/functions/v1/onboard-tenant-owner`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          code: invitation.id  // UUID de l'invitation
        })
      }
    );
    
    if (!resp.ok) {
      throw new Error('Erreur Edge Function');
    }
    
    const data = await resp.json();
    
    // ÉTAPE 3 : Succès !
    console.log('✅ TENANT CRÉÉ AVEC SUCCÈS !');
    console.log('   - Tenant ID:', data.tenant_id);
    console.log('   - User ID:', data.user_id);
    console.log('   - Employee ID:', data.employee_id);
    
    setStatus('✅ Organisation créée ! Redirection...');
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
    
  } catch (error) {
    console.error('❌ ERREUR CRÉATION TENANT');
    setStatus('❌ Erreur lors de la création. Veuillez réessayer.');
    navigate('/');
  }
};
```

### Timeline Tenant Owner

```
T+0s    User clique Magic Link
T+0.5s  AuthCallback détecte invitation='tenant_owner'
T+1s    Session établie
T+1.5s  Recherche invitation en base
T+2s    Appel onboard-tenant-owner (Edge Function)
T+3s    Fonction SQL crée : tenant + profile + user_roles
T+3.5s  Réponse reçue avec tenant_id
T+5s    Redirection /dashboard
```

### Pourquoi l'Appel Manuel ?

La fonction `onboard-tenant-owner` fait des actions spéciales que le webhook ne peut pas faire :
- **Créer le tenant** (table `tenants`)
- **Générer un slug unique** pour l'organisation
- **Assigner le rôle tenant_admin** (rôle de propriétaire)

**Analogie** : C'est comme ouvrir un nouveau restaurant. Vous devez passer par un notaire (= fonction Edge) pour créer l'entreprise légalement. Un simple employé (= webhook) ne peut pas le faire.

---

## 📊 TABLEAU COMPARATIF

| Aspect | Collaborateur | Tenant Owner |
|--------|---------------|--------------|
| **Paramètre URL** | `invitation=collaborator` | `invitation=tenant_owner` |
| **Détection** | `if (invitation === 'collaborator')` | `else if (invitation === 'tenant_owner')` |
| **Appel fonction** | ❌ NON (webhook automatique) | ✅ OUI (onboard-tenant-owner) |
| **Méthode** | Polling (vérification toutes les 2s) | Appel HTTP direct |
| **Crée tenant** | ❌ NON (utilise existant) | ✅ OUI (nouveau tenant) |
| **Durée** | ~6-8 secondes (webhook + polling) | ~3-4 secondes (appel direct) |
| **Fonction appelée** | Aucune (webhook en arrière-plan) | `fetch('/functions/v1/onboard-tenant-owner')` |

---

## 🔍 COMMENT ÇA MARCHE CONCRÈTEMENT ?

### Scénario 1 : Jean (Collaborateur)

1. **Email reçu** : "Rejoignez Acme Corp en tant qu'employé"
2. **Lien cliqué** : `...auth/callback?invitation=collaborator`
3. **AuthCallback lit** : `invitation === 'collaborator'` ✅
4. **Branche prise** : COLLABORATEUR
5. **Action** : Attendre que le webhook crée le profil
6. **Vérification toutes les 2s** : Profil créé ? Non... Non... Oui ! ✅
7. **Résultat** : Jean est redirigé vers `/dashboard` avec son profil collaborateur

### Scénario 2 : Marie (Tenant Owner)

1. **Email reçu** : "Créez votre organisation Bakery Corp"
2. **Lien cliqué** : `...auth/callback?invitation=tenant_owner`
3. **AuthCallback lit** : `invitation === 'tenant_owner'` ✅
4. **Branche prise** : TENANT OWNER
5. **Action** : Appeler `onboard-tenant-owner` immédiatement
6. **Fonction crée** : Tenant "Bakery Corp" + Profil Marie + Rôle admin
7. **Résultat** : Marie est redirigée vers `/dashboard` en tant que propriétaire

---

## 🎨 LOGS CONSOLE VISUELS

### Pour Collaborateur

```
🔄 AuthCallback: Début du traitement...
📋 Paramètres URL: { email: 'jean@example.com', type: 'magiclink', invitation: 'collaborator' }
🔍 Type invitation détecté: collaborator
🔧 Traitement invitation Magic Link...
📌 Type détecté: collaborator
🔑 Tokens trouvés, établissement de la session...
✅ Session Magic Link établie

👥 ════════════════════════════════════════
👥 TYPE: COLLABORATEUR
👥 ════════════════════════════════════════
ℹ️  Le webhook handle-collaborator-confirmation
ℹ️  va créer automatiquement le profil

⏳ Attente création profil par le webhook...
🔍 Vérification profil (1/15)...
🔍 Vérification profil (2/15)...
🔍 Vérification profil (3/15)...

✅ ═══════════════════════════════════════════
✅ PROFIL CRÉÉ PAR LE WEBHOOK !
✅ ═══════════════════════════════════════════
📋 Détails:
   - Tenant ID: abc-123
   - Nom: Jean Dupont
   - Rôle: employee

→ Redirection vers /dashboard
```

### Pour Tenant Owner

```
🔄 AuthCallback: Début du traitement...
📋 Paramètres URL: { email: 'marie@example.com', type: 'magiclink', invitation: 'tenant_owner' }
🔍 Type invitation détecté: tenant_owner
🔧 Traitement invitation Magic Link...
📌 Type détecté: tenant_owner
🔑 Tokens trouvés, établissement de la session...
✅ Session Magic Link établie

👑 ════════════════════════════════════════
👑 TYPE: TENANT OWNER
👑 ════════════════════════════════════════
🔄 Appel de la fonction onboard-tenant-owner

🔄 Recherche de l'invitation tenant_owner...
✅ Invitation trouvée: def-456
🏢 Tenant à créer: Bakery Corp

📞 Appel Edge Function onboard-tenant-owner...

✅ ═══════════════════════════════════════════
✅ TENANT CRÉÉ AVEC SUCCÈS !
✅ ═══════════════════════════════════════════
📋 Résultat:
   - Tenant ID: xyz-789
   - User ID: user-123
   - Employee ID: 0001
   - Rôle: tenant_admin

→ Redirection vers /dashboard
```

---

## 🧩 COMPOSANTS VISUELS

### Badge Type Invitation (UI)

```typescript
{invitationType && (
  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-xs font-medium text-blue-800">
      {invitationType === 'collaborator' && '👥 Invitation Collaborateur'}
      {invitationType === 'tenant_owner' && '👑 Invitation Propriétaire'}
    </p>
  </div>
)}
```

**Affichage** :
- Collaborateur : Badge bleu "👥 Invitation Collaborateur"
- Tenant Owner : Badge bleu "👑 Invitation Propriétaire"

---

## ❓ QUESTIONS / RÉPONSES

### Q1 : Comment le système sait quel type d'invitation ?

**R** : Le paramètre `invitation` dans l'URL. Ce paramètre est ajouté par les fonctions Edge qui créent les invitations :
- `send-collaborator-invitation` → `invitation=collaborator`
- `send-invitation` (tenant owner) → `invitation=tenant_owner`

### Q2 : Que se passe-t-il si le webhook échoue pour un collaborateur ?

**R** : Après 30 secondes (15 tentatives x 2s), le système affiche un message d'erreur et redirige vers la page de connexion. L'utilisateur peut réessayer.

### Q3 : Peut-on réutiliser une ancienne invitation ?

**R** : 
- **Si status = 'accepted'** : NON, le lien ne fonctionne plus
- **Si status = 'pending'** : OUI, le lien fonctionne encore
- **Si expirée** : NON, erreur "Invitation expirée"

### Q4 : Pourquoi ne pas utiliser le webhook pour les tenant owners aussi ?

**R** : Le webhook ne peut pas créer de tenant. Seule une fonction Edge avec des permissions spéciales (service_role) peut créer des tenants et assigner le rôle `tenant_admin`.

### Q5 : Que se passe-t-il si quelqu'un modifie manuellement l'URL ?

**Exemple** : Change `invitation=collaborator` en `invitation=tenant_owner`

**R** : La fonction `handleTenantOwnerOnboarding` va chercher une invitation de type `tenant_owner` en base. Si elle ne la trouve pas (car c'est une invitation collaborateur), elle retourne une erreur "Invitation non trouvée".

---

## 🎯 RÉSUMÉ EN 3 POINTS

### 1. **Détection Automatique**
Le paramètre `invitation` dans l'URL détermine le type (`collaborator` ou `tenant_owner`)

### 2. **Routing Intelligent**
- `if (invitation === 'collaborator')` → Webhook + Polling
- `else if (invitation === 'tenant_owner')` → Appel Edge Function

### 3. **Traitement Différencié**
- **Collaborateur** : Passif (attendre webhook)
- **Tenant Owner** : Actif (appeler fonction)

---

## 🔧 AVANTAGES DE CETTE APPROCHE

### ✅ Sécurité
- Chaque type suit son propre processus sécurisé
- Pas de confusion entre les rôles

### ✅ Maintenabilité
- Code séparé = plus facile à debugger
- Logs clairs pour chaque branche

### ✅ Évolutivité
- Facile d'ajouter un nouveau type (ex: `invitation=manager`)
- Chaque branche est indépendante

### ✅ UX
- Messages adaptés selon le type
- Feedback visuel clair

---

**Cette logique garantit que chaque type d'utilisateur suit le bon processus d'onboarding !** 🎉
