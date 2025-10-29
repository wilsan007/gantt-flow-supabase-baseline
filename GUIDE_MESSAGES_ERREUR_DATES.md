# 📋 Guide des Messages d'Erreur - Validation des Dates

## 🎯 Objectif

Fournir des messages d'erreur **clairs, contextuels et actionnables** pour une expérience utilisateur optimale.

---

## 🎨 Principes de Design des Messages

### ✅ **Ce qui rend un bon message d'erreur**

1. **❌ Icône claire** : Indique immédiatement qu'il y a un problème
2. **📅 Contexte** : Affiche la date choisie par l'utilisateur
3. **🎯 Référence** : Montre la contrainte (projet, tâche, sous-tâche)
4. **💡 Solution** : Propose une action concrète
5. **Format lisible** : Utilise des sauts de ligne et des emojis

---

## 📊 Hiérarchie des Messages (4 Niveaux)

### **Niveau 1 : Projet → Tâche**

#### **Erreur : Date de début trop tôt**
```
❌ Date de début invalide pour la tâche

📅 Date choisie : 2025-08-01
📁 Projet : Début le 2025-09-17

💡 Solution : Choisissez une date à partir du 2025-09-17

HINT: La tâche doit commencer après ou en même temps que son projet
```

#### **Erreur : Date de fin trop tard**
```
❌ Date de fin invalide pour la tâche

📅 Date choisie : 2026-03-15
📁 Projet : Se termine le 2026-02-11

💡 Solution : Choisissez une date avant le 2026-02-11

HINT: La tâche doit se terminer avant ou en même temps que son projet
```

---

### **Niveau 2 : Tâche Parente → Sous-tâche**

#### **Erreur : Date de début trop tôt**
```
❌ Date de début invalide pour la sous-tâche

📅 Date choisie : 2025-09-10
📝 Tâche parente : Début le 2025-09-17

💡 Solution : Choisissez une date à partir du 2025-09-17

HINT: La sous-tâche doit commencer après ou en même temps que sa tâche parente
```

#### **Erreur : Date de fin trop tard**
```
❌ Date de fin invalide pour la sous-tâche

📅 Date choisie : 2025-10-20
📝 Tâche parente : Se termine le 2025-10-13

💡 Solution : Choisissez une date avant le 2025-10-13

HINT: La sous-tâche doit se terminer avant ou en même temps que sa tâche parente
```

---

### **Niveau 3 : Tâche → Action**

#### **Erreur : Action d'une tâche parente**
```
❌ Date invalide pour l'action

📅 Vous avez choisi : 2025-10-20
🎯 Tâche : "Documentation"
⏰ Date limite de la tâche : 2025-10-13

💡 Solution : Choisissez une date entre 2025-09-17 et 2025-10-13

HINT: L'action doit se terminer avant ou en même temps que sa tâche parente
```

#### **Erreur : Action d'une sous-tâche**
```
❌ Date invalide pour l'action

📅 Vous avez choisi : 2025-10-18
🎯 Sous-tâche : "Sous-tâche de Documentation"
⏰ Date limite de la sous-tâche : 2025-10-13

💡 Solution : Choisissez une date entre 2025-09-17 et 2025-10-13

HINT: L'action doit se terminer avant ou en même temps que sa sous-tâche parente
```

---

## 🎯 Exemples Concrets d'Utilisation

### **Scénario 1 : Création d'une Tâche**

**Contexte** :
- Projet : "Application Mobile" (2025-08-11 → 2025-12-09)
- Utilisateur crée une tâche : 2025-07-01 → 2025-08-15

**Message affiché** :
```
❌ Date de début invalide pour la tâche

📅 Date choisie : 2025-07-01
📁 Projet : Début le 2025-08-11

💡 Solution : Choisissez une date à partir du 2025-08-11
```

**Action utilisateur** : Ajuste la date de début à 2025-08-11 ou après

---

### **Scénario 2 : Ajout d'une Action à une Sous-tâche**

**Contexte** :
- Sous-tâche : "Préparer documentation" (2025-09-17 → 2025-10-13)
- Utilisateur crée une action avec échéance : 2025-10-20

**Message affiché** :
```
❌ Date invalide pour l'action

📅 Vous avez choisi : 2025-10-20
🎯 Sous-tâche : "Préparer documentation"
⏰ Date limite de la sous-tâche : 2025-10-13

💡 Solution : Choisissez une date entre 2025-09-17 et 2025-10-13
```

**Action utilisateur** : Ajuste l'échéance à 2025-10-13 ou avant

---

### **Scénario 3 : Modification d'un Projet**

