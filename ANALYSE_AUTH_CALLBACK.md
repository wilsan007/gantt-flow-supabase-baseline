# 🔍 ANALYSE AuthCallback - Flux Réel d'Invitation

**Date** : 31 octobre 2025

---

## 📊 Situation Actuelle

### Lien dans l'Email Collaborateur (ligne 341)

```typescript
redirectTo: `${baseUrl}/auth/callback?email=${email}&type=magiclink&invitation=collaborator`
```

**Paramètres** :
- `email` : Email du collaborateur
- `type` : "magiclink"
- `invitation` : **"collaborator"** ⚠️

### Ce Qui Se Passe Actuellement dans AuthCallback

```typescript
// Ligne 84
const invitation = urlParams.get('invitation');

// Ligne 91 - Vérification simpliste
if (invitation === 'true') {
  // Traite TOUTES les invitations pareil
}
```

**❌ PROBLÈME** : 
- Vérifie seulement `invitation === 'true'`
- Ne distingue PAS entre `tenant_owner` et `collaborator`
- Ne sait pas quelle fonction appeler

---

## ✅ SOLUTION : Détecter le Type d'Invitation

### 1. Lire le Paramètre `invitation`

```typescript
const invitation = urlParams.get('invitation');
// Peut être : 'collaborator', 'tenant_owner', 'true', ou null
```

### 2. Router Selon le Type

```typescript
if (invitation === 'collaborator') {
  // ✅ C'est un collaborateur
  // → Webhook handle-collaborator-confirmation s'en charge
  // → Juste attendre que le profil soit créé
  // → Rediriger vers /dashboard
}
else if (invitation === 'tenant_owner') {
  // ✅ C'est un tenant owner
  // → Appeler onboard-tenant-owner manuellement
  // → Créer le tenant
  // → Rediriger vers /dashboard
}
else if (invitation === 'true') {
  // ⚠️ Ancien format (compatibilité)
  // → Traiter comme avant
}
```

---

## 🔄 Flux Complet selon le Type

### Type 1 : COLLABORATEUR

```
1. User clique lien email
   ↓
2. Redirigé vers: /auth/callback?invitation=collaborator&email=...
   ↓
3. AuthCallback détecte: invitation === 'collaborator'
   ↓
4. Établit session Supabase (Magic Link)
   ↓
5. ⚠️ NE PAS appeler de fonction Edge Function
   ↓
6. Webhook handle-collaborator-confirmation se déclenche automatiquement
   ↓
7. Polling : Vérifier si profile créé (toutes les 2s)
   ↓
8. Quand profile.tenant_id existe → Redirection /dashboard
```

**Code à ajouter** :
```typescript
if (invitation === 'collaborator') {
  console.log('👥 COLLABORATEUR détecté');
  console.log('ℹ️ Webhook automatique va créer le profil');
  setStatus('Bienvenue ! Configuration de votre compte collaborateur...');
  
  // Attendre que le webhook crée le profil
  await waitForProfileCreation(session.user.id);
  
  // Rediriger vers dashboard
  navigate('/dashboard');
}
```

### Type 2 : TENANT OWNER

```
1. User clique lien email
   ↓
2. Redirigé vers: /auth/callback?invitation=tenant_owner&email=...
   ↓
3. AuthCallback détecte: invitation === 'tenant_owner'
   ↓
4. Établit session Supabase (Magic Link)
   ↓
5. ✅ APPELER Edge Function: onboard-tenant-owner
   ↓
6. Fonction crée: tenant + profile + user_roles
   ↓
7. Redirection /dashboard
```

**Code à ajouter** :
```typescript
if (invitation === 'tenant_owner') {
  console.log('👑 TENANT OWNER détecté');
  console.log('🔄 Appel onboard-tenant-owner...');
  setStatus('Création de votre organisation...');
  
  // Appeler la fonction Edge
  const resp = await fetch(
    `${SUPABASE_URL}/functions/v1/onboard-tenant-owner`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        code: invitationId // depuis URL ou metadata
      })
    }
  );
  
  if (!resp.ok) throw new Error('Erreur onboarding');
  
  const data = await resp.json();
  console.log('✅ Tenant créé:', data.tenant_id);
  
  // Rediriger vers dashboard
  navigate('/dashboard');
}
```

---

## 🔧 Code Complet à Implémenter

### Étape 1 : Extraction Paramètres Améliorée

```typescript
const urlParams = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.substring(1));

const email = urlParams.get('email');
const type = urlParams.get('type');
const invitation = urlParams.get('invitation'); // 'collaborator', 'tenant_owner', 'true'
const invitationId = urlParams.get('invitation_id'); // UUID de l'invitation
```

### Étape 2 : Router selon le Type

```typescript
// Établir la session d'abord
const access_token = hashParams.get('access_token');
const refresh_token = hashParams.get('refresh_token');

if (access_token && refresh_token) {
  const { data: sessionData } = await supabase.auth.setSession({
    access_token,
    refresh_token
  });
  
  const session = sessionData.session;
  
  // ROUTER SELON LE TYPE
  if (invitation === 'collaborator') {
    await handleCollaboratorInvitation(session);
  }
  else if (invitation === 'tenant_owner') {
    await handleTenantOwnerInvitation(session, invitationId);
  }
  else {
    // Ancien flux (compatibilité)
    await handleLegacyInvitation(session);
  }
}
```

### Étape 3 : Fonction handleCollaboratorInvitation

