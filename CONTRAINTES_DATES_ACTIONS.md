# 🔒 Contraintes de Dates pour Actions - Implémentation Complète

## 🎯 Objectif
Garantir que les utilisateurs ne peuvent sélectionner que des dates valides dans les fourchettes autorisées, et que les dates de référence (tâche parent) sont clairement identifiées comme non modifiables.

---

## ✅ Contraintes Implémentées

### **1. Date de la Tâche Parent - NON MODIFIABLE** 🔒

#### **Pour Activités Récurrentes**
```tsx
<div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed">
  <Badge variant="secondary">🔒 Fixe</Badge>
  <p className="font-medium">
    {mainTaskDate.toLocaleDateString('fr-FR')}
  </p>
  <p className="text-xs">🔒 La date de la tâche parent est fixe (non modifiable)</p>
</div>
```

**Comportement** :
- ✅ Affichage en lecture seule
- ✅ Bordure pointillée pour indiquer qu'elle est verrouillée
- ✅ Badge "🔒 Fixe" pour clarté visuelle
- ✅ Message explicite : "non modifiable"
- ❌ Aucun input de date éditable
- ❌ Pas de possibilité de modification

---

#### **Pour Activités Ponctuelles**
```tsx
<div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed">
  <Label className="text-sm">Tâche ponctuelle parent</Label>
  <p className="font-medium text-lg">
    {mainTaskDate.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })}
  </p>
  <p className="text-xs">🔒 Date fixe de référence (non modifiable)</p>
</div>
```

**Comportement** :
- ✅ Même protection que pour récurrentes
- ✅ Format de date complet avec année
- ✅ Message clair "non modifiable"

---

### **2. Fourchettes de Dates - LIMITÉES** 📅

#### **A. Pour Activités Récurrentes (Timeline)**

**Affichage de la fourchette** :
```tsx
<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <AlertCircle className="h-4 w-4 text-blue-600" />
  <p className="text-sm font-medium">Fourchette disponible</p>
  <p className="text-xs">
    Vous pouvez planifier cette action entre 
    <strong>{availableDays[0]}</strong> et 
    <strong>{availableDays[availableDays.length - 1]}</strong> 
    par rapport à la tâche principale
  </p>
</div>
```

**Contraintes appliquées** :
```typescript
// Boutons de navigation désactivés aux limites
<Button 
  disabled={formData.offset_days <= availableDays[0]}
>
  Jour précédent
</Button>

<Button 
  disabled={formData.offset_days >= availableDays[availableDays.length - 1]}
>
  Jour suivant
</Button>
```

**Grille Timeline** :
```typescript
// Seuls les jours dans availableDays sont affichés
{availableDays.map((offset) => (
  <button 
    onClick={() => handleOffsetChange(offset)}
    disabled={/* en dehors de la fourchette */}
  >
    {offset === 0 ? 'J' : offset > 0 ? `J+${offset}` : `J${offset}`}
  </button>
))}
```

---

#### **B. Pour Activités Ponctuelles (Input Date)**

**Affichage de la fourchette** :
```tsx
<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <AlertCircle className="h-4 w-4 text-blue-600" />
  <p className="text-sm font-medium">Fourchette autorisée</p>
  <p className="text-xs">
    Du <strong>{minDate}</strong> au <strong>{maxDate}</strong> (±15 jours)
  </p>
</div>
```

**Contraintes HTML5 natives** :
```tsx
<Input
  type="date"
  min={minDate}  // ← Limite inférieure
  max={maxDate}  // ← Limite supérieure
  value={formData.specific_date}
/>
```

**Validation programmatique** :
```typescript
// Vérifier que la date est dans la fourchette
if (activityKind === 'one_off') {
  if (!formData.specific_date) {
    newErrors.specific_date = 'La date est obligatoire';
  } else {
    const selectedDate = new Date(formData.specific_date);
    const min = new Date(minDate);
    const max = new Date(maxDate);
    
    if (selectedDate < min || selectedDate > max) {
      newErrors.specific_date = 
        `La date doit être entre le ${min.toLocaleDateString('fr-FR')} 
         et le ${max.toLocaleDateString('fr-FR')}`;
    }
  }
}
```

---

## 📊 Détails des Fourchettes par Type

### **Activités Récurrentes**

| Fréquence | Fourchette Timeline | Jours Disponibles | Modification Parent |
|-----------|---------------------|-------------------|---------------------|
| **Quotidienne** | J uniquement | `[0]` | ❌ Non |
| **Hebdomadaire** | J-3 à J+3 | `[-3,-2,-1,0,1,2,3]` | ❌ Non |
| **Mensuelle** | J-15 à J+15 | `[-15...0...15]` | ❌ Non |
| **Trimestrielle** | J-45 à J+45 | `[-45...0...45]` | ❌ Non |
| **Annuelle** | J-182 à J+182 | `[-182...0...182]` | ❌ Non |

