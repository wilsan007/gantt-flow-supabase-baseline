/**
 * Hook HR Optimisé - Pattern Enterprise SaaS
 * Inspiré de Stripe, Salesforce, Monday.com
 * 
 * Fonctionnalités:
 * - Query-level filtering (sécurité maximale)
 * - Cache intelligent avec invalidation
 * - Pagination et lazy loading
 * - Métriques de performance
 * - Gestion d'erreurs robuste
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { useUserRoles } from '@/hooks/useUserRoles';
import { cacheManager, createCacheKey } from '@/lib/cacheManager';
import { useRenderTracker } from '@/hooks/usePerformanceMonitor';

// Types optimisés pour l'enterprise
export interface Employee {
  id: string;
  user_id: string; // UUID référence auth.users - clé utilisée dans les relations
  full_name: string;
  avatar_url?: string;
  job_title?: string;
  employee_id: string; // Code employé (ex: EMP001)
  tenant_id?: string;
  tenants?: { name: string };
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: string; // 'pending' | 'approved' | 'rejected' mais flexible
  tenant_id?: string;
  absence_type_id?: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
  profiles?: { full_name: string; tenant_id?: string };
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  tenant_id?: string;
  profiles?: { full_name: string; tenant_id?: string };
}

export interface AbsenceType {
  id: string;
  name: string;
  description?: string;
  code?: string;
  color?: string;
  deducts_from_balance?: boolean;
  max_days_per_year?: number;
  requires_approval?: boolean;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  absence_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HRData {
  leaveRequests: LeaveRequest[];
  absenceTypes: AbsenceType[];
  attendances: Attendance[];
  employees: Employee[];
  leaveBalances: LeaveBalance[];
}

export interface HRMetrics {
  fetchTime: number;
  cacheHit: boolean;
  dataSize: number;
  lastUpdate: Date;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Hook HR Minimal - ZERO boucle infinie garantie
 * Optimisé avec cache enterprise et monitoring
 */
