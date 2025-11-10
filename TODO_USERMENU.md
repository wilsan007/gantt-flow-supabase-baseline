# 📅 RAPPEL : Réintégrer UserMenu

## 🗓️ Date : Dans 1 semaine (17 novembre 2025)

## 🎯 Tâche

**Réactiver le composant UserMenu dans le header** pour permettre aux utilisateurs d'accéder à :

- Mon profil avec photo
- Changer mot de passe
- Modifier logo entreprise (admin)
- Choisir la langue
- Calendrier personnel
- Mes formations
- Bloc-notes
- Mes statistiques
- Aide
- Se déconnecter

---

## 📝 Instructions de Réintégration

### **Fichier à Modifier** :

`/src/components/layout/AppLayoutWithSidebar.tsx`

### **Étape 1 : Ajouter les imports**

```typescript
import { UserMenu } from '@/components/user/UserMenu';
import { useTenant } from '@/contexts/TenantContext';
import { useSessionManager } from '@/hooks/useSessionManager';
```

### **Étape 2 : Ajouter les hooks dans le composant**

```typescript
const { session } = useSessionManager();
const { currentTenant } = useTenant();
const user = session?.user || null;
```

### **Étape 3 : Ajouter UserMenu au header mobile (après RoleIndicator)**

```tsx
<div className="hidden sm:block">
  <RoleIndicator />
</div>;
{
  /* User Menu */
}
{
  user && (
    <UserMenu
      user={user as any}
      isTenantAdmin={isTenantAdmin}
      tenantName={currentTenant?.name}
      onSignOut={signOut}
    />
  );
}
```

### **Étape 4 : Ajouter UserMenu au header desktop (après ThemeToggle)**

```tsx
<ThemeToggle />;
{
  /* User Menu */
}
{
  user && (
    <UserMenu
      user={user as any}
      isTenantAdmin={isTenantAdmin}
      tenantName={currentTenant?.name}
      onSignOut={signOut}
    />
  );
}
```

---

## ✅ Vérification Après Réintégration

1. ✅ Photo de profil visible en haut à droite
2. ✅ Clic sur photo → Menu déroulant s'ouvre
3. ✅ 25+ options disponibles dans le menu
4. ✅ Navigation fonctionne correctement
5. ✅ Badge "Admin · Nom Entreprise" visible si tenant admin

---

## 📦 Composant UserMenu

**Emplacement** : `/src/components/user/UserMenu.tsx`

**Fonctionnalités** :

- Avatar avec Gravatar automatique
- Indicateur de statut (Online, Away, Busy, Offline)
- Menu complet avec 25+ options
- Navigation contextuelle vers Settings avec tabs
- Actions spécifiques pour tenant admin
- Pattern : ClickUp, Notion, Linear

---

## 🔧 Tests à Effectuer

1. Se connecter avec Super Admin → Voir toutes les options admin
2. Se connecter avec Tenant Admin → Voir options entreprise
3. Se connecter avec utilisateur basique → Menu limité aux options personnelles
4. Tester navigation vers chaque page du menu
5. Vérifier changement de statut utilisateur
6. Tester déconnexion via le menu

---

## 📌 Notes Importantes

- Le composant est déjà créé et fonctionnel
- Testé avec succès le 10 novembre 2025
- Retiré temporairement pour développement en local
- Aucune modification du composant UserMenu.tsx nécessaire
- Juste réintégrer dans AppLayoutWithSidebar.tsx

---

**Date de création de ce rappel** : 10 novembre 2025, 22:55 UTC+3
**Date de réintégration prévue** : 17 novembre 2025

🚀 **BON DÉVELOPPEMENT EN LOCAL !**
