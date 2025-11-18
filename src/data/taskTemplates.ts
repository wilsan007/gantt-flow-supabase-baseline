/**
 * 🎯 Templates de tâches pour l'onboarding
 *
 * Ces templates sont affichés quand un tenant n'a pas encore créé de tâches.
 * Ils guident l'utilisateur à travers les premières étapes.
 */

export interface TemplateAction {
  id: string;
  title: string;
  description: string;
  is_done: boolean;
  weight_percentage: number;
  position: number;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: 'onboarding' | 'setup' | 'collaboration';
  icon: string;
  actions: TemplateAction[];
  estimatedTime: string;
  helpText: string;
}

/**
 * Templates de tâches d'onboarding
 */
export const ONBOARDING_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'template-1',
    title: '🚀 Créer votre première tâche',
    description:
      'Apprenez à créer et organiser vos tâches pour démarrer efficacement avec Wadashaqayn.',
    status: 'todo',
    priority: 'high',
    category: 'onboarding',
    icon: '🎯',
    estimatedTime: '5 min',
    helpText: 'Cliquez sur "Utiliser ce template" pour créer cette tâche et commencer!',
    actions: [
      {
        id: 'action-1-1',
        title: 'Cliquer sur le bouton "+ Nouvelle tâche"',
        description: 'Le bouton se trouve en haut à droite du tableau',
        is_done: false,
        weight_percentage: 25,
        position: 1,
      },
      {
        id: 'action-1-2',
        title: 'Remplir les informations de base',
        description: 'Titre, description, dates de début et fin',
        is_done: false,
        weight_percentage: 25,
        position: 2,
      },
      {
        id: 'action-1-3',
        title: 'Choisir une priorité (Basse, Moyenne, Haute)',
        description: 'Aide à organiser vos tâches par importance',
        is_done: false,
        weight_percentage: 25,
        position: 3,
      },
      {
        id: 'action-1-4',
        title: 'Sauvegarder votre tâche',
        description: 'Votre première tâche apparaîtra dans le tableau!',
        is_done: false,
        weight_percentage: 25,
        position: 4,
      },
    ],
  },
  {
    id: 'template-2',
    title: "👥 Inviter un membre de l'équipe",
    description:
      'Collaborez efficacement en invitant vos collègues à rejoindre votre espace de travail.',
    status: 'todo',
    priority: 'high',
    category: 'collaboration',
    icon: '✉️',
    estimatedTime: '3 min',
    helpText: 'Invitez votre premier collaborateur pour travailler ensemble!',
    actions: [
      {
        id: 'action-2-1',
        title: 'Aller dans le menu "RH" > "Inviter des collaborateurs"',
        description: 'Ou cliquez sur votre avatar en haut à droite',
        is_done: false,
        weight_percentage: 30,
        position: 1,
      },
      {
        id: 'action-2-2',
        title: "Entrer l'adresse email du collaborateur",
        description: 'Il recevra une invitation par email',
        is_done: false,
        weight_percentage: 30,
        position: 2,
      },
      {
        id: 'action-2-3',
        title: 'Choisir son rôle (Admin, Manager, Employé)',
        description: "Définit les permissions d'accès",
        is_done: false,
        weight_percentage: 40,
        position: 3,
      },
    ],
  },
  {
    id: 'template-3',
    title: '📊 Assigner une tâche à un responsable',
    description: 'Déleguez efficacement en assignant des tâches aux membres de votre équipe.',
    status: 'todo',
    priority: 'medium',
    category: 'setup',
    icon: '🎯',
    estimatedTime: '2 min',
    helpText: "Apprenez à répartir le travail entre les membres de l'équipe!",
    actions: [
      {
        id: 'action-3-1',
        title: 'Créer ou sélectionner une tâche',
        description: "Cliquez sur une tâche existante pour l'ouvrir",
        is_done: false,
        weight_percentage: 25,
        position: 1,
      },
      {
        id: 'action-3-2',
        title: 'Cliquer sur le champ "Assigné à"',
        description: 'Dans le dialogue de la tâche',
        is_done: false,
        weight_percentage: 25,
        position: 2,
      },
      {
        id: 'action-3-3',
        title: "Sélectionner un membre de l'équipe",
        description: 'La liste affiche tous les collaborateurs invités',
        is_done: false,
        weight_percentage: 25,
        position: 3,
      },
      {
        id: 'action-3-4',
        title: 'Le responsable recevra une notification',
        description: 'Il sera informé de sa nouvelle tâche',
        is_done: false,
        weight_percentage: 25,
        position: 4,
      },
    ],
  },
];

/**
 * Templates additionnels (optionnels)
 */
export const ADVANCED_TEMPLATES: TaskTemplate[] = [
  {
    id: 'template-4',
    title: '🔔 Configurer vos notifications',
    description: 'Restez informé des mises à jour importantes sur vos tâches et projets.',
    status: 'todo',
    priority: 'low',
    category: 'setup',
    icon: '⚙️',
    estimatedTime: '3 min',
    helpText: 'Personnalisez vos préférences de notification!',
    actions: [
      {
        id: 'action-4-1',
        title: 'Ouvrir les paramètres (icône en haut à droite)',
        description: 'Menu utilisateur > Paramètres',
        is_done: false,
        weight_percentage: 33,
        position: 1,
      },
      {
        id: 'action-4-2',
        title: 'Aller dans l\'onglet "Notifications"',
        description: 'Choisissez quand être notifié',
        is_done: false,
        weight_percentage: 33,
        position: 2,
      },
      {
        id: 'action-4-3',
        title: 'Activer les notifications par email et/ou push',
        description: 'Personnalisez selon vos préférences',
        is_done: false,
        weight_percentage: 34,
        position: 3,
      },
    ],
  },
];

/**
 * Obtenir les templates à afficher selon le contexte
 */
export function getOnboardingTemplates(includeAdvanced = false): TaskTemplate[] {
  return includeAdvanced
    ? [...ONBOARDING_TASK_TEMPLATES, ...ADVANCED_TEMPLATES]
    : ONBOARDING_TASK_TEMPLATES;
}

/**
 * Vérifier si l'utilisateur a complété l'onboarding
 * (peut être stocké en localStorage ou dans la DB)
 */
export function shouldShowOnboarding(taskCount: number, hasSeenOnboarding: boolean): boolean {
  return taskCount === 0 && !hasSeenOnboarding;
}
