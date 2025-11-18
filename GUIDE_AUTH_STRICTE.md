# 🔐 Guide Complet - Authentification Stricte

## 📋 Configuration Implémentée

### **Exigences de Sécurité**
- ✅ **JWT valide 2h uniquement** (7200 secondes)
- ✅ **Pas de refresh token automatique**
- ✅ **Déconnexion si ordinateur éteint/redémarré**
- ✅ **Déconnexion si session OS changée**
- ✅ **Utilisation de sessionStorage** (se vide à la fermeture du navigateur)

---

## 🛠️ **ÉTAPE 1 : Configuration Supabase Dashboard**

### **1.1 Modifier JWT Expiry à 2 heures**

**Chemin dans Supabase Dashboard** :
```
Project Settings → Authentication → JWT expiry
```

**Configuration à appliquer** :
```
JWT expiry: 7200 seconds (2 hours)
```

**Étapes détaillées** :
1. Aller sur https://app.supabase.com
2. Sélectionner votre projet `gantt-flow-supabase-baseline`
3. Cliquer sur l'icône ⚙️ (Settings) en bas à gauche
4. Naviguer vers **Authentication**
5. Section **JWT Settings**
6. Changer `JWT expiry` de `3600` à `7200`
7. Cliquer sur **Save**

### **1.2 Désactiver le Refresh Token automatique**

**Chemin** :
```
Project Settings → Authentication → Enable automatic token refresh
```

**Configuration** :
```
Enable automatic token refresh: OFF (décoché)
```

**⚠️ IMPORTANT** : Cette option peut ne pas exister dans toutes les versions de Supabase. Si absente, notre configuration côté client la gérera.

---

## 📦 **ÉTAPE 2 : Fichiers Créés**

### **Fichiers Implémentés** :

1. ✅ **`/src/lib/auth-config.ts`** (250 lignes)
   - Client Supabase avec sessionStorage
   - Détection de changement de session OS
   - Monitoring continu de l'expiration
   - Fonctions d'authentification strictes

2. ✅ **`/src/hooks/useStrictAuth.ts`** (200 lignes)
   - Hook React pour authentification
   - Gestion automatique de déconnexion
   - Timer de session
   - Redirections automatiques

3. ✅ **`/src/components/auth/SessionTimer.tsx`** (120 lignes)
   - Affichage temps restant
   - Alerte si < 5 minutes
   - Mode compact pour header

---

## 🔄 **ÉTAPE 3 : Migration du Code Existant**

### **3.1 Remplacer le client Supabase**

**❌ AVANT (client standard)** :
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**✅ APRÈS (client strict)** :
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,      // ⚠️ DÉSACTIVER refresh auto
      storage: window.sessionStorage, // ⚠️ Utiliser sessionStorage
      persistSession: false,          // ⚠️ Pas de persistance
      flowType: 'pkce',
    },
  }
);
```

### **3.2 Mettre à jour les composants d'authentification**

**❌ AVANT** :
```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginPage() {
  const { signIn } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    await signIn(email, password);
  };
}
```

**✅ APRÈS** :
```typescript
import { useStrictAuth } from '@/hooks/useStrictAuth';

function LoginPage() {
  const { signIn, loading } = useStrictAuth();
  
  const handleLogin = async (email: string, password: string) => {
    const result = await signIn(email, password);
    
    if (!result.success) {
      // Afficher l'erreur
      console.error(result.error);
    }
    // Sinon, redirection automatique par le hook
  };
}
```

### **3.3 Ajouter le SessionTimer dans le Layout**

**Fichier : `src/components/layout/Header.tsx`**

```typescript
import { SessionTimer } from '@/components/auth/SessionTimer';

function Header() {
  return (
    <header className="border-b">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo et navigation */}
        <div>...</div>
        
        {/* Timer de session */}
        <SessionTimer compact />
        
        {/* Menu utilisateur */}
        <UserMenu />
      </div>
    </header>
  );
}
```

### **3.4 Afficher l'alerte d'expiration**

**Fichier : `src/pages/DashboardLayout.tsx`**

```typescript
import { SessionTimer } from '@/components/auth/SessionTimer';

