/**
 * Hook Projects Enterprise - Pattern SaaS Leaders
 * Inspiré de Stripe, Salesforce, Monday.com
 *
 * Fonctionnalités:
 * - Query-level filtering (sécurité maximale)
 * - Cache intelligent avec invalidation
 * - Pagination et lazy loading
 * - Métriques de performance
 * - Gestion d'erreurs robuste
 * - Real-time updates optimisés
 * - Abort controllers pour performance
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';

// Types optimisés pour l'enterprise
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  start_date?: string;
  end_date?: string;
  due_date?: string; // Alias pour compatibilité
  budget?: number;
  tenant_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  owner_id?: string;
  owner_name?: string; // Nom du responsable
  tenants?: { name: string };
  profiles?: { full_name: string };
  // Champs calculés
  progress?: number;
  task_count?: number;
  team_size?: number;
}

export interface ProjectMetrics {
  fetchTime: number;
  cacheHit: boolean;
  dataSize: number;
  lastUpdate: Date;
  queryComplexity: 'simple' | 'medium' | 'complex';
}

export interface ProjectPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
}

export interface ProjectFilters {
  status?: string[];
  priority?: string[];
  dateRange?: { start: string; end: string };
  search?: string;
  createdBy?: string;
}

export interface ProjectsData {
  projects: Project[];
  totalCount: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
}

/**
 * Hook Projects Enterprise - Pattern Leaders SaaS
 */
