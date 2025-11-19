import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  Users,
  BarChart3,
  Shield,
  Clock,
  Globe,
  Menu,
  X,
  CreditCard,
  Mail,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Module Card Component
interface ModuleCardProps {
  icon: string;
  title: string;
  description: string;
  status: 'Disponible' | 'Bientôt';
  color: string;
}

function ModuleCard({ icon, title, description, status, color }: ModuleCardProps) {
  return (
    <div
      className={`group min-w-[280px] flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br shadow-xl transition-all hover:scale-105 hover:shadow-2xl sm:min-w-[320px] md:min-w-[380px] ${color}`}
    >
      <div className="p-6 sm:p-8">
        <div className="mb-4 flex items-start justify-between sm:mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl backdrop-blur-sm sm:h-20 sm:w-20 sm:text-5xl">
            {icon}
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold sm:px-4 sm:py-2 ${
              status === 'Disponible' ? 'bg-white/90 text-green-700' : 'bg-white/60 text-orange-700'
            }`}
          >
            {status}
          </span>
        </div>
        <h3 className="mb-2 text-xl font-bold text-white sm:mb-3 sm:text-2xl">{title}</h3>
        <p className="text-sm leading-relaxed text-white/90 sm:text-base">{description}</p>
      </div>
      <div className="h-2 w-full bg-white/20"></div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const pricingMultiplier = {
    monthly: 1,
    quarterly: 0.9, // 10% réduction
    yearly: 0.75, // 25% réduction
  };

  // Modules data for infinite carousel
  const modules = [
    {
      icon: '📊',
      title: 'Tableaux de bord',
      description: 'Visualisez vos KPIs en temps réel',
      status: 'Disponible' as const,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: '📋',
      title: 'Gestion de tâches',
      description: 'Organisez et suivez vos projets',
      status: 'Disponible' as const,
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: '📅',
      title: 'Vue Gantt',
      description: 'Planification visuelle de projets',
      status: 'Disponible' as const,
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: '🎯',
      title: 'Vue Kanban',
      description: 'Workflow agile et flexible',
      status: 'Disponible' as const,
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: '👥',
      title: 'Gestion RH',
      description: 'Équipes, absences, performances',
      status: 'Disponible' as const,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: '⏱️',
      title: 'Suivi du temps',
      description: 'Timesheet et pointage',
      status: 'Disponible' as const,
      color: 'from-teal-500 to-cyan-500',
    },
    {
      icon: '💰',
      title: 'Notes de frais',
      description: 'Gestion des dépenses',
      status: 'Disponible' as const,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: '🎓',
      title: 'Formation',
      description: 'Catalogue et suivi des formations',
      status: 'Disponible' as const,
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: '🤖',
      title: 'Automatisations',
      description: 'Workflows sans code',
      status: 'Bientôt' as const,
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: '📈',
      title: 'Analytics avancés',
      description: 'IA et prédictions',
      status: 'Bientôt' as const,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      icon: '🔔',
      title: 'Notifications',
      description: 'Alertes temps réel',
      status: 'Disponible' as const,
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: '📱',
      title: 'Application mobile',
      description: 'iOS et Android',
      status: 'Bientôt' as const,
      color: 'from-cyan-500 to-blue-500',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Animated Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute top-0 -left-4 h-96 w-96 rounded-full bg-purple-500 opacity-20 mix-blend-multiply blur-3xl filter"></div>
        <div className="animate-blob animation-delay-2000 absolute top-0 -right-4 h-96 w-96 rounded-full bg-cyan-500 opacity-20 mix-blend-multiply blur-3xl filter"></div>
        <div className="animate-blob animation-delay-4000 absolute -bottom-8 left-20 h-96 w-96 rounded-full bg-pink-500 opacity-20 mix-blend-multiply blur-3xl filter"></div>
      </div>
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-900/80 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/logo-w.svg" alt="Wadashaqayn" className="h-8 w-8" />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent md:text-xl">
              Wadashaqayn
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="font-medium text-gray-300 transition-colors hover:text-cyan-400"
            >
              Fonctionnalités
            </a>
            <a
              href="#solutions"
              className="font-medium text-gray-300 transition-colors hover:text-cyan-400"
            >
              Solutions
            </a>
            <a
              href="#pricing"
              className="font-medium text-gray-300 transition-colors hover:text-cyan-400"
            >
              Tarifs
            </a>
            <a
              href="#about"
              className="font-medium text-gray-300 transition-colors hover:text-cyan-400"
            >
              À propos
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden sm:block">
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
              >
                Se connecter
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button
                size="sm"
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-lg shadow-cyan-500/50 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-cyan-500/10 md:hidden"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-slate-900/95 backdrop-blur-xl md:hidden">
            <div className="container mx-auto flex flex-col gap-3 px-4 py-4">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-base font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                Fonctionnalités
              </a>
              <a
                href="#solutions"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-base font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                Solutions
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-base font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                Tarifs
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-base font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                À propos
              </a>
              <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                <Link to="/login" className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Se connecter
                  </Button>
                </Link>
                <Link to="/auth/signup" className="w-full">
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-lg shadow-cyan-500/50"
                  >
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-20 pb-10 text-center sm:pt-24 sm:pb-12 md:pt-32 md:pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse-subtle mb-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-3 py-1.5 text-xs font-medium text-cyan-300 shadow-lg shadow-cyan-500/20 backdrop-blur-sm sm:mb-4 sm:gap-2 md:mb-6 md:px-4 md:py-2 md:text-sm">
            <Zap className="h-3 w-3 text-cyan-400 md:h-4 md:w-4" />
            <span className="hidden sm:inline">La plateforme de gestion tout-en-un</span>
            <span className="sm:hidden">Gestion tout-en-un</span>
          </div>

          <h1 className="mb-3 px-2 text-2xl leading-tight font-bold text-white drop-shadow-2xl sm:mb-4 sm:text-3xl md:mb-6 md:text-5xl lg:text-6xl xl:text-7xl">
            Organisez vos projets sur{' '}
            <span className="animate-gradient bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              une plateforme unique
            </span>
          </h1>

          <p className="mb-6 px-4 text-base leading-relaxed text-gray-300 sm:mb-8 sm:text-xl md:text-2xl">
            Connectez de manière harmonieuse toutes vos données, équipes et processus sur une
            plateforme intuitive qui booste votre productivité.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 px-4 sm:flex-row sm:gap-4">
            <Link to="/auth/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="h-12 w-full transform bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 px-6 text-base font-bold shadow-2xl shadow-cyan-500/50 transition-all duration-300 hover:scale-105 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 hover:shadow-cyan-500/70 sm:h-14 sm:w-auto sm:px-8 sm:text-lg"
              >
                Démarrer gratuitement
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>

          <p className="mt-4 flex flex-wrap items-center justify-center gap-4 px-4 text-xs text-gray-400 sm:mt-6 sm:text-sm">
            <span className="flex items-center gap-1">
              <span className="text-green-400">✓</span> Essai gratuit de 14 jours
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-400">✓</span> Sans carte bancaire
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-400">✓</span> Configuration en 2 minutes
            </span>
          </p>

          {/* Badge Produit Local - Futuriste */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border-2 border-emerald-400/50 bg-gradient-to-r from-emerald-500/20 to-green-500/20 px-6 py-3 shadow-lg shadow-emerald-500/20 backdrop-blur-sm">
            <span className="text-3xl">🇩🇯</span>
            <div className="text-left">
              <p className="text-sm font-bold text-emerald-300">100% Produit Local</p>
              <p className="text-xs text-emerald-400">Conçu et développé à Djibouti</p>
            </div>
          </div>
        </div>

        {/* Hero Image / Dashboard Preview - Illustration Simple */}
        <div className="mt-8 overflow-hidden rounded-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 backdrop-blur-sm sm:mt-12 sm:rounded-2xl md:mt-16">
          <div className="border-t border-cyan-500/20 bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-6 backdrop-blur-xl sm:p-8 md:p-12">
            {/* Titre de l'aperçu */}
            <div className="mb-6 text-center sm:mb-8">
              <h3 className="mb-2 text-lg font-bold text-white sm:text-xl md:text-2xl">
                Aperçu de la plateforme
              </h3>
              <p className="text-sm text-gray-400 sm:text-base">
                Tableau de bord intuitif pour piloter votre activité
              </p>
            </div>

            {/* Grille de stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
              {/* Projets */}
              <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-5 shadow-lg backdrop-blur-md transition-all hover:shadow-cyan-500/20 sm:p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50 sm:h-12 sm:w-12">
                    <BarChart3 className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white sm:text-3xl">5</div>
                    <div className="text-xs text-cyan-300 sm:text-sm">Projets Actifs</div>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    style={{ width: '68%' }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-400">68% de progression moyenne</div>
              </div>

              {/* Tâches */}
              <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-5 shadow-lg backdrop-blur-md transition-all hover:shadow-emerald-500/20 sm:p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/50 sm:h-12 sm:w-12">
                    <CheckCircle2 className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white sm:text-3xl">127</div>
                    <div className="text-xs text-emerald-300 sm:text-sm">Tâches Terminées</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-400 sm:text-sm">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>+12% ce mois</span>
                </div>
              </div>

              {/* Équipe */}
              <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-5 shadow-lg backdrop-blur-md transition-all hover:shadow-purple-500/20 sm:p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg shadow-purple-500/50 sm:h-12 sm:w-12">
                    <Users className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white sm:text-3xl">24</div>
                    <div className="text-xs text-purple-300 sm:text-sm">Équipe Active</div>
                  </div>
                </div>
                <div className="text-xs text-purple-400 sm:text-sm">collaborateurs en ligne</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Sans emojis */}
      <section className="relative z-10 overflow-hidden py-10 sm:py-16 md:py-20 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10"></div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 md:gap-8">
            <div className="group rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-4 text-center backdrop-blur-sm transition-all hover:border-cyan-500/40 sm:p-6">
              <div className="mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-2xl font-bold text-transparent sm:mb-3 sm:text-3xl md:text-4xl lg:text-5xl">
                12+
              </div>
              <p className="text-xs font-medium text-gray-300 sm:text-sm md:text-base">
                Modules disponibles
              </p>
            </div>
            <div className="group rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 text-center backdrop-blur-sm transition-all hover:border-purple-500/40 sm:p-6">
              <div className="mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-2xl font-bold text-transparent sm:mb-3 sm:text-3xl md:text-4xl lg:text-5xl">
                99.9%
              </div>
              <p className="text-xs font-medium text-gray-300 sm:text-sm md:text-base">
                Disponibilité
              </p>
            </div>
            <div className="group rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-4 text-center backdrop-blur-sm transition-all hover:border-emerald-500/40 sm:p-6">
              <div className="mb-2 bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-2xl font-bold text-transparent sm:mb-3 sm:text-3xl md:text-4xl lg:text-5xl">
                2min
              </div>
              <p className="text-xs font-medium text-gray-300 sm:text-sm md:text-base">
                Configuration
              </p>
            </div>
            <div className="group rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4 text-center backdrop-blur-sm transition-all hover:border-orange-500/40 sm:p-6">
              <div className="mb-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-2xl font-bold text-transparent sm:mb-3 sm:text-3xl md:text-4xl lg:text-5xl">
                24/7
              </div>
              <p className="text-xs font-medium text-gray-300 sm:text-sm md:text-base">
                Support local
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Excellence Locale Section - Redesignée */}
      <section className="relative z-10 border-y border-cyan-500/20 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 py-10 backdrop-blur-sm sm:py-12 md:py-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="mb-6 text-center sm:mb-8">
            <h2 className="mb-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text px-2 text-2xl font-bold text-transparent sm:mb-3 sm:text-3xl">
              Une Solution 100% Locale, Une Expertise Internationale
            </h2>
            <p className="px-4 text-base text-gray-300 sm:text-lg">
              Faites confiance à l'excellence des compétences nationales
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            <div className="group rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6 text-center shadow-xl shadow-emerald-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/40 sm:rounded-2xl sm:p-8">
              <div className="mb-3 text-4xl sm:mb-4 sm:text-5xl">🇩🇯</div>
              <h3 className="mb-2 text-lg font-bold text-emerald-300 sm:text-xl">
                Développé à Djibouti
              </h3>
              <p className="text-sm text-gray-300 sm:text-base">
                Par des talents locaux, pour les entreprises djiboutiennes et au-delà
              </p>
            </div>

            <div className="group rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 text-center shadow-xl shadow-cyan-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40 sm:rounded-2xl sm:p-8">
              <div className="mb-3 text-4xl sm:mb-4 sm:text-5xl">🏆</div>
              <h3 className="mb-2 text-lg font-bold text-cyan-300 sm:text-xl">
                Expertise Nationale
              </h3>
              <p className="text-sm text-gray-300 sm:text-base">
                Innovation technologique portée par des compétences djiboutiennes qualifiées
              </p>
            </div>

            <div className="group rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 text-center shadow-xl shadow-purple-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-purple-500/40 sm:rounded-2xl sm:p-8">
              <div className="mb-3 text-4xl sm:mb-4 sm:text-5xl">💼</div>
              <h3 className="mb-2 text-lg font-bold text-purple-300 sm:text-xl">Support Local</h3>
              <p className="text-sm text-gray-300 sm:text-base">
                Assistance en français et arabe, adaptée à votre contexte culturel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 container mx-auto px-4 py-12 sm:py-16 md:py-20"
      >
        <div className="mb-10 text-center sm:mb-12 md:mb-16">
          <h2 className="mb-3 bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text px-2 text-3xl font-bold text-transparent sm:mb-4 sm:text-4xl md:text-5xl">
            Tout ce dont vous avez besoin pour réussir
          </h2>
          <p className="mx-auto max-w-2xl px-4 text-base text-gray-300 sm:text-xl">
            Une suite complète d'outils pour gérer vos projets, équipes et processus
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="group hover:border-primary rounded-xl border bg-white p-6 transition-all hover:shadow-xl sm:rounded-2xl sm:p-8">
            <div className="bg-primary/10 text-primary mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg sm:mb-4 sm:h-12 sm:w-12">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 sm:mb-3 sm:text-xl">
              Tableaux de bord intelligents
            </h3>
            <p className="text-sm text-gray-600 sm:text-base">
              Visualisez vos KPIs en temps réel avec des graphiques personnalisables et des rapports
              automatisés.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group hover:border-primary rounded-xl border bg-white p-6 transition-all hover:shadow-xl sm:rounded-2xl sm:p-8">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600 sm:mb-4 sm:h-12 sm:w-12">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 sm:mb-3 sm:text-xl">
              Collaboration d'équipe
            </h3>
            <p className="text-sm text-gray-600 sm:text-base">
              Centralisez toutes les communications, partagez des fichiers et travaillez ensemble en
              temps réel.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group hover:border-primary rounded-xl border bg-white p-6 transition-all hover:shadow-xl sm:rounded-2xl sm:p-8">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 sm:mb-4 sm:h-12 sm:w-12">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 sm:mb-3 sm:text-xl">
              Automatisations sans code
            </h3>
            <p className="text-sm text-gray-600 sm:text-base">
              Créez des workflows automatisés pour éliminer les tâches répétitives et gagner du
              temps.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group hover:border-primary rounded-xl border bg-white p-6 transition-all hover:shadow-xl sm:rounded-2xl sm:p-8">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 sm:mb-4 sm:h-12 sm:w-12">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 sm:mb-3 sm:text-xl">
              Suivi du temps intégré
            </h3>
            <p className="text-sm text-gray-600 sm:text-base">
              Suivez le temps passé sur chaque tâche, gérez les absences et optimisez la
              productivité.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group hover:border-primary rounded-xl border bg-white p-6 transition-all hover:shadow-xl sm:rounded-2xl sm:p-8">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 sm:mb-4 sm:h-12 sm:w-12">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 sm:mb-3 sm:text-xl">
              Sécurité entreprise
            </h3>
            <p className="text-sm text-gray-600 sm:text-base">
              Chiffrement des données, authentification 2FA et conformité RGPD pour protéger vos
              informations.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group hover:border-primary rounded-xl border bg-white p-6 transition-all hover:shadow-xl sm:rounded-2xl sm:p-8">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 sm:mb-4 sm:h-12 sm:w-12">
              <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 sm:mb-3 sm:text-xl">
              Multi-tenant & multi-langue
            </h3>
            <p className="text-sm text-gray-600 sm:text-base">
              Gérez plusieurs organisations avec des espaces isolés et profitez de l'interface en
              français.
            </p>
          </div>
        </div>
      </section>

      {/* Modules Carousel Section */}
      <section className="relative z-10 overflow-hidden border-y border-cyan-500/20 bg-gradient-to-b from-slate-900/50 to-slate-800/50 py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center sm:mb-10 md:mb-12">
            <h2 className="mb-3 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text px-2 text-3xl font-bold text-transparent sm:mb-4 sm:text-4xl md:text-5xl">
              Tous vos outils au même endroit
            </h2>
            <p className="mx-auto max-w-2xl px-4 text-base text-gray-300 sm:text-xl">
              Une plateforme complète qui évolue avec vos besoins
            </p>
          </div>

          {/* Infinite Scroll Container */}
          <div className="relative">
            {/* Gradient overlays pour fade effect - adaptés au fond sombre */}
            <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-24 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent sm:w-32"></div>
            <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-24 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent sm:w-32"></div>

            {/* Scrolling container - UN SEUL SET avec répétition des premières cartes à la fin */}
            <div className="animate-scroll-seamless flex gap-6">
              {/* Toutes les 12 cartes originales */}
              {modules.map((module, index) => (
                <ModuleCard
                  key={`original-${index}`}
                  icon={module.icon}
                  title={module.title}
                  description={module.description}
                  status={module.status}
                  color={module.color}
                />
              ))}
              {/* Répétition complète des 12 cartes pour garantir continuité parfaite */}
              {modules.map((module, index) => (
                <ModuleCard
                  key={`repeat-${index}`}
                  icon={module.icon}
                  title={module.title}
                  description={module.description}
                  status={module.status}
                  color={module.color}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section
        id="solutions"
        className="relative z-10 border-y border-purple-500/20 bg-gradient-to-br from-slate-900/95 to-slate-800/95 py-20"
      >
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Des solutions pour chaque équipe
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-300">
              De la gestion de projet aux RH, Wadashaqayn s'adapte à tous vos besoins
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {/* Solution 1 */}
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 sm:rounded-2xl sm:p-8">
              <h3 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                Gestion de projet
              </h3>
              <ul className="mb-6 space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                  <span className="text-gray-700">Vue Gantt pour planification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                  <span className="text-gray-700">Kanban pour workflow agile</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                  <span className="text-gray-700">Tableau dynamique personnalisable</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
              >
                En savoir plus
              </Button>
            </div>

            {/* Solution 2 */}
            <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-6 sm:rounded-2xl sm:p-8">
              <h3 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                Ressources Humaines
              </h3>
              <ul className="mb-6 space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <span className="text-gray-700">Gestion des absences</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <span className="text-gray-700">Suivi des compétences</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <span className="text-gray-700">Évaluations de performance</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
              >
                En savoir plus
              </Button>
            </div>

            {/* Solution 3 */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 sm:rounded-2xl sm:p-8">
              <h3 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                Analyse & Reporting
              </h3>
              <ul className="mb-6 space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <span className="text-gray-700">Tableaux de bord en temps réel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <span className="text-gray-700">Rapports automatisés</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <span className="text-gray-700">Prévisions intelligentes</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                En savoir plus
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
            Des tarifs adaptés à votre équipe
          </h2>
          <p className="mx-auto max-w-2xl px-4 text-base text-gray-300 sm:text-xl">
            Choisissez la formule qui correspond à la taille de votre entreprise
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-gray-100 p-1.5 sm:gap-3">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all sm:px-6 sm:py-2.5 sm:text-sm ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all sm:px-6 sm:py-2.5 sm:text-sm ${
                billingCycle === 'quarterly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Trimestriel
              <span className="ml-1 text-xs text-green-600 sm:ml-1.5">-10%</span>
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all sm:px-6 sm:py-2.5 sm:text-sm ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annuel
              <span className="ml-1 text-xs text-green-600 sm:ml-1.5">-25%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-4 px-2 sm:grid-cols-2 sm:gap-6 sm:px-0 md:gap-8 lg:grid-cols-4">
          {/* Plan Essai */}
          <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-5 sm:rounded-2xl sm:p-6 md:p-8">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">Essai Gratuit</h3>
              <p className="mt-1 text-xs text-gray-600 sm:mt-2 sm:text-sm">
                Testez toutes les fonctionnalités
              </p>
            </div>
            <div className="mb-4 sm:mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900 sm:text-5xl">0</span>
                <span className="text-xl font-semibold text-gray-600 sm:text-2xl">DJF</span>
              </div>
              <p className="mt-1 text-xs text-gray-600 sm:mt-2 sm:text-sm">14 jours gratuits</p>
            </div>
            <ul className="mb-6 space-y-2 sm:mb-8 sm:space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <span className="text-sm text-gray-700">Tous les modules disponibles</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <span className="text-sm text-gray-700">Jusqu'à 5 utilisateurs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <span className="text-sm text-gray-700">Support par email</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <span className="text-sm text-gray-700">Sans carte bancaire</span>
              </li>
            </ul>
            <Link to="/auth/signup" className="block">
              <Button className="w-full bg-green-600 hover:bg-green-700">Commencer l'essai</Button>
            </Link>
          </div>

          {/* Plan Petite Équipe */}
          <div className="rounded-xl border-2 border-blue-200 bg-white p-5 shadow-lg sm:rounded-2xl sm:p-6 md:p-8">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">Petite Équipe</h3>
              <p className="mt-1 text-xs text-gray-600 sm:mt-2 sm:text-sm">
                Jusqu'à 20 utilisateurs
              </p>
            </div>
            <div className="mb-4 sm:mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
                  {Math.round(25000 * pricingMultiplier[billingCycle]).toLocaleString()}
                </span>
                <span className="text-2xl font-semibold text-gray-600">DJF</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {billingCycle === 'monthly' && 'par mois'}
                {billingCycle === 'quarterly' && 'par trimestre'}
                {billingCycle === 'yearly' && 'par an'}
              </p>
            </div>
            <ul className="mb-8 space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <span className="text-sm text-gray-700">1-20 utilisateurs actifs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <span className="text-sm text-gray-700">Tous les modules</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <span className="text-sm text-gray-700">10 GB de stockage</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <span className="text-sm text-gray-700">Support prioritaire</span>
              </li>
            </ul>
            <a href="mailto:support@wadashaqayn.org" className="block">
              <Button
                variant="outline"
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Mail className="mr-2 h-4 w-4" />
                Contactez-nous
              </Button>
            </a>
          </div>

          {/* Plan Moyenne Équipe - POPULAIRE */}
          <div className="relative rounded-xl border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 p-5 shadow-xl sm:rounded-2xl sm:p-6 md:p-8">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 sm:-top-4">
              <span className="rounded-full bg-purple-500 px-3 py-0.5 text-xs font-bold text-white sm:px-4 sm:py-1">
                ⭐ POPULAIRE
              </span>
            </div>
            <div className="mt-2 mb-4 sm:mt-0 sm:mb-6">
              <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">Moyenne Équipe</h3>
              <p className="mt-1 text-xs text-gray-600 sm:mt-2 sm:text-sm">20 à 50 utilisateurs</p>
            </div>
            <div className="mb-4 sm:mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
                  {Math.round(60000 * pricingMultiplier[billingCycle]).toLocaleString()}
                </span>
                <span className="text-xl font-semibold text-gray-600 sm:text-2xl">DJF</span>
              </div>
              <p className="mt-1 text-xs text-gray-600 sm:mt-2 sm:text-sm">
                {billingCycle === 'monthly' && 'par mois'}
                {billingCycle === 'quarterly' && 'par trimestre'}
                {billingCycle === 'yearly' && 'par an'}
              </p>
            </div>
            <ul className="mb-6 space-y-2 sm:mb-8 sm:space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                <span className="text-sm text-gray-700">21-50 utilisateurs actifs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                <span className="text-sm text-gray-700">Tous les modules + API</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                <span className="text-sm text-gray-700">50 GB de stockage</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                <span className="text-sm text-gray-700">Support premium 24/7</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                <span className="text-sm text-gray-700">Formation personnalisée</span>
              </li>
            </ul>
            <a href="mailto:support@wadashaqayn.org" className="block">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Mail className="mr-2 h-4 w-4" />
                Contactez-nous
              </Button>
            </a>
          </div>

          {/* Plan Grande Équipe */}
          <div className="rounded-xl border-2 border-cyan-200 bg-white p-5 shadow-lg sm:rounded-2xl sm:p-6 md:p-8">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">Grande Équipe</h3>
              <p className="mt-1 text-xs text-gray-600 sm:mt-2 sm:text-sm">
                Plus de 50 utilisateurs
              </p>
            </div>
            <div className="mb-4 sm:mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900 sm:text-4xl">Sur mesure</span>
              </div>
              <p className="mt-1 text-xs text-gray-600 sm:mt-2 sm:text-sm">Tarif personnalisé</p>
            </div>
            <ul className="mb-6 space-y-2 sm:mb-8 sm:space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-600" />
                <span className="text-sm text-gray-700">Utilisateurs illimités</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-600" />
                <span className="text-sm text-gray-700">Modules personnalisés</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-600" />
                <span className="text-sm text-gray-700">Stockage illimité</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-600" />
                <span className="text-sm text-gray-700">Gestionnaire de compte dédié</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-600" />
                <span className="text-sm text-gray-700">SLA garanti</span>
              </li>
            </ul>
            <a href="mailto:support@wadashaqayn.org" className="block">
              <Button
                variant="outline"
                className="w-full border-cyan-600 text-cyan-600 hover:bg-cyan-50"
              >
                <Mail className="mr-2 h-4 w-4" />
                Demander un devis
              </Button>
            </a>
          </div>
        </div>

        {/* Moyens de Paiement */}
        <div className="mx-2 mt-8 rounded-xl border-2 border-gray-200 bg-white p-5 sm:mx-0 sm:mt-12 sm:rounded-2xl sm:p-6 md:mt-16 md:p-8">
          <div className="text-center">
            <h3 className="mb-4 text-lg font-bold text-gray-900 sm:mb-6 sm:text-xl md:text-2xl">
              Moyens de paiement acceptés
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              <div className="flex items-center gap-2 sm:gap-3">
                <CreditCard className="h-6 w-6 text-gray-600 sm:h-8 sm:w-8" />
                <span className="text-sm font-semibold text-gray-700 sm:text-base">
                  Carte Bancaire
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 p-1.5 sm:h-12 sm:w-12">
                  <img src="/waafi-logo.svg" alt="Waafi" className="h-full w-full object-contain" />
                </div>
                <span className="text-sm font-semibold text-gray-700 sm:text-base">Waafi</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 p-1.5 sm:h-12 sm:w-12">
                  <img
                    src="/dmoney-logo.svg"
                    alt="D-Money"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 sm:text-base">D-Money</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-6 border-t pt-6 sm:mt-8 sm:pt-8">
            <div className="text-center">
              <h4 className="mb-3 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
                Besoin d'aide pour choisir ?
              </h4>
              <p className="mb-4 px-4 text-sm text-gray-600 sm:mb-6 sm:text-base">
                Notre équipe est là pour vous accompagner
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <a href="mailto:support@wadashaqayn.org" className="inline-flex w-full sm:w-auto">
                  <Button variant="outline" className="w-full gap-2 text-xs sm:w-auto sm:text-sm">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">support@wadashaqayn.org</span>
                  </Button>
                </a>
                <a
                  href="https://wa.me/25377621524"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full sm:w-auto"
                >
                  <Button className="w-full gap-2 bg-green-600 text-xs hover:bg-green-700 sm:w-auto sm:text-sm">
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">WhatsApp: +253 77 62 15 24</span>
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 p-8 text-center text-white shadow-2xl shadow-cyan-500/30 sm:rounded-3xl sm:p-10 md:p-12 lg:p-16">
          <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
            Prêt à transformer votre façon de travailler ?
          </h2>
          <p className="mb-6 px-4 text-base opacity-90 sm:mb-8 sm:text-lg md:text-xl">
            Rejoignez les entreprises qui ont choisi Wadashaqayn
          </p>
          <div className="flex flex-col items-center justify-center gap-3 px-4 sm:gap-4">
            <Link to="/auth/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 w-full px-6 text-base shadow-lg hover:shadow-xl sm:h-14 sm:w-auto sm:px-8 sm:text-lg"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full border-2 border-white px-6 text-base text-white hover:bg-white hover:text-cyan-600 sm:h-14 sm:w-auto sm:px-8 sm:text-lg"
            >
              Contacter les ventes
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyan-500/20 bg-gradient-to-b from-slate-900 to-slate-950 py-10 text-gray-300 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
            {/* Column 1 */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <img src="/logo-w.svg" alt="Wadashaqayn" className="h-8 w-8 invert" />
                <span className="text-xl font-bold text-white">Wadashaqayn</span>
              </div>
              <p className="text-sm">
                La plateforme tout-en-un pour gérer vos projets, équipes et processus avec
                efficacité.
              </p>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Tarifs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Sécurité
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Intégrations
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Ressources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Guides
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Entreprise</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Carrières
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Partenaires
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 Wadashaqayn. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
