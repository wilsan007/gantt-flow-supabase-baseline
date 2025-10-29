# 🔄 Invalider le Cache des Rôles

## **Méthode 1 : Console Navigateur (Recommandé)**

1. Ouvrir l'application dans le navigateur
2. Ouvrir la console (F12)
3. Exécuter cette commande :

```javascript
// Invalider tout le cache
localStorage.clear();
sessionStorage.clear();

// Recharger la page
window.location.reload();
```

## **Méthode 2 : Via le Code (Temporaire)**

Ajouter temporairement ce bouton dans `App.tsx` :

```tsx
// Dans App.tsx, ajouter temporairement
import { roleCacheManager } from '@/lib/roleCache';

// Quelque part dans le JSX
<button 
  onClick={() => {
    roleCacheManager.invalidateAll();
    window.location.reload();
  }}
  style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999 }}
>
  🔄 Clear Cache
</button>
```

## **Méthode 3 : Forcer le Refresh**

Dans la console du navigateur :

```javascript
// Importer le cache manager
import { roleCacheManager } from './src/lib/roleCache';

// Invalider
roleCacheManager.invalidateAll();

// Recharger
location.reload();
```

## **Méthode 4 : Hard Refresh**

Simplement faire **Ctrl + Shift + R** (ou Cmd + Shift + R sur Mac) pour forcer le rechargement complet.

---

## **Après l'invalidation**

Vous devriez voir dans la console :

```
🔍 Fetching roles for user: 5c5731ce-75d0-4455-8184-bc42c626cb17
📊 Roles query result: { data: [{ roles: { name: "tenant_admin" }, ... }], error: null }
✅ Roles fetched successfully: 1 roles
🎯 Rôles récupérés pour l'utilisateur: [{ roles: { name: "tenant_admin" }, ... }]
📋 Détail du rôle: tenant_admin
```

**Le problème sera résolu !** ✅
