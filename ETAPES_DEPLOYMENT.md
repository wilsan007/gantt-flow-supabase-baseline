# 📋 ÉTAPES POUR DÉPLOYER LES CORRECTIONS

## ✅ **CORRECTIONS EFFECTUÉES (3/3)**

1. ✅ handle-email-confirmation/index.ts
2. ✅ send-invitation/index.ts
3. ✅ send-collaborator-invitation/index.ts

---

## 🔧 **CONFIGURATION SUPABASE (À FAIRE)**

### **1. Ajouter la variable SITE_URL**

**Via Dashboard Supabase:**

1. Allez sur: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions
2. Section "Environment variables"
3. Ajoutez:
   ```
   Nom: SITE_URL
   Valeur: https://wadashaqeyn.org
   ```
4. Sauvegardez

---

### **2. Redéployer les 3 Edge Functions**

**Option A: Via Supabase CLI (recommandé)**

```bash
# Déployer les 3 fonctions
cd /home/awaleh/Bureau/Wadashaqayn-SaaS/gantt-flow-next

supabase functions deploy handle-email-confirmation
supabase functions deploy send-invitation
supabase functions deploy send-collaborator-invitation
```

**Option B: Via Dashboard Supabase**

1. Allez dans "Edge Functions"
2. Pour chaque fonction, cliquez "Redeploy"

---

## 🧪 **TESTS À EFFECTUER**

### **Test 1: Vérifier les actions (Console)**

1. ✅ Ouvrir http://localhost:8080
2. ✅ F12 → Console
3. ✅ Chercher: `📊 DEBUG - Total tasks:`
4. ✅ Noter ce qui s'affiche

**Si `task_actions` est vide:**

- Créer une tâche
- Lui ajouter une action via l'interface
- Vérifier que la colonne apparaît

---

### **Test 2: Invitation (Après redéploiement)**

1. ✅ Envoyer une invitation
2. ✅ Vérifier l'email reçu
3. ✅ Cliquer sur le lien
4. ✅ **VÉRIFIER:** Le lien doit pointer vers `https://wadashaqeyn.org` et PAS vers `localhost`

---

## 📝 **CHECKLIST COMPLÈTE**

- [ ] Variable SITE_URL ajoutée sur Supabase
- [ ] 3 Edge Functions redéployées
- [ ] Test invitation: lien correct vers wadashaqeyn.org
- [ ] Console checked: task_actions debug visible
- [ ] Actions fonctionnelles en local
- [ ] Tout fonctionne parfaitement

**UNE FOIS TOUT OK:**

- [ ] Commit de TOUTES les corrections
- [ ] Push vers GitHub
- [ ] Déploiement automatique vers Hostinger (avec dangerous-clean-slate)

---

## 🎯 **ORDRE D'EXÉCUTION**

1. **MAINTENANT:** Vérifier la console pour le debug des actions
2. **ENSUITE:** Configurer SITE_URL sur Supabase
3. **PUIS:** Redéployer les 3 Edge Functions
4. **ENFIN:** Tester une invitation complète
5. **SI TOUT OK:** Commit + Push + Déploiement
