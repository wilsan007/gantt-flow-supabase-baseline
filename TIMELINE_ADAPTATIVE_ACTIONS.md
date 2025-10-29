# ✅ Timeline Adaptative pour Actions - Implémentation Complète

## 🎯 Objectif
Adapter dynamiquement la fourchette de dates des actions en fonction de la fréquence de récurrence de l'activité parent et du type d'activité (récurrente vs ponctuelle).

---

## 📊 Règles de Gestion Implémentées

### **Pour les Activités RÉCURRENTES** (selon la fréquence)

| Fréquence | Fourchette | Description | Interface |
|-----------|-----------|-------------|-----------|
| **Quotidienne** | J+0 uniquement | Pas de décalage possible | ⚠️ Message informatif (pas de timeline) |
| **Hebdomadaire** | J-3 à J+3 | ±3 jours autour de la semaine | 📅 Timeline 7 jours |
| **Mensuelle** | J-15 à J+15 | ±15 jours autour du jour du mois | 📅 Timeline 30 jours |
| **Trimestrielle** | J-45 à J+45 | ±45 jours autour du trimestre | 📅 Timeline 90 jours |
| **Annuelle** | J-182 à J+182 | ±6 mois autour de la date annuelle | 📅 Timeline 365 jours |

### **Pour les Activités PONCTUELLES**

| Type | Fourchette | Description | Interface |
|------|-----------|-------------|-----------|
| **One-off** | J-15 à J+15 | ±15 jours autour de la tâche parent | 📅 Timeline 30 jours |

---

## 🏗️ Architecture Technique

### **1. Fichier Utilitaire : `/src/lib/scheduleUtils.ts`**

Fonctions créées :

```typescript
// Extraction de la fréquence depuis RRULE
extractFrequency(rrule: string | null): FrequencyType

// Fourchette maximum de jours selon fréquence
getMaxOffsetDays(frequency: FrequencyType, activityKind): number

// Liste des jours disponibles pour la timeline
getAvailableDays(frequency: FrequencyType, activityKind): number[]

// Label de la fréquence
getFrequencyLabel(frequency: FrequencyType): string

// Message informatif selon le contexte
getTimelineInfo(frequency: FrequencyType, activityKind): string
```

**Types définis :**
```typescript
type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null;
```

---

### **2. Composant : `ActionTemplateForm.tsx`**

#### **Nouvelles Props**
```typescript
interface ActionTemplateFormProps {
  // ... props existantes
  rrule?: string | null; // Règle de récurrence pour déterminer la fourchette
}
```

#### **Logique Adaptative**
```typescript
// Calculer la fréquence et les jours disponibles
const frequency = activityKind === 'recurring' ? extractFrequency(rrule) : null;
const availableDays = getAvailableDays(frequency, activityKind);
const maxOffset = getMaxOffsetDays(frequency, activityKind);
const isDailyRecurrence = frequency === 'daily';
```

#### **Interface Conditionnelle**

##### **Cas 1 : Activité Quotidienne (Daily)**
```tsx
{isDailyRecurrence && (
  <div className="p-6 bg-blue-50 border rounded-lg text-center">
    <Calendar className="h-8 w-8 mx-auto text-blue-600 mb-2" />
    <p className="font-medium">Tâches quotidiennes</p>
    <p className="text-xs mt-1">
      Les actions sont exécutées le même jour que la tâche
      (pas de décalage possible)
    </p>
  </div>
)}
```

##### **Cas 2 : Autres Fréquences**
```tsx
{!isDailyRecurrence && (
  <>
    {/* Boutons navigation avec limites dynamiques */}
    <Button disabled={formData.offset_days <= availableDays[0]} />
    <Button disabled={formData.offset_days >= availableDays[availableDays.length - 1]} />
    
    {/* Grille timeline avec jours disponibles */}
    <div>
      {availableDays.map((offset) => (
        <button onClick={() => handleOffsetChange(offset)}>
          {offset === 0 ? 'J' : offset > 0 ? `J+${offset}` : `J${offset}`}
        </button>
      ))}
    </div>
    
    {/* Message contextuel */}
    <p>{timelineInfo}</p>
  </>
)}
```

