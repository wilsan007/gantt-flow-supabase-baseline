# ✨ Fonctionnalité "Rôle Personnalisé" - Option "Autre"

## 🎯 Objectif

Permettre aux administrateurs d'inviter des collaborateurs avec des rôles personnalisés qui ne figurent pas dans la liste prédéfinie de rôles, offrant ainsi une flexibilité maximale pour les organisations avec des structures hiérarchiques uniques.

---

## 📋 Fonctionnalités Implémentées

### **1. Option "Autre" dans le Select de Rôle**

**Emplacement** : `src/components/hr/CollaboratorInvitation.tsx`

#### **Interface Utilisateur**
- ✅ Option "✏️ Autre" ajoutée en fin de liste des rôles
- ✅ Description : "Spécifier un rôle personnalisé"
- ✅ Affichage conditionnel d'un champ de saisie

#### **Comportement**
```typescript
// Lors de la sélection de "Autre"
- La liste des rôles se ferme
- Un nouveau champ "Rôle personnalisé" apparaît
- Le champ est requis et doit être rempli
- Placeholder : "Ex: Consultant, Stagiaire, Freelance..."
- Style : Bordure primaire pour attirer l'attention
```

### **2. Gestion d'État**

```typescript
// États ajoutés
const [showCustomRole, setShowCustomRole] = useState(false);
const [customRole, setCustomRole] = useState('');

// Handler spécifique pour le changement de rôle
const handleRoleChange = (value: string) => {
  if (value === 'autre') {
    setShowCustomRole(true);
    setForm(prev => ({ ...prev, roleToAssign: '' }));
  } else {
    setShowCustomRole(false);
    setCustomRole('');
    setForm(prev => ({ ...prev, roleToAssign: value }));
  }
};
```

### **3. Validation du Rôle Personnalisé**

**Validation côté frontend** :
```typescript
// Avant l'envoi du formulaire
if (showCustomRole && !customRole.trim()) {
  toast({
    title: '⚠️ Rôle manquant',
    description: 'Veuillez spécifier le rôle personnalisé ou sélectionner un rôle dans la liste',
    variant: 'destructive'
  });
  return;
}
```

**Message d'erreur clair** :
- ✅ Toast avec titre et description
- ✅ Indication précise du problème
- ✅ Suggestion d'action

### **4. Soumission du Formulaire**

```typescript
// Utiliser le rôle personnalisé si "Autre" est sélectionné
const formToSubmit = {
  ...form,
  roleToAssign: showCustomRole ? customRole.trim() : form.roleToAssign
};

const success = await sendInvitation(formToSubmit);
```

**Nettoyage après soumission réussie** :
```typescript
if (success) {
  setForm({
    email: '',
    fullName: '',
    roleToAssign: availableRoles.length > 0 ? availableRoles[0].value : '',
    department: '',
    jobPosition: '',
  });
  setShowCustomRole(false);  // Réinitialiser l'état "Autre"
  setCustomRole('');          // Vider le rôle personnalisé
}
```

---

## 🎨 Expérience Utilisateur

### **Flux Utilisateur Complet**

```
1. Tenant Admin ouvre le formulaire d'invitation
   ↓
2. Clique sur le Select "Rôle"
   ↓
3. Parcourt la liste des rôles disponibles
   - Manager
   - Employé
   - Responsable RH
   - ... (autres rôles de la DB)
   - ✏️ Autre ← Nouveau
   ↓
4. Sélectionne "✏️ Autre"
   ↓
5. Un nouveau champ apparaît : "Rôle personnalisé *"
   ↓
6. Saisit le rôle : "Consultant", "Stagiaire", "Freelance", etc.
   ↓
7. Remplit le reste du formulaire (email, nom, etc.)
   ↓
8. Clique sur "Envoyer l'invitation"
   ↓
9. Validation : Le rôle personnalisé ne doit pas être vide
   ↓
10. Envoi de l'invitation avec le rôle personnalisé
    ↓
11. Le collaborateur reçoit l'invitation avec son rôle spécifique
```

### **Feedback Visuel**

#### **Champ Rôle Personnalisé**
```tsx
<Input
  id="customRole"
  type="text"
  placeholder="Ex: Consultant, Stagiaire, Freelance..."
  value={customRole}
  onChange={(e) => setCustomRole(e.target.value)}
  disabled={isSending}
  required
  className="border-primary"  // Bordure bleue pour attirer l'attention
/>
```

#### **Message d'Aide**
```
💡 Ce rôle personnalisé sera créé pour ce collaborateur
```

### **Messages d'Erreur**

| Scénario | Toast | Description |
|----------|-------|-------------|
| **Rôle personnalisé vide** | ⚠️ Rôle manquant | "Veuillez spécifier le rôle personnalisé ou sélectionner un rôle dans la liste" |
| **Invitation réussie** | ✅ Invitation envoyée ! | "[Nom] recevra un email à [email]" |

---

## 🔧 Aspects Techniques

### **1. Champ Conditionnel**

