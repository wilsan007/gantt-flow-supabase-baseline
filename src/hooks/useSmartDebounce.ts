/**
 * Smart Debounce Hook - Pattern Notion/Linear
 * 
 * Fonctionnalités:
 * - Debouncing adaptatif selon le contexte
 * - Annulation intelligente des requêtes
 * - Gestion des états de chargement
 * - Optimisation pour les recherches
 * - Métriques de performance
 */

import { useRef, useCallback, useEffect, useState } from 'react';

interface DebounceOptions {
  delay?: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
  immediate?: boolean;
}

interface DebounceMetrics {
  totalCalls: number;
  executedCalls: number;
  cancelledCalls: number;
  averageDelay: number;
  lastExecutionTime: number;
}

export const useSmartDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  options: DebounceOptions = {}
) => {
  const {
    delay = 300,
    maxWait = 1000,
    leading = false,
    trailing = true,
    immediate = false
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastExecTimeRef = useRef<number>(0);
  const metricsRef = useRef<DebounceMetrics>({
    totalCalls: 0,
    executedCalls: 0,
    cancelledCalls: 0,
    averageDelay: 0,
    lastExecutionTime: 0
  });

  const [isPending, setIsPending] = useState(false);

  const execute = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    metricsRef.current.executedCalls++;
    metricsRef.current.lastExecutionTime = now;
    lastExecTimeRef.current = now;
    
    // Calculer le délai moyen
    const actualDelay = now - lastCallTimeRef.current;
    metricsRef.current.averageDelay = 
      (metricsRef.current.averageDelay + actualDelay) / 2;

    setIsPending(false);
    return callback(...args);
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      metricsRef.current.cancelledCalls++;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
    setIsPending(false);
  }, []);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    lastCallTimeRef.current = now;
    metricsRef.current.totalCalls++;

    // Exécution immédiate si demandée
    if (immediate && !timeoutRef.current) {
      return execute(...args);
    }

    // Exécution en leading edge
    if (leading && !timeoutRef.current) {
      execute(...args);
    }

    // Annuler le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsPending(true);

    // Nouveau timeout
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      if (trailing) {
        execute(...args);
      } else {
        setIsPending(false);
      }
    }, delay);

    // MaxWait timeout pour éviter les délais infinis
    if (maxWait && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        maxTimeoutRef.current = null;
        execute(...args);
      }, maxWait);
    }
  }, [callback, delay, maxWait, leading, trailing, immediate, execute]);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setIsPending(false);
      // Exécuter immédiatement avec les derniers arguments
      // Note: nous ne pouvons pas récupérer les arguments ici
      console.warn('flush() called but no arguments available');
    }
  }, []);

  const getMetrics = useCallback((): DebounceMetrics => {
    return { ...metricsRef.current };
  }, []);

  // Cleanup lors du démontage
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    debouncedCallback,
    cancel,
    flush,
    isPending,
    getMetrics
  };
};

/**
 * Hook spécialisé pour les recherches (Pattern Notion)
 */
export const useSearchDebounce = <T>(
  searchFunction: (query: string) => Promise<T>,
  options: {
    minLength?: number;
    delay?: number;
    maxWait?: number;
  } = {}
) => {
  const {
    minLength = 2,
    delay = 300,
    maxWait = 1000
  } = options;

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (query: string) => {
    if (query.length < minLength) {
      setResults(null);
      setError(null);
      return;
    }

    // Annuler la recherche précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setIsSearching(true);
      setError(null);
      
      const result = await searchFunction(query);
      
      if (!abortController.signal.aborted) {
        setResults(result);
      }
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        setError(err.message || 'Erreur de recherche');
        setResults(null);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, [searchFunction, minLength]);

  const { debouncedCallback: debouncedSearch, cancel, isPending } = useSmartDebounce(
    performSearch,
    { delay, maxWait, trailing: true }
  );

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
    cancel();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [cancel]);

  // Cleanup lors du démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    search: debouncedSearch,
    isSearching: isSearching || isPending,
    results,
    error,
    clearResults
  };
};

/**
 * Hook pour les sauvegardes automatiques (Pattern Linear)
 */
export const useAutoSave = <T>(
  saveFunction: (data: T) => Promise<void>,
  options: {
    delay?: number;
    maxWait?: number;
    enabled?: boolean;
  } = {}
) => {
  const {
    delay = 2000, // 2 secondes par défaut
    maxWait = 10000, // 10 secondes maximum
    enabled = true
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const performSave = useCallback(async (data: T) => {
    if (!enabled) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      
      await saveFunction(data);
      
      setLastSaved(new Date());
      // console.log('📁 Auto-save completed');
    } catch (err: any) {
      setSaveError(err.message || 'Erreur de sauvegarde');
      console.error('❌ Auto-save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [saveFunction, enabled]);

  const { debouncedCallback: debouncedSave, cancel } = useSmartDebounce(
    performSave,
    { 
      delay, 
      maxWait, 
      trailing: true,
      leading: false 
    }
  );

  const forceSave = useCallback((data: T) => {
    cancel(); // Annuler la sauvegarde en attente
    performSave(data); // Sauvegarder immédiatement
  }, [cancel, performSave]);

  return {
    autoSave: debouncedSave,
    forceSave,
    isSaving,
    lastSaved,
    saveError,
    cancelSave: cancel
  };
};

/**
 * Hook pour les validations en temps réel (Pattern Stripe)
 */
export const useValidationDebounce = <T>(
  validationFunction: (value: T) => Promise<{ isValid: boolean; errors: string[] }>,
  options: {
    delay?: number;
    validateOnMount?: boolean;
  } = {}
) => {
  const {
    delay = 500,
    validateOnMount = false
  } = options;

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
  } | null>(null);

  const performValidation = useCallback(async (value: T) => {
    try {
      setIsValidating(true);
      const result = await validationFunction(value);
      setValidationResult(result);
    } catch (err: any) {
      setValidationResult({
        isValid: false,
        errors: [err.message || 'Erreur de validation']
      });
    } finally {
      setIsValidating(false);
    }
  }, [validationFunction]);

  const { debouncedCallback: debouncedValidate, cancel } = useSmartDebounce(
    performValidation,
    { delay, trailing: true }
  );

  const clearValidation = useCallback(() => {
    setValidationResult(null);
    cancel();
  }, [cancel]);

  return {
    validate: debouncedValidate,
    isValidating,
    validationResult,
    clearValidation
  };
};
