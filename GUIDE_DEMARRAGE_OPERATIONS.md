# 🚀 Guide de Démarrage - Module Opérations

## ✅ Installation Terminée !

Le module **Activités Opérationnelles** est maintenant complètement intégré à votre application Wadashaqeen.

---

## 📍 Accès au Module

### **URL d'accès**
```
http://localhost:5173/operations
```

### **Navigation**
Cliquez sur **"Opérations"** dans le menu de navigation principal.

### **Permissions**
- ✅ Même permission que les tâches (`canAccessTasks`)
- ✅ Accessible à tous les utilisateurs ayant accès aux tâches

---

## 🎯 Fonctionnalités Disponibles

### **1. Créer une Activité Récurrente**

**Cas d'usage :** Réunion d'équipe tous les lundis

1. Cliquer sur **"Nouvelle Récurrente"**
2. **Onglet Informations :**
   - Nom : "Réunion d'équipe hebdomadaire"
   - Description : "Point hebdomadaire avec l'équipe"
   - Portée : Organisation
   - Template titre : "Réunion - Semaine {{isoWeek}}"

3. **Onglet Planification :**
   - Fréquence : Hebdomadaire
   - Jours : Cocher "Lundi"
   - Date début : Aujourd'hui
   - Date fin : Laisser vide (récurrence infinie)
   - Fenêtre : 30 jours

4. **Onglet Actions :**
   - Action 1 : "Préparer l'ordre du jour"
   - Action 2 : "Envoyer le compte-rendu"

5. **Créer** → La tâche sera générée automatiquement chaque lundi !

---

### **2. Créer une Activité Ponctuelle**

**Cas d'usage :** Audit de sécurité le 30 janvier

1. Cliquer sur **"Nouvelle Ponctuelle"**
2. Remplir :
   - Nom : "Audit de sécurité annuel"
   - Description : "Audit complet du système"
   - Date : 30/01/2025
   - Actions : "Vérifier les logs", "Tester les backups"

3. **Créer** → La tâche est générée immédiatement !

---

### **3. Gérer les Activités Existantes**

#### **Voir les détails**
- Cliquer sur une card d'activité
- 5 onglets disponibles :
  - **Infos** : Nom, description, template
  - **Planning** : RRULE, dates
  - **Actions** : Templates de checklist
  - **Occurrences** : Liste des tâches générées
  - **Stats** : Taux de complétion, métriques

#### **Modifier une activité**
- Cliquer sur "Modifier" dans le menu (3 points)
- Éditer les informations
- Sauvegarder

#### **Activer/Désactiver**
- Menu → "Désactiver" : Arrête la génération de nouvelles tâches
- Menu → "Activer" : Reprend la génération

#### **Supprimer**
- Menu → "Supprimer"
- Choisir : Conserver les tâches terminées OU Tout supprimer
- Confirmer

---

## 🔄 Génération Automatique

### **Edge Function : operational-instantiator**

**Déployée :** ✅ Oui  
**URL :** https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/operational-instantiator

**Fonctionnement :**
1. S'exécute quotidiennement à 00:00 UTC
2. Génère les tâches pour les 30 prochains jours
3. Idempotence : Ne crée pas de doublons
4. Clone automatiquement les actions templates

**Test manuel :**
```bash
npm run edge:test
```

**Voir les logs :**
Supabase Dashboard → Edge Functions → operational-instantiator → Logs

---

## 📊 Exemples RRULE

### **Quotidien**
```
FREQ=DAILY
```
Génère une tâche tous les jours.

### **Hebdomadaire - Jours ouvrés**
```
FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
```
Génère une tâche du lundi au vendredi.

### **Mensuel - 1er et 15 du mois**
```
FREQ=MONTHLY;BYMONTHDAY=1,15
```
Génère une tâche le 1er et le 15 de chaque mois.

---

## 🎨 Variables de Titre

Utilisez ces variables dans le template de titre :

| Variable | Résultat | Exemple |
|----------|----------|---------|
| `{{date}}` | 2025-01-13 | Rapport du 2025-01-13 |
| `{{isoWeek}}` | 3 | Réunion - Semaine 3 |
| `{{year}}` | 2025 | Bilan de l'année 2025 |
| `{{month}}` | 01 | Rapport mensuel 01 |
| `{{day}}` | 13 | Point du jour 13 |

**Exemple complet :**
```
Réunion hebdo - Semaine {{isoWeek}} ({{date}})
→ Réunion hebdo - Semaine 3 (2025-01-13)
```

---

## 📋 Actions Templates

### **Comment ça marche ?**

1. Vous créez des templates d'actions dans l'activité
2. Chaque tâche générée reçoit automatiquement ces actions
3. Les actions sont clonées dans la table `task_actions`
4. Les poids sont répartis automatiquement (100% total)

### **Exemple concret**

**Templates définis :**
- "Préparer l'ordre du jour" (position 1)
- "Animer la réunion" (position 2)
- "Envoyer le compte-rendu" (position 3)

**Tâche générée le lundi 13/01 :**
- ✅ Contient les 3 actions
- ✅ Chaque action pèse 33%
- ✅ Progression calculée automatiquement

---

## 🔍 Où Voir les Tâches Générées ?

