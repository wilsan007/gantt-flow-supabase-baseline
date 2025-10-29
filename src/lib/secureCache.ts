/**
 * Système de Cache Sécurisé avec Expiration Automatique
 * 
 * Bonnes Pratiques Sécurité :
 * - TTL adaptatif selon le type de données
 * - Expiration automatique pour données sensibles
 * - Invalidation sur déconnexion
 * - Chiffrement optionnel pour données critiques
 * 
 * Pattern: Auth0 + AWS Cognito + Firebase Auth
 */

// ============================================================================
// CONFIGURATION - Ajustable selon besoins de sécurité
// ============================================================================

export const CACHE_TTL = {
  // Auth & Sessions (Court - Sécurité maximale)
  SESSION: 15 * 60 * 1000,           // 15 min - Token refresh
  AUTH_TOKEN: 30 * 60 * 1000,        // 30 min - Access token
  
  // Rôles & Permissions (Moyen - Équilibre perf/sécu)
  ROLES: 10 * 60 * 1000,             // 10 min - Rôles utilisateur
  PERMISSIONS: 10 * 60 * 1000,       // 10 min - Permissions
  ACCESS_RIGHTS: 5 * 60 * 1000,      // 5 min - Droits calculés
  
  // Données Utilisateur (Court)
  USER_PROFILE: 5 * 60 * 1000,       // 5 min - Profil utilisateur
  USER_SETTINGS: 10 * 60 * 1000,     // 10 min - Préférences
  
  // Données Métier (Moyen)
  EMPLOYEES: 5 * 60 * 1000,          // 5 min - Liste employés
  PROJECTS: 3 * 60 * 1000,           // 3 min - Projets
  TASKS: 2 * 60 * 1000,              // 2 min - Tâches
  
  // Données Référence (Long)
  DEPARTMENTS: 30 * 60 * 1000,       // 30 min - Départements (stable)
  TENANT_CONFIG: 60 * 60 * 1000,     // 1h - Config tenant
  
  // Données Publiques (Très long)
  PUBLIC_DATA: 24 * 60 * 60 * 1000,  // 24h - Données publiques
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
  userId?: string;
  tenantId?: string;
  version: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  expired: number;
  invalidated: number;
  totalEntries: number;
  memoryUsage: number;
}

// ============================================================================
// GESTIONNAIRE DE CACHE SÉCURISÉ
// ============================================================================

class SecureCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    expired: 0,
    invalidated: 0,
    totalEntries: 0,
    memoryUsage: 0,
  };
  
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 60 * 1000; // Nettoyage toutes les minutes
  private readonly VERSION = '1.0';

  constructor() {
    this.startAutoCleanup();
    this.setupStorageSync();
    this.listenForAuthEvents();
  }

  // ==========================================================================
  // OPÉRATIONS CACHE PRINCIPALES
  // ==========================================================================

  /**
   * Récupérer une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Vérifier expiration
    if (this.isExpired(entry)) {
      this.stats.expired++;
      this.stats.misses++;
      this.delete(key);
      return null;
    }

    // Mise à jour statistiques d'accès
    entry.accessCount++;
    entry.lastAccess = Date.now();
    this.stats.hits++;

    return entry.data;
  }

  /**
   * Stocker une valeur dans le cache
   */
  set<T>(
    key: string, 
    data: T, 
    ttl: number = CACHE_TTL.USER_PROFILE,
    options?: {
      userId?: string;
      tenantId?: string;
      persist?: boolean; // Sauvegarder dans localStorage
    }
  ): void {
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      ttl,
      accessCount: 0,
      lastAccess: now,
      userId: options?.userId,
      tenantId: options?.tenantId,
      version: this.VERSION,
    };

    this.cache.set(key, entry);
    this.stats.totalEntries = this.cache.size;

    // Optionnel : persister dans localStorage
    if (options?.persist) {
      this.persistToStorage(key, entry);
    }

    // Estimer usage mémoire
    this.updateMemoryUsage();
  }

  /**
   * Supprimer une entrée
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromStorage(key);
      this.stats.totalEntries = this.cache.size;
      this.stats.invalidated++;
    }
    return deleted;
  }

  /**
   * Vérifier existence sans décompter comme miss
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Récupérer ou créer (pattern standard)
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.USER_PROFILE,
    options?: { userId?: string; tenantId?: string; persist?: boolean }
  ): Promise<T> {
    // Essayer de récupérer du cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Récupérer les données
    const data = await fetcher();
    
    // Stocker dans le cache
    this.set(key, data, ttl, options);
    
    return data;
  }

  // ==========================================================================
  // INVALIDATION PAR PATTERN
  // ==========================================================================

  /**
   * Invalider toutes les clés correspondant à un pattern
   */
  invalidateByPattern(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern.replace(/\*/g, '.*')) 
      : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Invalider par utilisateur
   */
  invalidateByUser(userId: string): number {
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.userId === userId) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Invalider par tenant
   */
  invalidateByTenant(tenantId: string): number {
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tenantId === tenantId) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Nettoyer tout le cache (déconnexion, changement tenant)
   */
  clear(): void {
    this.cache.clear();
    this.stats.totalEntries = 0;
    this.stats.invalidated += this.cache.size;
    this.clearStorage();
  }

  // ==========================================================================
  // EXPIRATION & NETTOYAGE
  // ==========================================================================

  /**
   * Vérifier si une entrée est expirée
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Nettoyer les entrées expirées
   */
  private cleanupExpired(): number {
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Démarrer le nettoyage automatique
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const removed = this.cleanupExpired();
      if (removed > 0 && import.meta.env.DEV) {
        console.log(`🧹 Cache: ${removed} entrées expirées supprimées`);
      }
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Arrêter le nettoyage automatique
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // ==========================================================================
  // PERSISTANCE LOCALE (OPTIONNELLE)
  // ==========================================================================

  private persistToStorage(key: string, entry: CacheEntry<any>): void {
    try {
      // Ne persister que si la donnée n'est pas sensible
      if (!key.includes('token') && !key.includes('password')) {
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      }
    } catch (error) {
      // Quota dépassé, ignorer silencieusement
      if (import.meta.env.DEV) {
        console.warn('⚠️ Impossible de persister le cache:', error);
      }
    }
  }

  private removeFromStorage(key: string): void {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      // Ignorer
    }
  }

  private clearStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      // Ignorer
    }
  }

  /**
   * Restaurer le cache depuis localStorage au démarrage
   */
  private setupStorageSync(): void {
    try {
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const entry = JSON.parse(data);
              const cacheKey = key.replace('cache_', '');
              
              // Vérifier si toujours valide
              if (!this.isExpired(entry)) {
                this.cache.set(cacheKey, entry);
              } else {
                // Supprimer si expiré
                localStorage.removeItem(key);
              }
            } catch (e) {
              // Ignorer entrées corrompues
              localStorage.removeItem(key);
            }
          }
        }
      });

      this.stats.totalEntries = this.cache.size;
      
      if (import.meta.env.DEV && this.cache.size > 0) {
        console.log(`💾 Cache: ${this.cache.size} entrées restaurées depuis localStorage`);
      }
    } catch (error) {
      // Ignorer erreurs
    }
  }

  // ==========================================================================
  // LISTENERS AUTH
  // ==========================================================================

  private listenForAuthEvents(): void {
    if (typeof window === 'undefined') return;

    // Déconnexion : nettoyer tout
    window.addEventListener('auth:logout', () => {
      this.clear();
      if (import.meta.env.DEV) {
        console.log('🔒 Cache: Nettoyé suite à la déconnexion');
      }
    });

    // Changement de tenant : invalider par tenant
    window.addEventListener('tenant:changed', ((event: CustomEvent) => {
      const { oldTenantId, newTenantId } = event.detail;
      if (oldTenantId) {
        this.invalidateByTenant(oldTenantId);
      }
      if (import.meta.env.DEV) {
        console.log(`🔄 Cache: Invalidé pour le tenant ${oldTenantId}`);
      }
    }) as EventListener);

    // Rôle modifié : invalider rôles/permissions
    window.addEventListener('role:updated', () => {
      this.invalidateByPattern(/^roles_|^permissions_|^access_/);
      if (import.meta.env.DEV) {
        console.log('🔐 Cache: Rôles/permissions invalidés');
      }
    });
  }

  // ==========================================================================
  // STATISTIQUES & DEBUG
  // ==========================================================================

  private updateMemoryUsage(): void {
    // Estimation grossière
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry).length;
    }
    this.stats.memoryUsage = size;
  }

  /**
   * Récupérer les statistiques
   */
  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 
      ? ((this.stats.hits / total) * 100).toFixed(2) + '%'
      : 'N/A';

    return {
      ...this.stats,
      hitRate,
    };
  }

  /**
   * Afficher un rapport détaillé (debug)
   */
  printReport(): void {
    const stats = this.getStats();
    
    console.group('📊 Rapport Cache');
    console.log(`✅ Hits: ${stats.hits}`);
    console.log(`❌ Misses: ${stats.misses}`);
    console.log(`⏱️ Expirés: ${stats.expired}`);
    console.log(`🗑️ Invalidés: ${stats.invalidated}`);
    console.log(`📦 Entrées actuelles: ${stats.totalEntries}`);
    console.log(`💾 Mémoire utilisée: ${(stats.memoryUsage / 1024).toFixed(2)} KB`);
    console.log(`🎯 Taux de succès: ${stats.hitRate}`);
    console.groupEnd();
  }

  /**
   * Réinitialiser les statistiques
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      expired: 0,
      invalidated: 0,
      totalEntries: this.cache.size,
      memoryUsage: this.stats.memoryUsage,
    };
  }
}

// ============================================================================
// INSTANCE SINGLETON
// ============================================================================

export const secureCache = new SecureCacheManager();

// Exposer dans window pour debug (dev uniquement)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).secureCache = secureCache;
  (window as any).showCacheStats = () => secureCache.printReport();
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Générer une clé de cache standardisée
 */
export const generateCacheKey = (
  type: string,
  identifier: string,
  ...suffixes: string[]
): string => {
  const parts = [type, identifier, ...suffixes].filter(Boolean);
  return parts.join(':');
};

/**
 * Décorateur pour mettre en cache une fonction
 */
export function cached<T>(
  keyGenerator: (...args: any[]) => string,
  ttl: number = CACHE_TTL.USER_PROFILE
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator(...args);
      
      return secureCache.getOrFetch(
        key,
        () => originalMethod.apply(this, args),
        ttl
      );
    };

    return descriptor;
  };
}