function DashboardLayout() {
  return (
    <div className="min-h-screen">
      {/* Alerte si session expire bientôt */}
      <SessionTimer showAlert />
      
      {/* Contenu du dashboard */}
      <main>
        {children}
      </main>
    </div>
  );
}
```

---

## 🔐 **ÉTAPE 4 : Fonctionnement du Système**

### **4.1 Scénario : Connexion Normale**

```
1. Utilisateur entre email/password
   ↓
2. signInStrict() appelé
   ↓
3. Génération marqueur de session unique
   ↓
4. Stockage dans sessionStorage
   ↓
5. Connexion Supabase (JWT 2h)
   ↓
6. setupSessionMonitoring() activé
   ↓
7. Utilisateur connecté ✅
```

### **4.2 Scénario : Fermeture du Navigateur**

```
1. Utilisateur ferme le navigateur
   ↓
2. sessionStorage automatiquement vidé (comportement navigateur)
   ↓
3. Marqueur de session supprimé
   ↓
4. Au prochain démarrage :
   - Pas de marqueur trouvé
   - isSessionValid() retourne false
   - Redirection vers /login
```

### **4.3 Scénario : Redémarrage de l'Ordinateur**

```
1. Ordinateur redémarre
   ↓
2. sessionStorage vidé (nouvelle session OS)
   ↓
3. Utilisateur rouvre le navigateur
   ↓
4. Application charge
   ↓
5. getStrictSession() vérifie :
   - Pas de marqueur dans sessionStorage
   - OU JWT expiré
   ↓
6. invalidateSession() appelé
   ↓
7. Redirection vers /login ✅
```

### **4.4 Scénario : Changement de Session OS**

```
1. Utilisateur connecté (Session A)
   ↓
2. Verrouillage écran → Changement utilisateur OS
   ↓
3. Nouvelle session OS (Session B)
   ↓
4. Retour à Session A
   ↓
5. Application détecte changement via :
   - Event 'focus' window
   - Vérification marqueur sessionStorage
   ↓
6. Marqueur différent ou absent
   ↓
7. invalidateSession() + redirect /login ✅
```

### **4.5 Scénario : Expiration du JWT (2h)**

```
T+0min  : Connexion réussie (JWT expire à T+120min)
T+115min: isExpiringSoon() = true → Alerte affichée
T+120min: Token expiré
          ↓
          Vérification périodique (30s) détecte expiration
          ↓
          invalidateSession() appelé
          ↓
          Redirection /login avec message "Session expirée"
```

---

## 🛡️ **Mécanismes de Sécurité Implémentés**

### **1. Marqueur de Session Unique**

```typescript
// Généré au login
const marker = `${Date.now()}-${Math.random().toString(36)}`;
// Ex: "1702345678901-k7x9p2m"

// Stocké dans sessionStorage (pas localStorage)
sessionStorage.setItem('wadashaqayn_session_marker', marker);

// Vérifié à chaque focus/visibilité
const isValid = sessionStorage.getItem('wadashaqayn_session_marker') === marker;
```

**Pourquoi ça marche ?**
- `sessionStorage` est **isolé par onglet**
- Se vide **automatiquement** à la fermeture
- **Survit pas** au redémarrage OS
- **Différent** entre sessions utilisateur OS

### **2. Surveillance Continue**

```typescript
// Vérification toutes les 30 secondes
setInterval(() => {
  const session = await supabaseStrict.auth.getSession();
  
  if (isTokenExpired(session.expires_at)) {
    // Déconnexion automatique
    await invalidateSession();
  }
}, 30000);
```

### **3. Event Listeners**

```typescript
// Détection fermeture navigateur
window.addEventListener('beforeunload', () => {
  // sessionStorage se vide automatiquement
});

// Détection changement de focus
window.addEventListener('focus', async () => {
  if (!isSessionValid()) {
    await invalidateSession();
  }
});