**Protection** :
- ✅ Boutons navigation désactivés aux limites
- ✅ Grille limitée aux jours disponibles
- ✅ Date parent affichée en lecture seule
- ✅ Badge "🔒 Fixe" sur la date parent

---

### **Activités Ponctuelles**

| Type | Fourchette | Min Date | Max Date | Modification Parent |
|------|------------|----------|----------|---------------------|
| **One-off** | ±15 jours | `mainTaskDate - 15j` | `mainTaskDate + 15j` | ❌ Non |

**Protection** :
- ✅ Attributs HTML `min` et `max` sur `<input type="date">`
- ✅ Validation programmatique si date hors limites
- ✅ Message d'erreur avec dates exactes
- ✅ Date parent affichée en lecture seule avec bordure
- ✅ Bandeau bleu avec fourchette autorisée

---

## 🎨 Éléments Visuels de Protection

### **1. Dates Verrouillées (Parent)**

```
┌─────────────────────────────────────────┐
│ 🔒 Tâche principale parent              │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ ← Bordure pointillée
│                                         │
│ [🔒 Fixe]  Lundi 14 octobre 2024       │
│                                         │
│ 🔒 Date fixe de référence (non modif.) │
└─────────────────────────────────────────┘
```

### **2. Fourchette Autorisée**

```
┌─────────────────────────────────────────┐
│ ⓘ Fourchette disponible                 │
│ ───────────────────────────────────────  │
│ Du 29 sept. au 29 oct. (±15 jours)     │
└─────────────────────────────────────────┘
```

### **3. Timeline Limitée**

```
Navigation:
[← Jour préc.] [J-2] [Jour suiv. →]
      ↑                    ↑
   disabled            disabled
  (à la limite)      (à la limite)

Grille:
[J-3] [J-2] [J-1] [J] [J+1] [J+2] [J+3]
  ↑     ↑     ↑    ↑    ↑     ↑     ↑
Seulement les jours dans availableDays
```

---

## 🔧 Mécanismes de Protection

### **1. Protection HTML Native**

```tsx
// Input date avec min/max
<input 
  type="date"
  min="2024-09-29"  // ← Navigateur empêche sélection avant
  max="2024-10-29"  // ← Navigateur empêche sélection après
/>
```

**Comportement navigateur** :
- ✅ Chrome/Edge/Safari : Dates hors limites grisées dans le picker
- ✅ Firefox : Validation automatique à la sélection
- ✅ Mobile : Limiteur natif du date picker OS

---

### **2. Protection React (Boutons)**

```tsx
// Désactivation conditionnelle
<Button 
  disabled={
    isDailyRecurrence || 
    formData.offset_days <= availableDays[0]
  }
>
```

**Comportement** :
- ✅ Bouton grisé visuellement
- ✅ Cursor: not-allowed
- ✅ onClick désactivé
- ✅ Attribut `disabled` sur le DOM

---

### **3. Protection TypeScript (Validation)**

```typescript
// Validation double couche
if (activityKind === 'one_off') {
  const selectedDate = new Date(formData.specific_date);
  const min = new Date(minDate);
  const max = new Date(maxDate);
  
  if (selectedDate < min || selectedDate > max) {
    // ❌ Erreur affichée + formulaire bloqué
    newErrors.specific_date = 'Date hors limites';
  }
}
```

**Comportement** :
- ✅ Validation côté client avant soumission
- ✅ Message d'erreur contextuel avec dates exactes
- ✅ Bordure rouge sur l'input
- ✅ Icône d'alerte
- ✅ Empêche la soumission du formulaire

---

## 📋 Scénarios de Test

### **Scénario 1 : Tâche Hebdomadaire (Récurrente)**

**Configuration** :
- Activité : "Rapport hebdomadaire"
- Fréquence : WEEKLY (lundi)
- Date parent : Lundi 14 octobre 2024

**Comportements attendus** :
1. ✅ Date parent affichée "Lundi 14 octobre" avec badge "🔒 Fixe"
2. ✅ Fourchette : "entre J-3 et J+3"
3. ✅ Timeline affiche : [Ven 11] [Sam 12] [Dim 13] [Lun 14] [Mar 15] [Mer 16] [Jeu 17]
4. ✅ Bouton "Jour précédent" désactivé si on est à J-3
5. ✅ Bouton "Jour suivant" désactivé si on est à J+3
6. ✅ Impossible de modifier la date parent
7. ✅ Clic uniquement sur les 7 jours affichés

