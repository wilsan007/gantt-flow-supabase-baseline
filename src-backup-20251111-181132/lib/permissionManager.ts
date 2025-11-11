/**
 * Gestionnaire de Permissions Avancé
 * Inspiré des meilleures pratiques de Auth0, AWS IAM, et Google Cloud IAM
 *
 * Fonctionnalités:
 * - Évaluation des permissions en temps réel
 * - Cache intelligent avec invalidation
 * - Permissions contextuelles (tenant, projet, etc.)
 * - Audit trail des vérifications
 * - Fallback sécurisé (deny by default)
 */

import { UserRole, UserPermission, RoleNames, PermissionNames } from './permissionsSystem';
import { roleCacheManager } from './roleCache';

// Types pour le système de permissions avancé
export interface PermissionContext {
  tenantId?: string;
  projectId?: string;
  resourceId?: string;
  action: string;
  resource: string;
}

export interface PermissionRule {
  id: string;
  name: string;
  description: string;
  conditions: PermissionCondition[];
  effect: 'allow' | 'deny';
  priority: number;
}

export interface PermissionCondition {
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'in'
    | 'not_in'
    | 'contains'
    | 'starts_with'
    | 'greater_than'
    | 'less_than';
  value: any;
}

export interface PermissionEvaluation {
  granted: boolean;
  reason: string;
  appliedRules: string[];
  context: PermissionContext;
  evaluatedAt: number;
  userId: string;
}

/**
 * ========================================
 * CONFIGURATION DES PERMISSIONS - WADASHAQEEN
 * ========================================
 *
 * IMPORTANT: Les permissions ci-dessous sont des EXEMPLES DE BASE uniquement.
 * Le système réel récupère DYNAMIQUEMENT les permissions depuis la base de données :
 *
 * FLUX DE RÉCUPÉRATION DES PERMISSIONS:
 * =====================================
 *
 * 1. USER → USER_ROLES (user_id)
 *    ↓
 * 2. USER_ROLES → ROLES (role_id)
 *    ↓
 * 3. ROLES → ROLE_PERMISSIONS (role_id)
 *    ↓
 * 4. ROLE_PERMISSIONS → PERMISSIONS (permission_id)
 *
 * REQUÊTE SQL OPTIMISÉE:
 * ======================
 * SELECT DISTINCT p.name as permission_name, p.description, r.name as role_name
 * FROM user_roles ur
 * JOIN roles r ON ur.role_id = r.id
 * JOIN role_permissions rp ON r.id = rp.role_id
 * JOIN permissions p ON rp.permission_id = p.id
 * WHERE ur.user_id = ? AND ur.is_active = true
 *
 * AVANTAGES DE L'APPROCHE DYNAMIQUE:
 * ===================================
 * ✅ Support des 16+ rôles en base de données
 * ✅ Permissions configurables sans redéploiement
 * ✅ Évolutivité totale du système
 * ✅ Cohérence avec la source de vérité (DB)
 */

// Permissions de base pour tous les utilisateurs authentifiés (exemples)
const BASIC_AUTHENTICATED_PERMISSIONS = [
  'read_own_profile',
  'update_own_profile',
  'read_own_tasks',
];

// Permissions contextuelles nécessitant une évaluation spéciale (exemples)
const CONTEXTUAL_PERMISSIONS = [
  'edit_project_in_tenant',
  'assign_task_in_project',
  'view_employee_in_tenant',
  'manage_budget_in_project',
];

/**
 * Gestionnaire Principal des Permissions
 */
class PermissionManager {
  private evaluationCache = new Map<string, PermissionEvaluation>();
  private auditLog: PermissionEvaluation[] = [];
  private customRules: PermissionRule[] = [];

