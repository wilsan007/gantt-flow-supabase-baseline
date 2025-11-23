# 🔧 FIX: Double création utilisateur dans send-collaborator-invitation

## ❌ PROBLÈME IDENTIFIÉ :

Dans `send-collaborator-invitation/index.ts`, la logique actuelle est :

```
1. Générer Magic Link avec generateLink()
   → ⚠️ Crée automatiquement l'utilisateur dans auth.users
2. Créer l'invitation en base
3. Essayer de créer l'utilisateur avec createUser()
   → ❌ ERREUR: "email already exists"
4. Rollback: supprimer l'invitation
```

## ✅ SOLUTION :

Utiliser la même logique que `send-invitation` :

```
1. Créer l'invitation en base EN PREMIER
2. Vérifier si l'utilisateur existe dans auth.users
3. Si existe → Mettre à jour les metadata
4. Si n'existe pas → Créer avec createUser()
5. Générer Magic Link (ne créera pas de doublon car user existe déjà)
6. Envoyer email
```

## 📝 ORDRE CORRECT (comme send-invitation) :

1. ✅ **Créer invitation** → Récupérer l'ID réel
2. ✅ **Vérifier utilisateur existant** → listUsers()
3. ✅ **Créer/Mettre à jour utilisateur** → avec invitation_id réel
4. ✅ **Générer Magic Link** → aucune création, juste le token
5. ✅ **Mettre à jour invitation** → avec le token
6. ✅ **Envoyer email**

## 🔑 DIFFÉRENCE CLÉ :

- `generateLink()` **NE CRÉE PAS** d'utilisateur s'il existe déjà
- Donc l'ordre doit être : **CRÉER USER AVANT generateLink()**

## 🚀 À FAIRE :

Réorganiser `send-collaborator-invitation/index.ts` pour suivre exactement le même flux que `send-invitation/index.ts` :

1. Créer invitation
2. Créer/mettre à jour user
3. Générer link
4. Envoyer email

---

**Alternative rapide :** Copier la logique exacte de `send-invitation` et l'adapter pour collaborator.
