# 🔐 Système de Contrôle d'Accès Basé sur les Rôles

## 🎯 Vue d'Ensemble

Implémentation complète d'un système de **contrôle d'accès basé sur les rôles (RBAC)** qui détermine automatiquement les permissions de l'utilisateur dès sa connexion.

## 🏗️ Architecture du Système

### **1. Hook Principal : `useRoleBasedAccess`**
```typescript
// Détermine automatiquement tous les droits d'accès
const {
  accessRights,           // Objet complet des permissions
  canAccess,             // Fonction pour vérifier un accès spécifique
  getAccessLevel,        // Niveau d'accès global
  getUserRoleNames,      // Liste des rôles de l'utilisateur
  getAvailableFeatures,  // Fonctionnalités disponibles
  getAccessRestrictions  // Restrictions actuelles
} = useRoleBasedAccess();
```

### **2. Composant de Protection : `ProtectedRoute`**
```typescript
// Protection automatique des routes
<ProtectedRoute requiredAccess="canAccessHR">
  <HRPage />
</ProtectedRoute>

// Protection par rôle spécifique
<ProtectedRoute requiredRole="super_admin">
  <SuperAdminPage />
</ProtectedRoute>

// Protection par permission
<ProtectedRoute requiredPermission="manage_users">
  <UserManagement />
</ProtectedRoute>
```

### **3. Indicateur de Rôle : `RoleIndicator`**
```typescript
// Affichage du rôle dans l'en-tête avec détails des permissions
<RoleIndicator />
```

## 🎭 Hiérarchie des Rôles et Permissions

### **Super Admin** 👑
```typescript
accessRights = {
  // Accès complet à tout
  canAccessDashboard: true,
  canAccessHR: true,
  canAccessProjects: true,
  canAccessTasks: true,
  canAccessSuperAdmin: true,
  
  // Permissions administratives
  canManageUsers: true,
  canManageRoles: true,
  canManageTenants: true,
  canViewSystemLogs: true,
  
  // Toutes les autres permissions...
  accessLevel: 'super_admin'
}
```

### **Tenant Admin** 🛡️
```typescript
accessRights = {
  // Accès à la gestion du tenant
  canAccessDashboard: true,
  canAccessHR: true,
  canAccessProjects: true,
  canAccessTasks: true,
  canAccessSuperAdmin: false,  // ❌ Pas d'accès système
  
  // Permissions de gestion
  canManageUsers: true,
  canManageProjects: true,
  canManageProjectBudgets: true,
  canViewReports: true,
  
  accessLevel: 'admin'
}
```

### **HR Manager** 👥
```typescript
accessRights = {
  // Accès spécialisé RH
  canAccessDashboard: true,
  canAccessHR: true,
  canAccessProjects: false,    // ❌ Pas d'accès projets
  canAccessTasks: true,
  
  // Permissions RH
  canManageEmployees: true,
  canViewReports: true,
  canManageAbsences: true,
  canViewPayroll: true,
  
  accessLevel: 'advanced'
}
```

### **Project Manager** 💼
```typescript
accessRights = {
  // Accès spécialisé projets
  canAccessDashboard: true,
  canAccessHR: false,          // ❌ Pas d'accès RH
  canAccessProjects: true,
  canAccessTasks: true,
  
  // Permissions projets
  canCreateProjects: true,
  canManageProjects: true,
  canAssignTasks: true,
  canViewProjectReports: true,
  
  accessLevel: 'advanced'
}
```

### **Employé Standard** 👤
```typescript
accessRights = {
  // Accès de base
  canAccessDashboard: true,
  canAccessHR: false,
  canAccessProjects: false,
  canAccessTasks: true,        // ✅ Peut voir ses tâches
  
  // Permissions limitées
  canCreateTasks: true,        // ✅ Peut créer des tâches
  canAssignTasks: false,       // ❌ Ne peut pas assigner
  canManageAllTasks: false,    // ❌ Gestion limitée
  
  accessLevel: 'basic'
}
```

## 🔄 Flux de Détermination des Rôles

### **1. Connexion Utilisateur**
```typescript
// Lors de la connexion
supabase.auth.signInWithPassword(email, password)
  ↓
// Événement d'authentification déclenché
onAuthStateChange('SIGNED_IN', session)
  ↓
// useRoleBasedAccess activé automatiquement
useRoleBasedAccess() → Récupère les rôles depuis user_roles
  ↓
// Calcul automatique des permissions
setAccessRights(calculatedRights)
```

### **2. Vérification des Permissions**
```typescript
// Dans useRoleBasedAccess
useEffect(() => {
  // 1. Récupérer les rôles de l'utilisateur
  const userRoles = await getUserRoles(user.id);
  
  // 2. Calculer les permissions basées sur les rôles
  const permissions = calculatePermissions(userRoles);
  
  // 3. Déterminer le niveau d'accès
  const accessLevel = determineAccessLevel(userRoles);
  
  // 4. Mettre à jour l'état des droits d'accès
  setAccessRights({
    canAccessHR: isHRManager() || isTenantAdmin() || isSuperAdmin(),
    canAccessProjects: isProjectManager() || isTenantAdmin() || isSuperAdmin(),
    // ... autres permissions
  });
}, [userRoles]);
```

## 🛡️ Protection des Routes

### **Navigation Conditionnelle**
```typescript
// Dans App.tsx - Navigation basée sur les permissions
{accessRights.canAccessHR && (
  <Link to="/hr">Ressources Humaines</Link>
)}

{accessRights.canAccessProjects && (
  <Link to="/projects">Projets & Alertes</Link>
)}

{accessRights.canAccessSuperAdmin && (
  <Link to="/super-admin">👑 Super Admin</Link>
)}
```

