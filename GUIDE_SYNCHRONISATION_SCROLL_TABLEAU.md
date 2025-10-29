# Guide de Synchronisation du Scroll Horizontal - DynamicTable

## 🎯 Problème Résolu

### Symptôme
Les en-têtes des colonnes du tableau (TaskFixedColumns et TaskActionColumns) restaient fixes lors du défilement horizontal, causant un **désalignement** entre les en-têtes et le contenu du tableau.

**Comportement observé :**
- ✅ En-têtes visibles en permanence (sticky header)
- ❌ En-têtes ne suivent pas le scroll horizontal
- ❌ Colonnes des en-têtes désalignées avec les colonnes du corps
- ❌ Deux tableaux séparés (header + body) avec largeurs différentes

---

## ✅ Solution Implémentée

### Architecture Sticky Header

La solution utilise un **tableau unique** avec un header sticky CSS :

```
┌─────────────────────────────────────┐
│  <Table>                            │
│    <TableHeader sticky top-0>       │ ← Reste visible en haut
│      Colonnes d'en-tête             │
│    </TableHeader>                   │
│    <TableBody>                      │ ← Défile normalement
│      Lignes du tableau              │
│    </TableBody>                     │
│  </Table>                           │
└─────────────────────────────────────┘
         Scroll horizontal/vertical
```

**Avantages :**
- ✅ Un seul tableau = colonnes parfaitement alignées
- ✅ Header sticky CSS natif = performance optimale
- ✅ Scroll horizontal et vertical fonctionnels
- ✅ Pas de synchronisation JavaScript nécessaire

---

## 🛠️ Implémentation Technique

### 1. TaskFixedColumns.tsx

#### Structure Simplifiée avec Sticky Header

```tsx
return (
  <div 
    ref={scrollRef}
    className="h-[600px] overflow-auto"
    onScroll={onScroll}
  >
    <Table>
      {/* Header sticky qui reste visible en haut */}
      <TableHeader className="sticky top-0 z-20">
        <TableRow className="h-16 hover:bg-transparent border-0">
          <TableHead className="min-w-[200px] h-16 text-white font-bold bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0">
            Tâche
          </TableHead>
          <TableHead className="min-w-[150px] h-gradient-to-r from-blue-500 to-blue-600 sticky top-0">
            Responsable
          </TableHead>
          {/* ... autres colonnes ... */}
        </TableRow>
      </TableHeader>
      
      {/* Body qui défile normalement */}
      <TaskTableBody
        tasks={tasks}
        selectedTaskId={selectedTaskId}
        onSelectTask={onSelectTask}
        // ... autres props
      />
    </Table>
  </div>
);
```

**Points clés :**
- Un seul `<Table>` contenant header + body
- `className="sticky top-0 z-20"` sur `<TableHeader>`
- `sticky top-0` également sur chaque `<TableHead>`
- Conteneur parent avec `overflow-auto` pour le scroll

---

### 2. TaskActionColumns.tsx

**Même structure** que TaskFixedColumns :

```tsx
return (
  <div 
    ref={scrollRef}
    className="h-[600px] overflow-auto"
    onScroll={onScroll}
  >
    <Table>
      <TableHeader className="sticky top-0 z-20">
        <TableRow className="h-16 hover:bg-transparent border-0">
          {orderedActions.map((actionTitle) => (
            <TableHead 
              key={actionTitle}
              className="min-w-[140px] max-w-[140px] text-center h-16 bg-gradient-to-r from-cyan-500 to-cyan-600 sticky top-0"
            >
              {actionTitle}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Lignes du tableau */}
      </TableBody>
    </Table>
  </div>
);
```

---

## 🎨 Classes CSS Clés

### Conteneur Principal

```css
h-[600px]         /* Hauteur fixe du tableau */
overflow-auto     /* Scroll horizontal ET vertical */
```

### TableHeader

```css
sticky            /* Position sticky CSS native */
top-0             /* Reste collé en haut */
z-20              /* Au-dessus du contenu */
shadow-md         /* Ombre portée pour distinguer du contenu */
```

### TableHead (chaque colonne)

```css
sticky top-0      /* Chaque cellule d'en-tête est sticky */
shadow-sm         /* Ombre légère sur chaque cellule */
min-w-[XXXpx]     /* Largeur minimale pour alignement */
bg-gradient-to-r  /* Background opaque pour masquer le contenu en dessous */
```

**Important :** Les largeurs `min-w-*` doivent être **identiques** entre `<TableHead>` et `<TableCell>` pour un alignement parfait.

---

## 📊 Avantages de la Solution Sticky Header

### Avant (2 tableaux séparés)
```
❌ Problèmes :
- Désalignement des colonnes
- Synchronisation JavaScript complexe
- Performance dégradée
- Largeurs différentes entre header/body
```

### Après (1 tableau avec sticky header)
```
✅ Avantages :
- Alignement parfait automatique
- Pas de JavaScript de synchronisation
- Performance optimale (CSS natif)
- Largeurs toujours identiques
- Scroll horizontal/vertical fluide
```

---