  constructor() {
    // Nettoyer le cache d'évaluation périodiquement
    setInterval(() => this.cleanupEvaluationCache(), 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Évaluer une permission avec contexte
   */
  async evaluatePermission(
    userId: string,
    permission: string,
    context: Partial<PermissionContext> = {}
  ): Promise<PermissionEvaluation> {
    const fullContext: PermissionContext = {
      action: context.action || 'access',
      resource: context.resource || 'general',
      ...context,
    };

    // Générer une clé de cache pour cette évaluation
    const cacheKey = this.generateEvaluationCacheKey(userId, permission, fullContext);

    // Vérifier le cache d'évaluation
    const cached = this.evaluationCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    // Effectuer l'évaluation complète
    const evaluation = await this.performPermissionEvaluation(userId, permission, fullContext);

    // Mettre en cache le résultat
    this.evaluationCache.set(cacheKey, evaluation);

    // Ajouter au log d'audit
    this.addToAuditLog(evaluation);

    return evaluation;
  }

  /**
   * Effectuer l'évaluation complète des permissions
   */
  private async performPermissionEvaluation(
    userId: string,
    permission: string,
    context: PermissionContext
  ): Promise<PermissionEvaluation> {
    const evaluation: PermissionEvaluation = {
      granted: false,
      reason: 'Permission refusée par défaut',
      appliedRules: [],
      context,
      evaluatedAt: Date.now(),
      userId,
    };

    try {
      // 1. Récupérer les rôles de l'utilisateur depuis le cache
      const userRoles = await this.getUserRoles(userId, context.tenantId);
      const userPermissions = await this.getUserPermissions(userId, context.tenantId);

      // 2. Vérifier les permissions de base (super admin)
      if (this.isSuperAdmin(userRoles)) {
        evaluation.granted = true;
        evaluation.reason = 'Super Admin - Accès complet';
        evaluation.appliedRules.push('SUPER_ADMIN_RULE');
        return evaluation;
      }

      // 3. Vérifier les permissions explicites
      if (this.hasExplicitPermission(userPermissions, permission)) {
        evaluation.granted = true;
        evaluation.reason = `Permission explicite: ${permission}`;
        evaluation.appliedRules.push('EXPLICIT_PERMISSION');
        return evaluation;
      }

      // 4. Vérifier les permissions par rôle (avec les permissions de la DB)
      const rolePermissionResult = this.checkRolePermissions(
        userRoles,
        userPermissions,
        permission
      );
      if (rolePermissionResult.granted) {
        evaluation.granted = true;
        evaluation.reason = rolePermissionResult.reason;
        evaluation.appliedRules.push(...rolePermissionResult.appliedRules);
        return evaluation;
      }

      // 5. Vérifier les permissions contextuelles
      const contextualResult = await this.checkContextualPermissions(
        userId,
        userRoles,
        permission,
        context
      );
      if (contextualResult.granted) {
        evaluation.granted = true;
        evaluation.reason = contextualResult.reason;
        evaluation.appliedRules.push(...contextualResult.appliedRules);
        return evaluation;
      }

      // 6. Appliquer les règles personnalisées
      const customRuleResult = this.applyCustomRules(userRoles, permission, context);
      if (customRuleResult.granted) {
        evaluation.granted = true;
        evaluation.reason = customRuleResult.reason;
        evaluation.appliedRules.push(...customRuleResult.appliedRules);
        return evaluation;
      }

      // 7. Vérifier les permissions de base pour utilisateurs authentifiés
      if (BASIC_AUTHENTICATED_PERMISSIONS.includes(permission)) {
        evaluation.granted = true;
        evaluation.reason = 'Permission de base pour utilisateur authentifié';
        evaluation.appliedRules.push('AUTHENTICATED_USER_RULE');
        return evaluation;
      }

      // Permission refusée
      evaluation.reason = `Permission '${permission}' non accordée pour ce rôle/contexte`;
    } catch (error) {
      console.error("Erreur lors de l'évaluation des permissions:", error);
      evaluation.reason = `Erreur d'évaluation: ${error}`;
    }

    return evaluation;
  }

  /**
   * Récupérer les rôles utilisateur depuis le cache
   */
  private async getUserRoles(userId: string, tenantId?: string): Promise<UserRole[]> {
    // Utiliser le cache de rôles existant
    return roleCacheManager.getRoles(userId, tenantId, async () => {
      // Cette fonction ne devrait pas être appelée car le cache est géré par useUserRoles
      throw new Error('Les rôles doivent être récupérés via useUserRoles');
    });
  }

  /**
   * Récupérer les permissions utilisateur depuis le cache
   */
  private async getUserPermissions(userId: string, tenantId?: string): Promise<UserPermission[]> {
    return roleCacheManager.getPermissions(userId, tenantId, [], async () => {
      throw new Error('Les permissions doivent être récupérées via useUserRoles');
    });
  }

  /**
   * Vérifier si l'utilisateur est super admin
   */
  private isSuperAdmin(userRoles: UserRole[]): boolean {
    return userRoles.some(role => role.roles.name === RoleNames.SUPER_ADMIN);
  }

  /**
   * Vérifier les permissions explicites
   */
  private hasExplicitPermission(userPermissions: UserPermission[], permission: string): boolean {
    return userPermissions.some(perm => perm.permission_name === permission);
  }

  /**
   * Vérifier les permissions par rôle (LOGIQUE DYNAMIQUE)
   *
   * IMPORTANT: Cette fonction utilise les permissions récupérées dynamiquement
   * depuis la base de données via useUserRoles → roleCacheManager
   *
   * FLUX OPTIMISÉ:
   * 1. Les permissions sont déjà récupérées et mises en cache par useUserRoles
   * 2. Cette fonction vérifie simplement si la permission existe dans la liste
   * 3. Pas besoin de requête supplémentaire - tout est en cache
   */
  private checkRolePermissions(
    userRoles: UserRole[],
    userPermissions: UserPermission[],
    permission: string
  ): {
    granted: boolean;
    reason: string;
    appliedRules: string[];
  } {
    // Vérifier si l'utilisateur a la permission directement (depuis la DB)
    const hasDirectPermission = userPermissions.some(perm => perm.permission_name === permission);

    if (hasDirectPermission) {
      const grantingRole = userPermissions.find(
        perm => perm.permission_name === permission
      )?.role_name;

      return {
        granted: true,
        reason: `Permission '${permission}' accordée par le rôle '${grantingRole}'`,
        appliedRules: [`ROLE_${grantingRole?.toUpperCase()}_${permission.toUpperCase()}`],
      };
    }

    // Vérifier les super admins (accès complet)
    const isSuperAdmin = userRoles.some(role => role.roles.name === 'super_admin');

    if (isSuperAdmin) {
      return {
        granted: true,
        reason: 'Super Admin - Accès complet à toutes les permissions',
        appliedRules: ['SUPER_ADMIN_ALL_PERMISSIONS'],
      };
    }

    return {
      granted: false,
      reason: `Permission '${permission}' non trouvée dans les rôles de l'utilisateur`,
      appliedRules: [],
    };
  }

  /**
   * Vérifier les permissions contextuelles
   */
  private async checkContextualPermissions(
    userId: string,
    userRoles: UserRole[],
    permission: string,
    context: PermissionContext
  ): Promise<{ granted: boolean; reason: string; appliedRules: string[] }> {
    // Exemples de permissions contextuelles

    // Permission de modifier un projet dans son tenant
    if (permission === 'edit_project_in_tenant' && context.tenantId) {
      const userTenantId = userRoles.find(role => role.tenant_id)?.tenant_id;
      if (userTenantId === context.tenantId) {
        return {
          granted: true,
          reason: 'Permission accordée dans le contexte du tenant',
          appliedRules: ['CONTEXTUAL_TENANT_PERMISSION'],
        };
      }
    }

    // Permission d'assigner des tâches dans un projet géré
    if (permission === 'assign_task_in_project' && context.projectId) {
      const isProjectManager = userRoles.some(
        role => role.roles.name === RoleNames.PROJECT_MANAGER
      );
      if (isProjectManager) {
        return {
          granted: true,
          reason: 'Permission accordée en tant que chef de projet',
          appliedRules: ['CONTEXTUAL_PROJECT_MANAGER_PERMISSION'],
        };
      }
    }

    return {
      granted: false,
      reason: 'Permission contextuelle non accordée',
      appliedRules: [],
    };
  }

  /**
   * Appliquer les règles personnalisées
   */
  private applyCustomRules(
    userRoles: UserRole[],
    permission: string,
    context: PermissionContext
  ): { granted: boolean; reason: string; appliedRules: string[] } {
    // Trier les règles par priorité
    const sortedRules = this.customRules.sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.evaluateRuleConditions(rule, userRoles, permission, context)) {
        return {
          granted: rule.effect === 'allow',
          reason: `Règle personnalisée appliquée: ${rule.name}`,
          appliedRules: [rule.id],
        };
      }
    }

    return {
      granted: false,
      reason: 'Aucune règle personnalisée applicable',
      appliedRules: [],
    };
  }

