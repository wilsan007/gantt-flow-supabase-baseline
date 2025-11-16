# 📝 Guide : Édition Inline des Tâches (Style Monday.com)

## 🎯 Vue d'Ensemble

Le tableau de tâches permet maintenant l'édition **directe en cliquant** sur les cellules, comme sur Monday.com ou ClickUp.
Plus besoin d'ouvrir un dialog pour modifier les tâches !

---

## ✨ Fonctionnalités

### Cellules Éditables

| Champ             | Type   | Interaction                               |
| ----------------- | ------ | ----------------------------------------- |
| **Titre**         | Texte  | Cliquer → Taper → Enter pour valider      |
| **Date début**    | Date   | Cliquer → Calendrier popup → Sélectionner |
| **Date échéance** | Date   | Cliquer → Calendrier popup → Sélectionner |
| **Priorité**      | Select | Cliquer → Menu déroulant → Choisir        |
| **Statut**        | Select | Cliquer → Menu déroulant → Choisir        |
| **Charge (h)**    | Nombre | Cliquer → Taper → Enter pour valider      |

### Indicateurs Visuels

- **Hover** : Fond gris léger pour indiquer que la cellule est éditable
- **Focus** : Ring bleu autour de la cellule en cours d'édition
- **Validation** : Mise à jour instantanée (optimistic update)

---

## 🖱️ Utilisation

### Éditer le Titre

```
1. Cliquer sur le titre de la tâche
2. Le texte devient éditable (input avec focus)
3. Modifier le texte
4. Appuyer sur Enter pour valider
5. Appuyer sur Escape pour annuler
```

### Changer une Date

```
1. Cliquer sur la date (début ou échéance)
2. Un calendrier popup s'ouvre
3. Sélectionner la nouvelle date
4. La date est mise à jour instantanément
```

### Modifier Priorité ou Statut

```
1. Cliquer sur le badge (Priorité ou Statut)
2. Un menu déroulant s'ouvre
3. Choisir la nouvelle valeur
4. Le badge se met à jour automatiquement
```

### Ajuster la Charge

```
1. Cliquer sur la charge en heures
2. L'input devient éditable
3. Taper le nouveau nombre
4. Enter pour valider
```

---

## 💡 Astuces

### Raccourcis Clavier

- **Enter** : Valider la modification
- **Escape** : Annuler la modification
- **Tab** : Passer à la cellule suivante (à venir)

### Optimistic Updates

Les modifications sont affichées **instantanément** avant même d'être sauvegardées en base.
Si l'enregistrement échoue, les données se rechargent automatiquement.

### Mode Démo

En mode démo (découverte), les modifications ne sont **pas** sauvegardées.
Un message informatif s'affiche pour créer de vraies tâches.

---

## 🔧 Implémentation Technique

### Composants Créés

```
src/components/vues/table/cells/
├── EditableCell.tsx           # Cellule texte/nombre générique
├── EditableDateCell.tsx       # Sélecteur de date avec calendrier
└── EditableSelectCell.tsx     # Menu déroulant pour statut/priorité
```

### Flow de Données

```
Utilisateur clique
    ↓
Composant cellule éditable
    ↓
onUpdateTask(taskId, updates)
    ↓
handleUpdateTask dans DynamicTable
    ↓
  ├─ Optimistic update (affichage immédiat)
  └─ updateTask() API call (Supabase)
    ↓
Mise à jour réussie ✅
```

### Gestion d'Erreurs

Si la mise à jour échoue :

1. Un log d'erreur est affiché dans la console
2. Les données sont rechargées depuis le serveur
3. L'affichage revient à l'état correct

---

## 📚 Exemples de Code

### Ajouter une Cellule Éditable Personnalisée

```tsx
import { EditableCell } from './cells/EditableCell';

<EditableCell
  value={task.custom_field}
  onChange={value => onUpdateTask(task.id, { custom_field: value })}
  type="text"
  placeholder="Valeur..."
  isSubtask={isSubtask}
/>;
```

### Ajouter un Select Personnalisé

```tsx
import { EditableSelectCell } from './cells/EditableSelectCell';

<EditableSelectCell
  value={task.department}
  options={[
    { value: 'dev', label: 'Développement' },
    { value: 'design', label: 'Design' },
  ]}
  onChange={value => onUpdateTask(task.id, { department: value })}
  isSubtask={isSubtask}
/>;
```

---

## 🚀 Prochaines Améliorations

- [ ] Navigation au clavier (Tab/Shift+Tab)
- [ ] Édition en masse (sélection multiple)
- [ ] Historique des modifications (Undo/Redo)
- [ ] Validation personnalisée (regex, min/max)
- [ ] Cellules conditionnelles (désactiver selon statut)

---

## 🐛 Troubleshooting

### Les modifications ne se sauvegardent pas

**Cause** : Mode démo activé ou problème de connexion  
**Solution** : Vérifier que vous êtes en mode normal (pas démo) et que Supabase est accessible

### Le calendrier ne s'affiche pas

**Cause** : Composant Calendar de shadcn/ui manquant  
**Solution** : Vérifier que `@/components/ui/calendar` est installé

### Erreur TypeScript sur `Partial<Task>`

**Cause** : Type Task incomplet  
**Solution** : Ajouter les champs manquants dans l'interface Task

---

## 📖 Ressources

- [Monday.com Inline Editing](https://monday.com/)
- [ClickUp Table View](https://clickup.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Optimistic UI Patterns](https://www.patterns.dev/posts/optimistic-ui)