**Contexte** :
- Projet : "Migration Cloud" (2025-08-11 → 2025-12-09)
- Tâche existante : "Design Interface" (2025-09-17 → 2025-12-15)
- Utilisateur réduit la fin du projet à 2025-11-30

**Message affiché** :
```
❌ Date de fin invalide pour la tâche

📅 Date choisie : 2025-12-15
📁 Projet : Se termine le 2025-11-30

💡 Solution : Choisissez une date avant le 2025-11-30
```

**Action utilisateur** : Ajuste d'abord les tâches, puis le projet

---

## 💡 Bonnes Pratiques UX

### **✅ À Faire**

1. **Être spécifique** : Indiquer exactement quelle date pose problème
2. **Montrer le contexte** : Afficher le nom de l'élément parent
3. **Proposer une solution** : Donner la plage de dates valide
4. **Utiliser des emojis** : Rendre le message plus visuel et scannable
5. **Formater clairement** : Utiliser des sauts de ligne pour la lisibilité

### **❌ À Éviter**

1. ~~"Erreur de validation"~~ → Trop vague
2. ~~"Date invalide"~~ → Pas assez de contexte
3. ~~"Veuillez corriger"~~ → Pas de solution concrète
4. ~~Messages en anglais technique~~ → Pas accessible
5. ~~Tout en une ligne~~ → Difficile à lire

---

## 🔄 Mode Ajustement Automatique

Si vous activez le mode ajustement au lieu de validation stricte, les messages deviennent des **notifications informatives** :

```
✅ Action créée avec succès

ℹ️ Date ajustée automatiquement
   Date demandée : 2025-10-20
   Date appliquée : 2025-10-13
   Raison : Correspond à la date limite de la sous-tâche "Préparer documentation"
```

---

## 📱 Intégration Frontend

### **Recommandations pour l'affichage**

```typescript
// Exemple de gestion d'erreur dans le frontend
try {
  await supabase.from('task_actions').insert({
    title: 'Nouvelle action',
    due_date: '2025-10-20',
    task_id: 'task-id'
  });
} catch (error) {
  // Le message d'erreur PostgreSQL est déjà formaté
  showErrorDialog({
    title: 'Validation des dates',
    message: error.message, // Contient le message formaté avec emojis
    type: 'warning',
    actions: [
      { label: 'Ajuster la date', primary: true },
      { label: 'Annuler' }
    ]
  });
}
```

### **Composant d'Erreur Suggéré**

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Validation des dates</AlertTitle>
  <AlertDescription className="whitespace-pre-line">
    {error.message}
  </AlertDescription>
  <AlertAction onClick={handleAdjustDate}>
    Ajuster la date
  </AlertAction>
</Alert>
```

---

## 🎨 Personnalisation par Langue

Les messages sont actuellement en français. Pour ajouter d'autres langues :

```sql
-- Exemple avec détection de langue
IF current_setting('app.language', true) = 'en' THEN
  RAISE EXCEPTION E'❌ Invalid action date\n\n'
    '📅 Selected date: %\n'
    '🎯 Task: "%"\n'
    '⏰ Task deadline: %\n\n'
    '💡 Solution: Choose a date between % and %';
ELSE
  -- Message en français (par défaut)
END IF;
```

---

## 📊 Métriques de Succès

Pour mesurer l'efficacité des messages d'erreur :

1. **Taux de résolution** : % d'utilisateurs qui corrigent l'erreur
2. **Temps de résolution** : Temps moyen pour corriger
3. **Taux d'abandon** : % d'utilisateurs qui abandonnent
4. **Demandes de support** : Nombre de tickets liés aux dates

---

## ✅ Checklist de Validation

Avant de déployer un nouveau message d'erreur :

- [ ] Le message commence par une icône claire (❌)
- [ ] La date problématique est affichée
- [ ] Le contexte (projet/tâche/sous-tâche) est mentionné
- [ ] Une solution concrète est proposée
- [ ] Le message est formaté avec des sauts de ligne
- [ ] Un HINT complémentaire est fourni
- [ ] Le message est testé avec de vraies données
- [ ] Le message est cohérent avec les autres niveaux

---

## 🎉 Résultat Final

**Avant** :
```
ERROR: date check constraint violated
```

**Après** :
```
❌ Date invalide pour l'action

📅 Vous avez choisi : 2025-10-20
🎯 Sous-tâche : "Préparer documentation"
⏰ Date limite de la sous-tâche : 2025-10-13

💡 Solution : Choisissez une date entre 2025-09-17 et 2025-10-13

HINT: L'action doit se terminer avant ou en même temps que sa sous-tâche parente
```

**Impact** : Expérience utilisateur claire, guidée et professionnelle ! 🚀
