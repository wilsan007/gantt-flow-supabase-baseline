# 📋 TODO AVANT DÉPLOIEMENT - Session en cours

**Date:** 9 novembre 2025
**Status:** 🟡 EN COURS - Modifications en cours, pas de déploiement avant accord

---

## ✅ FAIT DANS CETTE SESSION

### **1. AuthContext Provider**

- [x] Créer `src/contexts/AuthContext.tsx`
- [x] Intégrer dans `App.tsx`
- [x] Documenter migration (`AUTHCONTEXT_MIGRATION_GUIDE.md`)
- [x] Marquer `useUserFilterContext` comme deprecated

### **2. Diagnostic Actions Vides**

- [x] Identifier le problème: RLS bloque les `task_actions`
- [x] Ajouter logs debug dans `useTasksEnterprise.ts`
- [x] Créer script SQL de correction (`FIX_TASK_ACTIONS_RLS.md`)
- [x] Documenter la solution complète

### **3. Documentation**

- [x] `CHANGES_READY_FOR_COMMIT.txt` - Récapitulatif complet
- [x] `COMMIT_MESSAGE.txt` - Message de commit préparé
- [x] `prepare-commit.sh` - Script de commit interactif
- [x] `GIT_STATUS_SUMMARY.txt` - État des fichiers

---

## ⏳ À FAIRE AVANT DÉPLOIEMENT

### **ÉTAPE 1: Corrections RLS (CRITIQUE)**

- [ ] Exécuter script SQL `FIX_TASK_ACTIONS_RLS.md` sur Supabase
- [ ] Vérifier que les 52 actions sont maintenant visibles
- [ ] Tester en local que les colonnes d'actions s'affichent

### **ÉTAPE 2: Corrections Liens d'Invitation**

Fichiers déjà modifiés (sessions précédentes):

- [x] `supabase/functions/handle-email-confirmation/index.ts`
- [x] `supabase/functions/send-invitation/index.ts`
- [x] `supabase/functions/send-collaborator-invitation/index.ts`

Actions restantes:

- [ ] Configurer variable `SITE_URL` sur Supabase Edge Functions
- [ ] Tester l'envoi d'une invitation
- [ ] Vérifier que le lien pointe vers le domaine de prod

### **ÉTAPE 3: Tests Locaux Complets**

- [ ] Application démarre sans erreur
- [ ] 16 tâches s'affichent
- [ ] Colonnes d'actions visibles (après fix SQL)
- [ ] AuthContext fonctionne (1 seul appel auth au lieu de 15+)
- [ ] Console propre (pas d'erreurs rouges)
- [ ] Performance améliorée (requêtes réduites)

### **ÉTAPE 4: Nettoyage Optionnel**

- [ ] Retirer les logs de debug (ou les garder pour le moment)
- [ ] Supprimer fichiers temporaires si besoin
- [ ] Vérifier `.gitignore` pour exclure fichiers sensibles

---

## 🎯 PROCHAINES MODIFICATIONS PRÉVUES

### **Option A: Migration Progressive vers AuthContext**

Migrer les hooks qui utilisent `useUserFilterContext()`:

- [ ] `src/hooks/useAlerts.ts`
- [ ] `src/hooks/useProfiles.ts`
- [ ] `src/hooks/useEmployees.ts`
- [ ] `src/hooks/useSkillsTraining.ts`
- [ ] `src/hooks/useHRSelfService.ts`
- [ ] `src/hooks/useNotifications.ts`
- [ ] `src/hooks/useOnboardingOffboarding.ts`
- [ ] `src/hooks/useHRMinimal.ts`

**Guide:** Voir `AUTHCONTEXT_MIGRATION_GUIDE.md`

### **Option B: Autres Corrections/Features**

- [ ] Optimiser performance (si besoin)
- [ ] Corriger bugs identifiés
- [ ] Ajouter nouvelles features
- [ ] Améliorer UI/UX

### **Option C: Responsive & Mobile**

Fichiers à vérifier selon les mémoires:

- [ ] SuperAdminPage (URGENT selon mémoire)
- [ ] Settings Page (URGENT selon mémoire)
- [ ] Auth Pages
- [ ] Dialogs/Modals

---

## 📦 FICHIERS MODIFIÉS ACTUELLEMENT

### **Code Source (4 fichiers):**

```
M  src/App.tsx
M  src/hooks/useUserAuth.ts
M  src/hooks/useTasksEnterprise.ts
?? src/contexts/AuthContext.tsx (NOUVEAU)
```

### **Edge Functions (3 fichiers - sessions précédentes):**

```
M  supabase/functions/handle-email-confirmation/index.ts
M  supabase/functions/send-invitation/index.ts
M  supabase/functions/send-collaborator-invitation/index.ts
```

### **Autres (1 fichier):**

```
M  src/components/vues/table/DynamicTable.tsx (logs debug)
M  .github/workflows/main-pipeline.yml (session précédente)
```

### **Documentation (7+ fichiers):**

```
?? AUTHCONTEXT_MIGRATION_GUIDE.md
?? FIX_TASK_ACTIONS_RLS.md
?? debug-task-actions.sql
?? CHANGES_READY_FOR_COMMIT.txt
?? COMMIT_MESSAGE.txt
?? prepare-commit.sh
?? GIT_STATUS_SUMMARY.txt
?? TODO_AVANT_DEPLOIEMENT.md (ce fichier)
+ autres fichiers de sessions précédentes
```

---

## 🚫 PAS DE DÉPLOIEMENT AVANT

- [ ] Accord explicite de l'utilisateur
- [ ] Toutes les modifications terminées
- [ ] Tests locaux passés
- [ ] Script SQL exécuté sur Supabase
- [ ] Variables d'environnement configurées

---

## 💡 COMMANDES RAPIDES

### **Voir l'état actuel:**

```bash
git status
```

### **Tester localement:**

```bash
npm run dev
# Puis ouvrir http://localhost:8080
```

### **Préparer commit (plus tard):**

```bash
bash prepare-commit.sh
# Ou manuellement avec git add + git commit -F COMMIT_MESSAGE.txt
```

---

## 🎯 WORKFLOW DE TRAVAIL

1. **MAINTENANT:** Continuer les modifications
2. **ENSUITE:** Centraliser tous les changements
3. **PUIS:** Tests complets en local
4. **ENFIN:** Déploiement après accord

**Status actuel:** Phase 1 - Modifications en cours ✅

---

## 📞 QUESTIONS À CLARIFIER

- Quelles modifications voulez-vous faire ensuite?
- Faut-il migrer des hooks vers AuthContext maintenant?
- Y a-t-il d'autres bugs/features à corriger avant le déploiement?
- Voulez-vous tester l'application localement d'abord?

---

**✅ TOUS LES CHANGEMENTS SONT SAUVEGARDÉS**
**🚫 AUCUN DÉPLOIEMENT NE SERA FAIT SANS VOTRE ACCORD**
**🔧 PRÊT À CONTINUER LES MODIFICATIONS!**
