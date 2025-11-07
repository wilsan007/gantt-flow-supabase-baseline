/**
 * Hook Cache Intelligent - Pattern Stripe/Salesforce
 * Gestion centralisée du cache avec TTL et invalidation
 */

import { useRef, useCallback } from 'react';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheConfig {
  ttl: number; // Time to live en millisecondes
}

export const useCache = <T>(config: CacheConfig) => {
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  const get = useCallback(
    (key: string): T | null => {
      const entry = cacheRef.current.get(key);
      if (!entry) return null;

      const isExpired = Date.now() - entry.timestamp > config.ttl;
      if (isExpired) {
        cacheRef.current.delete(key);
        return null;
      }

      return entry.data;
    },
    [config.ttl]
  );

  const set = useCallback((key: string, data: T) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  const invalidate = useCallback((key: string) => {
    cacheRef.current.delete(key);
  }, []);

  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const getStats = useCallback(() => {
    const entries = Array.from(cacheRef.current.entries());
    return {
      size: entries.length,
      keys: entries.map(([key]) => key),
      totalSize: entries.reduce((acc, [, entry]) => acc + JSON.stringify(entry.data).length, 0),
    };
  }, []);

  const isStale = useCallback(
    (key: string): boolean => {
      const entry = cacheRef.current.get(key);
      if (!entry) return true;
      return Date.now() - entry.timestamp > config.ttl;
    },
    [config.ttl]
  );

  return {
    get,
    set,
    invalidate,
    clear,
    getStats,
    isStale,
  };
};
