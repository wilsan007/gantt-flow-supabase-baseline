/**
 * Système de Logging Optimisé pour Production
 * 
 * Pattern: Datadog + Sentry + LogRocket
 * 
 * - Logs désactivés en production par défaut
 * - Mode debug activable via console
 * - Groupage intelligent pour réduire le bruit
 * - Performance tracking intégré
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const IS_DEV = import.meta.env.DEV;
const IS_PROD = import.meta.env.PROD;

// Mode debug manuel (activable en prod via console)
let DEBUG_MODE = false;

try {
  DEBUG_MODE = localStorage.getItem('DEBUG_MODE') === 'true';
} catch (e) {
  // Ignorer si localStorage non disponible
}

// ============================================================================
// TYPES
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'perf';

interface LogConfig {
  level: LogLevel;
  enabled: boolean;
  timestamp: boolean;
  stack: boolean;
}

// Configuration par niveau
const LOG_CONFIG: Record<LogLevel, LogConfig> = {
  debug: {
    level: 'debug',
    enabled: IS_DEV || DEBUG_MODE,
    timestamp: IS_DEV,
    stack: false,
  },
  info: {
    level: 'info',
    enabled: IS_DEV || DEBUG_MODE,
    timestamp: IS_DEV,
    stack: false,
  },
  warn: {
    level: 'warn',
    enabled: true, // Toujours actif
    timestamp: true,
    stack: false,
  },
  error: {
    level: 'error',
    enabled: true, // Toujours actif
    timestamp: true,
    stack: true,
  },
  perf: {
    level: 'perf',
    enabled: IS_DEV || DEBUG_MODE,
    timestamp: true,
    stack: false,
  },
};

// ============================================================================
// COMPTEURS POUR DÉDOUBLONNAGE
// ============================================================================

interface MessageCounter {
  count: number;
  lastLog: number;
  suppressed: number;
}

const messageCounters = new Map<string, MessageCounter>();
const DEBOUNCE_INTERVAL = 1000; // 1 seconde
const MAX_SAME_MESSAGE = 3; // Max 3 messages identiques par intervalle

/**
 * Vérifier si un message doit être loggé (anti-spam)
 */
function shouldLog(message: string): boolean {
  const now = Date.now();
  const counter = messageCounters.get(message);

  if (!counter) {
    messageCounters.set(message, {
      count: 1,
      lastLog: now,
      suppressed: 0,
    });
    return true;
  }

  // Reset si intervalle écoulé
  if (now - counter.lastLog > DEBOUNCE_INTERVAL) {
    if (counter.suppressed > 0 && IS_DEV) {
      console.log(`🔇 ${counter.suppressed} messages identiques supprimés`);
    }
    counter.count = 1;
    counter.lastLog = now;
    counter.suppressed = 0;
    return true;
  }

  // Incrémenter compteur
  counter.count++;

  // Supprimer si trop de messages identiques
  if (counter.count > MAX_SAME_MESSAGE) {
    counter.suppressed++;
    return false;
  }

  counter.lastLog = now;
  return true;
}

// ============================================================================
// LOGGER PRINCIPAL
// ============================================================================

class Logger {
  private timers = new Map<string, number>();
  private groups = new Map<string, number>();

  /**
   * Log debug (développement uniquement)
   */
  debug(message: string, ...args: any[]): void {
    if (!LOG_CONFIG.debug.enabled) return;
    if (!shouldLog(message)) return;

    const formatted = this.formatMessage('🐛', message);
    console.log(formatted, ...args);
  }

  /**
   * Log info
   */
  info(message: string, ...args: any[]): void {
    if (!LOG_CONFIG.info.enabled) return;
    if (!shouldLog(message)) return;

    const formatted = this.formatMessage('ℹ️', message);
    console.log(formatted, ...args);
  }

  /**
   * Log warning (toujours actif)
   */
  warn(message: string, ...args: any[]): void {
    if (!LOG_CONFIG.warn.enabled) return;

    const formatted = this.formatMessage('⚠️', message);
    console.warn(formatted, ...args);
  }

