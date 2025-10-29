# Guide de Gestion des Erreurs de Refresh Token

## 🔍 Problème Identifié

### Erreur Typique
```
POST https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/token?grant_type=refresh_token
[HTTP/2 400 396ms]

AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

### Quand Survient-elle ?
Cette erreur apparaît lors de la **connexion/démarrage de l'application** quand :

1. **Le refresh token stocké localement est invalide** (révoqué côté serveur)
2. **L'utilisateur s'est déconnecté sur un autre appareil**
3. **Le localStorage a été partiellement vidé** sans déconnexion propre
4. **Conflit entre plusieurs onglets/sessions**
5. **Token expiré** après une longue période d'inactivité

## ✅ Solutions Implémentées

### 1. Configuration Améliorée du Client Supabase

**Fichier:** `/src/integrations/supabase/client.ts`

```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce', // Plus sécurisé
  }
});

// Gestion globale des événements d'authentification
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('✅ Token rafraîchi avec succès');
  }
  
  if (event === 'SIGNED_OUT') {
    console.log('🔒 Utilisateur déconnecté - Nettoyage du localStorage');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('manualLogout');
  }
});
```

**Améliorations:**
- ✅ **PKCE Flow** pour sécurité renforcée
- ✅ **Détection automatique** des sessions dans l'URL
- ✅ **Nettoyage automatique** du localStorage lors de la déconnexion

---

### 2. Gestion Robuste dans useSessionManager

**Fichier:** `/src/hooks/useSessionManager.ts`

```typescript
const initializeSession = useCallback(async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Gérer les erreurs de refresh token
    if (error) {
      console.error('❌ Erreur lors de la récupération de la session:', error.message);
      
      // Si le refresh token est invalide, nettoyer complètement
      if (error.message.includes('refresh') || error.message.includes('Invalid')) {
        console.log('🧹 Nettoyage du localStorage suite à un refresh token invalide');
        await supabase.auth.signOut();
        localStorage.clear();
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }
    }
    
    // ... reste de la logique
  } catch (error) {
    // En cas d'erreur critique, nettoyer et forcer la déconnexion
    await supabase.auth.signOut();
    localStorage.clear();
    setUser(null);
    setSession(null);
  }
}, [isSessionExpired, updateActivity]);
```

**Améliorations:**
- ✅ **Détection automatique** des erreurs de refresh token
- ✅ **Nettoyage complet** du localStorage en cas d'erreur
- ✅ **Gestion gracieuse** sans crash de l'application
- ✅ **Logs détaillés** pour debugging

---

### 3. Utilitaires de Nettoyage de Session

**Fichier:** `/src/utils/sessionCleanup.ts`

#### Fonctions Disponibles

##### `cleanupSession()`
Nettoie complètement la session et le localStorage.

```typescript
import { cleanupSession } from '@/utils/sessionCleanup';

// Utilisation
await cleanupSession();
```

##### `isRefreshTokenValid()`
Vérifie si le refresh token est valide.

```typescript
const isValid = await isRefreshTokenValid();
if (!isValid) {
  await cleanupSession();
}
```

##### `getValidSession()`
Récupère la session si valide, nettoie sinon.

```typescript
const session = await getValidSession();
if (!session) {
  // Rediriger vers login
}
```

##### `debugSession()`
Affiche les informations de debug (disponible dans la console).

```typescript
// Dans la console du navigateur
window.debugSession();
window.cleanupSession();
```

---

### 4. Composant SessionErrorBoundary

**Fichier:** `/src/components/SessionErrorBoundary.tsx`

Ce composant **détecte automatiquement** les erreurs de refresh token et affiche une interface utilisateur claire.

#### Fonctionnalités

- ✅ **Détection automatique** des erreurs de refresh token
- ✅ **Interface utilisateur claire** expliquant le problème
- ✅ **Bouton de nettoyage** pour résoudre le problème
- ✅ **Redirection automatique** après nettoyage

#### Intégration

```typescript
// App.tsx
import { SessionErrorBoundary } from "@/components/SessionErrorBoundary";