---

### **3. Composant : `ActionTemplateListEnhanced.tsx`**

#### **Nouvelles Props**
```typescript
interface ActionTemplateListEnhancedProps {
  // ... props existantes
  rrule?: string | null; // Règle de récurrence
}
```

#### **Transmission au Formulaire**
```typescript
<ActionTemplateForm
  // ... autres props
  rrule={rrule}
/>
```

---

### **4. Composant : `ActivityDetailDialog.tsx`**

#### **Chargement et Transmission de la RRULE**
```typescript
// Charger le schedule
const { schedule, setSchedule } = useState<OperationalSchedule | null>(null);

useEffect(() => {
  const scheduleData = await getSchedule(activityId);
  setSchedule(scheduleData);
}, [activityId]);

// Passer au composant actions
<ActionTemplateListEnhanced
  // ... autres props
  rrule={schedule?.rrule || null}
/>
```

---

## 🎨 Expérience Utilisateur

### **Scénario 1 : Activité Hebdomadaire**

1. **Configuration activité** :
   - Nom : "Rapport hebdomadaire"
   - Fréquence : Hebdomadaire (lundi)
   - RRULE : `FREQ=WEEKLY;BYDAY=MO`

2. **Ajout action "Préparer données"** :
   - Timeline affichée : **J-3 à J+3** (7 jours)
   - Exemple : Si tâche le lundi 14 oct
     - J-3 = vendredi 11 oct
     - J+0 = lundi 14 oct (jour de la tâche)
     - J+3 = jeudi 17 oct
   
3. **Message** : "Fourchette de ±3 jours autour de la semaine"

---

### **Scénario 2 : Activité Quotidienne**

1. **Configuration activité** :
   - Nom : "Relevé température quotidien"
   - Fréquence : Quotidienne
   - RRULE : `FREQ=DAILY`

2. **Ajout action "Saisir mesures"** :
   - **Pas de timeline affichée** ❌
   - Message informatif : 
     > "**Tâches quotidiennes**  
     > Les actions sont exécutées le même jour que la tâche (pas de décalage possible)"
   
3. **offset_days fixé à 0** automatiquement

---

### **Scénario 3 : Activité Mensuelle**

1. **Configuration activité** :
   - Nom : "Clôture comptable"
   - Fréquence : Mensuelle (jour 1)
   - RRULE : `FREQ=MONTHLY;BYMONTHDAY=1`

2. **Ajout action "Vérifier comptes"** :
   - Timeline affichée : **J-15 à J+15** (30 jours)
   - Navigation par boutons ou clic direct
   
3. **Message** : "Fourchette de ±15 jours autour du jour du mois"

---

### **Scénario 4 : Activité Ponctuelle**

1. **Configuration activité** :
   - Nom : "Audit annuel 2024"
   - Type : Ponctuelle
   - Date : 15 décembre 2024

2. **Ajout action "Envoyer rapport"** :
   - Timeline affichée : **J-15 à J+15** (30 jours autour du 15 déc)
   - OU : **Saisie de date précise** (si activité ponctuelle avec actions à date fixe)
   
3. **Message** : "Fourchette de ±15 jours autour de la date de la tâche ponctuelle"

---

## 📋 Détails des Fourchettes par Fréquence

### **Quotidienne (FREQ=DAILY)**
```
Fourchette : 0 jours
Timeline : [J]
Message : Pas de décalage possible
```

### **Hebdomadaire (FREQ=WEEKLY)**
```
Fourchette : ±3 jours
Timeline : [J-3] [J-2] [J-1] [J] [J+1] [J+2] [J+3]
Max offset : 7 jours
Message : Fourchette de ±3 jours autour de la semaine
```

### **Mensuelle (FREQ=MONTHLY)**
```
Fourchette : ±15 jours
Timeline : [J-15] ... [J] ... [J+15]
Max offset : 30 jours
Message : Fourchette de ±15 jours autour du jour du mois
```

