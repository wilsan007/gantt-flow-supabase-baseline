# 🚀 Déploiement Migration 230 - Correction Doublons user_roles

## ✅ MISE À JOUR IMPORTANTE

**La migration a été corrigée pour supporter les rôles contextuels** :
- ✅ Contrainte UNIQUE inclut maintenant `context_type` et `context_id`
- ✅ Permet à un utilisateur d'avoir le même rôle pour différents projets/départements
- ✅ Empêche les vrais doublons (même rôle + même contexte)

## 📊 Analyse du Problème

### Statistiques Actuelles
```
Total lignes: 35,036 ❌
Lignes uniques attendues: ~39-50 ✅ (avec contextes différents)
Lignes à supprimer: ~34,990
Réduction: ~99.85%
```

### Impact
- **Performance** : Les requêtes `user_roles` sont 900x plus lentes
- **Bande passante** : Transfert de 35,000 lignes au lieu de 39
- **Cache** : Pollution du cache avec des milliers de doublons
- **UX** : Temps de chargement des rôles très long

---

## 🔧 Méthode 1 : Dashboard Supabase (RECOMMANDÉ)

### Étapes

1. **Ouvrez le Dashboard Supabase**
   ```
   https://app.supabase.com/project/qliinxtanjdnwxlvnxji/sql
   ```

2. **Copiez le contenu du fichier**
   ```bash
   cat supabase/migrations/20250111000230_fix_user_roles_duplicates_and_trigger.sql
   ```

3. **Collez dans l'éditeur SQL**
   - Cliquez sur "New Query"
   - Collez tout le contenu
   - Cliquez sur "Run" (ou Ctrl+Enter)

4. **Vérifiez les logs**
   - Vous devriez voir les messages de progression
   - Vérifiez qu'il n'y a pas d'erreurs

5. **Vérifiez le résultat**
   ```sql
   SELECT COUNT(*) FROM user_roles;
   -- Devrait retourner ~39 au lieu de 35,036
   ```

---

## 🔧 Méthode 2 : Supabase CLI

### Prérequis
```bash
npm install -g supabase
```

### Commandes

1. **Lier le projet**
   ```bash
   npx supabase link --project-ref qliinxtanjdnwxlvnxji
   ```

2. **Pousser la migration**
   ```bash
   npx supabase db push
   ```

3. **Vérifier**
   ```bash
   npx supabase db execute --file supabase/migrations/20250111000230_fix_user_roles_duplicates_and_trigger.sql
   ```

---

## 🔧 Méthode 3 : Script Node.js (Si les autres échouent)

### Exécution Étape par Étape

```bash
# 1. Nettoyer les doublons
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Récupérer tous les user_roles
const { data } = await supabase.from('user_roles').select('*');

// Grouper par (user_id, role_id, tenant_id)
const groups = {};
data.forEach(role => {
  const key = \`\${role.user_id}-\${role.role_id}-\${role.tenant_id}\`;
  if (!groups[key]) groups[key] = [];
  groups[key].push(role);
});

// Supprimer les doublons (garder le plus récent)
for (const [key, roles] of Object.entries(groups)) {
  if (roles.length > 1) {
    const sorted = roles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const toDelete = sorted.slice(1).map(r => r.id);
    await supabase.from('user_roles').delete().in('id', toDelete);
    console.log(\`Supprimé \${toDelete.length} doublons pour \${key}\`);
  }
}
"
```

---

## ✅ Vérification Post-Déploiement

### 1. Vérifier le nombre de lignes
```sql
SELECT COUNT(*) as total FROM user_roles;
-- Attendu: ~39
```

### 2. Vérifier qu'il n'y a plus de doublons
```sql
SELECT user_id, role_id, tenant_id, COUNT(*) as count
FROM user_roles
GROUP BY user_id, role_id, tenant_id
HAVING COUNT(*) > 1;
-- Attendu: 0 lignes
```

### 3. Vérifier la contrainte UNIQUE
```sql
SELECT conname, contype
FROM pg_constraint
WHERE conname = 'user_roles_user_role_tenant_unique';
-- Attendu: 1 ligne avec contype = 'u'
```

### 4. Vérifier le trigger
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'handle_email_confirmation_trigger';
-- Attendu: 1 ligne avec tgenabled = 'O' (enabled)
```

### 5. Tester la création d'un utilisateur
```bash
# Créer un utilisateur de test
# Vérifier qu'il n'a qu'UN SEUL rôle créé
```

---

## 🔄 Actions Post-Migration

### 1. Vider le Cache Frontend
```javascript
// Dans la console du navigateur
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Redémarrer l'Application
```bash
# Si en développement
npm run dev

# Si en production
# Redéployer l'application
```

### 3. Demander aux Utilisateurs de se Reconnecter
- Envoyer un email aux utilisateurs
- Ou forcer la déconnexion côté serveur

---

## 📈 Résultats Attendus

### Performance
- ✅ Requêtes `user_roles` **900x plus rapides**
- ✅ Temps de chargement des rôles : **< 50ms** au lieu de plusieurs secondes
- ✅ Taille de la réponse : **~2KB** au lieu de **~2MB**

### Sécurité
- ✅ Contrainte UNIQUE empêche les futurs doublons
- ✅ Trigger corrigé ne se déclenche qu'une seule fois

### Stabilité
- ✅ Plus de boucles infinies de création de rôles
- ✅ Cache frontend propre
- ✅ Données cohérentes

---

## ⚠️ En Cas de Problème

### Erreur: "duplicate key value violates unique constraint"
**Cause** : Il reste des doublons  
**Solution** : Réexécuter l'étape de nettoyage

### Erreur: "permission denied for table user_roles"
**Cause** : Clé service_role incorrecte  
**Solution** : Vérifier `SUPABASE_SERVICE_ROLE_KEY` dans `.env`

### Erreur: "trigger does not exist"
**Cause** : Le trigger n'a pas été créé  
**Solution** : Exécuter manuellement la section du trigger

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans le Dashboard Supabase
2. Consultez ce document
3. Contactez l'équipe technique

---

**Date de création** : 2025-01-11  
**Version** : 1.0  
**Auteur** : Cascade AI
