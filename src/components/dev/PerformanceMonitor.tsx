/**
 * Performance Monitor Component - Pattern Linear/Notion
 * 
 * Composant de développement pour monitorer les performances
 * en temps réel et afficher les métriques du cache
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cacheManager } from '@/lib/cacheManager';

interface PerformanceStats {
  cacheStats: any;
  memoryUsage?: number;
  renderMetrics: {
    [componentName: string]: {
      renderCount: number;
      averageTime: number;
      warningLevel: string;
    };
  };
}

export const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fonction pour collecter les statistiques
  const collectStats = () => {
    const cacheStats = cacheManager.getStats();
    const memoryUsage = (performance as any).memory?.usedJSHeapSize / (1024 * 1024);
    
    setStats({
      cacheStats,
      memoryUsage,
      renderMetrics: {} // Sera étendu avec les métriques des composants
    });
  };

  // Auto-refresh toutes les 2 secondes
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(collectStats, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Collecter les stats initiales
  useEffect(() => {
    collectStats();
  }, []);

  // Raccourci clavier pour afficher/masquer (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible || process.env.NODE_ENV === 'production') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsVisible(true)}
          className="bg-black/80 text-white border-gray-600 hover:bg-black/90"
        >
          📊 Perf
        </Button>
      </div>
    );
  }

  const getCacheHitRate = () => {
    if (!stats?.cacheStats.metrics) return 0;
    return stats.cacheStats.metrics.hitRate.toFixed(1);
  };

  const getMemoryUsage = () => {
    if (!stats?.memoryUsage) return 'N/A';
    return `${stats.memoryUsage.toFixed(1)} MB`;
  };

  const getCacheSize = () => {
    if (!stats?.cacheStats.metrics) return 'N/A';
    return `${(stats.cacheStats.metrics.size / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card className="bg-black/90 text-white border-gray-600">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              🚀 Performance Monitor
            </CardTitle>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="h-6 px-2 text-xs"
              >
                {autoRefresh ? '⏸️' : '▶️'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={collectStats}
                className="h-6 px-2 text-xs"
              >
                🔄
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="h-6 px-2 text-xs"
              >
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 text-xs">
          {/* Cache Metrics */}
          <div>
            <h4 className="font-medium text-blue-300 mb-1">📦 Cache Performance</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">Hit Rate:</span>
                <Badge 
                  variant={parseFloat(getCacheHitRate()) > 80 ? "default" : "destructive"}
                  className="ml-1 text-xs"
                >
                  {getCacheHitRate()}%
                </Badge>
              </div>
              <div>
                <span className="text-gray-400">Size:</span>
                <span className="ml-1 text-green-400">{getCacheSize()}</span>
              </div>
              <div>
                <span className="text-gray-400">Entries:</span>
                <span className="ml-1 text-blue-400">
                  {stats?.cacheStats.metrics?.totalEntries || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Hits:</span>
                <span className="ml-1 text-green-400">
                  {stats?.cacheStats.metrics?.hits || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div>
            <h4 className="font-medium text-purple-300 mb-1">🧠 Memory Usage</h4>
            <div>
              <span className="text-gray-400">Heap Size:</span>
              <Badge 
                variant={stats?.memoryUsage && stats.memoryUsage > 100 ? "destructive" : "default"}
                className="ml-1 text-xs"
              >
                {getMemoryUsage()}
              </Badge>
            </div>
          </div>

          {/* Cache Keys */}
          {stats?.cacheStats.keys && stats.cacheStats.keys.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-300 mb-1">🔑 Active Cache Keys</h4>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {stats.cacheStats.keys.slice(0, 5).map((key: string, index: number) => (
                  <div key={index} className="text-xs text-gray-300 truncate">
                    {key}
                  </div>
                ))}
                {stats.cacheStats.keys.length > 5 && (
                  <div className="text-xs text-gray-500">
                    +{stats.cacheStats.keys.length - 5} more...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-gray-700">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  cacheManager.clear();
                  collectStats();
                }}
                className="h-6 px-2 text-xs"
              >
                🗑️ Clear Cache
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  cacheManager.cleanup();
                  collectStats();
                }}
                className="h-6 px-2 text-xs"
              >
                🧹 Cleanup
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="pt-2 border-t border-gray-700 text-xs text-gray-500">
            Press <kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+P</kbd> to toggle
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;
