/**
 * Hook Protection Anti-Boucle - Pattern Enterprise
 * Évite les refetch inutiles avec détection de changements
 */

import { useRef, useCallback } from 'react';

export const useFetchProtection = () => {
  const fetchedRef = useRef(false);
  const paramsRef = useRef<string>('');

  const shouldFetch = useCallback((params: any): boolean => {
    const currentParams = JSON.stringify(params);

    // Si déjà fetché avec les mêmes paramètres, skip
    if (fetchedRef.current && paramsRef.current === currentParams) {
      return false;
    }

    return true;
  }, []);

  const markAsFetched = useCallback((params: any) => {
    fetchedRef.current = true;
    paramsRef.current = JSON.stringify(params);
  }, []);

  const reset = useCallback(() => {
    fetchedRef.current = false;
    paramsRef.current = '';
  }, []);

  return {
    shouldFetch,
    markAsFetched,
    reset,
  };
};
