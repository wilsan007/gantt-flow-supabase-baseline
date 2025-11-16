import { useEffect, useState } from 'react';

/**
 * Hook de debounce pour retarder les mises à jour
 * Utilisé pour éviter trop d'appels API pendant la saisie
 *
 * @param value - Valeur à debouncer
 * @param delay - Délai en millisecondes (défaut: 800ms comme Monday.com)
 * @returns Valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 800): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook de debounce avec callback
 * Utile pour déclencher une action après la fin de la saisie
 *
 * @param callback - Fonction à appeler après le délai
 * @param delay - Délai en millisecondes
 * @returns Fonction debouncée
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 800
): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  }) as T;

  useEffect(() => {
    // Cleanup à la destruction du composant
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}
