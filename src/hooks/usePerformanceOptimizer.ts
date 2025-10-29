import { useEffect, useRef, useState } from 'react';
import { cacheManager } from '@/lib/cacheManager';

/**
 * Hook de monitoring et optimisation des performances
 * Inspiré des patterns Stripe/Linear pour le monitoring temps réel
 */
export function usePerformanceOptimizer() {
  const [metrics, setMetrics] = useState({
    totalRenders: 0,
    averageRenderTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    activeHooks: 0,
    slowOperations: 0,
    lastOptimization: null as Date | null
  });

  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const lastCleanupRef = useRef(Date.now());

  // Monitoring des performances en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      updateMetrics();
    }, 2000); // Mise à jour toutes les 2 secondes

    return () => clearInterval(interval);
  }, []);

  const updateMetrics = () => {
    const cacheStats = cacheManager.getStats();
    
    setMetrics(prev => ({
      ...prev,
      cacheHitRate: cacheStats.hitRate,
      memoryUsage: cacheStats.memoryUsage,
      lastOptimization: new Date()
    }));
  };

  // Optimisations automatiques
  const optimizePerformance = () => {
    const now = Date.now();
    
    // Nettoyage du cache si nécessaire (toutes les 5 minutes)
    if (now - lastCleanupRef.current > 5 * 60 * 1000) {
      cacheManager.cleanup();
      lastCleanupRef.current = now;
      // console.log('🧹 Cache cleanup automatique effectué');
    }

    // Préchargement des données critiques
    preloadCriticalData();

    // Optimisation de la mémoire
    if (typeof window !== 'undefined' && window.gc) {
      window.gc();
      // console.log('🗑️ Garbage collection forcé');
    }
  };

  const preloadCriticalData = () => {
    // Précharger les données HR si pas en cache
    const hrCacheKey = 'hr:super_admin';
    if (!cacheManager.get(hrCacheKey)) {
      // console.log('⚡ Préchargement des données HR...');
      // Le préchargement sera fait par useHRMinimal au prochain appel
    }
  };

  // Analyse des goulots d'étranglement
  const analyzeBottlenecks = () => {
    const cacheStats = cacheManager.getStats();
    const recommendations = [];

    if (cacheStats.hitRate < 0.7) {
      recommendations.push('📈 Améliorer le cache hit rate (actuellement ' + (cacheStats.hitRate * 100).toFixed(1) + '%)');
    }

    if (renderTimesRef.current.length > 0) {
      const avgRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;
      if (avgRenderTime > 100) {
        recommendations.push('⚡ Optimiser les temps de rendu (actuellement ' + avgRenderTime.toFixed(1) + 'ms)');
      }
    }

    if (cacheStats.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('🧹 Nettoyer la mémoire cache (actuellement ' + (cacheStats.memoryUsage / 1024 / 1024).toFixed(1) + 'MB)');
    }

    return recommendations;
  };

  // Rapport de performance détaillé
  const getPerformanceReport = () => {
    const cacheStats = cacheManager.getStats();
    const recommendations = analyzeBottlenecks();

    return {
      summary: {
        status: recommendations.length === 0 ? '✅ Excellent' : recommendations.length <= 2 ? '⚠️ Bon' : '❌ À améliorer',
        score: Math.max(0, 100 - recommendations.length * 15)
      },
      cache: {
        hitRate: (cacheStats.hitRate * 100).toFixed(1) + '%',
        memoryUsage: (cacheStats.memoryUsage / 1024 / 1024).toFixed(1) + 'MB',
        activeKeys: cacheStats.activeKeys,
        totalHits: cacheStats.hits,
        totalMisses: cacheStats.misses
      },
      rendering: {
        totalRenders: renderCountRef.current,
        averageTime: renderTimesRef.current.length > 0 
          ? (renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length).toFixed(1) + 'ms'
          : 'N/A'
      },
      recommendations,
      lastUpdate: new Date().toISOString()
    };
  };

  // Actions d'optimisation
  const actions = {
    clearCache: () => {
      cacheManager.clear();
      // console.log('🗑️ Cache vidé manuellement');
    },
    
    cleanup: () => {
      cacheManager.cleanup();
      // console.log('🧹 Nettoyage du cache effectué');
    },
    
    optimize: optimizePerformance,
    
    forceGC: () => {
      if (typeof window !== 'undefined' && window.gc) {
        window.gc();
        // console.log('🗑️ Garbage collection forcé');
      } else {
        console.warn('Garbage collection non disponible');
      }
    },

    preload: preloadCriticalData
  };

  return {
    metrics,
    report: getPerformanceReport(),
    recommendations: analyzeBottlenecks(),
    actions
  };
}

/**
 * Hook pour tracker les re-renders d'un composant spécifique
 */
export function useRenderOptimizer(componentName: string) {
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const lastRenderRef = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const renderTime = now - lastRenderRef.current;
    
    renderCountRef.current += 1;
    renderTimesRef.current.push(renderTime);
    
    // Garder seulement les 10 derniers temps de rendu
    if (renderTimesRef.current.length > 10) {
      renderTimesRef.current = renderTimesRef.current.slice(-10);
    }
    
    lastRenderRef.current = now;

    // Alerte si trop de re-renders
    if (renderCountRef.current > 20) {
      console.warn(`⚠️ ${componentName} a été rendu ${renderCountRef.current} fois - vérifier les dépendances`);
    }

    // Alerte si rendu trop lent
    if (renderTime > 200) {
      console.warn(`🐌 ${componentName} rendu lent: ${renderTime}ms`);
    }
  });

  const getStats = () => ({
    renderCount: renderCountRef.current,
    averageRenderTime: renderTimesRef.current.length > 0 
      ? renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length 
      : 0,
    lastRenderTime: renderTimesRef.current[renderTimesRef.current.length - 1] || 0
  });

  return {
    renderCount: renderCountRef.current,
    stats: getStats()
  };
}

// Types pour le monitoring global
declare global {
  interface Window {
    gc?: () => void;
  }
}
