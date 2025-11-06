# 🚀 Wadashaqeen SaaS - Enterprise Project Management

[![CI/CD Pipeline](https://github.com/YOUR_USERNAME/gantt-flow-next/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/YOUR_USERNAME/gantt-flow-next/actions/workflows/ci-cd.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e.svg)](https://supabase.com/)

Plateforme SaaS multi-tenant de gestion de projet et RH avec architecture Enterprise-grade.

## ✨ **Fonctionnalités**

### 📊 **Gestion de Projet**
- **3 Vues Synchronisées** : Table Dynamique, Gantt, Kanban
- **Rotation Paysage Intelligente** : Optimisation mobile/tablette automatique
- **Hiérarchie des Tâches** : Support des sous-tâches et dépendances
- **Filtrage Temps Réel** : Recherche, statut, priorité, assignation

### 👥 **Ressources Humaines**
- **Gestion des Congés** : Workflow d'approbation complet
- **Timesheet Hebdomadaire** : Suivi du temps de travail
- **Notes de Frais** : Gestion et approbation des dépenses
- **Formations & Compétences** : Catalogue et suivi
- **Télétravail** : Demandes et validation

### 🔒 **Sécurité**
- **Multi-Tenant** : Isolation stricte des données par organisation
- **RBAC** : Contrôle d'accès basé sur les rôles (8 rôles)
- **Row-Level Security** : Filtrage au niveau base de données
- **Super Admin** : Gestion cross-tenant sécurisée

### 📱 **Responsive**
- **Score 95/100** : Optimisation complète mobile/tablette/desktop
- **Progressive Enhancement** : Adaptation intelligente par appareil
- **Préférences Utilisateur** : Configuration de l'orientation sauvegardée

## 🛠️ **Stack Technique**

### **Frontend**
- **React 18.3** avec TypeScript 5.5
- **Vite 5.4** - Build ultra-rapide (<21s)
- **TailwindCSS** - Design system moderne
- **shadcn/ui** - Composants UI premium
- **React Router** - Navigation SPA
- **Lucide React** - Icônes modernes

### **Backend**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Base de données relationnelle
- **Row-Level Security** - Sécurité native
- **Edge Functions** - Serverless Functions
- **Realtime** - WebSocket subscriptions

### **État & Cache**
- **React Query** - Server state management
- **Cache Intelligent** - TTL adaptatif (3-5 min)
- **Optimistic Updates** - UX instantanée
- **Abort Controllers** - Performance optimale

## 🚀 **Démarrage Rapide**

### **Prérequis**
```bash
Node.js >= 18.x
npm >= 9.x
```

### **Installation**
```bash
# Cloner le repo
git clone https://github.com/YOUR_USERNAME/gantt-flow-next.git
cd gantt-flow-next

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase
```

### **Développement**
```bash
# Démarrer le serveur de développement
npm run dev

# Ouvrir http://localhost:8080
```

### **Build Production**
```bash
# Build optimisé
npm run build

# Preview du build
npm run preview
```

## 📦 **Scripts Disponibles**

```bash
npm run dev          # Serveur de développement (port 8080)
npm run build        # Build production TypeScript + Vite
npm run preview      # Preview du build production
npm run lint         # Linter ESLint
```

## 🏗️ **Architecture**

### **Patterns Implémentés**
- ✅ **Stripe** - Cache intelligent + Query filtering
- ✅ **Salesforce** - Isolation tenant + Métriques
- ✅ **Monday.com** - Types robustes + UX moderne
- ✅ **Linear** - Abort controllers + Performance
- ✅ **Notion** - Pagination + Filtres avancés

### **Structure du Projet**
```
src/
├── components/       # Composants React
│   ├── tasks/       # Gestion des tâches
│   ├── hr/          # Module RH
│   ├── projects/    # Gestion de projets
│   ├── ui/          # Composants UI shadcn
│   └── layout/      # Layout & Navigation
├── hooks/           # Custom React Hooks
├── lib/             # Utilitaires & Helpers
├── pages/           # Pages React Router
├── types/           # Types TypeScript
└── integrations/    # Intégrations externes
    └── supabase/    # Client Supabase
```

## 🔐 **Rôles & Permissions**

| Rôle | Description | Accès |
|------|-------------|-------|
| **Super Admin** | Administration globale | Cross-tenant |
| **Tenant Admin** | Admin organisation | Full tenant |
| **HR Manager** | Gestion RH | Module RH + Employés |
| **Project Manager** | Gestion projets | Projets assignés |
| **Team Lead** | Chef d'équipe | Équipe + Tâches |
| **Employee** | Employé standard | Tâches assignées + RH self-service |

## 📊 **Performance**

### **Métriques Build**
- **Build Time**: ~21s
- **Bundle Size**: 446 KB (123 KB gzipped)
- **Modules**: 3223 transformés
- **TypeScript**: 0 erreurs

### **Optimisations**
- ✅ Code splitting automatique
- ✅ Tree shaking activé
- ✅ CSS minification
- ✅ Asset optimization
- ✅ Cache intelligent

## 🧪 **CI/CD**

### **GitHub Actions**
- ✅ Tests TypeScript automatiques
- ✅ Build multi-versions (Node 18, 20)
- ✅ Security audit npm
- ✅ Bundle size tracking
- ✅ Artifacts upload

### **Workflow**
```yaml
Push/PR → Type Check → Build → Security Audit → Deploy Preview
```

## 🤝 **Contribution**

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 **License**

Ce projet est sous licence privée. © 2025 Wadashaqeen SaaS

## 👥 **Équipe**

- **Product Owner** - Gestion produit
- **Tech Lead** - Architecture & Development
- **UI/UX Designer** - Design & Expérience utilisateur

## 📞 **Support**

Pour toute question ou support :
- 📧 Email: support@wadashaqeen.com
- 💬 Discord: [Lien Discord]
- 📚 Documentation: [Lien Documentation]

---

**Made with ❤️ using React, TypeScript & Supabase**
