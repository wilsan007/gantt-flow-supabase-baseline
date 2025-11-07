/**
 * Types pour le système de dépendances entre tâches
 */

export type DependencyType = 
  | 'finish-to-start'  // FS: La tâche B commence après la fin de A
  | 'start-to-start'   // SS: La tâche B commence en même temps que A
  | 'finish-to-finish' // FF: La tâche B finit en même temps que A
  | 'start-to-finish';  // SF: La tâche B finit quand A commence (rare)

export interface TaskDependency {
  id: string;
  depends_on_task_id: string;  // Tâche dont on dépend (prédécesseur)
  task_id: string;             // Tâche qui dépend (successeur)
  dependency_type: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  // Alias pour compatibilité
  predecessor_task_id?: string;
  successor_task_id?: string;
}

export interface DependencyLink {
  from: {
    taskId: string;
    point: 'start' | 'end'; // Point de départ du lien
  };
  to: {
    taskId: string;
    point: 'start' | 'end'; // Point d'arrivée du lien
  };
  type: DependencyType;
  lag_days?: number;
}

/**
 * Traduit les points de connexion en type de dépendance
 */
export function getDependencyType(
  fromPoint: 'start' | 'end',
  toPoint: 'start' | 'end'
): DependencyType {
  if (fromPoint === 'end' && toPoint === 'start') {
    return 'finish-to-start'; // Plus courant : A finit, B commence
  }
  if (fromPoint === 'start' && toPoint === 'start') {
    return 'start-to-start'; // A et B commencent ensemble
  }
  if (fromPoint === 'end' && toPoint === 'end') {
    return 'finish-to-finish'; // A et B finissent ensemble
  }
  // fromPoint === 'start' && toPoint === 'end'
  return 'start-to-finish'; // Rare : B finit quand A commence
}

/**
 * Labels lisibles pour les types de dépendances
 */
export const dependencyLabels: Record<DependencyType, string> = {
  'finish-to-start': 'Fin → Début',
  'start-to-start': 'Début → Début',
  'finish-to-finish': 'Fin → Fin',
  'start-to-finish': 'Début → Fin',
};

/**
 * Descriptions des types de dépendances
 */
export const dependencyDescriptions: Record<DependencyType, string> = {
  'finish-to-start': 'La tâche suivante démarre après la fin de celle-ci',
  'start-to-start': 'Les deux tâches démarrent en même temps',
  'finish-to-finish': 'Les deux tâches se terminent en même temps',
  'start-to-finish': 'La tâche suivante se termine quand celle-ci démarre',
};