### **Protection des Routes**
```typescript
// Protection automatique avec message d'erreur
<Route 
  path="/hr" 
  element={
    <ProtectedRoute requiredAccess="canAccessHR">
      <HRPage />
    </ProtectedRoute>
  } 
/>
```

### **Page d'Accès Refusé**
```typescript
// Affichage automatique si l'accès est refusé
<Card>
  <CardHeader>
    <Shield className="text-red-600" />
    <CardTitle>Accès Refusé</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Raison : {denialReason}</p>
    <p>Vos rôles : {getUserRoleNames().join(', ')}</p>
    <p>Niveau d'accès : {getAccessLevel()}</p>
    <Button onClick={() => window.history.back()}>
      Retour
    </Button>
  </CardContent>
</Card>
```

## 📊 Indicateur de Rôle dans l'En-tête

### **Affichage Visuel**
```typescript
// Icône et badge basés sur le rôle principal
{isSuperAdmin && <Crown className="text-yellow-600" />}
{isTenantAdmin && <Shield className="text-blue-600" />}
{isHRManager && <Users className="text-green-600" />}
{isProjectManager && <Briefcase className="text-purple-600" />}
```

### **Popover Détaillé**
```typescript
// Clic sur l'indicateur → Détails complets
<PopoverContent>
  <div>
    <p>Rôles assignés : {getUserRoleNames()}</p>
    <p>Niveau : {getAccessLevel()}</p>
    <p>Fonctionnalités disponibles :</p>
    <ul>
      {getAvailableFeatures().map(feature => (
        <li>✅ {feature}</li>
      ))}
    </ul>
    <p>Restrictions :</p>
    <ul>
      {getAccessRestrictions().map(restriction => (
        <li>❌ {restriction}</li>
      ))}
    </ul>
  </div>
</PopoverContent>
```

## 🔧 Exemples d'Utilisation

### **Dans un Composant**
```typescript
const MyComponent = () => {
  const { canAccess, isSuperAdmin, accessLevel } = useRoleBasedAccess();
  
  return (
    <div>
      {canAccess('canManageUsers') && (
        <UserManagementSection />
      )}
      
      {canAccess('canViewReports') && (
        <ReportsSection />
      )}
      
      {isSuperAdmin && (
        <SystemAdministration />
      )}
      
      <Badge>{accessLevel}</Badge>
    </div>
  );
};
```

### **Protection Granulaire**
```typescript
// Protection par fonctionnalité spécifique
<ProtectedRoute requiredAccess="canManageProjectBudgets">
  <BudgetManagement />
</ProtectedRoute>

// Protection par rôle exact
<ProtectedRoute requiredRole="hr_manager">
  <PayrollSection />
</ProtectedRoute>

// Protection par permission
<ProtectedRoute requiredPermission="view_system_logs">
  <SystemLogs />
</ProtectedRoute>
```

## 🎯 Avantages du Système

### **1. Sécurité Automatique**
- ✅ **Détermination automatique** des rôles à la connexion
- ✅ **Protection des routes** basée sur les permissions
- ✅ **Navigation conditionnelle** selon les droits
- ✅ **Messages d'erreur explicites** en cas d'accès refusé

### **2. Expérience Utilisateur**
- ✅ **Interface adaptée** au niveau d'accès
- ✅ **Indicateur visuel** du rôle dans l'en-tête
- ✅ **Feedback immédiat** sur les permissions
- ✅ **Navigation intuitive** (pas de liens inaccessibles)

### **3. Maintenabilité**
- ✅ **Logique centralisée** dans `useRoleBasedAccess`
- ✅ **Composants réutilisables** (`ProtectedRoute`, `RoleIndicator`)
- ✅ **Configuration flexible** des permissions
- ✅ **Évolutivité** pour nouveaux rôles/permissions

### **4. Conformité**
- ✅ **Principe du moindre privilège** appliqué
- ✅ **Traçabilité** des accès et restrictions
- ✅ **Audit trail** des permissions
- ✅ **Séparation des responsabilités** respectée

## 📁 Fichiers du Système

### **Hooks**
- ✅ `/src/hooks/useRoleBasedAccess.ts` - Hook principal
- ✅ `/src/hooks/useUserRoles.ts` - Gestion des rôles (existant)
- ✅ `/src/lib/permissionsSystem.ts` - Types et utilitaires (existant)

### **Composants**
- ✅ `/src/components/auth/ProtectedRoute.tsx` - Protection des routes
- ✅ `/src/components/auth/RoleIndicator.tsx` - Indicateur de rôle

### **Configuration**
- ✅ `/src/App.tsx` - Intégration du système de contrôle d'accès

## 🚀 Résultat Final

### **À la Connexion**
1. ✅ **Utilisateur se connecte** avec ses identifiants
2. ✅ **Rôles déterminés automatiquement** depuis la base de données
3. ✅ **Permissions calculées** basées sur les rôles
4. ✅ **Interface adaptée** selon le niveau d'accès
5. ✅ **Navigation filtrée** selon les droits

### **Navigation Sécurisée**
- ✅ **Super Admin** → Voit tout (Dashboard, HR, Projets, Tâches, Super Admin)
- ✅ **Tenant Admin** → Voit la gestion (Dashboard, HR, Projets, Tâches)
- ✅ **HR Manager** → Voit RH (Dashboard, HR, Tâches)
- ✅ **Project Manager** → Voit projets (Dashboard, Projets, Tâches)
- ✅ **Employé** → Voit de base (Dashboard, Tâches)

**Système de contrôle d'accès complet et automatique implémenté !** 🔐
