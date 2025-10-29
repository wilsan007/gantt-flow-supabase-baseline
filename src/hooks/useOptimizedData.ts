/**
 * Hook de données optimisé - Pattern Enterprise unifié
 * 
 * Remplace tous les hooks de données existants avec:
 * - Cache intelligent global
 * - Performance monitoring
 * - Debouncing adaptatif
 * - Gestion d'erreurs robuste
 * - Métriques temps réel
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager, createCacheKey, CacheType } from '@/lib/cacheManager';
import { useRenderTracker } from '@/hooks/usePerformanceMonitor';
import { useSmartDebounce } from '@/hooks/useSmartDebounce';
import { useToast } from '@/hooks/use-toast';

interface OptimizedDataConfig<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  cacheType?: CacheType;
  enabled?: boolean;
  refetchOnMount?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: number;
  retryDelay?: number;
}

interface OptimizedDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
  invalidate: () => void;
  metrics: {
    fetchTime: number;
    cacheHit: boolean;
    lastUpdate: Date | null;
    retryCount: number;
  };
}

export const useOptimizedData = <T>(
  config: OptimizedDataConfig<T>
): OptimizedDataResult<T> => {
  const {
    queryKey,
    queryFn,
    cacheType = 'default',
    enabled = true,
    refetchOnMount = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000,   // 10 minutes
    retry = 3,
    retryDelay = 1000
  } = config;

  // Performance monitoring
  const performanceMonitor = useRenderTracker(`useOptimizedData-${queryKey.join('-')}`);

  // États
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [metrics, setMetrics] = useState({
    fetchTime: 0,
    cacheHit: false,
    lastUpdate: null as Date | null,
    retryCount: 0
  });

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const lastFetchRef = useRef<number>(0);
  const { toast } = useToast();

  // Génération de la clé de cache
  const cacheKey = createCacheKey(...queryKey);

  // Fonction de fetch optimisée
  const fetchData = useCallback(async (isRetry = false) => {
    if (!enabled) return;

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const startTime = performance.now();
      setIsFetching(true);
      setError(null);

      // Vérifier le cache d'abord
      const cachedData = cacheManager.get<T>(cacheKey);
      if (cachedData && !isRetry) {
        setData(cachedData);
        setMetrics(prev => ({
          ...prev,
          cacheHit: true,
          fetchTime: performance.now() - startTime,
          lastUpdate: new Date()
        }));
        setLoading(false);
        setIsFetching(false);
        return;
      }

      // Fetch des données fraîches
      const result = await queryFn();

      if (!abortController.signal.aborted) {
        // Mettre en cache
        cacheManager.set(cacheKey, result, cacheType);
        
        // Mettre à jour les états
        setData(result);
        setMetrics(prev => ({
          ...prev,
          cacheHit: false,
          fetchTime: performance.now() - startTime,
          lastUpdate: new Date(),
          retryCount: retryCountRef.current
        }));
        
        // Reset retry count on success
        retryCountRef.current = 0;
        lastFetchRef.current = Date.now();
      }
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        console.error(`❌ Error fetching data for ${cacheKey}:`, err);
        
        // Gestion des retry
        if (retryCountRef.current < retry && !isRetry) {
          retryCountRef.current++;
          // console.log(`🔄 Retrying fetch (${retryCountRef.current}/${retry}) for ${cacheKey}`);
          
          setTimeout(() => {
            fetchData(true);
          }, retryDelay * retryCountRef.current);
          return;
        }

        setError(err.message || 'Erreur de chargement');
        setMetrics(prev => ({
          ...prev,
          retryCount: retryCountRef.current
        }));

        // Toast d'erreur seulement après tous les retry
        if (retryCountRef.current >= retry) {
          toast({
            title: "Erreur de chargement",
            description: `Impossible de charger les données: ${err.message}`,
            variant: "destructive"
          });
        }
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [enabled, queryFn, cacheKey, cacheType, retry, retryDelay, toast]);

  // Debounced fetch pour éviter les appels trop fréquents
  const { debouncedCallback: debouncedFetch } = useSmartDebounce(
    fetchData,
    { delay: 100, maxWait: 500 }
  );

  // Fonction de refetch manuel
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Fonction d'invalidation
  const invalidate = useCallback(() => {
    cacheManager.invalidate(cacheKey);
    if (enabled) {
      debouncedFetch();
    }
  }, [cacheKey, enabled, debouncedFetch]);

  // Vérifier si les données sont stales
  const isStale = metrics.lastUpdate 
    ? Date.now() - metrics.lastUpdate.getTime() > staleTime
    : true;

  // Effect principal
  useEffect(() => {
    if (enabled && refetchOnMount) {
      debouncedFetch();
    }
  }, [enabled, refetchOnMount, debouncedFetch]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-refetch si les données sont stales et le composant est actif
  useEffect(() => {
    if (!enabled || !isStale || isFetching) return;

    const shouldRefetch = Date.now() - lastFetchRef.current > staleTime;
    if (shouldRefetch) {
      debouncedFetch();
    }
  }, [enabled, isStale, isFetching, staleTime, debouncedFetch]);

  return {
    data,
    loading,
    error,
    isStale,
    isFetching,
    refetch,
    invalidate,
    metrics
  };
};

/**
 * Hook spécialisé pour les données HR
 */
export const useOptimizedHR = () => {
  const { tenantId } = useTenant();
  const { isSuperAdmin } = useUserRoles();
  
  return useOptimizedData({
    queryKey: ['hr', tenantId || 'no_tenant', isSuperAdmin ? 'super_admin' : 'normal'],
    queryFn: async () => {
      // Logique de fetch HR optimisée
      const [employees, leaveRequests, attendances, absenceTypes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('leave_requests').select('*'),
        supabase.from('attendances').select('*'),
        supabase.from('absence_types').select('*')
      ]);

      return {
        employees: employees.data || [],
        leaveRequests: leaveRequests.data || [],
        attendances: attendances.data || [],
        absenceTypes: absenceTypes.data || []
      };
    },
    cacheType: 'hr_data',
    staleTime: 3 * 60 * 1000 // 3 minutes pour HR
  });
};

/**
 * Hook spécialisé pour les projets
 */
export const useOptimizedProjects = () => {
  const { tenantId } = useTenant();
  
  return useOptimizedData({
    queryKey: ['projects', tenantId || 'no_tenant'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      return data || [];
    },
    cacheType: 'projects',
    staleTime: 5 * 60 * 1000 // 5 minutes pour les projets
  });
};

/**
 * Hook spécialisé pour les tâches
 */
export const useOptimizedTasks = (projectId?: string) => {
  const { tenantId } = useTenant();
  
  return useOptimizedData({
    queryKey: ['tasks', tenantId || 'no_tenant', projectId || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    cacheType: 'tasks',
    staleTime: 2 * 60 * 1000 // 2 minutes pour les tâches
  });
};

// Import des hooks nécessaires (à ajouter en haut du fichier)
import { useTenant } from './useTenant';
import { useUserRoles } from './useUserRoles';