  /**
   * Évaluer les conditions d'une règle
   */
  private evaluateRuleConditions(
    rule: PermissionRule,
    userRoles: UserRole[],
    permission: string,
    context: PermissionContext
  ): boolean {
    return rule.conditions.every(condition => {
      let fieldValue: any;

      // Récupérer la valeur du champ
      switch (condition.field) {
        case 'permission':
          fieldValue = permission;
          break;
        case 'roles':
          fieldValue = userRoles.map(role => role.roles.name);
          break;
        case 'tenantId':
          fieldValue = context.tenantId;
          break;
        case 'action':
          fieldValue = context.action;
          break;
        case 'resource':
          fieldValue = context.resource;
          break;
        default:
          return false;
      }

      // Appliquer l'opérateur
      return this.applyConditionOperator(fieldValue, condition.operator, condition.value);
    });
  }

  /**
   * Appliquer un opérateur de condition
   */
  private applyConditionOperator(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue);
      case 'contains':
        return Array.isArray(fieldValue) && fieldValue.includes(expectedValue);
      case 'starts_with':
        return typeof fieldValue === 'string' && fieldValue.startsWith(expectedValue);
      case 'greater_than':
        return fieldValue > expectedValue;
      case 'less_than':
        return fieldValue < expectedValue;
      default:
        return false;
    }
  }

  /**
   * Générer une clé de cache pour l'évaluation
   */
  private generateEvaluationCacheKey(
    userId: string,
    permission: string,
    context: PermissionContext
  ): string {
    const contextStr = JSON.stringify(context);
    return `eval_${userId}_${permission}_${btoa(contextStr)}`;
  }

  /**
   * Vérifier si le cache d'évaluation est valide
   */
  private isCacheValid(evaluation: PermissionEvaluation): boolean {
    const now = Date.now();
    const maxAge = 2 * 60 * 1000; // 2 minutes
    return now - evaluation.evaluatedAt < maxAge;
  }

  /**
   * Nettoyer le cache d'évaluation expiré
   */
  private cleanupEvaluationCache(): void {
    const now = Date.now();
    const maxAge = 2 * 60 * 1000; // 2 minutes

    const expiredKeys: string[] = [];
    this.evaluationCache.forEach((evaluation, key) => {
      if (now - evaluation.evaluatedAt > maxAge) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.evaluationCache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`🧹 Cache d'évaluation nettoyé: ${expiredKeys.length} entrées expirées`);
    }
  }

  /**
   * Ajouter une évaluation au log d'audit
   */
  private addToAuditLog(evaluation: PermissionEvaluation): void {
    this.auditLog.push(evaluation);

    // Garder seulement les 1000 dernières évaluations
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  /**
   * Ajouter une règle personnalisée
   */
  addCustomRule(rule: PermissionRule): void {
    this.customRules.push(rule);
    console.log(`📋 Règle personnalisée ajoutée: ${rule.name}`);
  }

  /**
   * Supprimer une règle personnalisée
   */
  removeCustomRule(ruleId: string): void {
    const index = this.customRules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      const removedRule = this.customRules.splice(index, 1)[0];
      console.log(`🗑️ Règle personnalisée supprimée: ${removedRule.name}`);
    }
  }

  /**
   * Obtenir les statistiques du gestionnaire
   */
  getStats(): {
    evaluationCacheSize: number;
    auditLogSize: number;
    customRulesCount: number;
    recentEvaluations: number;
  } {
    const now = Date.now();
    const recentThreshold = 5 * 60 * 1000; // 5 minutes

    const recentEvaluations = this.auditLog.filter(
      evaluation => now - evaluation.evaluatedAt < recentThreshold
    ).length;

    return {
      evaluationCacheSize: this.evaluationCache.size,
      auditLogSize: this.auditLog.length,
      customRulesCount: this.customRules.length,
      recentEvaluations,
    };
  }

  /**
   * Obtenir le log d'audit récent
   */
  getRecentAuditLog(limit: number = 50): PermissionEvaluation[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Invalider le cache d'évaluation pour un utilisateur
   */
  invalidateUserEvaluations(userId: string): void {
    const keysToDelete: string[] = [];

    this.evaluationCache.forEach((evaluation, key) => {
      if (evaluation.userId === userId) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.evaluationCache.delete(key));

    console.log(
      `🗑️ Cache d'évaluation invalidé pour l'utilisateur ${userId}: ${keysToDelete.length} entrées`
    );
  }

  /**
   * Vérification rapide de permission (pour l'UI)
   */
  async canUser(
    userId: string,
    action: string,
    resource: string,
    context: Partial<PermissionContext> = {}
  ): Promise<boolean> {
    const permission = `${action}_${resource}`;
    const evaluation = await this.evaluatePermission(userId, permission, {
      action,
      resource,
      ...context,
    });

    return evaluation.granted;
  }
}

// Instance singleton du gestionnaire de permissions
export const permissionManager = new PermissionManager();

// Fonctions utilitaires pour l'utilisation dans les composants
export const checkPermission = (
  userId: string,
  permission: string,
  context?: Partial<PermissionContext>
) => permissionManager.evaluatePermission(userId, permission, context);

export const canUserAccess = (
  userId: string,
  action: string,
  resource: string,
  context?: Partial<PermissionContext>
) => permissionManager.canUser(userId, action, resource, context);

export default permissionManager;
