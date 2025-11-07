/**
 * Système de Cache Intelligent pour les Rôles et Permissions
 * Inspiré des meilleures pratiques de Auth0, Firebase Auth, et AWS Cognito
 */

import { UserRole, UserPermission } from './permissionsSystem';

// Configuration du cache (ajustable selon les besoins)
const CACHE_CONFIG = {
  // Durée de vie du cache en millisecondes
  TTL_ROLES: 15 * 60 * 1000, // 15 minutes pour les rôles
  TTL_PERMISSIONS: 10 * 60 * 1000, // 10 minutes pour les permissions
  TTL_ACCESS_RIGHTS: 5 * 60 * 1000, // 5 minutes pour les droits d'accès calculés

  // Clés de stockage
  STORAGE_PREFIX: 'wadashaqeen_auth_',

  // Événements d'invalidation
  INVALIDATION_EVENTS: [
    'role_updated',
    'permission_changed',
    'user_role_assigned',
    'user_role_revoked',
    'tenant_changed',
  ],
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
  userId: string;
  tenantId?: string;
}

interface RoleCacheData {
  userRoles: UserRole[];
  userPermissions: UserPermission[];
  accessRights: Record<string, boolean>;
  accessLevel: string;
  lastUpdated: number;
}

/**
 * Gestionnaire de Cache Intelligent pour les Rôles
 * Implémente les patterns de cache des leaders du marché
 */
class RoleCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private eventListeners = new Set<(event: string, data?: any) => void>();
  private refreshPromises = new Map<string, Promise<any>>();

  constructor() {
    // Nettoyer le cache expiré périodiquement
    this.startCleanupInterval();

    // Écouter les événements de changement d'authentification
    this.setupAuthListeners();

    // Restaurer le cache depuis localStorage au démarrage
    this.restoreFromStorage();
  }

  /**
   * Générer une clé de cache unique
   */
  private generateCacheKey(type: string, userId: string, tenantId?: string): string {
    const base = `${CACHE_CONFIG.STORAGE_PREFIX}${type}_${userId}`;
    return tenantId ? `${base}_${tenantId}` : base;
  }

  /**
   * Vérifier si une entrée de cache est valide
   */
  private isValidCacheEntry<T>(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    return entry.expiresAt > now && entry.data !== null;
  }

  /**
   * Obtenir une entrée du cache
   */
  private getCacheEntry<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || !this.isValidCacheEntry(entry)) {
      this.cache.delete(key);
      this.removeFromStorage(key);
      return null;
    }
    return entry.data;
  }

  /**
   * Définir une entrée dans le cache
   */
  private setCacheEntry<T>(
    key: string,
    data: T,
    ttl: number,
    userId: string,
    tenantId?: string
  ): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      version: this.generateVersion(),
      userId,
      tenantId,
    };

    this.cache.set(key, entry);
    this.saveToStorage(key, entry);
  }

  /**
   * Générer une version pour la cohérence du cache
   */
  private generateVersion(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sauvegarder dans localStorage (avec gestion d'erreurs)
   */
  private saveToStorage<T>(key: string, entry: CacheEntry<T>): void {
    try {
      const serialized = JSON.stringify(entry);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.warn('Impossible de sauvegarder le cache dans localStorage:', error);
    }
  }

  /**
   * Restaurer depuis localStorage
   */
  private restoreFromStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(key =>
        key.startsWith(CACHE_CONFIG.STORAGE_PREFIX)
      );

      keys.forEach(key => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry = JSON.parse(stored);
            if (this.isValidCacheEntry(entry)) {
              this.cache.set(key, entry);
            } else {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          console.warn(`Erreur lors de la restauration du cache ${key}:`, error);
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Erreur lors de la restauration du cache:', error);
    }
  }

  /**
   * Supprimer du localStorage
   */
  private removeFromStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Erreur lors de la suppression du cache:', error);
    }
  }

  /**
   * Nettoyer le cache expiré
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      this.cache.forEach((entry, key) => {
        if (entry.expiresAt <= now) {
          expiredKeys.push(key);
        }
      });

      expiredKeys.forEach(key => {
        this.cache.delete(key);
        this.removeFromStorage(key);
      });

      if (expiredKeys.length > 0) {
        console.log(`🧹 Cache nettoyé: ${expiredKeys.length} entrées expirées supprimées`);
      }
    }, 60000); // Nettoyer chaque minute
  }

  /**
   * Écouter les événements d'authentification
   */
  private setupAuthListeners(): void {
    // Écouter les changements de session
    window.addEventListener('storage', event => {
      if (event.key?.startsWith(CACHE_CONFIG.STORAGE_PREFIX)) {
        // Un autre onglet a modifié le cache
        this.restoreFromStorage();
        this.notifyListeners('cache_updated', { key: event.key });
      }
    });

    // Écouter les événements personnalisés d'invalidation
    CACHE_CONFIG.INVALIDATION_EVENTS.forEach(eventType => {
      window.addEventListener(eventType, () => {
        this.invalidateAll();
      });
    });
  }

  /**
   * Obtenir les rôles depuis le cache ou les récupérer
   */
  async getRoles(
    userId: string,
    tenantId: string | undefined,
    fetchFunction: () => Promise<UserRole[]>
  ): Promise<UserRole[]> {
    const key = this.generateCacheKey('roles', userId, tenantId);

    // Vérifier le cache d'abord
    const cached = this.getCacheEntry<UserRole[]>(key);
    if (cached) {
      // console.log('🎯 Rôles récupérés depuis le cache:', userId);
      return cached;
    }

    // Éviter les requêtes multiples simultanées
    if (this.refreshPromises.has(key)) {
      // console.log('⏳ Attente de la requête en cours pour les rôles:', userId);
      return this.refreshPromises.get(key)!;
    }

    // Récupérer depuis la base de données
    const promise = this.fetchWithRetry(fetchFunction, 3)
      .then(roles => {
        // console.log('🔄 Rôles récupérés depuis la DB et mis en cache:', userId);
        this.setCacheEntry(key, roles, CACHE_CONFIG.TTL_ROLES, userId, tenantId);
        this.refreshPromises.delete(key);
        return roles;
      })
      .catch(error => {
        // console.error('❌ Erreur lors de la récupération des rôles:', error);
        this.refreshPromises.delete(key);
        throw error;
      });

    this.refreshPromises.set(key, promise);
    return promise;
  }

  /**
   * Obtenir les permissions depuis le cache ou les récupérer
   */
  async getPermissions(
    userId: string,
    tenantId: string | undefined,
    roleIds: string[],
    fetchFunction: () => Promise<UserPermission[]>
  ): Promise<UserPermission[]> {
    const key = this.generateCacheKey('permissions', userId, tenantId);

    const cached = this.getCacheEntry<UserPermission[]>(key);
    if (cached) {
      // console.log('🎯 Permissions récupérées depuis le cache:', userId);
      return cached;
    }

    if (this.refreshPromises.has(key)) {
      return this.refreshPromises.get(key)!;
    }

    const promise = this.fetchWithRetry(fetchFunction, 3)
      .then(permissions => {
        // console.log('🔄 Permissions récupérées depuis la DB et mises en cache:', userId);
        this.setCacheEntry(key, permissions, CACHE_CONFIG.TTL_PERMISSIONS, userId, tenantId);
        this.refreshPromises.delete(key);
        return permissions;
      })
      .catch(error => {
        // console.error('❌ Erreur lors de la récupération des permissions:', error);
        this.refreshPromises.delete(key);
        throw error;
      });

    this.refreshPromises.set(key, promise);
    return promise;
  }

  /**
   * Obtenir les droits d'accès calculés depuis le cache
   */
  getAccessRights(userId: string, tenantId?: string): Record<string, boolean> | null {
    const key = this.generateCacheKey('access_rights', userId, tenantId);
    return this.getCacheEntry<Record<string, boolean>>(key);
  }

  /**
   * Définir les droits d'accès calculés dans le cache
   */
  setAccessRights(
    userId: string,
    tenantId: string | undefined,
    accessRights: Record<string, boolean>
  ): void {
    const key = this.generateCacheKey('access_rights', userId, tenantId);
    this.setCacheEntry(key, accessRights, CACHE_CONFIG.TTL_ACCESS_RIGHTS, userId, tenantId);
  }

  /**
   * Récupération avec retry automatique
   */
  private async fetchWithRetry<T>(fetchFunction: () => Promise<T>, maxRetries: number): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fetchFunction();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Backoff exponentiel
          console.warn(`Tentative ${attempt} échouée, retry dans ${delay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Invalider le cache pour un utilisateur spécifique
   */
  invalidateUser(userId: string, tenantId?: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.userId === userId && (!tenantId || entry.tenantId === tenantId)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.removeFromStorage(key);
    });

    console.log(
      `🗑️ Cache invalidé pour l'utilisateur ${userId}: ${keysToDelete.length} entrées supprimées`
    );
    this.notifyListeners('user_cache_invalidated', { userId, tenantId });
  }

  /**
   * Invalider tout le cache
   */
  invalidateAll(): void {
    console.log('🗑️ Invalidation complète du cache des rôles');
    this.cache.clear();

    // Nettoyer localStorage
    try {
      const keys = Object.keys(localStorage).filter(key =>
        key.startsWith(CACHE_CONFIG.STORAGE_PREFIX)
      );
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Erreur lors du nettoyage du localStorage:', error);
    }

    this.notifyListeners('cache_cleared');
  }

  /**
   * Forcer le rafraîchissement du cache pour un utilisateur
   */
  async refreshUser(
    userId: string,
    tenantId: string | undefined,
    fetchRoles: () => Promise<UserRole[]>,
    fetchPermissions: () => Promise<UserPermission[]>
  ): Promise<void> {
    console.log('🔄 Rafraîchissement forcé du cache pour:', userId);

    // Invalider le cache existant
    this.invalidateUser(userId, tenantId);

    // Récupérer les nouvelles données
    try {
      await Promise.all([
        this.getRoles(userId, tenantId, fetchRoles),
        this.getPermissions(userId, tenantId, [], fetchPermissions),
      ]);

      this.notifyListeners('user_cache_refreshed', { userId, tenantId });
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du cache:', error);
      throw error;
    }
  }

  /**
   * Ajouter un listener d'événements
   */
  addEventListener(callback: (event: string, data?: any) => void): () => void {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  /**
   * Notifier les listeners
   */
  private notifyListeners(event: string, data?: any): void {
    this.eventListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Erreur dans le listener de cache:', error);
      }
    });
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    memoryUsage: string;
  } {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;

    this.cache.forEach(entry => {
      if (entry.expiresAt > now) {
        validCount++;
      } else {
        expiredCount++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries: validCount,
      expiredEntries: expiredCount,
      memoryUsage: `${Math.round(JSON.stringify([...this.cache.entries()]).length / 1024)}KB`,
    };
  }

  /**
   * Précharger le cache pour un utilisateur
   */
  async preloadUser(
    userId: string,
    tenantId: string | undefined,
    fetchRoles: () => Promise<UserRole[]>,
    fetchPermissions: () => Promise<UserPermission[]>
  ): Promise<void> {
    console.log('⚡ Préchargement du cache pour:', userId);

    try {
      await Promise.all([
        this.getRoles(userId, tenantId, fetchRoles),
        this.getPermissions(userId, tenantId, [], fetchPermissions),
      ]);

      console.log('✅ Cache préchargé avec succès pour:', userId);
    } catch (error) {
      console.error('❌ Erreur lors du préchargement du cache:', error);
    }
  }
}

// Instance singleton du gestionnaire de cache
export const roleCacheManager = new RoleCacheManager();

// Fonction utilitaire pour déclencher l'invalidation
export const invalidateRoleCache = (userId?: string, tenantId?: string) => {
  if (userId) {
    roleCacheManager.invalidateUser(userId, tenantId);
  } else {
    roleCacheManager.invalidateAll();
  }
};

// Fonction pour rafraîchir le cache
export const refreshRoleCache = async (
  userId: string,
  tenantId: string | undefined,
  fetchRoles: () => Promise<UserRole[]>,
  fetchPermissions: () => Promise<UserPermission[]>
) => {
  return roleCacheManager.refreshUser(userId, tenantId, fetchRoles, fetchPermissions);
};

export default roleCacheManager;
