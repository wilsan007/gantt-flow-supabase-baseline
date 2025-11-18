import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Slide = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  tagline: string;
};

const slides: Slide[] = [
  {
    id: 'collaboration',
    image: '/illustrations/loading-collaboration.svg',
    tagline: 'Collaboration',
    title: 'Collaborez simplement sur chaque projet',
    subtitle: 'Centralisez tâches, équipes et priorités au même endroit pour une gestion optimale.',
  },
  {
    id: 'recurring',
    image: '/illustrations/loading-recurring-activities.svg',
    tagline: 'Activités Récurrentes',
    title: 'Maîtrisez vos activités récurrentes',
    subtitle:
      'Réunions hebdomadaires, suivis mensuels, routines opérationnelles : tout est planifié et automatisé.',
  },
  {
    id: 'analytics',
    image: '/illustrations/loading-analytics.svg',
    tagline: 'Performance',
    title: 'Visualisez la performance en temps réel',
    subtitle: 'Projets, activités et ressources humaines : des indicateurs clairs et actionnables.',
  },
  {
    id: 'hr',
    image: '/illustrations/loading-hr.svg',
    tagline: 'Ressources Humaines',
    title: 'Prenez soin de vos équipes',
    subtitle: 'Absences, compétences, objectifs et formations réunis dans un seul système intégré.',
  },
  {
    id: 'workload',
    image: '/illustrations/loading-workload.svg',
    tagline: 'Charge de Travail',
    title: "Équilibrez la charge avant qu'il ne soit trop tard",
    subtitle:
      'Repérez les surcharges, redistribuez les tâches et protégez vos équipes efficacement.',
  },
  {
    id: 'security',
    image: '/illustrations/loading-security.svg',
    tagline: 'Sécurité',
    title: 'Chaque organisation, son espace sécurisé',
    subtitle: 'Multi-tenant, RLS et permissions fines : vos données restent à leur place.',
  },
];

interface BrandedLoadingScreenProps {
  appName?: string;
  logoSrc?: string;
  loopDelayMs?: number;
  showProgress?: boolean;
}

export function BrandedLoadingScreen({
  appName = 'Wadashaqayn',
  logoSrc = '/logo-w.svg',
  loopDelayMs = 3000,
  showProgress = true,
}: BrandedLoadingScreenProps) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setIndex(prev => (prev + 1) % slides.length);
    }, loopDelayMs);

    return () => clearInterval(slideInterval);
  }, [loopDelayMs]);

  useEffect(() => {
    if (!showProgress) return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 100 / (loopDelayMs / 50);
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, [loopDelayMs, showProgress, index]);

  const current = slides[index];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-50">
      {/* Background animated gradient */}
      <div className="animate-gradient-shift absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />

      {/* Animated orbs in background */}
      <motion.div
        className="absolute top-20 left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="relative z-10 w-full max-w-6xl px-6">
        {/* Logo / Nom de l'app */}
        <div className="mb-12 flex items-center justify-center gap-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {logoSrc ? (
              <motion.img
                src={logoSrc}
                alt={appName}
                className="h-14 w-14 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <motion.div
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/50"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <span className="text-2xl font-bold tracking-tight">W</span>
              </motion.div>
            )}

            {/* Animated ring around logo */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-indigo-400/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          <div className="flex flex-col">
            <motion.span
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent"
            >
              {appName}
            </motion.span>
            <motion.span
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 text-sm text-slate-400"
            >
              <motion.span
                className="inline-block h-2 w-2 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              Chargement de votre espace sécurisé…
            </motion.span>
          </div>
        </div>

        {/* Zone illustration + texte */}
        <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:gap-16">
          {/* Illustration */}
          <div className="flex w-full items-center justify-center lg:w-1/2">
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={current.id}
                  src={current.image}
                  alt={current.title}
                  initial={{ opacity: 0, y: 20, scale: 0.9, rotate: -5 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9, rotate: 5 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="max-h-80 w-auto drop-shadow-[0_0_60px_rgba(99,102,241,0.4)]"
                  onError={e => {
                    // Fallback si l'image n'existe pas
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </AnimatePresence>

              {/* Glow effect behind illustration */}
              <motion.div
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 blur-3xl"
                animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>
          </div>

          {/* Texte */}
          <div className="w-full text-center lg:w-1/2 lg:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id + '-text'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                {/* Tagline badge */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2 text-sm font-medium text-indigo-300 ring-1 ring-indigo-400/30 backdrop-blur-sm"
                >
                  <motion.span
                    className="h-2 w-2 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  {current.tagline}
                </motion.div>

                {/* Title */}
                <h2 className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-3xl leading-tight font-bold text-transparent lg:text-4xl">
                  {current.title}
                </h2>

                {/* Subtitle */}
                <p className="max-w-xl text-base leading-relaxed text-slate-300 lg:text-lg">
                  {current.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="mt-8 flex items-center justify-center gap-2 lg:justify-start">
              {slides.map((slide, i) => (
                <motion.button
                  key={slide.id}
                  onClick={() => setIndex(i)}
                  className={
                    'relative h-2 cursor-pointer rounded-full transition-all ' +
                    (i === index
                      ? 'w-10 bg-indigo-400'
                      : 'w-2 bg-slate-600/70 hover:bg-slate-500/70')
                  }
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Aller à ${slide.tagline}`}
                >
                  {i === index && showProgress && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-indigo-300"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Optimisation de vos projets, activités et ressources humaines…
          </p>
        </motion.div>
      </div>
    </div>
  );
}
