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
      className={`group min-w-[380px] flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br shadow-xl transition-all hover:scale-105 hover:shadow-2xl ${color}`}
    >
      <div className="p-8">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-5xl backdrop-blur-sm">
            {icon}
          </div>
          <span
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              status === 'Disponible' ? 'bg-white/90 text-green-700' : 'bg-white/60 text-orange-700'
            }`}
          >
            {status}
          </span>
        </div>
        <h3 className="mb-3 text-2xl font-bold text-white">{title}</h3>
        <p className="text-base leading-relaxed text-white/90">{description}</p>
      </div>
      <div className="h-2 w-full bg-white/20"></div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/logo-w.svg" alt="Wadashaqayn" className="h-8 w-8" />
            <span className="text-primary text-xl font-bold">Wadashaqayn</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="hover:text-primary text-sm font-medium text-gray-700">
              Fonctionnalités
            </a>
            <a href="#solutions" className="hover:text-primary text-sm font-medium text-gray-700">
              Solutions
            </a>
            <a href="#pricing" className="hover:text-primary text-sm font-medium text-gray-700">
              Tarifs
            </a>
            <a href="#about" className="hover:text-primary text-sm font-medium text-gray-700">
              À propos
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Se connecter
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm" className="from-primary bg-gradient-to-r to-cyan-500">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <Zap className="h-4 w-4" />
            La plateforme de gestion tout-en-un
          </div>

          <h1 className="mb-6 text-5xl leading-tight font-bold text-gray-900 md:text-6xl lg:text-7xl">
            Organisez vos projets sur{' '}
            <span className="from-primary bg-gradient-to-r to-cyan-500 bg-clip-text text-transparent">
              une plateforme unique
            </span>
          </h1>

          <p className="mb-8 text-xl text-gray-600 md:text-2xl">
            Connectez de manière harmonieuse toutes vos données, équipes et processus sur une
            plateforme intuitive qui booste votre productivité.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/auth/signup">
              <Button
                size="lg"
                className="from-primary h-14 bg-gradient-to-r to-cyan-500 px-8 text-lg shadow-xl hover:shadow-2xl"
              >
                Démarrer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            ✓ Essai gratuit de 14 jours · ✓ Sans carte bancaire · ✓ Configuration en 2 minutes
          </p>

          {/* Badge Produit Local */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border-2 border-green-200 bg-green-50 px-6 py-3">
            <span className="text-3xl">🇩🇯</span>
            <div className="text-left">
              <p className="text-sm font-bold text-green-900">100% Produit Local</p>
              <p className="text-xs text-green-700">Conçu et développé à Djibouti</p>
            </div>
          </div>
        </div>

        {/* Hero Image / Dashboard Preview */}
        <div className="mt-16 overflow-hidden rounded-2xl border-8 border-white shadow-2xl">
          <div className="from-primary/5 aspect-video bg-gradient-to-br to-cyan-500/5 p-8">
            <div className="grid h-full grid-cols-3 gap-4">
              {/* Mock Dashboard Cards */}
              <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg">
                <div className="mb-4 h-4 w-32 rounded bg-gray-200"></div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 h-10 w-10 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded bg-gray-200"></div>
                      <div className="h-3 w-2/3 rounded bg-gray-100"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded bg-gray-200"></div>
                      <div className="h-3 w-3/4 rounded bg-gray-100"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg bg-white p-4 shadow-lg">
                  <div className="mb-2 h-3 w-20 rounded bg-gray-200"></div>
                  <div className="from-primary h-8 w-full rounded bg-gradient-to-r to-cyan-500"></div>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-lg">
                  <div className="space-y-2">
                    <div className="h-2 rounded bg-gray-200"></div>
                    <div className="h-2 w-3/4 rounded bg-gray-100"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Excellence Locale Section */}
      <section className="border-y bg-gradient-to-r from-green-50 via-blue-50 to-cyan-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">
              Une Solution 100% Locale, Une Expertise Internationale
            </h2>
            <p className="text-lg text-gray-700">
              Faites confiance à l'excellence des compétences nationales
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
              <div className="mb-4 text-5xl">🇩🇯</div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Développé à Djibouti</h3>
              <p className="text-gray-600">
                Par des talents locaux, pour les entreprises djiboutiennes et au-delà
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
              <div className="mb-4 text-5xl">🏆</div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Expertise Nationale</h3>
              <p className="text-gray-600">
                Innovation technologique portée par des compétences djiboutiennes qualifiées
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
              <div className="mb-4 text-5xl">💼</div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Support Local</h3>
              <p className="text-gray-600">
                Assistance en français et arabe, adaptée à votre contexte culturel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Tout ce dont vous avez besoin pour réussir
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Une suite complète d'outils pour gérer vos projets, équipes et processus
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="group hover:border-primary rounded-2xl border bg-white p-8 transition-all hover:shadow-xl">
            <div className="bg-primary/10 text-primary mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">Tableaux de bord intelligents</h3>
            <p className="text-gray-600">
              Visualisez vos KPIs en temps réel avec des graphiques personnalisables et des rapports
              automatisés.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group hover:border-primary rounded-2xl border bg-white p-8 transition-all hover:shadow-xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">Collaboration d'équipe</h3>
            <p className="text-gray-600">
              Centralisez toutes les communications, partagez des fichiers et travaillez ensemble en
              temps réel.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group hover:border-primary rounded-2xl border bg-white p-8 transition-all hover:shadow-xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">Automatisations sans code</h3>
            <p className="text-gray-600">
              Créez des workflows automatisés pour éliminer les tâches répétitives et gagner du
              temps.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group hover:border-primary rounded-2xl border bg-white p-8 transition-all hover:shadow-xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">Suivi du temps intégré</h3>
            <p className="text-gray-600">
              Suivez le temps passé sur chaque tâche, gérez les absences et optimisez la
              productivité.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group hover:border-primary rounded-2xl border bg-white p-8 transition-all hover:shadow-xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">Sécurité entreprise</h3>
            <p className="text-gray-600">
              Chiffrement des données, authentification 2FA et conformité RGPD pour protéger vos
              informations.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group hover:border-primary rounded-2xl border bg-white p-8 transition-all hover:shadow-xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">Multi-tenant & multi-langue</h3>
            <p className="text-gray-600">
              Gérez plusieurs organisations avec des espaces isolés et profitez de l'interface en
              français.
            </p>
          </div>
        </div>
      </section>

      {/* Modules Carousel Section */}
      <section className="overflow-hidden bg-gradient-to-b from-white to-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Tous vos outils au même endroit
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              Une plateforme complète qui évolue avec vos besoins
            </p>
          </div>

          {/* Infinite Scroll Container */}
          <div className="relative">
            {/* Gradient overlays pour fade effect */}
            <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-32 bg-gradient-to-r from-white to-transparent"></div>
            <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-32 bg-gradient-to-l from-white to-transparent"></div>

            {/* Scrolling container */}
            <div className="animate-scroll flex gap-6">
              {/* First set of cards */}
              <ModuleCard
                icon="📊"
                title="Tableaux de bord"
                description="Visualisez vos KPIs en temps réel"
                status="Disponible"
                color="from-blue-500 to-cyan-500"
              />
              <ModuleCard
                icon="📋"
                title="Gestion de tâches"
                description="Organisez et suivez vos projets"
                status="Disponible"
                color="from-purple-500 to-pink-500"
              />
              <ModuleCard
                icon="📅"
                title="Vue Gantt"
                description="Planification visuelle de projets"
                status="Disponible"
                color="from-green-500 to-emerald-500"
              />
              <ModuleCard
                icon="🎯"
                title="Vue Kanban"
                description="Workflow agile et flexible"
                status="Disponible"
                color="from-orange-500 to-red-500"
              />
              <ModuleCard
                icon="👥"
                title="Gestion RH"
                description="Équipes, absences, performances"
                status="Disponible"
                color="from-indigo-500 to-purple-500"
              />
              <ModuleCard
                icon="⏱️"
                title="Suivi du temps"
                description="Timesheet et pointage"
                status="Disponible"
                color="from-teal-500 to-cyan-500"
              />
              <ModuleCard
                icon="💰"
                title="Notes de frais"
                description="Gestion des dépenses"
                status="Disponible"
                color="from-yellow-500 to-orange-500"
              />
              <ModuleCard
                icon="🎓"
                title="Formation"
                description="Catalogue et suivi des formations"
                status="Disponible"
                color="from-pink-500 to-rose-500"
              />
              <ModuleCard
                icon="🤖"
                title="Automatisations"
                description="Workflows sans code"
                status="Bientôt"
                color="from-violet-500 to-purple-500"
              />
              <ModuleCard
                icon="📈"
                title="Analytics avancés"
                description="IA et prédictions"
                status="Bientôt"
                color="from-blue-600 to-indigo-600"
              />
              <ModuleCard
                icon="🔔"
                title="Notifications"
                description="Alertes temps réel"
                status="Disponible"
                color="from-red-500 to-pink-500"
              />
              <ModuleCard
                icon="📱"
                title="Application mobile"
                description="iOS et Android"
                status="Bientôt"
                color="from-cyan-500 to-blue-500"
              />

              {/* Duplicate set for infinite scroll */}
              <ModuleCard
                icon="📊"
                title="Tableaux de bord"
                description="Visualisez vos KPIs en temps réel"
                status="Disponible"
                color="from-blue-500 to-cyan-500"
              />
              <ModuleCard
                icon="📋"
                title="Gestion de tâches"
                description="Organisez et suivez vos projets"
                status="Disponible"
                color="from-purple-500 to-pink-500"
              />
              <ModuleCard
                icon="📅"
                title="Vue Gantt"
                description="Planification visuelle de projets"
                status="Disponible"
                color="from-green-500 to-emerald-500"
              />
              <ModuleCard
                icon="🎯"
                title="Vue Kanban"
                description="Workflow agile et flexible"
                status="Disponible"
                color="from-orange-500 to-red-500"
              />
              <ModuleCard
                icon="👥"
                title="Gestion RH"
                description="Équipes, absences, performances"
                status="Disponible"
                color="from-indigo-500 to-purple-500"
              />
              <ModuleCard
                icon="⏱️"
                title="Suivi du temps"
                description="Timesheet et pointage"
                status="Disponible"
                color="from-teal-500 to-cyan-500"
              />
              <ModuleCard
                icon="💰"
                title="Notes de frais"
                description="Gestion des dépenses"
                status="Disponible"
                color="from-yellow-500 to-orange-500"
              />
              <ModuleCard
                icon="🎓"
                title="Formation"
                description="Catalogue et suivi des formations"
                status="Disponible"
                color="from-pink-500 to-rose-500"
              />
              <ModuleCard
                icon="🤖"
                title="Automatisations"
                description="Workflows sans code"
                status="Bientôt"
                color="from-violet-500 to-purple-500"
              />
              <ModuleCard
                icon="📈"
                title="Analytics avancés"
                description="IA et prédictions"
                status="Bientôt"
                color="from-blue-600 to-indigo-600"
              />
              <ModuleCard
                icon="🔔"
                title="Notifications"
                description="Alertes temps réel"
                status="Disponible"
                color="from-red-500 to-pink-500"
              />
              <ModuleCard
                icon="📱"
                title="Application mobile"
                description="iOS et Android"
                status="Bientôt"
                color="from-cyan-500 to-blue-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Des solutions pour chaque équipe
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              De la gestion de projet aux RH, Wadashaqayn s'adapte à tous vos besoins
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Solution 1 */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-8">
              <h3 className="mb-4 text-2xl font-bold text-gray-900">Gestion de projet</h3>
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
            <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-8">
              <h3 className="mb-4 text-2xl font-bold text-gray-900">Ressources Humaines</h3>
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
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-8">
              <h3 className="mb-4 text-2xl font-bold text-gray-900">Analyse & Reporting</h3>
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

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="from-primary rounded-3xl bg-gradient-to-r to-cyan-500 p-12 text-center text-white md:p-16">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Prêt à transformer votre façon de travailler ?
          </h2>
          <p className="mb-8 text-xl opacity-90">
            Rejoignez les entreprises qui ont choisi Wadashaqayn
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/auth/signup">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="hover:text-primary h-14 border-white px-8 text-lg text-white hover:bg-white"
            >
              Contacter les ventes
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-900 py-12 text-gray-300">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
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