export const useProjectsEnterprise = (filters?: ProjectFilters) => {
  // États optimisés avec métriques
  const [data, setData] = useState<ProjectsData>({
    projects: [],
    totalCount: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueProjects: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    fetchTime: 0,
    cacheHit: false,
    dataSize: 0,
    lastUpdate: new Date(),
    queryComplexity: 'simple',
  });

  // Pagination state
  const [pagination, setPagination] = useState<ProjectPagination>({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false,
    totalPages: 0,
  });

  // Hooks externes
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { isSuperAdmin, isLoading: rolesLoading, userRoles } = useUserRoles();

  // Refs pour optimisations (Pattern Stripe/Salesforce)
  const fetchedRef = useRef(false);
  const tenantIdRef = useRef<string | null>(null);
  const filtersRef = useRef<ProjectFilters | undefined>(undefined);
  const cacheRef = useRef<Map<string, { data: ProjectsData; timestamp: number }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache TTL (5 minutes comme Stripe)
  const CACHE_TTL = 5 * 60 * 1000;

  // Fonction de cache intelligent (Pattern Stripe/Salesforce)
  const getCacheKey = useCallback(
    (
      tenantId: string | null,
      isSuperAdmin: boolean,
      filters?: ProjectFilters,
      page: number = 1
    ) => {
      const baseKey = `projects_${isSuperAdmin ? 'super_admin' : tenantId || 'no_tenant'}`;
      const filterKey = filters ? `_${JSON.stringify(filters)}` : '';
      const pageKey = `_page_${page}`;
      return `${baseKey}${filterKey}${pageKey}`;
    },
    []
  );

  const getCachedData = useCallback((cacheKey: string): ProjectsData | null => {
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // console.log('🎯 Cache hit for projects data:', cacheKey);
      return cached.data;
    }
    return null;
  }, []);

  const setCachedData = useCallback((cacheKey: string, data: ProjectsData) => {
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
    // console.log('💾 Cached projects data:', cacheKey);
  }, []);

  // Fonction de construction de requête optimisée (Pattern Enterprise)
  const buildQuery = useCallback(
    (
      isSuper: boolean,
      tenantId: string | null,
      filters?: ProjectFilters,
      page: number = 1,
      limit: number = 50
    ) => {
      // Construction de la requête avec le bon type
      // ✅ Inclure le join avec profiles pour récupérer le nom du manager
      let query = isSuper
        ? supabase
            .from('projects')
            .select('*, tenants:tenant_id(name), manager:manager_id(id, full_name)', {
              count: 'exact',
            })
        : supabase
            .from('projects')
            .select('*, manager:manager_id(id, full_name)', { count: 'exact' });

      // Filtrage par tenant (sécurité enterprise)
      if (!isSuper && tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      // Filtres avancés (Pattern Monday.com)
      if (filters) {
        if (filters.status?.length) {
          query = query.in('status', filters.status);
        }
        if (filters.priority?.length) {
          query = query.in('priority', filters.priority);
        }
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
        if (filters.createdBy) {
          query = query.eq('created_by', filters.createdBy);
        }
        if (filters.dateRange) {
          query = query
            .gte('start_date', filters.dateRange.start)
            .lte('end_date', filters.dateRange.end);
        }
      }

      // Pagination (Pattern Stripe)
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      return query.order('created_at', { ascending: false }).range(from, to);
    },
    []
  );

  // Fonction de fetch principale optimisée
  const fetchProjects = useCallback(
    async (page: number = 1, forceRefresh: boolean = false) => {
      // Annuler la requête précédente (Pattern Linear)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const startTime = performance.now();
        setLoading(true);
        setError(null);

        const isSuper = isSuperAdmin();
        const cacheKey = getCacheKey(tenantId, isSuper, filters, page);

        // Vérifier le cache d'abord (sauf si force refresh)
        if (!forceRefresh) {
          const cachedData = getCachedData(cacheKey);
          if (cachedData) {
            setData(cachedData);
            setMetrics(prev => ({
              ...prev,
              cacheHit: true,
              fetchTime: performance.now() - startTime,
              lastUpdate: new Date(),
            }));
            setLoading(false);
            return;
          }
        }

        // console.log('🔄 Fetching projects data:', {
        //   tenant: tenantId || 'ALL_TENANTS (Super Admin)',
        //   isSuperAdmin: isSuper,
        //   filters,
        //   page,
        //   cacheKey
        // });

        // Construction et exécution de la requête (Pattern Enterprise)
        const query = buildQuery(isSuper, tenantId, filters, page, pagination.limit);
        const { data: projects, error: projectsError, count } = await query;

        if (projectsError) {
          throw new Error(projectsError.message);
        }

        // Cast et mapping pour éviter les erreurs de typage Supabase
        const projectsList = (projects || []).map((p: any) => ({
          ...p,
          // ✅ Mapper le manager depuis le join profiles (si la FK existe)
          manager: p.manager?.full_name || p.owner_name || null,
          owner_name: p.manager?.full_name || p.owner_name || null,
        })) as Project[];

        // Calculer les métriques business (Pattern Salesforce)
        const activeProjects = projectsList.filter(p => p.status === 'active').length;
        const completedProjects = projectsList.filter(p => p.status === 'completed').length;
        const overdueProjects = projectsList.filter(p => {
          if (!p.end_date) return false;
          return new Date(p.end_date) < new Date() && p.status !== 'completed';
        }).length;

        const newData: ProjectsData = {
          projects: projectsList,
          totalCount: count || 0,
          activeProjects,
          completedProjects,
          overdueProjects,
        };

        // Calculer les métriques de performance
        const endTime = performance.now();
        const fetchTime = endTime - startTime;
        const dataSize = JSON.stringify(newData).length;
        const queryComplexity = filters ? 'complex' : isSuper ? 'medium' : 'simple';

        // Mettre en cache les données
        setCachedData(cacheKey, newData);

        // Mettre à jour les états
        setData(newData);
        setMetrics({
          fetchTime,
          cacheHit: false,
          dataSize,
          lastUpdate: new Date(),
          queryComplexity,
        });

        // Mettre à jour la pagination
        setPagination(prev => ({
          ...prev,
          page,
          total: count || 0,
          hasMore: (count || 0) > page * pagination.limit,
          totalPages: Math.ceil((count || 0) / pagination.limit),
        }));

        // console.log('✅ Projects data loaded:', {
        //   projects: newData.projects.length,
        //   totalCount: newData.totalCount,
        //   activeProjects: newData.activeProjects,
        //   completedProjects: newData.completedProjects,
        //   overdueProjects: newData.overdueProjects,
        //   isSuperAdmin: isSuper,
        //   scope: isSuper ? 'ALL_TENANTS' : `TENANT_${tenantId}`,
        //   fetchTime: `${fetchTime.toFixed(2)}ms`,
        //   dataSize: `${(dataSize / 1024).toFixed(2)}KB`,
        //   queryComplexity,
        //   cacheKey
        // });
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // console.log('🚫 Projects fetch aborted');
          return;
        }

        console.error('❌ Error fetching projects data:', error);
        setError(error.message || 'Erreur de chargement des projets');

        toast({
          title: 'Erreur',
          description: 'Impossible de charger les projets',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      tenantId,
      isSuperAdmin,
      filters,
      pagination.limit,
      getCacheKey,
      getCachedData,
      setCachedData,
      buildQuery,
      toast,
    ]
  );

  // Effect principal avec protection anti-boucle
  useEffect(() => {
    if (rolesLoading) {
      // console.log('⏳ Roles still loading...');
      return;
    }

    // Super Admin peut accéder aux données même sans tenant_id
    if (!tenantId && !isSuperAdmin()) {
      // console.log('⚠️ No tenant ID available and not Super Admin');
      setLoading(false);
      return;
    }

    // Éviter les refetch inutiles
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(filtersRef.current);
    const tenantChanged = tenantIdRef.current !== tenantId;

    if (fetchedRef.current && !filtersChanged && !tenantChanged) {
      // console.log('📦 Projects data already fetched, skipping...');
      return;
    }

    // Marquer comme en cours de fetch
    fetchedRef.current = true;
    tenantIdRef.current = tenantId;
    filtersRef.current = filters;

    fetchProjects(1);
  }, [tenantId, rolesLoading, filters, fetchProjects, isSuperAdmin]);

  // Fonctions utilitaires optimisées (Pattern Enterprise)
  const refresh = useCallback(() => {
    const cacheKey = getCacheKey(tenantId, isSuperAdmin(), filters, pagination.page);
    cacheRef.current.delete(cacheKey);
    fetchedRef.current = false;
    tenantIdRef.current = null;
    filtersRef.current = undefined;
    fetchProjects(pagination.page, true);
    // console.log('🔄 Cache invalidated and refresh triggered:', cacheKey);
  }, [tenantId, isSuperAdmin, filters, pagination.page, getCacheKey, fetchProjects]);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetchProjects(pagination.page + 1);
    }
  }, [pagination.hasMore, pagination.page, loading, fetchProjects]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    // console.log('🗑️ All projects cache cleared');
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      size: cacheRef.current.size,
      keys: Array.from(cacheRef.current.keys()),
      totalSize: Array.from(cacheRef.current.values()).reduce(
        (acc, { data }) => acc + JSON.stringify(data).length,
        0
      ),
    };
  }, []);

  // ✅ Fonction pour mettre à jour un projet (ÉDITION INLINE)
  const updateProject = useCallback(
    async (projectId: string, updates: Partial<Project>) => {
      try {
        const { error: updateError } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', projectId);

        if (updateError) throw updateError;

        // Invalider le cache et refresh
        refresh();
      } catch (error: any) {
        console.error('Error updating project:', error);
        throw error;
      }
    },
    [refresh]
  );

  // Cleanup lors du démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Déterminer les informations d'accès pour l'UX
  const currentUserRole = userRoles[0]?.roles?.name || 'Aucun rôle';
  const requiredRole = 'project_manager, tenant_admin ou super_admin';

  // SOLUTION TEMPORAIRE : Récupérer le tenant_id depuis user_roles si useTenant échoue
  const tenantIdFromRoles = userRoles[0]?.tenant_id;
  const effectiveTenantId = tenantId || tenantIdFromRoles;

  // Vérifier si l'utilisateur a le bon rôle
  const hasRequiredRole =
    isSuperAdmin() || currentUserRole === 'project_manager' || currentUserRole === 'tenant_admin';

  const hasAccess = hasRequiredRole && !!effectiveTenantId;

  return {
    // Données
    ...data,

    // États
    loading,
    error,

    // Métriques de performance
    metrics,
    pagination,

    // Permissions optimisées
    canAccess: hasAccess,
    isSuperAdmin: isSuperAdmin(),

    // Informations d'accès pour l'UX
    accessInfo: {
      hasAccess,
      currentRole: currentUserRole,
      requiredRole,
      reason: !hasAccess ? (!userRoles.length ? 'no_role' : 'insufficient_permissions') : null,
    },

    // Actions optimisées
    refresh,
    loadMore,
    clearCache,
    getCacheStats,
    updateProject, // ✅ Fonction d'édition inline

    // Utilitaires
    isDataStale: metrics.lastUpdate && Date.now() - metrics.lastUpdate.getTime() > CACHE_TTL,
    cacheKey: getCacheKey(tenantId, isSuperAdmin(), filters, pagination.page),

    // Fonctions de navigation
    goToPage: (page: number) => fetchProjects(page),
    setFilters: (newFilters: ProjectFilters) => {
      filtersRef.current = newFilters;
      fetchedRef.current = false;
      fetchProjects(1);
    },
  };
};
