# 🎨 Diagrammes de Flux d'Authentification

## 1️⃣ Flux de Connexion Initiale

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant App as Application
    participant Supabase as Supabase Auth
    participant LS as localStorage
    participant DB as Database

    U->>App: Entre email/password
    App->>Supabase: signInWithPassword()
    Supabase-->>App: access_token + refresh_token
    App->>LS: Sauvegarde tokens
    Note over LS: supabase.auth.token<br/>{access_token, refresh_token}
    App->>DB: SELECT profiles WHERE user_id
    DB-->>App: tenant_id, role, permissions
    App->>App: Cache dans tenantCache
    App-->>U: ✅ Connecté
```

---

## 2️⃣ Flux de Reconnexion Automatique (Après Fermeture)

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant Browser as Navigateur
    participant App as Application
    participant LS as localStorage
    participant Supabase as Supabase Auth
    participant DB as Database

    Note over U: Utilisateur revient<br/>3 jours plus tard
    
    U->>Browser: Ouvre l'application
    Browser->>App: Démarre App
    App->>LS: Lit supabase.auth.token
    LS-->>App: access_token (expiré) + refresh_token
    
    App->>App: Détecte access_token expiré
    App->>Supabase: Utilise refresh_token
    
    alt Refresh Token Valide
        Supabase-->>App: Nouveau access_token
        App->>LS: Met à jour tokens
        App->>DB: SELECT profiles
        DB-->>App: tenant_id, role
        App->>App: Cache dans tenantCache
        App-->>U: ✅ Connecté automatiquement
    else Refresh Token Expiré
        Supabase-->>App: Error 401
        App->>LS: Nettoie tokens
        App-->>U: ❌ Redirect → /login
    end
```

---

## 3️⃣ Refresh Token Automatique (Pendant Utilisation)

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant App as Application (active)
    participant Timer as Auto Refresh Timer
    participant Supabase as Supabase Auth
    participant LS as localStorage

    Note over U: Utilisateur travaille<br/>access_token va expirer
    
    Timer->>Timer: Détecte expiration proche<br/>(< 5 min)
    Timer->>Supabase: POST /auth/token<br/>(avec refresh_token)
    Supabase-->>Timer: Nouveau access_token
    Timer->>LS: Met à jour localStorage
    Timer->>App: Event: TOKEN_REFRESHED
    App->>App: console.log("Token rafraîchi")
    
    Note over U: Utilisateur ne remarque rien<br/>✅ Travail continue sans interruption
```

---

## 4️⃣ Architecture du Cache Tenant

```mermaid
graph TB
    subgraph "Application React"
        App[App.tsx]
        TenantProvider[TenantProvider]
        CompA[Component A]
        CompB[Component B]
        CompC[Component C]
    end
    
    subgraph "Cache Global (Singleton)"
        Cache[tenantCache<br/>{currentTenant, userMembership}]
    end
    
    subgraph "Base de Données"
        DB[(Supabase DB)]
    end
    
    App-->TenantProvider
    TenantProvider-->|Premier chargement|Cache
    Cache-->|Lit 1 fois|DB
    
    TenantProvider-->CompA
    TenantProvider-->CompB
    TenantProvider-->CompC
    
    CompA-->|Lecture instantanée|Cache
    CompB-->|Lecture instantanée|Cache
    CompC-->|Lecture instantanée|Cache
    
    style Cache fill:#90EE90
    style DB fill:#87CEEB
```

---

## 5️⃣ Comparaison des Deux Systèmes

```mermaid
graph LR
    subgraph "SYSTÈME 1 - Par Défaut ✅"
        A1[supabase client]
        A2[localStorage]
        A3[autoRefreshToken: true]
        A4[Session: 7+ jours]
        A5[✅ Reconnexion auto]
        
        A1-->A2
        A2-->A3
        A3-->A4
        A4-->A5
    end
    
    subgraph "SYSTÈME 2 - Strict ⚠️"
        B1[supabaseStrict client]
        B2[sessionStorage]
        B3[autoRefreshToken: false]
        B4[Session: 2 heures max]
        B5[❌ Déconnexion à fermeture]
        
        B1-->B2
        B2-->B3
        B3-->B4
        B4-->B5
    end
    
    style A5 fill:#90EE90
    style B5 fill:#FFB6C1
