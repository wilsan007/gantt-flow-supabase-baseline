/**
 * Hook Métriques - Pattern Salesforce
 * Suivi des performances et métriques temps réel
 */

import { useState, useCallback } from 'react';

export interface Metrics {
  fetchTime: number;
  cacheHit: boolean;
  dataSize: number;
  lastUpdate: Date;
  queryComplexity: 'simple' | 'medium' | 'complex';
}

export const useMetrics = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    fetchTime: 0,
    cacheHit: false,
    dataSize: 0,
    lastUpdate: new Date(),
    queryComplexity: 'simple',
  });

  const startTimer = useCallback(() => {
    return performance.now();
  }, []);

  const recordMetrics = useCallback(
    (
      startTime: number,
      data: any,
      cacheHit: boolean,
      complexity: 'simple' | 'medium' | 'complex' = 'simple'
    ) => {
      const fetchTime = performance.now() - startTime;
      const dataSize = JSON.stringify(data).length;

      setMetrics({
        fetchTime,
        cacheHit,
        dataSize,
        lastUpdate: new Date(),
        queryComplexity: complexity,
      });

      return { fetchTime, dataSize };
    },
    []
  );

  return {
    metrics,
    startTimer,
    recordMetrics,
  };
};
