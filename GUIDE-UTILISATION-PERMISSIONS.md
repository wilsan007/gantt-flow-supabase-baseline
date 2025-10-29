# 📋 Guide d'Utilisation - Système de Permissions

## 🎯 Vue d'Ensemble

Le système de permissions de Wadashaqeen est maintenant **entièrement documenté** dans le code pour éviter toute confusion future.

### 📁 **Fichiers Clés**

1. **`/src/lib/permissionsSystem.ts`** → Documentation complète + types + utilitaires
2. **`/src/hooks/useUserRoles.ts`** → Hook principal pour les rôles/permissions
3. **`/src/hooks/useSuperAdmin.ts`** → Hook spécialisé pour Super Admin

## 🏗️ **Structure de Base de Données**

```sql
-- Utilisateurs et leurs rôles
user_roles {
  user_id → auth.users.id
  role_id → roles.id
  is_active → boolean
  tenant_id → tenants.id
}

-- Définition des rôles
roles {
  id → UUID
  name → 'super_admin', 'tenant_admin', etc.
}

-- Définition des permissions
permissions {
  id → UUID
  name → 'manage_users', 'create_tenant', etc.
}

-- Liaison rôles ↔ permissions
role_permissions {
  role_id → roles.id
  permission_id → permissions.id
}
```

## 🔧 **Utilisation dans les Composants**

### **Vérification de Rôles**

```tsx
import { useUserRoles } from '@/hooks/useUserRoles';
import { RoleNames } from '@/lib/permissionsSystem';

const MyComponent = () => {
  const { hasRole, isSuperAdmin, isTenantAdmin } = useUserRoles();
  
  // Méthode 1: Fonctions helper
  const isAdmin = isSuperAdmin();
  const isTenant = isTenantAdmin();
  
  // Méthode 2: Vérification directe
  const isHR = hasRole(RoleNames.MANAGER_HR);
  const isPM = hasRole(RoleNames.PROJECT_MANAGER);
  
  return (
    <div>
      {isAdmin && <SuperAdminPanel />}
      {isTenant && <TenantAdminPanel />}
      {isHR && <HRSection />}
      {isPM && <ProjectSection />}
    </div>
  );
};
```

### **Vérification de Permissions**

```tsx
import { PermissionNames } from '@/lib/permissionsSystem';

const MyComponent = () => {
  const { hasPermission } = useUserRoles();
  
  const canManageUsers = hasPermission(PermissionNames.MANAGE_USERS);
  const canCreateTenant = hasPermission(PermissionNames.CREATE_TENANT);
  const canViewReports = hasPermission(PermissionNames.VIEW_REPORTS);
  
  return (
    <div>
      {canManageUsers && <UserManagementButton />}
      {canCreateTenant && <CreateTenantButton />}
      {canViewReports && <ReportsSection />}
    </div>
  );
};
```

## 🎭 **Hiérarchie des Rôles**

### **1. Super Admin** 👑
```tsx
// Accès complet au système
const { isSuperAdmin } = useUserRoles();

// Boutons visibles UNIQUEMENT pour super_admin
{isSuperAdmin() && (
  <>
    <Link to="/super-admin">👑 Super Admin</Link>
    <RoleManagementButton />
  </>
)}
```

### **2. Tenant Admin** 🏢
```tsx
// Administration du tenant
const { isTenantAdmin } = useUserRoles();

{isTenantAdmin() && <TenantManagementPanel />}
```

### **3. Manager HR** 👥
```tsx
// Gestion des ressources humaines
const { isHRManager } = useUserRoles();

{isHRManager() && <HRDashboard />}
```

### **4. Project Manager** 📊
```tsx
// Gestion des projets
const { isProjectManager } = useUserRoles();

{isProjectManager() && <ProjectDashboard />}
```

## 🔍 **Débogage**

### **Fonction de Debug Intégrée**

```tsx
import { debugUserPermissions } from '@/lib/permissionsSystem';

// Dans un composant ou useEffect
useEffect(() => {
  const userId = 'user-uuid-here';
  debugUserPermissions(userId);
}, []);
```

### **Logs Console**

```tsx
const { userRoles, userPermissions } = useUserRoles();

console.log('🎭 Rôles utilisateur:', userRoles);
console.log('🔐 Permissions utilisateur:', userPermissions);
```

## ⚠️ **Règles Importantes**

### **1. Sécurité**
- ✅ Toujours vérifier `is_active = true`
- ✅ Filtrer par `tenant_id` (sauf super_admin)
- ✅ Utiliser les enums pour éviter les erreurs de frappe

### **2. Performance**
- ✅ Les hooks cachent les résultats pendant la session
- ✅ Une seule requête pour récupérer rôles + permissions
- ✅ Jointures optimisées avec `!inner`

### **3. Évolutivité**
- ✅ Ajouter nouveaux rôles dans `RoleNames`
- ✅ Ajouter nouvelles permissions dans `PermissionNames`
- ✅ Mettre à jour la documentation dans `permissionsSystem.ts`

## 🚀 **Exemples Concrets**

### **App.tsx - Boutons Conditionnels**

```tsx
// Implémentation actuelle
const { isSuperAdmin } = useSuperAdmin();

// Navigation
{isSuperAdmin && (
  <Link to="/super-admin" className="text-yellow-600">
    👑 Super Admin
  </Link>
)}

// Header
{isSuperAdmin && <RoleManagementButton />}
```

### **Composant avec Permissions Multiples**

```tsx
const Dashboard = () => {
  const { 
    hasRole, 
    hasPermission, 
    isSuperAdmin, 
    userRoles 
  } = useUserRoles();
  
  const canManage = hasPermission(PermissionNames.MANAGE_USERS);
  const canView = hasPermission(PermissionNames.VIEW_REPORTS);
  const isAdmin = isSuperAdmin();
  
  return (
    <div className="dashboard">
      <h1>Tableau de Bord</h1>
      
      {/* Section Admin */}
      {isAdmin && (
        <AdminSection>
          <SuperAdminTools />
          <SystemSettings />
        </AdminSection>
      )}
      
      {/* Section Gestion */}
      {canManage && (
        <ManagementSection>
          <UserManagement />
          <RoleAssignment />
        </ManagementSection>
      )}
      
      {/* Section Rapports */}
      {canView && (
        <ReportsSection>
          <Analytics />
          <Charts />
        </ReportsSection>
      )}
      
      {/* Debug Info (dev uniquement) */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel>
          <p>Rôles: {userRoles.map(r => r.roles.name).join(', ')}</p>
        </DebugPanel>
      )}
    </div>
  );
};
```

## 📚 **Ressources**

- **Documentation complète** : `/src/lib/permissionsSystem.ts`
- **Hook principal** : `/src/hooks/useUserRoles.ts`
- **Types TypeScript** : Définis dans `permissionsSystem.ts`
- **Exemples d'usage** : Ce guide + commentaires dans le code

**Plus jamais de confusion sur les permissions !** 🎉

Toute la logique est maintenant **documentée**, **typée**, et **centralisée** pour une maintenance facile.