```typescript
async function handleCollaboratorInvitation(session) {
  console.log('👥 Traitement invitation COLLABORATEUR');
  setStatus('Bienvenue ! Configuration de votre compte...');
  
  // ⚠️ NE PAS appeler de fonction Edge Function
  // Le webhook handle-collaborator-confirmation s'en charge automatiquement
  
  console.log('ℹ️ Webhook automatique va créer votre profil');
  console.log('⏳ Attente création profil...');
  
  // Polling pour vérifier la création du profil
  let attempts = 0;
  const maxAttempts = 15; // 30 secondes max (15 x 2s)
  
  const checkProfile = async () => {
    attempts++;
    console.log(`🔍 Vérification profil (${attempts}/${maxAttempts})...`);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, full_name')
      .eq('user_id', session.user.id)
      .single();
    
    if (profile?.tenant_id) {
      console.log('✅ Profil créé par le webhook !');
      console.log('   - Tenant:', profile.tenant_id);
      console.log('   - Nom:', profile.full_name);
      
      setStatus('✅ Configuration terminée ! Redirection...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
      return true;
    }
    
    if (attempts >= maxAttempts) {
      console.error('❌ Timeout : profil non créé après 30s');
      setStatus('⚠️ Configuration incomplète. Veuillez réessayer.');
      
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
      return true;
    }
    
    // Continuer à vérifier
    setTimeout(checkProfile, 2000);
    return false;
  };
  
  // Démarrer la vérification
  await checkProfile();
}
```

### Étape 4 : Fonction handleTenantOwnerInvitation

```typescript
async function handleTenantOwnerInvitation(session, invitationId) {
  console.log('👑 Traitement invitation TENANT OWNER');
  setStatus('Création de votre organisation...');
  
  try {
    // ✅ APPELER la fonction Edge Function
    console.log('🔄 Appel onboard-tenant-owner...');
    
    // Récupérer l'invitation pour avoir le code
    const { data: invitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', session.user.email)
      .eq('invitation_type', 'tenant_owner')
      .eq('status', 'pending')
      .single();
    
    if (!invitation) {
      throw new Error('Invitation non trouvée');
    }
    
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboard-tenant-owner`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          code: invitation.id
        })
      }
    );
    
    if (!resp.ok) {
      const error = await resp.text();
      throw new Error(error);
    }
    
    const data = await resp.json();
    console.log('✅ Tenant créé avec succès !');
    console.log('   - Tenant ID:', data.tenant_id);
    console.log('   - User ID:', data.user_id);
    console.log('   - Employee ID:', data.employee_id);
    
    setStatus('✅ Organisation créée ! Redirection...');
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
    
  } catch (error) {
    console.error('❌ Erreur création tenant:', error);
    setStatus('❌ Erreur lors de la création. Veuillez réessayer.');
    
    setTimeout(() => {
      navigate('/');
    }, 3000);
  }
}
```

---

## 📋 Résumé des Changements

### ❌ AVANT
```typescript
if (invitation === 'true') {
  // Traite tout pareil
  // Ne sait pas quel type
  // Ne sait pas quelle fonction appeler
}
```

### ✅ APRÈS
```typescript
if (invitation === 'collaborator') {
  // Webhook automatique
  // Juste attendre profil
  // Redirection dashboard
}
else if (invitation === 'tenant_owner') {
  // Appel onboard-tenant-owner
  // Création tenant
  // Redirection dashboard
}
```

---

## 🔄 Modification du Lien Email pour Tenant Owner

**⚠️ IMPORTANT** : Vérifier que send-invitation (tenant_owner) génère le bon lien :

```typescript
// Dans send-invitation/index.ts
redirectTo: `${baseUrl}/auth/callback?email=${email}&type=magiclink&invitation=tenant_owner&invitation_id=${invitationId}`
```

---

## 📊 Tableau Comparatif

| Aspect | Collaborateur | Tenant Owner |
|--------|--------------|--------------|
| **Paramètre URL** | `invitation=collaborator` | `invitation=tenant_owner` |
| **Fonction appelée** | ❌ Aucune (webhook) | ✅ onboard-tenant-owner |
| **Crée tenant** | ❌ NON | ✅ OUI |
| **Polling profil** | ✅ OUI (webhook) | ⚠️ Non (fonction le crée) |
| **Durée** | ~5-10s (webhook) | ~2-3s (API directe) |
| **Redirection** | `/dashboard` | `/dashboard` |

---

## 🧪 Tests à Faire

### Test 1 : Collaborateur
```
1. Inviter un collaborateur depuis RH
2. Cliquer sur lien email
3. Vérifier URL: invitation=collaborator
4. Vérifier logs: "👥 COLLABORATEUR détecté"
5. Attendre profil créé par webhook
6. Redirection dashboard
```

### Test 2 : Tenant Owner
```
1. Super admin invite tenant owner
2. Cliquer sur lien email
3. Vérifier URL: invitation=tenant_owner
4. Vérifier logs: "👑 TENANT OWNER détecté"
5. Appel onboard-tenant-owner
6. Tenant créé
7. Redirection dashboard
```

---

## 🎯 Prochaines Étapes

1. ✅ Modifier AuthCallback.tsx pour router selon le type
2. ✅ Vérifier que send-collaborator-invitation génère `invitation=collaborator`
3. ✅ Vérifier que send-invitation génère `invitation=tenant_owner`
4. ✅ Tester les deux flux
5. ✅ Vérifier les logs console

---

**Maintenant je vais implémenter ces changements dans AuthCallback.tsx**