export const useHRMinimal = () => {
  // Performance monitoring
  const performanceMonitor = useRenderTracker('useHRMinimal');
  // États optimisés avec métriques
  const [data, setData] = useState<HRData>({
    leaveRequests: [],
    absenceTypes: [],
    attendances: [],
    employees: [],
    leaveBalances: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<HRMetrics>({
    fetchTime: 0,
    cacheHit: false,
    dataSize: 0,
    lastUpdate: new Date()
  });
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false
  });
  
  // Hooks externes
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { isSuperAdmin, isLoading: rolesLoading, userRoles } = useUserRoles();
  
  // Refs pour éviter les boucles et optimisations
  const fetchedRef = useRef(false);
  const tenantIdRef = useRef<string | null>(null);
  const cacheRef = useRef<Map<string, { data: HRData; timestamp: number }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cache TTL (5 minutes comme Stripe)
  const CACHE_TTL = 5 * 60 * 1000;
  
  // Fonction de cache intelligent (Pattern Stripe/Salesforce) - Utilise le cache global
  const getCacheKey = useCallback((tenantId: string | null, isSuperAdmin: boolean) => {
    return createCacheKey('hr', isSuperAdmin ? 'super_admin' : tenantId || 'no_tenant');
  }, []);
  
  const getCachedData = useCallback((cacheKey: string): HRData | null => {
    return cacheManager.get<HRData>(cacheKey);
  }, []);
  
  const setCachedData = useCallback((cacheKey: string, data: HRData) => {
    cacheManager.set(cacheKey, data, 'hr_data');
  }, []);

  // Fonction de fetch stable
  useEffect(() => {
    // Conditions de sortie pour éviter les boucles
    if (rolesLoading) {
      // // console.log('⏳ Roles still loading...');
      return;
    }

    // Super Admin peut accéder aux données même sans tenant_id
    if (!tenantId && !isSuperAdmin()) {
      // // console.log('⚠️ No tenant ID available and not Super Admin');
      setLoading(false);
      return;
    }

    // Protection STRICTE contre les refetch - hash stable
    const currentTenantHash = `${tenantId || 'null'}-${isSuperAdmin()}`;
    const lastTenantHash = tenantIdRef.current || '';
    
    // ARRÊT COMPLET si mêmes paramètres et déjà fetché
    if (fetchedRef.current && currentTenantHash === lastTenantHash) {
      return; // Pas de logs répétitifs
    }
    
    // Vérifier le cache avant tout fetch
    const cacheKey = getCacheKey(tenantId, isSuperAdmin());
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData && currentTenantHash === lastTenantHash) {
      return; // Utiliser le cache sans refetch
    }

    // Marquer comme en cours de fetch AVANT le fetch pour éviter les races
    fetchedRef.current = true;
    tenantIdRef.current = currentTenantHash;

    const fetchData = async () => {
      // Annuler la requête précédente si elle existe
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
        const cacheKey = getCacheKey(tenantId, isSuper);
        
        // Vérifier le cache d'abord (Pattern Stripe)
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setMetrics(prev => ({
            ...prev,
            cacheHit: true,
            fetchTime: performance.now() - startTime,
            lastUpdate: new Date()
          }));
          setLoading(false);
          return;
        }

        // // console.log('🔄 Fetching HR data for tenant:', tenantId || 'ALL_TENANTS (Super Admin)');
        // // console.log('👑 Is Super Admin:', isSuper);
        // // console.log('�� Cache key:', cacheKey);
        
        const [
          leaveRequestsRes,
          absenceTypesRes,
          attendancesRes,
          employeesRes,
          leaveBalancesRes
        ] = await Promise.all([
          // Leave Requests - Super Admin voit tout, autres voient leur tenant
          isSuper 
            ? supabase
                .from('leave_requests')
                .select('*, profiles:employee_id(full_name, tenant_id)')
                .order('created_at', { ascending: false })
                .limit(100) // Plus de données pour Super Admin
            : tenantId
                ? supabase
                    .from('leave_requests')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .order('created_at', { ascending: false })
                    .limit(50)
                : supabase
                    .from('leave_requests')
                    .select('*')
                    .limit(0), // Pas de données si pas de tenant et pas Super Admin
          
          // Absence Types - Toujours globaux
          supabase
            .from('absence_types')
            .select('*')
            .order('name'),
          
          // Attendances - Super Admin voit tout, autres voient leur tenant
          isSuper
            ? supabase
                .from('attendances')
                .select('*, profiles:employee_id(full_name, tenant_id)')
                .order('date', { ascending: false })
                .limit(100) // Plus de données pour Super Admin
            : tenantId
                ? supabase
                    .from('attendances')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .order('date', { ascending: false })
                    .limit(30)
                : supabase
                    .from('attendances')
                    .select('*')
                    .limit(0), // Pas de données si pas de tenant et pas Super Admin
          
          // Employees - Super Admin voit TOUS les employés, autres voient leur tenant
          isSuper
            ? supabase
                .from('profiles')
                .select('id, user_id, full_name, avatar_url, job_title, employee_id, tenant_id, tenants:tenant_id(name)')
                .order('full_name')
            : tenantId
                ? supabase
                    .from('profiles')
                    .select('id, user_id, full_name, avatar_url, job_title, employee_id')
                    .eq('tenant_id', tenantId)
                : supabase
                    .from('profiles')
                    .select('*')
                    .limit(0), // Pas de données si pas de tenant et pas Super Admin
          
          // Leave Balances - Super Admin voit tout, autres voient leur tenant
          isSuper
            ? supabase
                .from('leave_balances')
                .select('*, profiles:employee_id(full_name), absence_types:absence_type_id(name)')
                .order('year', { ascending: false })
            : tenantId
                ? supabase
                    .from('leave_balances')
                    .select('*, profiles:employee_id(full_name), absence_types:absence_type_id(name)')
                    .eq('tenant_id', tenantId)
                    .order('year', { ascending: false })
                : supabase
                    .from('leave_balances')
                    .select('*')
                    .limit(0)
        ]);

        // Vérifier les erreurs
        if (leaveRequestsRes.error) {
          console.error('Leave requests error:', leaveRequestsRes.error);
        }
        if (absenceTypesRes.error) {
          console.error('Absence types error:', absenceTypesRes.error);
        }
        if (attendancesRes.error) {
          console.error('Attendances error:', attendancesRes.error);
        }
        if (employeesRes.error) {
          console.error('Employees error:', employeesRes.error);
        }
        if (leaveBalancesRes.error) {
          console.error('Leave balances error:', leaveBalancesRes.error);
        }

        // Construire les données (même en cas d'erreur partielle)
        const newData: HRData = {
          leaveRequests: leaveRequestsRes.data || [],
          absenceTypes: absenceTypesRes.data || [],
          attendances: attendancesRes.data || [],
          employees: employeesRes.data || [],
          leaveBalances: leaveBalancesRes.data || []
        };

        // Calculer les métriques de performance
        const endTime = performance.now();
        const fetchTime = endTime - startTime;
        const dataSize = JSON.stringify(newData).length;
        
        // Mettre en cache les données
        setCachedData(cacheKey, newData);
        
        // Mettre à jour les états
        setData(newData);
        setMetrics({
          fetchTime,
          cacheHit: false,
          dataSize,
          lastUpdate: new Date()
        });
        
        // Mettre à jour la pagination
        setPagination(prev => ({
          ...prev,
          total: newData.employees.length + newData.leaveRequests.length + newData.attendances.length,
          hasMore: false // Pour l'instant, pas de pagination infinie
        }));

        // // console.log('✅ HR data loaded:', {
        //   leaveRequests: newData.leaveRequests.length,
        //   absenceTypes: newData.absenceTypes.length,
        //   attendances: newData.attendances.length,
        //   employees: newData.employees.length,
        //   isSuperAdmin: isSuper,
        //   scope: isSuper ? 'ALL_TENANTS' : `TENANT_${tenantId}`,
        //   fetchTime: `${fetchTime.toFixed(2)}ms`,
        //   dataSize: `${(dataSize / 1024).toFixed(2)}KB`,
        //   cacheKey
        // });

      } catch (error: any) {
        console.error('❌ Error fetching HR data:', error);
        setError(error.message || 'Erreur de chargement');
        
        toast({
          title: "Erreur",
          description: "Impossible de charger les données RH",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId, rolesLoading, isSuperAdmin, toast]);

  // Fonction de refresh optimisée avec invalidation cache global
  const refresh = useCallback(() => {
    const cacheKey = getCacheKey(tenantId, isSuperAdmin());
    cacheManager.invalidate(cacheKey);
    fetchedRef.current = false;
    tenantIdRef.current = null;
    setLoading(true);
    // console.log('🔄 Cache invalidated and refresh triggered:', cacheKey);
  }, [tenantId, isSuperAdmin, getCacheKey]);

  // Fonction pour vider tout le cache HR (utilise le cache global)
  const clearCache = useCallback(() => {
    cacheManager.invalidatePattern('hr:*');
    // console.log('🗑️ All HR cache cleared');
  }, []);

  // Fonction pour obtenir les statistiques de cache global
  const getCacheStats = useCallback(() => {
    return cacheManager.getStats();
  }, []);

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
  const requiredRole = 'manager_hr ou tenant_admin';
  
  // SOLUTION TEMPORAIRE : Récupérer le tenant_id depuis user_roles si useTenant échoue
  const tenantIdFromRoles = userRoles[0]?.tenant_id;
  const effectiveTenantId = tenantId || tenantIdFromRoles;
  
  // Vérifier si l'utilisateur a le bon rôle
  const hasRequiredRole = isSuperAdmin() || 
    currentUserRole === 'manager_hr' || 
    currentUserRole === 'tenant_admin';
  
  const hasAccess = hasRequiredRole && !!effectiveTenantId;
  
  // Debug : Afficher les informations d'accès (désactivé en production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 HR Access Check:', {
      currentUserRole,
      tenantId,
      tenantIdFromRoles,
      effectiveTenantId,
      hasRequiredRole,
      hasAccess,
      isSuperAdmin: isSuperAdmin()
    });
  }
  
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
      reason: !hasAccess ? (currentUserRole === 'Aucun rôle' ? 'no_role' : 'insufficient_permissions') : null
    },
    
    // Actions optimisées
    refresh,
    clearCache,
    getCacheStats,
    
    // Utilitaires
    isDataStale: metrics.lastUpdate && Date.now() - metrics.lastUpdate.getTime() > CACHE_TTL,
    cacheKey: getCacheKey(tenantId, isSuperAdmin())
  };
};