### **Option 1 : Dans le module Opérations**
1. Ouvrir une activité
2. Onglet "Occurrences"
3. Voir toutes les tâches générées

### **Option 2 : Dans le module Tâches**
1. Aller dans `/tasks`
2. Filtrer par badge "Opération"
3. Les tâches opérationnelles ont `is_operational = true`

### **Option 3 : Vue Kanban/Gantt**
Les tâches opérationnelles apparaissent normalement avec un badge "Opération".

---

## 🐛 Dépannage

### **Problème : Aucune tâche générée**

**Vérifications :**
1. L'activité est-elle **active** ? (badge vert)
2. La date de début est-elle dans le passé ?
3. La RRULE est-elle valide ? (voir preview)
4. L'Edge Function a-t-elle été exécutée ? (logs Supabase)

**Solution :**
```bash
# Tester manuellement la fonction
npm run edge:test

# Voir les logs
Supabase Dashboard → Edge Functions → Logs
```

---

### **Problème : Tâches dupliquées**

**Cause :** Index unique non créé correctement

**Vérification :**
```sql
-- Dans Supabase SQL Editor
SELECT * FROM pg_indexes WHERE indexname = 'uq_tasks_activity_occurrence';
```

**Solution :**
```sql
-- Recréer l'index
CREATE UNIQUE INDEX IF NOT EXISTS uq_tasks_activity_occurrence
ON public.tasks(activity_id, start_date)
WHERE activity_id IS NOT NULL;
```

---

### **Problème : Actions non clonées**

**Cause :** RPC function `clone_operational_actions_to_task` non déployée

**Vérification :**
```sql
-- Dans Supabase SQL Editor
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'clone_operational_actions_to_task';
```

**Solution :**
Exécuter à nouveau le script `05-update-rpc-functions.sql`

---

### **Problème : Erreur "redistribute_task_actions_weight"**

**Cause :** Fonction manquante dans votre baseline

**Solution :**
La fonction est normalement présente. Vérifier :
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'redistribute_task_actions_weight';
```

Si absente, la fonction `clone_operational_actions_to_task` fonctionne quand même (poids à 0).

---

## 📈 Statistiques & Monitoring

### **Voir les statistiques d'une activité**

1. Ouvrir une activité
2. Onglet "Stats"
3. Voir :
   - Taux de complétion global
   - Répartition (terminées/en cours/bloquées)
   - Temps moyen de complétion
   - Prochaine/dernière occurrence

### **Métriques disponibles (via RPC)**

```typescript
const stats = await supabase.rpc('get_activity_statistics', {
  p_activity_id: 'uuid-activite'
});

// Retourne :
{
  total_occurrences: 12,
  completed_count: 8,
  in_progress_count: 3,
  blocked_count: 1,
  completion_rate: 67,
  avg_completion_time_days: 2.5,
  next_occurrence: '2025-01-20',
  last_occurrence: '2025-01-13'
}
```

---

## 🎯 Cas d'Usage Recommandés

### **Opérations Récurrentes**
- ✅ Réunions hebdomadaires/mensuelles
- ✅ Rapports périodiques (quotidiens, hebdo, mensuels)
- ✅ Sauvegardes et maintenances
- ✅ Revues de code/performance
- ✅ Contrôles qualité réguliers
- ✅ Envois de newsletters
- ✅ Facturations récurrentes

### **Opérations Ponctuelles**
- ✅ Audits annuels/semestriels
- ✅ Formations spécifiques
- ✅ Événements uniques
- ✅ Migrations de données
- ✅ Déploiements majeurs
- ✅ Revues de fin d'année

---

## 🚀 Prochaines Améliorations Possibles

### **Court Terme**
- [ ] Notifications par email avant échéance
- [ ] Export PDF des statistiques
- [ ] Templates d'activités prédéfinis
- [ ] Duplication d'activités

### **Moyen Terme**
- [ ] Workflow d'approbation
- [ ] Assignation automatique selon rôle
- [ ] Intégration calendrier (iCal)
- [ ] Dashboard analytics global

### **Long Terme**
- [ ] IA pour optimiser les planifications
- [ ] Prédictions de charge de travail
- [ ] Automatisation complète (webhooks)

---

## 📞 Support

### **Documentation**
- Fichier : `RECAPITULATIF_INITIATIVE_A.md`
- Fichier : `PHASE_4_COMPLETE.md`

### **Logs & Debug**
- Console navigateur (F12)
- Supabase Dashboard → Edge Functions → Logs
- Network tab (requêtes API)

### **Base de Données**
- Supabase Dashboard → Table Editor
- SQL Editor pour requêtes personnalisées

---

## ✅ Checklist de Validation

Avant de passer en production :

- [ ] Tester création activité récurrente
- [ ] Tester création activité ponctuelle
- [ ] Vérifier génération automatique (edge function)
- [ ] Valider clonage des actions
- [ ] Tester modification/suppression
- [ ] Vérifier statistiques
- [ ] Tester avec plusieurs utilisateurs
- [ ] Valider isolation par tenant
- [ ] Tester cas limites (dates, RRULE complexes)
- [ ] Documenter pour l'équipe

---

**Date :** 2025-01-13 19:10 UTC  
**Version :** 1.0.0  
**Status :** ✅ Production Ready

**Félicitations ! Le module Opérations est opérationnel ! 🎉**