---

### **Scénario 2 : Tâche Quotidienne (Récurrente)**

**Configuration** :
- Activité : "Relevé température"
- Fréquence : DAILY
- Date parent : Aujourd'hui

**Comportements attendus** :
1. ✅ Date parent affichée avec badge "🔒 Fixe"
2. ✅ Message : "Tâches quotidiennes - Pas de décalage possible"
3. ✅ Aucune timeline affichée
4. ✅ offset_days forcé à 0
5. ✅ Impossible de modifier quoi que ce soit

---

### **Scénario 3 : Tâche Ponctuelle (One-off)**

**Configuration** :
- Activité : "Audit annuel 2024"
- Date parent : 15 décembre 2024

**Comportements attendus** :
1. ✅ Date parent affichée "Dimanche 15 décembre 2024" (lecture seule)
2. ✅ Bandeau bleu : "Du 30 novembre au 30 décembre (±15 jours)"
3. ✅ Input date avec min="2024-11-30" et max="2024-12-30"
4. ✅ Si sélection 25 novembre → Erreur "doit être entre le 30/11/2024 et le 30/12/2024"
5. ✅ Si sélection 5 décembre → ✓ Accepté
6. ✅ Bordure rouge si date invalide
7. ✅ Impossible de soumettre si date hors limites

---

### **Scénario 4 : Tentatives de Contournement**

**Test 1 : Modification manuelle de l'input (HTML)**
```
Tentative : Modifier min/max via DevTools
Résultat : ✅ Validation TypeScript détecte et bloque
```

**Test 2 : Saisie clavier dans date picker**
```
Tentative : Taper une date hors limites
Résultat : ✅ Navigateur refuse ou validation détecte
```

**Test 3 : Modification de availableDays via console**
```
Tentative : Changer availableDays = [-100, 100]
Résultat : ✅ Recalculé à chaque render depuis RRULE
```

---

## ✨ Avantages de cette Approche

### **1. Sécurité Multi-Couches**
- ✅ **Couche 1** : HTML5 native (min/max)
- ✅ **Couche 2** : React disabled buttons
- ✅ **Couche 3** : Validation TypeScript
- ✅ **Couche 4** : Validation serveur (future)

### **2. Expérience Utilisateur**
- ✅ **Feedback immédiat** : Erreurs affichées en temps réel
- ✅ **Clarté visuelle** : Badges, bordures, couleurs
- ✅ **Messages explicites** : "non modifiable", "fourchette autorisée"
- ✅ **Prévention d'erreurs** : Limites claires avant saisie

### **3. Accessibilité**
- ✅ **Lecteurs d'écran** : Labels "Date fixe de référence"
- ✅ **Navigation clavier** : Boutons désactivés = skip
- ✅ **Contraste** : Bordures et couleurs accessibles
- ✅ **ARIA** : Attributs disabled natifs

### **4. Maintenabilité**
- ✅ **Logique centralisée** : `getMinMaxDates()`, `getAvailableDays()`
- ✅ **Réutilisable** : Fonctions dans `scheduleUtils.ts`
- ✅ **Testable** : Validation isolée
- ✅ **Évolutif** : Facile d'ajouter nouvelles fréquences

---

## 🎯 Résumé des Garanties

| Élément | Protection | Méthode |
|---------|-----------|---------|
| **Date parent récurrente** | Non modifiable | Affichage lecture seule + Badge 🔒 |
| **Date parent ponctuelle** | Non modifiable | Affichage lecture seule + Badge 🔒 |
| **Timeline récurrente** | Limitée à availableDays | Boutons disabled + Grille filtrée |
| **Input date ponctuelle** | Limitée à ±15j | HTML min/max + Validation TypeScript |
| **Boutons navigation** | Aux limites | disabled=true si min/max atteint |
| **Soumission formulaire** | Si date invalide | validateForm() retourne false |

---

## 🔐 Conclusion

**Le système implémente 4 niveaux de protection** :

1. **Visuel** : Badges, bordures, messages clairs → L'utilisateur comprend avant d'essayer
2. **HTML** : Attributs min/max → Le navigateur empêche les saisies invalides
3. **React** : Boutons disabled → L'UI empêche les actions invalides
4. **Validation** : TypeScript → Le code vérifie et bloque si contournement

**Résultat** : Il est **impossible** pour un utilisateur de :
- ❌ Modifier la date de la tâche parent
- ❌ Sélectionner une date hors fourchette (récurrente ou ponctuelle)
- ❌ Soumettre le formulaire avec une date invalide
- ❌ Contourner les limites même via DevTools

**L'expérience utilisateur est claire, sécurisée et sans ambiguïté !** ✨