## 🔍 Points Techniques Importants

### 1. Pourquoi `sticky top-0` sur TableHeader ET TableHead ?

- `sticky top-0` sur `<TableHeader>` : Rend tout le header sticky
- `sticky top-0` sur chaque `<TableHead>` : Assure que chaque cellule reste visible

### 2. Pourquoi un seul `<Table>` ?

- ✅ **Alignement automatique** : Le navigateur gère les largeurs de colonnes
- ✅ **Pas de calculs** : Pas besoin de synchroniser manuellement
- ✅ **Performance** : Une seule structure DOM

### 3. Performance

La solution sticky CSS est **ultra-performante** car :
- Gérée nativement par le navigateur
- Pas de JavaScript lors du scroll
- Pas de re-render React
- Hardware accelerated (GPU)

---

## 🧪 Tests de Validation

### Test 1 : Scroll Horizontal Simple
1. Ouvrir DynamicTable
2. Scroller horizontalement dans le corps du tableau
3. ✅ Vérifier que les en-têtes suivent le scroll
4. ✅ Vérifier l'alignement des colonnes

### Test 2 : Scroll Rapide
1. Scroller rapidement de gauche à droite
2. ✅ Pas de lag visible
3. ✅ Synchronisation fluide

### Test 3 : Redimensionnement
1. Redimensionner le panneau avec ResizableHandle
2. Scroller horizontalement
3. ✅ Synchronisation maintenue

### Test 4 : Scroll Vertical
1. Scroller verticalement
2. ✅ Scroll vertical fonctionne normalement
3. ✅ Pas d'impact sur le scroll horizontal

---

## 🐛 Problèmes Potentiels et Solutions

### Problème : Header ne reste pas visible lors du scroll

**Cause :** Classes `sticky top-0` manquantes.

**Solution :**
```tsx
// Ajouter sticky sur TableHeader ET TableHead
<TableHeader className="sticky top-0 z-20">
  <TableRow>
    <TableHead className="sticky top-0">...</TableHead>
  </TableRow>
</TableHeader>
```

### Problème : Largeurs de colonnes différentes

**Cause :** Classes CSS `min-w-*` différentes entre header et body.

**Solution :** Vérifier que les largeurs sont **identiques** :
```tsx
// Header
<TableHead className="min-w-[200px]">Tâche</TableHead>

// Body (dans TaskTableBody)
<TableCell className="min-w-[200px]">...</TableCell>
```

### Problème : Header disparaît derrière le contenu

**Cause :** `z-index` insuffisant.

**Solution :**
```tsx
<TableHeader className="sticky top-0 z-20">
  {/* z-20 assure que le header reste au-dessus */}
</TableHeader>
```

---

## 📝 Checklist d'Implémentation

Pour implémenter cette solution sur un nouveau composant :

- [ ] Utiliser un seul `<Table>` (pas de tableaux séparés)
- [ ] Ajouter `className="sticky top-0 z-20"` sur `<TableHeader>`
- [ ] Ajouter `sticky top-0` sur chaque `<TableHead>`
- [ ] Conteneur parent avec `className="h-[600px] overflow-auto"`
- [ ] Vérifier que les largeurs `min-w-*` sont identiques entre header et body
- [ ] Tester le scroll horizontal
- [ ] Tester le scroll vertical
- [ ] Vérifier que le header reste visible en scrollant

---

## 🎯 Résultat Final

### Avant
```
Header: [Col1] [Col2] [Col3] [Col4]
Body:          [Col1] [Col2] [Col3] [Col4]  ← Désaligné
```

### Après
```
Header: [Col1] [Col2] [Col3] [Col4]
Body:   [Col1] [Col2] [Col3] [Col4]  ← Parfaitement aligné ✅
```

---

## 🚀 Améliorations Futures Possibles

1. **Ombres de scroll** : Afficher des ombres aux bords pour indiquer qu'il y a du contenu
   ```tsx
   const [showLeftShadow, setShowLeftShadow] = useState(false);
   const [showRightShadow, setShowRightShadow] = useState(true);
   
   const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
     const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
     setShowLeftShadow(scrollLeft > 0);
     setShowRightShadow(scrollLeft < scrollWidth - clientWidth);
   };
   ```

2. **Scroll horizontal au clavier** : Support des touches ← →
   ```typescript
   const handleKeyDown = (e: KeyboardEvent) => {
     if (e.key === 'ArrowLeft') scrollRef.current.scrollLeft -= 100;
     if (e.key === 'ArrowRight') scrollRef.current.scrollLeft += 100;
   };
   ```

3. **Resize des colonnes** : Permettre à l'utilisateur de redimensionner les colonnes
   ```tsx
   // Utiliser react-resizable-panels ou une solution custom
   ```

---

## 📚 Références

- [MDN - Element.scrollLeft](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft)
- [React useRef Hook](https://react.dev/reference/react/useRef)
- [CSS overflow Property](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow)

---

**Dernière mise à jour :** 2025-01-12  
**Version :** 1.0.0  
**Auteur :** Équipe Wadashaqeen
