# 📌 Ajouter le Code de Vérification Google

## Quand Google vous donne un code comme :

```html
<meta name="google-site-verification" content="ABC123XYZ456" />
```

## Où l'ajouter :

**Fichier :** `index.html`

**Position :** Dans la section `<head>`, après la ligne 11

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />

    <!-- Favicons -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/svg+xml" href="/logo-w.svg" />
    <link rel="apple-touch-icon" sizes="180x180" href="/logo-w.svg" />

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- ⬇️ AJOUTEZ LE CODE GOOGLE ICI ⬇️ -->
    <meta name="google-site-verification" content="VOTRE_CODE_ICI" />
    <!-- ⬆️ AJOUTEZ LE CODE GOOGLE ICI ⬆️ -->

    <!-- Primary Meta Tags -->
    <title>Wadashaqayn - Gestion de Projets, RH & Collaboration | Plateforme Tout-en-Un</title>
    ...
  </head>
</html>
```

## Après avoir ajouté :

1. **Build** : `npm run build`
2. **Commit** : `git add -A && git commit -m "Ajout vérification Google Search Console"`
3. **Push** : `git push`
4. **Attendre 2-3 minutes** que Hostinger déploie
5. **Retourner sur Google Search Console** et cliquer "Vérifier"

---

## Alternative : Fichier HTML

Si Google vous donne un fichier `google123456789.html` :

1. Placez-le dans `/public/google123456789.html`
2. Build, commit, push
3. Vérifiez que le fichier est accessible : `https://wadashaqayn.org/google123456789.html`
4. Cliquez "Vérifier" sur Search Console
