# ⚡ Générer les Types Supabase - Guide Rapide

## 🎯 Problème

Le mot de passe de la base de données est requis pour générer les types automatiquement.

---

## ✅ SOLUTION LA PLUS RAPIDE (2 minutes)

### **Via Dashboard Supabase (RECOMMANDÉ)**

1. **Ouvrir le Dashboard**
   ```
   https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/api
   ```

2. **Scroll vers le bas jusqu'à "TypeScript Types"**

3. **Copier tout le code TypeScript généré**

4. **Créer/Remplacer le fichier**
   ```bash
   # Créer le dossier si nécessaire
   mkdir -p src/integrations/supabase
   
   # Ouvrir le fichier
   nano src/integrations/supabase/types.ts
   # ou
   code src/integrations/supabase/types.ts
   ```

5. **Coller le code copié**

6. **Sauvegarder**

7. **✅ TERMINÉ !** Les erreurs TypeScript devraient disparaître

---

## 🔑 Alternative : Récupérer le Mot de Passe DB

Si vous préférez utiliser la ligne de commande :

1. **Aller dans Dashboard > Settings > Database**
   ```
   https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/settings/database
   ```

2. **Copier le "Database Password"** (ou le réinitialiser si oublié)

3. **Lier le projet**
   ```bash
   supabase link --project-ref qliinxtanjdnwxlvnxji
   # Coller le mot de passe quand demandé
   ```

4. **Générer les types**
   ```bash
   npm run db:types
   ```

---

## 🚀 Alternative Temporaire : Utiliser "as any"

Si vous voulez **tester immédiatement sans attendre** :

### **Dans useOperationalActionTemplates.ts**
```typescript
// Ligne 31 - Ajouter (as any)
const { data, error: fetchError } = await (supabase as any)
  .from('operational_action_templates')
  .select('*')
  // ... reste du code
```

### **Dans OneOffActivityDialog.tsx**
```typescript
// Ligne 90 - Ajouter (as any)
await (supabase as any)
  .from('operational_action_templates')
  .insert({...});

// Ligne 101 - Ajouter (as any)  
const { error: rpcError } = await (supabase as any).rpc('instantiate_one_off_activity', {
  p_activity_id: activityData.id,
  p_due_date: format(dueDate, 'yyyy-MM-dd'),
  p_title_override: null,
});
```

### **Dans tous les autres hooks**
Ajouter `(supabase as any)` partout où vous voyez l'erreur de type.

⚠️ **Note :** C'est une solution temporaire. Les types corrects devraient être générés dès que possible.

---

## 📋 Vérification

Après avoir généré les types, vérifiez :

```bash
# Le fichier existe
ls -la src/integrations/supabase/types.ts

# Contient les nouvelles tables
grep "operational_activities" src/integrations/supabase/types.ts
grep "operational_schedules" src/integrations/supabase/types.ts
grep "operational_action_templates" src/integrations/supabase/types.ts

# Contient les RPC functions
grep "instantiate_one_off_activity" src/integrations/supabase/types.ts
grep "clone_operational_actions_to_task" src/integrations/supabase/types.ts
```

Si toutes les commandes retournent du contenu → ✅ **C'est bon !**

---

## 🎯 Redémarrer l'Application

```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

Les erreurs TypeScript devraient avoir disparu ! 🎉

---

## 📞 En Cas de Problème

### **Types générés mais erreurs persistent**
```bash
# Nettoyer le cache TypeScript
rm -rf node_modules/.vite
npm run dev
```

### **Fichier types.ts vide ou invalide**
- Vérifier que les tables SQL ont bien été créées
- Vérifier dans Dashboard > Table Editor

### **Autres erreurs**
- Voir `RESOLUTION_ERREURS_TYPESCRIPT.md` pour plus de détails

---

**⏱️ Temps estimé :** 2 minutes (via Dashboard)  
**💡 Recommandation :** Utiliser le Dashboard Supabase (le plus simple)