```

---

## 6️⃣ Cycle de Vie des Tokens

```mermaid
timeline
    title Durée de Vie d'une Session Utilisateur
    section Connexion Initiale
        T0 : Connexion réussie
           : access_token valide 1h
           : refresh_token valide 7j
    section Après 55 minutes
        T+55min : Auto-refresh déclenché
                : Nouveau access_token (1h)
                : refresh_token inchangé
    section Après 1 jour
        T+1j : Utilisateur ferme navigateur
             : localStorage conservé ✅
    section Après 3 jours
        T+3j : Utilisateur rouvre navigateur
             : Auto-refresh au démarrage
             : Nouveau access_token
             : ✅ Connexion automatique
    section Après 8 jours
        T+8j : refresh_token expiré
             : ❌ Déconnexion
             : Redirect → /login
```

---

## 7️⃣ Décisions de Sécurité

```mermaid
flowchart TD
    Start[Requête Authentifiée]
    CheckLS{localStorage<br/>contient token?}
    CheckExpiry{access_token<br/>expiré?}
    CheckRefresh{refresh_token<br/>valide?}
    UseToken[Utilise access_token]
    RefreshToken[Refresh automatique]
    Login[Redirect → /login]
    Success[✅ Requête Autorisée]
    
    Start-->CheckLS
    CheckLS-->|Non|Login
    CheckLS-->|Oui|CheckExpiry
    CheckExpiry-->|Non|UseToken
    CheckExpiry-->|Oui|CheckRefresh
    CheckRefresh-->|Oui|RefreshToken
    CheckRefresh-->|Non|Login
    UseToken-->Success
    RefreshToken-->UseToken
    
    style Success fill:#90EE90
    style Login fill:#FFB6C1
```

---

## 8️⃣ Performance du Cache Tenant

```mermaid
graph TB
    subgraph "Sans Cache (Avant)"
        SC1[Component A<br/>100ms DB query]
        SC2[Component B<br/>100ms DB query]
        SC3[Component C<br/>100ms DB query]
        SC4[Total: 300ms<br/>3 requêtes DB]
        
        SC1-->SC4
        SC2-->SC4
        SC3-->SC4
    end
    
    subgraph "Avec Cache (Actuel)"
        AC1[Component A<br/>100ms DB query<br/>→ Cache]
        AC2[Component B<br/>0ms lecture cache]
        AC3[Component C<br/>0ms lecture cache]
        AC4[Total: 100ms<br/>1 requête DB]
        
        AC1-->AC4
        AC2-->AC4
        AC3-->AC4
    end
    
    style SC4 fill:#FFB6C1
    style AC4 fill:#90EE90
```

---

## 9️⃣ Isolation Multi-Tenant

```mermaid
graph TD
    subgraph "Tenant A"
        TA[Tenant A<br/>tenant_id: aaa-111]
        UA1[User A1]
        UA2[User A2]
    end
    
    subgraph "Tenant B"
        TB[Tenant B<br/>tenant_id: bbb-222]
        UB1[User B1]
        UB2[User B2]
    end
    
    subgraph "Base de Données"
        DB[(Supabase DB)]
        RLS[Row Level Security]
    end
    
    UA1-->|tenant_id: aaa-111|RLS
    UA2-->|tenant_id: aaa-111|RLS
    UB1-->|tenant_id: bbb-222|RLS
    UB2-->|tenant_id: bbb-222|RLS
    
    RLS-->|Filtre automatique|DB
    DB-->|Données Tenant A|TA
    DB-->|Données Tenant B|TB
    
    style RLS fill:#FFD700
