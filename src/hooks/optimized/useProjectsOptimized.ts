/**
 * Hook Projects Optimisé - Version Moderne
 * Combine simplicité + optimisations Enterprise
 * Max 200 lignes - Single Responsibility
 */

import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useCache } from '@/hooks/utils/useCache';
import { useMetrics } from '@/hooks/utils/useMetrics';
import { useFetchProtection } from '@/hooks/utils/useFetchProtection';
import { useQueryBuilder, QueryFilters } from '@/hooks/utils/useQueryBuilder';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  end_date?: string;
  budget?: number;
  progress?: number;
  tenant_id?: string;
  manager_id?: string;
  manager_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useProjectsOptimized = (filters?: QueryFilters) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({ total: 0, active: 0, completed: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { tenantId } = useTenant();
  const { isSuperAdmin, isLoading: rolesLoading } = useUserRoles();
  const cache = useCache<{ projects: Project[]; stats: ProjectStats }>({ ttl: CACHE_TTL });
  const { metrics, startTimer, recordMetrics } = useMetrics();
  const { shouldFetch, markAsFetched, reset } = useFetchProtection();
  const { buildProjectsQuery, getComplexity } = useQueryBuilder();

  const getCacheKey = useCallback(() => {
    const base = isSuperAdmin() ? 'projects_super_admin' : `projects_${tenantId}`;
    return filters ? `${base}_${JSON.stringify(filters)}` : base;
  }, [tenantId, isSuperAdmin, filters]);

  const calculateStats = useCallback((projectList: Project[]): ProjectStats => {
    const now = new Date();
    return {
      total: projectList.length,
      active: projectList.filter(p => p.status === 'active').length,
      completed: projectList.filter(p => p.status === 'completed').length,
      overdue: projectList.filter(p => 
        p.end_date && new Date(p.end_date) < now && p.status !== 'completed'
      ).length
    };
  }, []);

  const fetchProjects = useCallback(async (forceRefresh = false) => {
    if (rolesLoading) return;
    if (!tenantId && !isSuperAdmin()) {
      setLoading(false);
      return;
    }

    const params = { tenantId, filters, isSuperAdmin: isSuperAdmin() };
    if (!forceRefresh && !shouldFetch(params)) return;

    const cacheKey = getCacheKey();
    
    // Vérifier cache
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        setProjects(cached.projects);
        setStats(cached.stats);
        setLoading(false);
        return;
      }
    }

    try {
      const timer = startTimer();
      setLoading(true);
      setError(null);

      const query = buildProjectsQuery(tenantId, isSuperAdmin(), filters);
      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const projectList = (data || []) as Project[];
      const projectStats = calculateStats(projectList);

      // Mettre en cache
      cache.set(cacheKey, { projects: projectList, stats: projectStats });
      
      setProjects(projectList);
      setStats(projectStats);
      markAsFetched(params);

      recordMetrics(timer, { projects: projectList, stats: projectStats }, false,
        getComplexity(filters, isSuperAdmin()));

    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, rolesLoading, filters, isSuperAdmin, shouldFetch, getCacheKey,
      cache, startTimer, buildProjectsQuery, calculateStats, markAsFetched,
      recordMetrics, getComplexity]);

  const refresh = useCallback(() => {
    cache.invalidate(getCacheKey());
    reset();
    fetchProjects(true);
  }, [cache, getCacheKey, reset, fetchProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    stats,
    loading,
    error,
    metrics,
    refresh,
    clearCache: cache.clear,
    isStale: () => cache.isStale(getCacheKey())
  };
};
