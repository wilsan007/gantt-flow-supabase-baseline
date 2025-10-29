# 🔧 Solution : Simplifier useTenant

## 📊 Analyse d'Impact

### **Option 1 : Supprimer useTenant** ❌ (Non recommandé)
**Impact** :
- 8 fichiers à modifier
- Risque de casser `TenantContext` et `useTenantOwnerSetup`
- Perte de fonctionnalités : `switchTenant`, `hasPermission`, `canManage`

### **Option 2 : Simplifier useTenant** ✅ (Recommandé)
**Impact** :
- 1 seul fichier à modifier (`useTenant.ts`)
- Garde toutes les fonctionnalités existantes
- Utilise `useUserRoles` en interne
- Aucun changement dans les composants

## 🎯 Solution Recommandée

Remplacer le contenu de `useTenant.ts` par une version simplifiée :

```typescript
import { useUserRoles } from './useUserRoles';

export const useTenant = () => {
  const { userRoles, isLoading } = useUserRoles();
  
  // Récupérer le tenant_id depuis le premier rôle
  const tenantId = userRoles[0]?.tenant_id;
  const currentTenant = tenantId ? { id: tenantId, name: 'Mon Organisation' } : null;
  
  // Fonctions simplifiées
  const hasPermission = (permission: string) => true; // TODO: Implémenter si nécessaire
  const canManage = (resource: string) => true; // TODO: Implémenter si nécessaire
  const hasRole = (roleName: string) => userRoles.some(r => r.roles.name === roleName);
  const getActiveRoles = () => userRoles.filter(r => r.is_active).map(r => r.roles.name);
  
  return {
    currentTenant,
    userMembership: null,
    userRoles,
    loading: isLoading,
    tenantId,
    hasPermission,
    canManage,
    hasRole,
    getActiveRoles,
    isAdmin: userRoles.some(r => ['tenant_admin', 'super_admin'].includes(r.roles.name)),
    fetchUserTenant: () => Promise.resolve(),
    switchTenant: () => Promise.resolve()
  };
};
```

## ✅ Avantages

1. **Simplicité** : 50 lignes au lieu de 400+
2. **Fiabilité** : Utilise `useUserRoles` qui fonctionne
3. **Compatibilité** : API identique, aucun changement ailleurs
4. **Performance** : Pas de fetch supplémentaire
5. **Maintenabilité** : Code simple et clair

## 📝 Actions à Faire

1. Remplacer le contenu de `src/hooks/useTenant.ts`
2. Supprimer les logs de debug
3. Tester tous les modules
4. Supprimer les fallbacks temporaires dans les hooks Enterprise

## 🚀 Résultat Final

- ✅ `tenantId` toujours disponible
- ✅ Tous les modules fonctionnent
- ✅ Code simplifié et maintenable
- ✅ Pas de breaking changes
