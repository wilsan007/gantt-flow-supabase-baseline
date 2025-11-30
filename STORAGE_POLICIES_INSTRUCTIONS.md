# Instructions pour créer les Storage Policies

## Méthode 1: Via le Dashboard Supabase (Recommandé)

1. Allez sur **Supabase Dashboard** → **Storage** → **action-attachments**
2. Cliquez sur **Policies** dans le menu latéral
3. Créez 4 nouvelles policies:

### Policy 1: SELECT (Lecture)

- **Name:** Users can view action attachments in their tenant
- **Policy command:** SELECT
- **Target roles:** authenticated
- **USING expression:**

```sql
(bucket_id = 'action-attachments')
AND (
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text
    FROM profiles
    WHERE user_id = auth.uid()
  )
)
```

### Policy 2: INSERT (Upload)

- **Name:** Users can upload action attachments to their tenant
- **Policy command:** INSERT
- **Target roles:** authenticated
- **WITH CHECK expression:**

```sql
(bucket_id = 'action-attachments')
AND (
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text
    FROM profiles
    WHERE user_id = auth.uid()
  )
)
```

### Policy 3: UPDATE (Modification)

- **Name:** Users can update their own action attachments
- **Policy command:** UPDATE
- **Target roles:** authenticated
- **USING expression:**

```sql
(bucket_id = 'action-attachments')
AND (
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text
    FROM profiles
    WHERE user_id = auth.uid()
  )
)
AND (owner = auth.uid())
```

### Policy 4: DELETE (Suppression)

- **Name:** Users can delete action attachments in their tenant
- **Policy command:** DELETE
- **Target roles:** authenticated
- **USING expression:**

```sql
(bucket_id = 'action-attachments')
AND (
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text
    FROM profiles
    WHERE user_id = auth.uid()
  )
)
AND (
  owner = auth.uid()
  OR public.is_super_admin()
)
```

## Méthode 2: Solution temporaire (Public)

Si vous voulez tester rapidement sans sécurité, exécutez dans le **SQL Editor**:

```sql
UPDATE storage.buckets
SET public = true
WHERE id = 'action-attachments';
```

⚠️ **ATTENTION:** Ceci rend tous les fichiers accessibles publiquement. Ne pas utiliser en production!

## Vérification

Après avoir créé les policies, testez l'upload. Si ça fonctionne:

- ✅ Les policies sont correctement configurées
- 🔒 Vos fichiers sont sécurisés par tenant

Si l'erreur persiste:

1. Vérifiez que votre utilisateur a bien un `tenant_id` dans la table `profiles`
2. Vérifiez les logs Supabase pour plus de détails
