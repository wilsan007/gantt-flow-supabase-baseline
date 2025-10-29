# 📋 Plan d'Action - Dossier Comparaison

## 🎯 Deux Initiatives Identifiées

### **A. Module Tâches Récurrentes** (40-60h) - Priorité 1
Système de tâches récurrentes automatiques (quotidiennes, hebdomadaires, mensuelles).

### **B. Améliorations Kanban/Gantt** (4-8h) - Priorité 2  
Application des meilleures pratiques UX des leaders SaaS.

---

## 🚀 INITIATIVE A : Tâches Récurrentes

### Phase 1 : Analyse (2-4h)
- [ ] Inspecter schéma existant de la table `tasks`
- [ ] Vérifier si `task_actions` existe
- [ ] Créer mapping de colonnes si différences
- [ ] Documenter dans `SCHEMA_ANALYSE.md`

### Phase 2 : Tables SQL (4-6h)
- [ ] Créer `operational_activities`
- [ ] Créer `operational_schedules`
- [ ] Créer `operational_action_templates`
- [ ] Modifier table `tasks` (ajouter `activity_id`, `is_operational`)
- [ ] Configurer RLS policies
- [ ] Créer fonctions RPC (`clone_operational_actions_to_task`, `instantiate_one_off_activity`, `pause_activity`)

### Phase 3 : Edge Function (8-12h)
- [ ] Créer `/supabase/functions/operational-instantiator/`
- [ ] Implémenter parser RRULE (DAILY, WEEKLY, MONTHLY)
- [ ] Implémenter générateur de tâches (idempotent)
- [ ] Tester localement
- [ ] Déployer sur Supabase
- [ ] Configurer cron quotidien (00:00)

### Phase 4 : UI React (16-24h)
- [ ] Hook `useActivities` (CRUD complet)
- [ ] Hook `useSchedules` (CRUD planification)
- [ ] Hook `useActionTemplates` (gestion checklist)
- [ ] Composant `ActivityList` (liste avec filtres)
- [ ] Composant `ActivityForm` (création/édition)
- [ ] Composant `ScheduleForm` (RRULE UI)
- [ ] Composant `ActionTemplateList` (drag & drop)
- [ ] Page `/operations` (liste principale)
- [ ] Page `/operations/:id` (détails)
- [ ] Ajouter filtre "Opérations" dans Kanban/Gantt/Calendrier

### Phase 5 : Tests (4-6h)
- [ ] Tests unitaires RPC functions
- [ ] Tests Edge Function (idempotence, RRULE)
- [ ] Tests E2E (créer activité → voir occurrences)
- [ ] Tests RLS (isolation tenant)

---

## 🎨 INITIATIVE B : Améliorations Kanban/Gantt

### Quick Wins (1-2h)
- [ ] Extraire `TaskRowActions` avec DropdownMenu
- [ ] Appliquer hauteurs différenciées (64px tâches, 51px sous-tâches)
- [ ] Créer composants `LoadingState` et `ErrorState`

### Améliorations UX (2-3h)
- [ ] Créer `AssigneeSelect` avec Popover
- [ ] Ajouter indentation hiérarchique (`paddingLeft`)
- [ ] Améliorer responsive avec `useIsMobile()`

### Fonctionnalités Avancées (2-4h)
- [ ] Créer `DocumentCellColumn` (upload inline)
- [ ] Créer `CommentCellColumn` (timestamps relatifs)
- [ ] Tester dans Kanban et Gantt

---

## 📝 Ordre d'Exécution Recommandé

### **Option 1 : Focus Récurrence (Recommandé si urgent)**
1. Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
2. Puis Initiative B en parallèle

### **Option 2 : Quick Win d'abord**
1. Initiative B (Quick Wins) → valeur immédiate
2. Puis Initiative A complète
3. Puis reste Initiative B

### **Option 3 : Incrémental**
1. Phase 1-2 (SQL) + Initiative B (Quick Wins)
2. Phase 3 (Edge Function)
3. Phase 4 (UI) + reste Initiative B
4. Phase 5 (Tests)

---

## 📦 Livrables Attendus

### Initiative A :
- [ ] `SCHEMA_ANALYSE.md`
- [ ] `create-operational-tables.sql`
- [ ] `setup-rls-policies.sql`
- [ ] `create-rpc-functions.sql`
- [ ] `/supabase/functions/operational-instantiator/`
- [ ] Components React dans `/src/components/operations/`
- [ ] Pages dans `/src/pages/`
- [ ] Tests E2E

### Initiative B :
- [ ] Components atomiques dans `/src/components/vues/`
- [ ] Helpers dans `/src/lib/`
- [ ] Documentation des changements

---

## ⚠️ Points d'Attention

### Initiative A :
- **Adaptation schéma** : Vérifier colonnes existantes avant ALTER
- **RRULE** : Parser simple suffisant (pas besoin lib complète)
- **Idempotence** : Index unique critique pour éviter doublons
- **Cron** : Vérifier support dans votre plan Supabase

### Initiative B :
- **Tests régression** : Vérifier drag & drop après modifications
- **Performance** : Tester avec 50+ tâches
- **Responsive** : Tester sur mobile

---

## 🎯 Prochaine Étape Immédiate

**Je recommande de commencer par :**

1. **Phase 1 (Analyse)** - 2-4h
   - Exécuter requêtes d'introspection
   - Documenter schéma actuel
   - Créer mapping si nécessaire

**Voulez-vous que je commence par :**
- [ ] A) Générer les scripts SQL d'introspection
- [ ] B) Créer les tables SQL complètes
- [ ] C) Développer la Edge Function
- [ ] D) Appliquer les Quick Wins de l'Initiative B d'abord

**Ou préférez-vous une autre approche ?**