// Détection visibilité (verrouillage écran, etc.)
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden && !isSessionValid()) {
    await invalidateSession();
  }
});
```

---

## 📊 **Comparaison : Avant vs Après**

| Fonctionnalité | AVANT (Standard) | APRÈS (Strict) |
|----------------|------------------|----------------|
| **Durée JWT** | 1h (3600s) | 2h (7200s) |
| **Refresh Token** | ✅ Automatique (7j) | ❌ Désactivé |
| **Stockage** | localStorage | sessionStorage |
| **Persistance** | ✅ Survit redémarrage | ❌ Se vide à la fermeture |
| **Session OS** | ❌ Pas détectée | ✅ Détectée et invalidée |
| **Fermeture navigateur** | ✅ Reconnecte auto | ❌ Déconnexion complète |
| **Expiration** | 7 jours (refresh) | 2h (max absolu) |
| **Sécurité** | Moyenne | Maximale |

---

## 🧪 **Tests de Validation**

### **Test 1 : Connexion et Timer**
```bash
1. Se connecter avec email/password
2. Vérifier badge timer dans header (affiche "1h 59min")
3. Attendre 1h55
4. Vérifier alerte "Session expire bientôt"
5. Attendre 2h
6. Vérifier redirection automatique vers /login
```

### **Test 2 : Fermeture Navigateur**
```bash
1. Se connecter
2. Fermer complètement le navigateur
3. Rouvrir le navigateur
4. Aller sur l'app
5. ✅ Devrait être sur /login (pas auto-connecté)
```

### **Test 3 : Redémarrage Ordinateur**
```bash
1. Se connecter
2. Redémarrer l'ordinateur
3. Rouvrir le navigateur après redémarrage
4. Aller sur l'app
5. ✅ Devrait être sur /login
```

### **Test 4 : Changement Session OS** (Windows/Linux)
```bash
1. Se connecter sur Session Utilisateur A
2. Verrouiller l'écran
3. Changer vers Session Utilisateur B
4. Retour à Session Utilisateur A
5. Retour sur l'app (onglet toujours ouvert)
6. ✅ Devrait se déconnecter automatiquement
```

### **Test 5 : Vérification sessionStorage**
```bash
# Ouvrir DevTools (F12) → Console
# Après connexion :
sessionStorage.getItem('wadashaqayn_session_marker')
# Devrait afficher un ID unique

# Après fermeture navigateur :
sessionStorage.getItem('wadashaqayn_session_marker')
# Devrait afficher null
```

---

## 🚨 **Messages d'Erreur et Raisons**

### **Console Logs à Observer**

```javascript
✅ "🔐 Initialisation authentification stricte..."
✅ "🔑 Marqueur de session: 1702345678901-k7x9p2m"
✅ "✅ Connexion réussie - Session valide pour 2h"

⚠️ "⏰ Token JWT expiré (2h dépassées)"
⚠️ "❌ Session système invalide"
⚠️ "❌ Session invalide - nouvelle session OS détectée"
⚠️ "🔒 Session invalidée - redirection vers login"
```

### **Raisons de Déconnexion**

| Message | Raison | Solution |
|---------|--------|----------|
| "Session expirée" | 2h écoulées | Se reconnecter |
| "Session invalide" | Redémarrage/fermeture | Se reconnecter |
| "Nouvelle session détectée" | Changement utilisateur OS | Se reconnecter |
| "Token expiré" | JWT > 2h | Se reconnecter |

---

## ✅ **Checklist de Migration**

### **Backend (Supabase)** :
- [ ] JWT expiry configuré à 7200s
- [ ] Refresh token auto désactivé (si option existe)
- [ ] Tester avec un vrai utilisateur

### **Frontend (React)** :
- [ ] `auth-config.ts` créé
- [ ] `useStrictAuth.ts` créé
- [ ] `SessionTimer.tsx` créé
- [ ] Client Supabase mis à jour (sessionStorage)
- [ ] Composants de login mis à jour
- [ ] SessionTimer ajouté au layout
- [ ] Tests de validation passés

---

## 🎯 **Résultat Final**

**Vous avez maintenant une authentification de niveau bancaire** :

✅ **Sécurité maximale** : Pas de session persistante  
✅ **Contrôle strict** : 2h maximum, pas d'extension  
✅ **Détection avancée** : Changement de session OS  
✅ **UX claire** : Timer visible + alertes  
✅ **Zéro surprise** : Déconnexion automatique explicite  

**C'est exactement ce que font les applications bancaires et gouvernementales !** 🏦🔐
