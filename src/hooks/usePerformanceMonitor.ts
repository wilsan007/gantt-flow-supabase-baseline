/**
 * Performance Monitor Hook - Pattern Monday.com/Linear
 * 
 * Fonctionnalités:
 * - Monitoring des re-renders
 * - Métriques de performance temps réel
 * - Détection des boucles infinies
 * - Alertes de performance
 * - Profiling automatique
 */

import { useRef, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  totalRenderTime: number;
  slowRenders: number;
  memoryUsage?: number;
  componentName: string;
  isStable: boolean;
  warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

interface RenderInfo {
  timestamp: number;
  duration: number;
  props?: any;
  state?: any;
}

const PERFORMANCE_THRESHOLDS = {
  SLOW_RENDER_MS: 16, // 60fps = 16ms par frame
  MAX_RENDERS: 10,
  STABILITY_THRESHOLD: 5,
  CRITICAL_RENDERS: 50,
  MEMORY_WARNING_MB: 50
};

export const usePerformanceMonitor = (componentName: string, options?: {
  enableProfiling?: boolean;
  trackProps?: boolean;
  trackState?: boolean;
  alertThreshold?: number;
}) => {
  const {
    enableProfiling = process.env.NODE_ENV === 'development',
    trackProps = false,
    trackState = false,
    alertThreshold = PERFORMANCE_THRESHOLDS.MAX_RENDERS
  } = options || {};

  // Refs pour le tracking
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const renderHistoryRef = useRef<RenderInfo[]>([]);
  const startTimeRef = useRef<number>(0);
  const lastPropsRef = useRef<any>(null);
  const lastStateRef = useRef<any>(null);
  const warningShownRef = useRef(false);

  // Métriques calculées
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    totalRenderTime: 0,
    slowRenders: 0,
    componentName,
    isStable: false,
    warningLevel: 'none'
  });

  // Démarrer le monitoring d'un render
  const startRender = useCallback(() => {
    if (!enableProfiling) return;
    startTimeRef.current = performance.now();
  }, [enableProfiling]);

  // Terminer le monitoring d'un render
  const endRender = useCallback((props?: any, state?: any) => {
    if (!enableProfiling || startTimeRef.current === 0) return;

    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    
    renderCountRef.current++;
    renderTimesRef.current.push(renderTime);
    
    // Garder seulement les 100 derniers renders
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current.shift();
    }

    // Enregistrer dans l'historique
    const renderInfo: RenderInfo = {
      timestamp: endTime,
      duration: renderTime,
      ...(trackProps && { props }),
      ...(trackState && { state })
    };
    
    renderHistoryRef.current.push(renderInfo);
    if (renderHistoryRef.current.length > 50) {
      renderHistoryRef.current.shift();
    }

    // Calculer les métriques
    updateMetrics(renderTime);
    
    // Vérifier les seuils de performance
    checkPerformanceThresholds();
    
    startTimeRef.current = 0;
  }, [enableProfiling, trackProps, trackState]);

  // Mettre à jour les métriques
  const updateMetrics = useCallback((renderTime: number) => {
    const renderTimes = renderTimesRef.current;
    const renderCount = renderCountRef.current;
    
    const totalTime = renderTimes.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / renderTimes.length;
    const slowRenders = renderTimes.filter(time => time > PERFORMANCE_THRESHOLDS.SLOW_RENDER_MS).length;
    
    // Déterminer le niveau d'alerte
    let warningLevel: PerformanceMetrics['warningLevel'] = 'none';
    if (renderCount > PERFORMANCE_THRESHOLDS.CRITICAL_RENDERS) {
      warningLevel = 'critical';
    } else if (renderCount > alertThreshold) {
      warningLevel = 'high';
    } else if (slowRenders > renderTimes.length * 0.3) {
      warningLevel = 'medium';
    } else if (slowRenders > 0) {
      warningLevel = 'low';
    }

    // Vérifier la stabilité (pas de renders dans les 2 dernières secondes)
    const now = Date.now();
    const recentRenders = renderHistoryRef.current.filter(
      render => now - render.timestamp < 2000
    );
    const isStable = recentRenders.length <= PERFORMANCE_THRESHOLDS.STABILITY_THRESHOLD;

    metricsRef.current = {
      renderCount,
      averageRenderTime: averageTime,
      lastRenderTime: renderTime,
      totalRenderTime: totalTime,
      slowRenders,
      componentName,
      isStable,
      warningLevel,
      memoryUsage: getMemoryUsage()
    };
  }, [alertThreshold]);

  // Vérifier les seuils de performance
  const checkPerformanceThresholds = useCallback(() => {
    const metrics = metricsRef.current;
    
    // Alerte pour trop de renders
    if (metrics.renderCount > alertThreshold && !warningShownRef.current) {
      console.warn(
        `⚠️ Performance Warning: ${componentName} has rendered ${metrics.renderCount} times. ` +
        `Average render time: ${metrics.averageRenderTime.toFixed(2)}ms`
      );
      warningShownRef.current = true;
    }

    // Alerte critique
    if (metrics.renderCount > PERFORMANCE_THRESHOLDS.CRITICAL_RENDERS) {
      console.error(
        `🚨 Critical Performance Issue: ${componentName} has rendered ${metrics.renderCount} times! ` +
        `This indicates a render loop or inefficient re-rendering.`
      );
    }

    // Alerte pour renders lents
    if (metrics.lastRenderTime > PERFORMANCE_THRESHOLDS.SLOW_RENDER_MS * 2) {
      console.warn(
        `🐌 Slow Render: ${componentName} took ${metrics.lastRenderTime.toFixed(2)}ms to render ` +
        `(threshold: ${PERFORMANCE_THRESHOLDS.SLOW_RENDER_MS}ms)`
      );
    }
  }, [componentName, alertThreshold]);

  // Obtenir l'usage mémoire (si disponible)
  const getMemoryUsage = useCallback((): number | undefined => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return undefined;
  }, []);

  // Obtenir les métriques actuelles
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  // Obtenir l'historique des renders
  const getRenderHistory = useCallback((): RenderInfo[] => {
    return [...renderHistoryRef.current];
  }, []);

  // Réinitialiser les métriques
  const resetMetrics = useCallback(() => {
    renderCountRef.current = 0;
    renderTimesRef.current = [];
    renderHistoryRef.current = [];
    warningShownRef.current = false;
    metricsRef.current = {
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      totalRenderTime: 0,
      slowRenders: 0,
      componentName,
      isStable: true,
      warningLevel: 'none'
    };
  }, [componentName]);

  // Obtenir un rapport de performance
  const getPerformanceReport = useCallback(() => {
    const metrics = getMetrics();
    const history = getRenderHistory();
    
    return {
      summary: {
        component: componentName,
        totalRenders: metrics.renderCount,
        averageRenderTime: `${metrics.averageRenderTime.toFixed(2)}ms`,
        slowRenders: metrics.slowRenders,
        warningLevel: metrics.warningLevel,
        isStable: metrics.isStable,
        memoryUsage: metrics.memoryUsage ? `${metrics.memoryUsage.toFixed(2)}MB` : 'N/A'
      },
      recommendations: generateRecommendations(metrics),
      recentActivity: history.slice(-10).map(render => ({
        timestamp: new Date(render.timestamp).toISOString(),
        duration: `${render.duration.toFixed(2)}ms`,
        performance: render.duration > PERFORMANCE_THRESHOLDS.SLOW_RENDER_MS ? 'slow' : 'good'
      }))
    };
  }, [componentName, getMetrics, getRenderHistory]);

  // Générer des recommandations
  const generateRecommendations = (metrics: PerformanceMetrics): string[] => {
    const recommendations: string[] = [];
    
    if (metrics.renderCount > PERFORMANCE_THRESHOLDS.MAX_RENDERS) {
      recommendations.push('Consider using React.memo() to prevent unnecessary re-renders');
      recommendations.push('Check if props or state are changing unnecessarily');
      recommendations.push('Use useMemo() and useCallback() for expensive computations');
    }
    
    if (metrics.slowRenders > metrics.renderCount * 0.2) {
      recommendations.push('Optimize render performance - consider code splitting');
      recommendations.push('Check for expensive operations in render method');
      recommendations.push('Use React DevTools Profiler to identify bottlenecks');
    }
    
    if (!metrics.isStable) {
      recommendations.push('Component is not stable - check for infinite render loops');
      recommendations.push('Verify useEffect dependencies are correct');
    }
    
    return recommendations;
  };

  // Hook d'effet pour le monitoring automatique
  useEffect(() => {
    if (enableProfiling) {
      startRender();
      return () => {
        endRender();
      };
    }
  });

  return {
    startRender,
    endRender,
    getMetrics,
    getRenderHistory,
    resetMetrics,
    getPerformanceReport,
    isStable: metricsRef.current.isStable,
    warningLevel: metricsRef.current.warningLevel,
    renderCount: renderCountRef.current
  };
};

// Hook simplifié pour le monitoring automatique
export const useRenderTracker = (componentName: string) => {
  const monitor = usePerformanceMonitor(componentName, {
    enableProfiling: true,
    alertThreshold: 15
  });

  // Log automatique quand le composant se stabilise
  useEffect(() => {
    if (monitor.isStable && monitor.renderCount > 5) {
      const report = monitor.getPerformanceReport();
      // console.log(`📊 ${componentName} Performance Report:`, report.summary);
      
      if (report.recommendations.length > 0) {
        // console.log(`💡 Recommendations for ${componentName}:`, report.recommendations);
      }
    }
  }, [monitor.isStable, monitor.renderCount, componentName, monitor]);

  return monitor;
};
