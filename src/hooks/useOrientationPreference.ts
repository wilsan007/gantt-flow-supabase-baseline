/**
 * Hook pour gérer les préférences d'orientation utilisateur
 * Permet de sauvegarder et récupérer les préférences (localStorage)
 * Pattern: Notion/Linear pour préférences utilisateur persistantes
 */

import { useState, useEffect } from 'react';

export type OrientationPreference = 'auto' | 'always-landscape' | 'always-portrait' | 'never-ask';

interface UseOrientationPreferenceReturn {
  preference: OrientationPreference;
  setPreference: (pref: OrientationPreference) => void;
  shouldForceOrientation: (viewType: 'table' | 'gantt' | 'kanban') => boolean;
  dismissedViews: string[];
  dismissView: (viewType: string) => void;
  resetDismissed: () => void;
}

const PREFERENCE_KEY = 'wadashaqayn_orientation_preference';
const DISMISSED_KEY = 'wadashaqayn_dismissed_orientation_views';

export const useOrientationPreference = (): UseOrientationPreferenceReturn => {
  const [preference, setPreferenceState] = useState<OrientationPreference>('auto');
  const [dismissedViews, setDismissedViews] = useState<string[]>([]);

  // Charger les préférences au montage
  useEffect(() => {
    try {
      const savedPref = localStorage.getItem(PREFERENCE_KEY) as OrientationPreference;
      if (
        savedPref &&
        ['auto', 'always-landscape', 'always-portrait', 'never-ask'].includes(savedPref)
      ) {
        setPreferenceState(savedPref);
      }

      const savedDismissed = localStorage.getItem(DISMISSED_KEY);
      if (savedDismissed) {
        setDismissedViews(JSON.parse(savedDismissed));
      }
    } catch (error) {
      console.error('Erreur chargement préférences orientation:', error);
    }
  }, []);

  // Sauvegarder la préférence
  const setPreference = (pref: OrientationPreference) => {
    setPreferenceState(pref);
    try {
      localStorage.setItem(PREFERENCE_KEY, pref);
    } catch (error) {
      console.error('Erreur sauvegarde préférence orientation:', error);
    }
  };

  // Marquer une vue comme "ne plus afficher"
  const dismissView = (viewType: string) => {
    const newDismissed = [...dismissedViews, viewType];
    setDismissedViews(newDismissed);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(newDismissed));
    } catch (error) {
      console.error('Erreur sauvegarde vues ignorées:', error);
    }
  };

  // Réinitialiser les vues ignorées
  const resetDismissed = () => {
    setDismissedViews([]);
    try {
      localStorage.removeItem(DISMISSED_KEY);
    } catch (error) {
      console.error('Erreur reset vues ignorées:', error);
    }
  };

  // Déterminer si on doit forcer l'orientation pour une vue
  const shouldForceOrientation = (viewType: 'table' | 'gantt' | 'kanban'): boolean => {
    // Si l'utilisateur a dit "ne plus afficher" pour cette vue
    if (dismissedViews.includes(viewType)) {
      return false;
    }

    // Selon la préférence
    switch (preference) {
      case 'never-ask':
        return false;
      case 'always-landscape':
        return true;
      case 'always-portrait':
        return false;
      case 'auto':
      default:
        // Comportement par défaut: forcer pour ces 3 vues
        return ['table', 'gantt', 'kanban'].includes(viewType);
    }
  };

  return {
    preference,
    setPreference,
    shouldForceOrientation,
    dismissedViews,
    dismissView,
    resetDismissed,
  };
};
