# 🧪 Guide de Test Manuel - Dashboards Analytics

**Date:** 14 Octobre 2025  
**Objectif:** Tester tous les dashboards avec les vraies données de la base

---

## 📋 Prérequis

✅ Application démarrée : `npm run dev`  
✅ Connexion utilisateur active  
✅ Données réelles dans la base (projets, employés, congés)

---

## 🎯 PARTIE 1 : Test Dashboard Projets

### **Étape 1: Accéder au Dashboard**

1. Ouvrez votre navigateur : `http://localhost:8080`
2. Connectez-vous avec vos identifiants
3. Naviguez vers **Projets** ou **Analytics Projets**

### **Étape 2: Vérifier les KPIs**

Vérifiez que vous voyez bien :
- [ ] **Total Projets** : Nombre affiché correspond à vos données
- [ ] **Projets Actifs** : Nombre avec statut "active"
- [ ] **Projets Terminés** : Nombre avec statut "completed"
- [ ] **En Retard** : Projets dont la date de fin est dépassée
- [ ] **Tendances** : Flèches ↑ ou ↓ avec pourcentages

**✅ Attendu:** Tous les KPIs affichent des nombres cohérents

### **Étape 3: Vérifier la Durée Moyenne**

- [ ] **Durée Moyenne** affiché en jours
- [ ] Calcul basé sur les projets terminés uniquement

**✅ Attendu:** Nombre cohérent (ex: 45j pour projets de ~1.5 mois)

### **Étape 4: Vérifier les Graphiques**

#### **Distribution par Statut**
- [ ] Camembert visible
- [ ] Sections colorées (Actifs=Vert, Terminés=Bleu, etc.)
- [ ] Pourcentages corrects
- [ ] Total = 100%

#### **Distribution par Priorité**
- [ ] Camembert visible
- [ ] Sections: Haute (Rouge), Moyenne (Orange), Basse (Vert)
- [ ] Pourcentages cohérents

**✅ Attendu:** Graphiques interactifs avec tooltips au hover

### **Étape 5: Test Export CSV**

1. Cliquez sur **"Exporter"**
2. Sélectionnez **"CSV (Tableau)"**
3. Fichier téléchargé : `projets-YYYY-MM-DD.csv`

**Vérifications:**
- [ ] Fichier s'ouvre dans Excel/Numbers
- [ ] Colonnes : Nom, Description, Statut, Priorité, Dates, Budget
- [ ] Données complètes (pas de cellules vides anormales)
- [ ] Encodage UTF-8 correct (accents visibles)

**✅ Attendu:** CSV exploitable immédiatement

### **Étape 6: Test Export PDF Tableau**

1. Cliquez sur **"Exporter"**
2. Sélectionnez **"PDF Tableau"**
3. Fichier téléchargé : `projets-YYYY-MM-DD.pdf`

**Vérifications:**
- [ ] PDF s'ouvre correctement
- [ ] En-tête : "Rapport Projets" + sous-titre
- [ ] Date de génération visible
- [ ] Tableau professionnel avec bordures
- [ ] Colonnes bien alignées
- [ ] Pagination automatique si >20 projets
- [ ] Pied de page : "Généré par Wadashaqeen SaaS"
- [ ] Numérotation des pages

**✅ Attendu:** PDF professionnel prêt à imprimer

### **Étape 7: Test Export PDF Visuel**

1. Cliquez sur **"Exporter"**
2. Sélectionnez **"PDF Visuel"**
3. Fichier téléchargé : `dashboard-projets-YYYY-MM-DD.pdf`

**Vérifications:**
- [ ] PDF contient une capture du dashboard
- [ ] KPIs visibles
- [ ] Graphiques visibles (couleurs préservées)
- [ ] Format paysage (landscape)
- [ ] Qualité image correcte (pas pixelisé)

**✅ Attendu:** Screenshot professionnel du dashboard

### **Étape 8: Test Export PDF Complet**

1. Cliquez sur **"Exporter"**
2. Sélectionnez **"PDF Complet"**
3. Fichier téléchargé : `rapport-complet-projets-YYYY-MM-DD.pdf`

**Vérifications:**
- [ ] **Page 1 - Métriques:**
  - Titre "Rapport Complet - Projets"
  - Section "Métriques Clés" avec encadrés
  - 5 métriques affichées (Total, Actifs, Terminés, Retard, Durée)
- [ ] **Page 1/2 - Tableau:**
  - Section "Données Détaillées"
  - Tableau professionnel
  - Données des projets
- [ ] **Multi-pages** si nécessaire
- [ ] Numérotation correcte

