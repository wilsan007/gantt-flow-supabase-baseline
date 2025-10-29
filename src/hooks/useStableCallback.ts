import { useCallback, useRef } from 'react';

/**
 * Hook pour créer des callbacks stables qui ne changent jamais de référence
 * Inspiré des patterns Stripe/Linear pour éviter les re-renders inutiles
 * 
 * @param callback - La fonction callback à stabiliser
 * @returns Une fonction callback stable qui ne change jamais de référence
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef<T>(callback);
  
  // Mettre à jour la référence sans changer la fonction retournée
  callbackRef.current = callback;
  
  // Retourner une fonction stable qui appelle toujours la dernière version
  const stableCallback = useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
  
  return stableCallback;
}

/**
 * Hook pour créer des callbacks stables avec dépendances
 * Utilise un hash des dépendances pour éviter les changements inutiles
 * 
 * @param callback - La fonction callback
 * @param deps - Les dépendances du callback
 * @returns Une fonction callback stable
 */
export function useStableCallbackWithDeps<T extends (...args: any[]) => any>(
  callback: T, 
  deps: any[]
): T {
  const callbackRef = useRef<T>(callback);
  const depsRef = useRef<any[]>(deps);
  const stableCallbackRef = useRef<T | null>(null);
  
  // Créer un hash stable des dépendances
  const depsHash = JSON.stringify(deps);
  const lastDepsHash = JSON.stringify(depsRef.current);
  
  // Mettre à jour seulement si les dépendances ont vraiment changé
  if (depsHash !== lastDepsHash || !stableCallbackRef.current) {
    callbackRef.current = callback;
    depsRef.current = deps;
    
    stableCallbackRef.current = ((...args: any[]) => {
      return callbackRef.current(...args);
    }) as T;
  }
  
  return stableCallbackRef.current!;
}

/**
 * Hook pour créer des event handlers stables
 * Optimisé pour les événements DOM fréquents
 * 
 * @param handler - Le gestionnaire d'événement
 * @returns Un gestionnaire d'événement stable
 */
export function useStableEventHandler<T extends Event>(
  handler: (event: T) => void
) {
  return useStableCallback(handler);
}

/**
 * Hook pour créer des callbacks async stables
 * Avec gestion automatique des abort controllers
 * 
 * @param asyncCallback - La fonction async à stabiliser
 * @returns Une fonction async stable avec abort controller
 */
export function useStableAsyncCallback<T extends (...args: any[]) => Promise<any>>(
  asyncCallback: T
): T & { abort: () => void } {
  const abortControllerRef = useRef<AbortController | null>(null);
  const callbackRef = useRef<T>(asyncCallback);
  
  callbackRef.current = asyncCallback;
  
  const stableCallback = useCallback(async (...args: any[]) => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Créer un nouveau controller
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      const result = await callbackRef.current(...args);
      
      // Nettoyer le controller si la requête s'est bien passée
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      
      return result;
    } catch (error) {
      // Ne pas propager l'erreur si c'est une annulation
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      throw error;
    }
  }, []) as T;
  
  // Ajouter la méthode abort
  const stableCallbackWithAbort = stableCallback as T & { abort: () => void };
  stableCallbackWithAbort.abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  return stableCallbackWithAbort;
}