### **Trimestrielle (FREQ=QUARTERLY)**
```
Fourchette : ±45 jours
Timeline : [J-45] ... [J] ... [J+45]
Max offset : 90 jours
Message : Fourchette de ±45 jours autour du trimestre
```

### **Annuelle (FREQ=YEARLY)**
```
Fourchette : ±182 jours (6 mois)
Timeline : [J-182] ... [J] ... [J+182]
Max offset : 365 jours
Message : Fourchette de ±6 mois autour de la date annuelle
```

### **Ponctuelle (one_off)**
```
Fourchette : ±15 jours
Timeline : [J-15] ... [J] ... [J+15]
Max offset : 30 jours
Message : Fourchette de ±15 jours autour de la tâche ponctuelle
```

---

## ✅ Avantages de cette Approche

### **1. Cohérence Business**
- ✅ Pas de décalage incohérent (ex : action 10 jours après pour tâche hebdomadaire)
- ✅ Logique adaptée au contexte métier
- ✅ Prévient les erreurs de configuration

### **2. Expérience Utilisateur**
- ✅ Interface claire et adaptée au contexte
- ✅ Messages informatifs contextuels
- ✅ Pas de choix inutiles (quotidien = 1 seule option)
- ✅ Timeline visuelle limitée aux options pertinentes

### **3. Performance**
- ✅ Calculs côté client (pas de requêtes serveur)
- ✅ Validation en temps réel
- ✅ Fonctions utilitaires réutilisables

### **4. Maintenabilité**
- ✅ Logique centralisée dans `scheduleUtils.ts`
- ✅ Facile à ajuster les fourchettes
- ✅ Types TypeScript robustes
- ✅ Code découplé et testable

---

## 🔧 Configuration et Utilisation

### **Comment la fourchette est déterminée ?**

```typescript
// 1. L'activité possède une RRULE
const activity = {
  name: "Rapport hebdomadaire",
  kind: "recurring",
  // ...
};

const schedule = {
  rrule: "FREQ=WEEKLY;BYDAY=MO", // ← RRULE stockée
  // ...
};

// 2. La RRULE est passée au formulaire d'action
<ActionTemplateForm
  activityKind="recurring"
  rrule="FREQ=WEEKLY;BYDAY=MO"
/>

// 3. La fréquence est extraite et la timeline est calculée
const frequency = extractFrequency("FREQ=WEEKLY;BYDAY=MO"); // → 'weekly'
const availableDays = getAvailableDays('weekly', 'recurring'); // → [-3,-2,-1,0,1,2,3]
const timelineInfo = getTimelineInfo('weekly', 'recurring'); // → "Fourchette de ±3 jours..."

// 4. L'interface s'adapte automatiquement
{!isDailyRecurrence && <Timeline days={availableDays} />}
```

---

## 📝 Notes Techniques

### **Gestion des Cas Spéciaux**

1. **Activité récurrente SANS schedule** :
   - `rrule = null`
   - Fourchette par défaut : ±15 jours (30 jours total)

2. **RRULE invalide ou non reconnue** :
   - `extractFrequency()` retourne `null`
   - Fourchette par défaut appliquée

3. **Activité ponctuelle** :
   - Ignore la RRULE (même si présente par erreur)
   - Fourchette fixe : ±15 jours

### **Validation des Offsets**

```typescript
// Les boutons de navigation sont désactivés aux limites
<Button 
  disabled={offset_days <= availableDays[0]} 
/>

<Button 
  disabled={offset_days >= availableDays[availableDays.length - 1]} 
/>
```

---

## 🎉 Résultat Final

**Le système s'adapte intelligemment à chaque contexte :**
- 📅 **Quotidien** → Pas de choix (J uniquement)
- 📅 **Hebdomadaire** → Choix cohérent (±3 jours)
- 📅 **Mensuel** → Flexibilité adaptée (±15 jours)
- 📅 **Trimestriel/Annuel** → Grande fourchette pour planification complexe
- 📅 **Ponctuel** → Fourchette raisonnable autour de la date unique

**L'expérience utilisateur est optimisée et les erreurs de configuration sont prévenues !** ✨