return (
  <SessionErrorBoundary>
    {/* Votre application */}
  </SessionErrorBoundary>
);
```

---

## 🛠️ Utilisation et Debugging

### Pour les Développeurs

#### 1. Vérifier l'État de la Session

Ouvrez la console du navigateur et tapez :

```javascript
window.debugSession();
```

Cela affichera :
- ✅ État de la session actuelle
- ✅ Présence des tokens (access + refresh)
- ✅ Date d'expiration
- ✅ Contenu du localStorage

#### 2. Nettoyer Manuellement la Session

Si vous rencontrez des problèmes :

```javascript
window.cleanupSession();
```

Ou utilisez le bouton dans l'interface utilisateur.

#### 3. Tester le Scénario d'Erreur

Pour tester la gestion d'erreur :

1. Connectez-vous à l'application
2. Ouvrez la console développeur
3. Allez dans **Application > Local Storage**
4. Supprimez uniquement la clé `supabase.auth.token`
5. Rechargez la page

➡️ L'application devrait détecter l'erreur et afficher l'interface de nettoyage.

---

### Pour les Utilisateurs

Si vous voyez le message **"Session Expirée"** :

1. **Cliquez sur "Nettoyer et Se Reconnecter"**
2. Attendez le nettoyage automatique
3. Vous serez redirigé vers la page de connexion
4. Reconnectez-vous normalement

---

## 🔒 Sécurité

### Bonnes Pratiques Implémentées

1. **PKCE Flow** : Flux d'authentification plus sécurisé
2. **Nettoyage automatique** : Aucune donnée sensible ne reste après déconnexion
3. **Validation stricte** : Vérification systématique de la validité des tokens
4. **Logs sécurisés** : Pas d'exposition de données sensibles dans les logs

### Ce qui est Nettoyé

Lors d'une erreur de refresh token, les éléments suivants sont supprimés :

- ✅ `supabase.auth.token` (token Supabase)
- ✅ `sb-*` (toutes les clés Supabase)
- ✅ `lastActivity` (activité utilisateur)
- ✅ `manualLogout` (flag de déconnexion)
- ✅ Tous les autres éléments du localStorage

---

## 📊 Événements d'Authentification Gérés

| Événement | Description | Action |
|-----------|-------------|--------|
| `SIGNED_IN` | Connexion réussie | Réinitialiser les flags d'erreur |
| `SIGNED_OUT` | Déconnexion | Nettoyer le localStorage |
| `TOKEN_REFRESHED` | Token rafraîchi | Logger le succès |
| `TOKEN_REFRESHED` (sans session) | Échec du refresh | Nettoyer et déconnecter |

---

## 🐛 Résolution de Problèmes

### Problème : L'erreur persiste après nettoyage

**Solution :**
1. Vider complètement le cache du navigateur
2. Fermer tous les onglets de l'application
3. Rouvrir l'application dans un nouvel onglet
4. Se reconnecter

### Problème : Déconnexions fréquentes

**Causes possibles :**
- Session timeout trop court (actuellement 15 minutes)
- Problème réseau empêchant le refresh automatique
- Conflit entre plusieurs onglets

**Solution :**
- Augmenter le `SESSION_TIMEOUT` dans `useSessionManager.ts`
- Vérifier la connexion internet
- Utiliser un seul onglet à la fois

### Problème : Erreur dans la console mais pas d'interface

**Solution :**
Vérifiez que `SessionErrorBoundary` est bien intégré dans `App.tsx` :

```typescript
<SessionErrorBoundary>
  <ThemeProvider>
    {/* Votre application */}
  </ThemeProvider>
</SessionErrorBoundary>
```

---

## 📝 Logs et Monitoring

### Logs Importants à Surveiller

```
✅ Token rafraîchi avec succès
🔒 Utilisateur déconnecté - Nettoyage du localStorage
❌ Erreur lors de la récupération de la session
🧹 Nettoyage du localStorage suite à un refresh token invalide
⏰ Session expirée - Déconnexion automatique
```

### Métriques à Suivre

- Fréquence des erreurs de refresh token
- Temps moyen de récupération après erreur
- Taux de réussite du refresh automatique

---

## 🚀 Améliorations Futures Possibles

1. **Retry automatique** : Tenter de rafraîchir le token plusieurs fois avant d'abandonner
2. **Notification utilisateur** : Toast notification avant déconnexion automatique
3. **Sauvegarde de l'état** : Restaurer l'état de l'application après reconnexion
4. **Analytics** : Tracker les erreurs de refresh token pour identifier les patterns

---

## 📚 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [PKCE Flow](https://oauth.net/2/pkce/)
- [Best Practices for Token Management](https://auth0.com/docs/secure/tokens/token-best-practices)

---

**Dernière mise à jour :** 2025-01-12  
**Version :** 1.0.0  
**Auteur :** Équipe Wadashaqeen