```

---

## 🔟 Événements d'Authentification

```mermaid
stateDiagram-v2
    [*] --> NotConnected: App démarre
    NotConnected --> Authenticating: signInWithPassword()
    Authenticating --> Connected: SIGNED_IN
    Connected --> Connected: TOKEN_REFRESHED<br/>(auto, transparent)
    Connected --> NotConnected: SIGNED_OUT
    Connected --> SessionExpired: refresh_token expiré
    SessionExpired --> NotConnected: Redirect /login
    
    note right of Connected
        État principal
        Durée: 7+ jours
        Survit fermeture navigateur
    end note
    
    note right of NotConnected
        localStorage vide
        ou tokens expirés
    end note
```

---

## 1️⃣1️⃣ Gestion des Erreurs d'Authentification

```mermaid
flowchart TD
    Start[Tentative d'accès ressource]
    Auth{Utilisateur<br/>authentifié?}
    TokenValid{Token<br/>valide?}
    RefreshValid{Refresh<br/>possible?}
    TenantValid{Tenant<br/>existe?}
    PermValid{Permission<br/>OK?}
    Success[✅ Accès autorisé]
    
    Error401[❌ 401 Unauthorized<br/>→ /login]
    Error403[❌ 403 Forbidden<br/>Permission refusée]
    Error404[❌ 404 Not Found<br/>Tenant inexistant]
    
    Start-->Auth
    Auth-->|Non|Error401
    Auth-->|Oui|TokenValid
    TokenValid-->|Non|RefreshValid
    TokenValid-->|Oui|TenantValid
    RefreshValid-->|Non|Error401
    RefreshValid-->|Oui|TokenValid
    TenantValid-->|Non|Error404
    TenantValid-->|Oui|PermValid
    PermValid-->|Non|Error403
    PermValid-->|Oui|Success
    
    style Success fill:#90EE90
    style Error401 fill:#FFB6C1
    style Error403 fill:#FFB6C1
    style Error404 fill:#FFB6C1
```

---

## 1️⃣2️⃣ Optimisation des Re-renders

```mermaid
graph TB
    subgraph "Problème Initial"
        P1[App.tsx: 37 renders]
        P2[TenantContext: Re-fetch constant]
        P3[Composants enfants: Re-renders cascade]
        P4[Performance: 787ms moyen]
        
        P1-->P2-->P3-->P4
    end
    
    subgraph "Solution Implémentée"
        S1[Cache singleton global]
        S2[React.memo sur composants]
        S3[useStableCallback pour callbacks]
        S4[Vérification cache avant fetch]
        S5[Performance: ~100ms ⚡]
        
        S1-->S2-->S3-->S4-->S5
    end
    
    style P4 fill:#FFB6C1
    style S5 fill:#90EE90
```

---

## 📊 Légende

```mermaid
graph LR
    A[Composant/Processus]
    B[(Base de Données)]
    C{Décision}
    D[Résultat Succès]
    E[Résultat Erreur]
    
    style A fill:#87CEEB
    style B fill:#87CEEB
    style C fill:#FFD700
    style D fill:#90EE90
    style E fill:#FFB6C1
```

---

## 🎯 Comment Lire Ces Diagrammes

### **Diagrammes de Séquence** (1, 2, 3)
- Montrent l'ordre chronologique des événements
- Flèches : Messages entre composants
- Notes : Informations contextuelles

### **Graphes de Flux** (4, 5, 8, 9)
- Montrent l'architecture et les relations
- Flèches : Flux de données
- Couleurs : État (vert = OK, rouge = erreur)

### **Diagrammes de Décision** (7, 11)
- Montrent la logique conditionnelle
- Losanges : Points de décision
- Rectangles : Actions

### **Timeline** (6)
- Montre l'évolution temporelle
- Sections : Phases de la session
- Événements : Points clés

### **Diagramme d'États** (10)
- Montre les états possibles du système
- Transitions : Événements déclencheurs
- Notes : Détails sur les états

---

**Pour visualiser ces diagrammes** :
1. Copier le code Mermaid
2. Coller dans : https://mermaid.live/
3. Ou utiliser extension VSCode : "Markdown Preview Mermaid Support"

---

**Date** : 29 Octobre 2025  
**Format** : Mermaid.js  
**Documentation** : https://mermaid.js.org/
