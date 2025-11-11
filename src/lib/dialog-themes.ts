/**
 * 🎨 SYSTÈME DE THÈMES POUR DIALOGS
 *
 * Thèmes modernes et élégants par module
 * Inspirés de Linear, Notion, Monday.com, Slack
 *
 * Usage:
 * import { getDialogTheme } from '@/lib/dialog-themes';
 * const theme = getDialogTheme('tasks');
 */

export type DialogModule =
  | 'tasks' // Tâches
  | 'projects' // Projets
  | 'hr' // Ressources Humaines
  | 'operations' // Opérations
  | 'admin' // Administration
  | 'training' // Formation
  | 'analytics' // Analytics
  | 'settings'; // Paramètres

export interface DialogTheme {
  // Couleurs principales
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Gradients
  gradient: string;
  gradientHover: string;

  // Backgrounds
  headerBg: string;
  bodyBg: string;

  // Borders & Shadows
  border: string;
  shadow: string;

  // Icons & Badges
  iconColor: string;
  badgeBg: string;

  // États
  success: string;
  warning: string;
  error: string;

  // Animations
  transition: string;
}

/**
 * 🎨 Thèmes par Module
 * Pattern: Chaque module a sa propre identité visuelle
 */
export const dialogThemes: Record<DialogModule, DialogTheme> = {
  // 📋 TÂCHES - Bleu/Indigo (Productivité)
  tasks: {
    primary: 'rgb(59, 130, 246)', // blue-500
    primaryLight: 'rgb(96, 165, 250)', // blue-400
    primaryDark: 'rgb(37, 99, 235)', // blue-600
    gradient: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600',
    gradientHover: 'hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700',
    headerBg:
      'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50',
    bodyBg: 'bg-white dark:bg-zinc-900',
    border: 'border-blue-200 dark:border-blue-800',
    shadow: 'shadow-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // 📁 PROJETS - Violet/Purple (Innovation)
  projects: {
    primary: 'rgb(168, 85, 247)', // purple-500
    primaryLight: 'rgb(192, 132, 252)', // purple-400
    primaryDark: 'rgb(147, 51, 234)', // purple-600
    gradient: 'bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-600',
    gradientHover: 'hover:from-purple-600 hover:via-violet-600 hover:to-fuchsia-700',
    headerBg:
      'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50',
    bodyBg: 'bg-white dark:bg-zinc-900',
    border: 'border-purple-200 dark:border-purple-800',
    shadow: 'shadow-purple-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // 👥 RH - Vert/Emerald (Croissance)
  hr: {
    primary: 'rgb(16, 185, 129)', // emerald-500
    primaryLight: 'rgb(52, 211, 153)', // emerald-400
    primaryDark: 'rgb(5, 150, 105)', // emerald-600
    gradient: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600',
    gradientHover: 'hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700',
    headerBg:
      'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50',
    bodyBg: 'bg-white dark:bg-zinc-900',
    border: 'border-emerald-200 dark:border-emerald-800',
    shadow: 'shadow-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // ⚙️ OPÉRATIONS - Orange/Amber (Action)
  operations: {
    primary: 'rgb(245, 158, 11)', // amber-500
    primaryLight: 'rgb(251, 191, 36)', // amber-400
    primaryDark: 'rgb(217, 119, 6)', // amber-600
    gradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500',
    gradientHover: 'hover:from-amber-600 hover:via-orange-600 hover:to-red-600',
    headerBg:
      'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50',
    bodyBg: 'bg-white dark:bg-zinc-900',
    border: 'border-amber-200 dark:border-amber-800',
    shadow: 'shadow-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // 🛡️ ADMIN - Rouge/Rose (Pouvoir)
  admin: {
    primary: 'rgb(239, 68, 68)', // red-500
    primaryLight: 'rgb(248, 113, 113)', // red-400
    primaryDark: 'rgb(220, 38, 38)', // red-600
    gradient: 'bg-gradient-to-br from-red-500 via-rose-500 to-pink-600',
    gradientHover: 'hover:from-red-600 hover:via-rose-600 hover:to-pink-700',
    headerBg: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50',
    bodyBg: 'bg-white dark:bg-zinc-900',
    border: 'border-red-200 dark:border-red-800',
    shadow: 'shadow-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    badgeBg: 'bg-red-100 dark:bg-red-900/30',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // 🎓 FORMATION - Cyan/Sky (Apprentissage)
  training: {
    primary: 'rgb(6, 182, 212)', // cyan-500
    primaryLight: 'rgb(34, 211, 238)', // cyan-400
    primaryDark: 'rgb(8, 145, 178)', // cyan-600
    gradient: 'bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600',
    gradientHover: 'hover:from-cyan-600 hover:via-sky-600 hover:to-blue-700',
    headerBg: 'bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-950/50 dark:to-sky-950/50',
    bodyBg: 'bg-white dark:bg-zinc-900',
    border: 'border-cyan-200 dark:border-cyan-800',
    shadow: 'shadow-cyan-500/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // 📊 ANALYTICS - Slate/Gray (Données)
  analytics: {
    primary: 'rgb(100, 116, 139)', // slate-500
    primaryLight: 'rgb(148, 163, 184)', // slate-400
    primaryDark: 'rgb(71, 85, 105)', // slate-600
    gradient: 'bg-gradient-to-br from-slate-500 via-gray-500 to-zinc-600',
    gradientHover: 'hover:from-slate-600 hover:via-gray-600 hover:to-zinc-700',
    headerBg:
      'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50',
    bodyBg: 'bg-white dark:bg-zinc-900',
    border: 'border-slate-200 dark:border-slate-800',
    shadow: 'shadow-slate-500/20',
    iconColor: 'text-slate-600 dark:text-slate-400',
    badgeBg: 'bg-slate-100 dark:bg-slate-900/30',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // ⚙️ SETTINGS - Zinc/Neutral (Neutre)
  settings: {
    primary: 'rgb(113, 113, 122)', // zinc-500
    primaryLight: 'rgb(161, 161, 170)', // zinc-400
    primaryDark: 'rgb(82, 82, 91)', // zinc-600
    gradient: 'bg-gradient-to-br from-zinc-500 via-neutral-500 to-stone-600',
    gradientHover: 'hover:from-zinc-600 hover:via-neutral-600 hover:to-stone-700',
    headerBg:
      'bg-gradient-to-r from-zinc-50 to-neutral-50 dark:from-zinc-950/50 dark:to-neutral-950/50',
    bodyBg: 'bg-white dark:bg-zinc-900',
    border: 'border-zinc-200 dark:border-zinc-800',
    shadow: 'shadow-zinc-500/20',
    iconColor: 'text-zinc-600 dark:text-zinc-400',
    badgeBg: 'bg-zinc-100 dark:bg-zinc-900/30',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    transition: 'transition-all duration-300 ease-in-out',
  },
};

/**
 * Récupère le thème pour un module donné
 */
export const getDialogTheme = (module: DialogModule): DialogTheme => {
  return dialogThemes[module];
};

/**
 * Classe utilitaire pour appliquer un thème
 */
export const applyDialogTheme = (module: DialogModule) => {
  const theme = getDialogTheme(module);
  return {
    header: `${theme.headerBg} ${theme.border} border-b`,
    body: theme.bodyBg,
    button: `${theme.gradient} ${theme.gradientHover} text-white ${theme.transition}`,
    icon: theme.iconColor,
    badge: theme.badgeBg,
    shadow: theme.shadow,
  };
};
