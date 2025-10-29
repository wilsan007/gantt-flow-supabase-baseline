/**
 * Utilitaires pour la gestion des planifications RRULE
 */

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null;

/**
 * Extrait la fréquence d'une RRULE
 */
export function extractFrequency(rrule: string | null | undefined): FrequencyType {
  if (!rrule) return null;
  
  if (rrule.includes('FREQ=DAILY')) return 'daily';
  if (rrule.includes('FREQ=WEEKLY')) return 'weekly';
  if (rrule.includes('FREQ=MONTHLY')) return 'monthly';
  if (rrule.includes('FREQ=QUARTERLY')) return 'quarterly';
  if (rrule.includes('FREQ=YEARLY')) return 'yearly';
  
  return null;
}

/**
 * Retourne la fourchette de jours maximum pour les actions selon la fréquence
 */
export function getMaxOffsetDays(frequency: FrequencyType | null, activityKind: 'recurring' | 'one_off'): number {
  // Pour les tâches ponctuelles : max 30 jours
  if (activityKind === 'one_off') {
    return 30;
  }
  
  // Pour les tâches récurrentes selon la fréquence
  switch (frequency) {
    case 'daily':
      return 0; // Pas de décalage possible (c'est chaque jour)
    case 'weekly':
      return 7; // Une semaine max
    case 'monthly':
      return 30; // Un mois max
    case 'quarterly':
      return 90; // Un trimestre max
    case 'yearly':
      return 365; // Un an max
    default:
      return 30; // Par défaut 30 jours
  }
}

/**
 * Génère la liste des jours disponibles pour la timeline
 */
export function getAvailableDays(frequency: FrequencyType | null, activityKind: 'recurring' | 'one_off'): number[] {
  const maxDays = getMaxOffsetDays(frequency, activityKind);
  
  if (maxDays === 0) {
    return [0]; // Seulement le jour même
  }
  
  // Générer la fourchette centrée sur 0
  const days: number[] = [];
  const halfRange = Math.floor(maxDays / 2);
  
  for (let i = -halfRange; i <= halfRange; i++) {
    days.push(i);
  }
  
  return days;
}

/**
 * Retourne le label de la fréquence
 */
export function getFrequencyLabel(frequency: FrequencyType | null): string {
  switch (frequency) {
    case 'daily': return 'Quotidienne';
    case 'weekly': return 'Hebdomadaire';
    case 'monthly': return 'Mensuelle';
    case 'quarterly': return 'Trimestrielle';
    case 'yearly': return 'Annuelle';
    default: return 'Non définie';
  }
}

/**
 * Retourne un message d'information selon la fréquence
 */
export function getTimelineInfo(frequency: FrequencyType | null, activityKind: 'recurring' | 'one_off'): string {
  if (activityKind === 'one_off') {
    return 'Fourchette de ±15 jours autour de la date de la tâche ponctuelle';
  }
  
  switch (frequency) {
    case 'daily':
      return 'Les tâches sont générées quotidiennement, pas de décalage possible';
    case 'weekly':
      return 'Fourchette de ±3 jours autour de la semaine';
    case 'monthly':
      return 'Fourchette de ±15 jours autour du jour du mois';
    case 'quarterly':
      return 'Fourchette de ±45 jours autour du trimestre';
    case 'yearly':
      return 'Fourchette de ±6 mois autour de la date annuelle';
    default:
      return 'Fourchette de ±15 jours autour de la tâche principale';
  }
}