Le champ "Rôle personnalisé" n'apparaît que si `showCustomRole === true` :

```tsx
{showCustomRole && (
  <div className="space-y-2">
    <Label htmlFor="customRole">
      Rôle personnalisé <span className="text-red-500">*</span>
    </Label>
    <Input
      id="customRole"
      type="text"
      placeholder="Ex: Consultant, Stagiaire, Freelance..."
      value={customRole}
      onChange={(e) => setCustomRole(e.target.value)}
      disabled={isSending}
      required
      className="border-primary"
    />
    <p className="text-xs text-muted-foreground">
      💡 Ce rôle personnalisé sera créé pour ce collaborateur
    </p>
  </div>
)}
```

### **2. Synchronisation État/Formulaire**

```typescript
// Le Select affiche "autre" si showCustomRole est true
value={showCustomRole ? 'autre' : form.roleToAssign}

// Utiliser handleRoleChange au lieu de handleInputChange
onValueChange={handleRoleChange}
```

### **3. Gestion Backend**

**Le rôle personnalisé est envoyé tel quel à l'Edge Function** :
- ✅ Validation côté frontend (non vide)
- ✅ Trim automatique des espaces
- ✅ Envoyé dans le champ `roleToAssign`

**L'Edge Function traite le rôle personnalisé** :
- ✅ Accepte n'importe quelle chaîne non vide
- ✅ Stocké dans `user_metadata.role_to_assign`
- ✅ Utilisé lors de la confirmation pour créer le profil

---

## 📊 Cas d'Usage

### **Exemples de Rôles Personnalisés**

| Rôle Personnalisé | Cas d'Usage |
|-------------------|-------------|
| **Consultant** | Prestataires externes avec accès limité |
| **Stagiaire** | Étudiants en stage temporaire |
| **Freelance** | Travailleurs indépendants |
| **Auditeur** | Accès en lecture seule pour audit |
| **Partenaire** | Collaborateurs externes de partenaires |
| **Bénévole** | Pour organisations à but non lucratif |
| **Apprenti** | Formations en alternance |
| **Observateur** | Invités avec accès très limité |

### **Avantages**

1. **Flexibilité** : Pas de limitation aux rôles prédéfinis
2. **Adaptabilité** : S'adapte à toutes les structures organisationnelles
3. **Rapidité** : Pas besoin de créer un rôle dans la DB avant d'inviter
4. **Simplicité** : Interface intuitive avec un seul clic

---

## ✅ Checklist de Validation

### **Fonctionnel**
- [x] Option "Autre" visible dans le Select
- [x] Champ "Rôle personnalisé" apparaît à la sélection
- [x] Validation : rôle personnalisé requis si "Autre" sélectionné
- [x] Toast d'erreur si rôle personnalisé vide
- [x] Rôle personnalisé envoyé correctement à l'API
- [x] Réinitialisation complète après envoi réussi

### **UX**
- [x] Placeholder explicite avec exemples
- [x] Message d'aide sous le champ
- [x] Bordure primaire pour attirer l'attention
- [x] Icône ✏️ pour "Autre"
- [x] Transition fluide entre modes

### **Technique**
- [x] États `showCustomRole` et `customRole` gérés
- [x] Handler `handleRoleChange` fonctionnel
- [x] Validation dans `handleSubmit`
- [x] Hook `useToast` importé et utilisé
- [x] Trim du rôle personnalisé avant envoi

---

## 🎯 Impact

### **Avant**
```
❌ Seulement les rôles prédéfinis (Manager, Employé, RH)
❌ Obligation de créer un rôle dans la DB avant d'inviter
❌ Pas de flexibilité pour cas spéciaux
```

### **Après**
```
✅ Rôles prédéfinis + Option "Autre"
✅ Création instantanée de rôles personnalisés
✅ Flexibilité totale pour tous les cas d'usage
✅ UX moderne avec feedback clair
```

---

## 🚀 Déploiement

**Fichiers Modifiés** :
1. ✅ `src/components/hr/CollaboratorInvitation.tsx`
   - Ajout états `showCustomRole`, `customRole`
   - Ajout handler `handleRoleChange`
   - Modification `handleSubmit` avec validation
   - Ajout option "Autre" dans le Select
   - Ajout champ conditionnel pour rôle personnalisé
   - Import `useToast`

**Aucune modification backend requise** :
- L'Edge Function accepte déjà n'importe quelle chaîne pour `roleToAssign`
- Le système est compatible immédiatement

**Prêt pour production** ✅

---

## 🎉 Résultat Final

**Les tenant_admin peuvent maintenant :**
- ✅ Sélectionner parmi les rôles existants dans la DB
- ✅ **OU** spécifier un rôle personnalisé via l'option "Autre"
- ✅ Inviter des collaborateurs avec n'importe quel rôle
- ✅ Bénéficier d'une validation claire et de messages d'aide
- ✅ Avoir une expérience utilisateur moderne et intuitive

**Flexibilité maximale pour toutes les structures organisationnelles ! 🚀**