  /**
   * Log erreur (toujours actif)
   */
  error(message: string, error?: Error | any, ...args: any[]): void {
    if (!LOG_CONFIG.error.enabled) return;

    const formatted = this.formatMessage('❌', message);
    console.error(formatted, error, ...args);

    // Stack trace en mode erreur
    if (LOG_CONFIG.error.stack && error?.stack) {
      console.error(error.stack);
    }

    // TODO: Envoyer à Sentry en production
    if (IS_PROD && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error || new Error(message));
    }
  }

  /**
   * Log performance
   */
  perf(label: string, duration: number): void {
    if (!LOG_CONFIG.perf.enabled) return;

    const color = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴';
    console.log(`${color} Performance: ${label} - ${duration.toFixed(2)}ms`);
  }

  // ==========================================================================
  // GROUPES
  // ==========================================================================

  /**
   * Démarrer un groupe de logs
   */
  group(label: string, collapsed: boolean = false): void {
    if (!IS_DEV && !DEBUG_MODE) return;

    const count = (this.groups.get(label) || 0) + 1;
    this.groups.set(label, count);

    if (collapsed) {
      console.groupCollapsed(`📂 ${label}`);
    } else {
      console.group(`📂 ${label}`);
    }
  }

  /**
   * Terminer un groupe
   */
  groupEnd(): void {
    if (!IS_DEV && !DEBUG_MODE) return;
    console.groupEnd();
  }

  // ==========================================================================
  // TIMERS
  // ==========================================================================

  /**
   * Démarrer un timer
   */
  time(label: string): void {
    if (!LOG_CONFIG.perf.enabled) return;
    this.timers.set(label, performance.now());
  }

  /**
   * Terminer un timer et logger la durée
   */
  timeEnd(label: string): number | void {
    if (!LOG_CONFIG.perf.enabled) return;

    const start = this.timers.get(label);
    if (start === undefined) {
      this.warn(`Timer "${label}" n'existe pas`);
      return;
    }

    const duration = performance.now() - start;
    this.perf(label, duration);
    this.timers.delete(label);
    
    return duration;
  }

  /**
   * Mesurer la durée d'exécution d'une fonction
   */
  async measure<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
    if (!LOG_CONFIG.perf.enabled) {
      return fn();
    }

    this.time(label);
    try {
      const result = await fn();
      this.timeEnd(label);
      return result;
    } catch (error) {
      this.timeEnd(label);
      throw error;
    }
  }

  // ==========================================================================
  // FORMATTING
  // ==========================================================================

  private formatMessage(icon: string, message: string): string {
    let formatted = `${icon} ${message}`;

    // Ajouter timestamp si activé
    if (LOG_CONFIG.debug.timestamp || LOG_CONFIG.info.timestamp) {
      const time = new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      });
      formatted = `[${time}] ${formatted}`;
    }

    return formatted;
  }

  // ==========================================================================
  // UTILITAIRES
  // ==========================================================================

  /**
   * Afficher une table (pratique pour arrays/objets)
   */
  table(data: any): void {
    if (!IS_DEV && !DEBUG_MODE) return;
    console.table(data);
  }

  /**
   * Afficher un objet en JSON formaté
   */
  json(data: any, label?: string): void {
    if (!IS_DEV && !DEBUG_MODE) return;
    
    if (label) {
      console.group(label);
    }
    console.log(JSON.stringify(data, null, 2));
    if (label) {
      console.groupEnd();
    }
  }

  /**
   * Activer le mode debug
   */
  enableDebug(): void {
    DEBUG_MODE = true;
    localStorage.setItem('DEBUG_MODE', 'true');
    
    // Mettre à jour la config
    LOG_CONFIG.debug.enabled = true;
    LOG_CONFIG.info.enabled = true;
    LOG_CONFIG.perf.enabled = true;
    
    console.log('✅ Mode debug activé - Rechargez la page pour voir tous les logs');
  }

  /**
   * Désactiver le mode debug
   */
  disableDebug(): void {
    DEBUG_MODE = false;
    localStorage.removeItem('DEBUG_MODE');
    
    // Mettre à jour la config
    LOG_CONFIG.debug.enabled = IS_DEV;
    LOG_CONFIG.info.enabled = IS_DEV;
    LOG_CONFIG.perf.enabled = IS_DEV;
    
    console.log('✅ Mode debug désactivé');
  }

  /**
   * Nettoyer les compteurs de messages
   */
  clearMessageCounters(): void {
    messageCounters.clear();
    console.log('✅ Compteurs de messages réinitialisés');
  }

  /**
   * Afficher les statistiques de logs
   */
  stats(): void {
    const suppressed = Array.from(messageCounters.values())
      .reduce((sum, counter) => sum + counter.suppressed, 0);

    console.group('📊 Statistiques de Logs');
    console.log(`Messages uniques: ${messageCounters.size}`);
    console.log(`Messages supprimés: ${suppressed}`);
    console.log(`Timers actifs: ${this.timers.size}`);
    console.log(`Groupes actifs: ${this.groups.size}`);
    console.groupEnd();
  }
}

// ============================================================================
// INSTANCE SINGLETON
// ============================================================================

export const logger = new Logger();

// Exposer dans window pour debug
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
  (window as any).enableDebug = () => logger.enableDebug();
  (window as any).disableDebug = () => logger.disableDebug();
  (window as any).logStats = () => logger.stats();
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Décorateur pour logger les appels de fonction
 */
export function logged(label?: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodLabel = label || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      logger.debug(`→ ${methodLabel}`, args);
      
      try {
        const result = await originalMethod.apply(this, args);
        logger.debug(`← ${methodLabel}`, result);
        return result;
      } catch (error) {
        logger.error(`✗ ${methodLabel}`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Décorateur pour mesurer les performances
 */
export function timed(label?: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodLabel = label || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return logger.measure(methodLabel, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

// Message de démarrage
if (IS_DEV) {
  console.log('🚀 Logger initialisé - Mode: DÉVELOPPEMENT');
  console.log('💡 Tapez enableDebug() pour activer les logs détaillés');
} else if (DEBUG_MODE) {
  console.log('🐛 Logger initialisé - Mode: DEBUG activé');
  console.log('💡 Tapez disableDebug() pour désactiver');
}