**✅ Attendu:** Rapport complet type "executive summary"

### **Étape 9: Test Actualisation**

1. Cliquez sur **"Actualiser"**
2. Spinner de chargement visible
3. Données rechargées

**✅ Attendu:** Actualisation fluide sans erreur console

---

## 👥 PARTIE 2 : Test Dashboard RH

### **Étape 1: Accéder au Dashboard**

1. Naviguez vers **RH** ou **Analytics RH**
2. Vérifiez que la page charge

### **Étape 2: Vérifier les KPIs**

- [ ] **Total Employés** : Nombre total dans la base
- [ ] **Demandes en Attente** : Congés status="pending"
- [ ] **Demandes Approuvées** : Congés status="approved"
- [ ] **Présences Aujourd'hui** : Nombre du jour
- [ ] **Tendances** : Flèches ↑ ou ↓

**✅ Attendu:** KPIs cohérents avec données RH

### **Étape 3: Vérifier Délai Moyen**

- [ ] **Délai Moyen d'Approbation** en jours
- [ ] Calcul : (updated_at - created_at) pour demandes approuvées

**✅ Attendu:** Nombre réaliste (ex: 2-5 jours)

### **Étape 4: Vérifier Calendrier des Absences**

**Vérifications:**
- [ ] Calendrier mensuel affiché
- [ ] Jours de la semaine : Lun, Mar, Mer...
- [ ] **Aujourd'hui** marqué (anneau bleu)
- [ ] Jours avec absences : fond rouge/rose
- [ ] Noms d'employés visibles sur jours absents
- [ ] Si >2 personnes : "+X" affiché
- [ ] Navigation mois précédent/suivant fonctionne
- [ ] Légende visible (Absences + Aujourd'hui)

**✅ Attendu:** Calendrier interactif et lisible

### **Étape 5: Vérifier les Graphiques**

#### **Distribution par Statut**
- [ ] Sections : En attente (Orange), Approuvées (Vert), Rejetées (Rouge)
- [ ] Pourcentages corrects

#### **Distribution par Type de Congé**
- [ ] Visible uniquement si types différents existent
- [ ] Sections par type (Maladie, Vacation, etc.)

**✅ Attendu:** Graphiques pertinents

### **Étape 6: Test Export CSV**

1. Cliquez **"Exporter"** > **"CSV (Tableau)"**
2. Fichier : `conges-YYYY-MM-DD.csv`

**Vérifications:**
- [ ] Colonnes : Employé, Date début, Date fin, Nombre jours, Statut
- [ ] Données complètes
- [ ] Encodage UTF-8

**✅ Attendu:** CSV exploitable

### **Étape 7: Test Export PDF Tableau**

1. **"Exporter"** > **"PDF Tableau"**
2. Fichier : `conges-YYYY-MM-DD.pdf`

**Vérifications:**
- [ ] Titre : "Rapport Congés"
- [ ] Tableau avec 5 colonnes
- [ ] Statuts traduits en français
- [ ] Pagination si nécessaire

**✅ Attendu:** PDF professionnel

### **Étape 8: Test Export PDF Visuel**

1. **"Exporter"** > **"PDF Visuel"**
2. Fichier : `dashboard-rh-YYYY-MM-DD.pdf`

**Vérifications:**
- [ ] KPIs capturés
- [ ] Calendrier visible (couleurs OK)
- [ ] Graphiques visibles
- [ ] Format paysage

**✅ Attendu:** Screenshot du dashboard

### **Étape 9: Test Export PDF Complet**

1. **"Exporter"** > **"PDF Complet"**
2. Fichier : `rapport-complet-rh-YYYY-MM-DD.pdf`

**Vérifications:**
- [ ] Section métriques (5 KPIs)
- [ ] Section tableau (20 premières demandes)
- [ ] Multi-pages si nécessaire

**✅ Attendu:** Rapport exécutif RH

---

## 🔍 PARTIE 3 : Tests de Robustesse

### **Test 1: Dashboard Vide**

**Scénario:** Aucune donnée dans la base

**Vérifications:**
- [ ] Message "Aucun projet trouvé" ou "Aucune donnée"
- [ ] Pas d'erreur JavaScript
- [ ] Boutons export désactivés
- [ ] Graphiques affichent "Aucune donnée à afficher"

**✅ Attendu:** Gestion gracieuse du cas vide

### **Test 2: Gros Volume de Données**

**Scénario:** >100 projets ou >200 congés

**Vérifications:**
- [ ] Dashboard charge en <3 secondes
- [ ] Pas de freeze du navigateur
- [ ] Graphiques lisibles
- [ ] PDF généré même avec beaucoup de données
- [ ] Pagination automatique des tableaux PDF

**✅ Attendu:** Performance correcte

### **Test 3: Données Manquantes**

**Scénario:** Projets sans budget, congés sans raison

**Vérifications:**
- [ ] Champs vides affichent "-" ou "N/A"
- [ ] Pas d'erreur "undefined" visible
- [ ] Exports gèrent les valeurs null

**✅ Attendu:** Robustesse

### **Test 4: Caractères Spéciaux**

**Scénario:** Noms avec accents, émojis

**Vérifications:**
- [ ] Affichage correct dans dashboard
- [ ] CSV : Accents préservés
- [ ] PDF : Caractères spéciaux OK

**✅ Attendu:** Support UTF-8 complet

---

## 📊 PARTIE 4 : Tests Cross-Browser

Testez sur **au moins 2 navigateurs** :

### **Chrome/Edge**
- [ ] Dashboard affiche correctement
- [ ] Exports fonctionnent
- [ ] Graphiques interactifs

### **Firefox**
- [ ] Dashboard affiche correctement
- [ ] Exports fonctionnent
- [ ] Graphiques interactifs

### **Safari** (si macOS)
- [ ] Dashboard affiche correctement
- [ ] Exports fonctionnent

**✅ Attendu:** Compatibilité multi-navigateurs

---

## 🎯 PARTIE 5 : Tests Responsive

### **Desktop (1920x1080)**
- [ ] 4 KPIs sur une ligne
- [ ] Graphiques côte à côte
- [ ] Tout visible sans scroll horizontal

### **Tablet (768x1024)**
- [ ] 2 KPIs par ligne
- [ ] Graphiques empilés
- [ ] Menu dropdown export accessible

### **Mobile (375x667)**
- [ ] KPIs empilés (1 par ligne)
- [ ] Calendrier adapté
- [ ] Boutons accessibles

**✅ Attendu:** Design responsive

---

## ✅ CHECKLIST FINALE

### **Dashboard Projets**
- [ ] ✅ KPIs affichent données réelles
- [ ] ✅ Graphiques fonctionnels
- [ ] ✅ Export CSV fonctionne
- [ ] ✅ Export PDF Tableau fonctionne
- [ ] ✅ Export PDF Visuel fonctionne
- [ ] ✅ Export PDF Complet fonctionne
- [ ] ✅ Actualisation fonctionne

### **Dashboard RH**
- [ ] ✅ KPIs affichent données réelles
- [ ] ✅ Calendrier absences fonctionne
- [ ] ✅ Graphiques fonctionnels
- [ ] ✅ Export CSV fonctionne
- [ ] ✅ Export PDF Tableau fonctionne
- [ ] ✅ Export PDF Visuel fonctionne
- [ ] ✅ Export PDF Complet fonctionne

### **Patterns Enterprise**
- [ ] ✅ Gestion d'erreurs gracieuse
- [ ] ✅ États de chargement clairs
- [ ] ✅ Toasts de confirmation
- [ ] ✅ Performance acceptable (<3s)
- [ ] ✅ Pas d'erreur console
- [ ] ✅ Design moderne et cohérent

---

## 📝 Rapport de Test

**Testeur:** _____________  
**Date:** _____________  
**Navigateur:** _____________  

**Résultats:**
```
✅ Tests réussis: __ / __
❌ Tests échoués: __ / __
⚠️  Points d'attention: 
- 
- 
```

**Bugs identifiés:**
```
1. 
2. 
3. 
```

**Suggestions d'amélioration:**
```
1. 
2. 
3. 
```

---

## 🆘 En Cas de Problème

### **Erreur: "Permission denied"**
→ Vérifiez que vous êtes bien connecté

### **Export PDF ne fonctionne pas**
→ Vérifiez la console (F12) pour erreurs
→ Essayez de désactiver bloqueur de pop-ups

### **Graphiques ne s'affichent pas**
→ Rafraîchissez la page (Ctrl+R)
→ Vérifiez que Recharts est installé

### **Calendrier vide**
→ Vérifiez qu'il existe des congés approuvés
→ Naviguez vers un autre mois

---

## 🎊 Tests Terminés !

**Si tous les tests passent** ✅ :
- Les dashboards sont **production-ready**
- Exports fonctionnent parfaitement
- Architecture enterprise validée

**Prochaines étapes** :
1. Déploiement en production
2. Formation utilisateurs
3. Monitoring post-déploiement

---

**Créé le:** 14 Octobre 2025  
**Version:** 1.0  
**Statut:** Prêt pour tests
