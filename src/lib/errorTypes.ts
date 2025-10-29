/**
 * Types d'erreurs standardisés pour l'application
 * Inspiré des meilleures pratiques SaaS (Notion, Linear, Asana)
 */

export enum ErrorType {
  // Erreurs d'authentification (Niveau Stripe/Notion)
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_ALREADY_EXISTS = 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_WEAK_PASSWORD = 'AUTH_WEAK_PASSWORD',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_EMAIL_NOT_CONFIRMED = 'AUTH_EMAIL_NOT_CONFIRMED',
  AUTH_TOO_MANY_ATTEMPTS = 'AUTH_TOO_MANY_ATTEMPTS',
  AUTH_ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
  
  // Erreurs de validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATE_RANGE_ERROR = 'DATE_RANGE_ERROR',
  REQUIRED_FIELD_ERROR = 'REQUIRED_FIELD_ERROR',
  
  // Erreurs de logique métier
  TASK_DATE_CONFLICT = 'TASK_DATE_CONFLICT',
  PARENT_TASK_DATE_CONFLICT = 'PARENT_TASK_DATE_CONFLICT',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  DEPENDENCY_ERROR = 'DEPENDENCY_ERROR',
  
  // Erreurs réseau/serveur
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  
  // Erreurs de données
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  
  // Erreurs génériques
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface ErrorAction {
  text: string;
  action: () => void;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  icon?: string;
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  title: string;
  message: string;
  details?: string;
  suggestion?: string;
  code: string; // Codes standardisés (obligatoire)
  field?: string;
  timestamp: Date;
  context?: Record<string, any>;
  recoverable: boolean;
  retryable: boolean;
  // Actions contextuelles (Niveau Stripe/Notion)
  actions?: ErrorAction[];
  // Messages séparés pour debug vs utilisateur
  userMessage: string;
  debugMessage?: string;
}

export interface ValidationError extends AppError {
  field: string;
  value?: any;
  constraint?: string;
}

export interface TaskDateError extends AppError {
  taskId?: string;
  parentTaskId?: string;
  conflictingDates: {
    taskStart: string;
    taskEnd: string;
    parentStart?: string;
    parentEnd?: string;
  };
}

/**
 * Factory pour créer des erreurs standardisées
 */
export class ErrorFactory {
  static createTaskDateConflictError(
    taskStart: string,
    taskEnd: string,
    parentStart?: string,
    parentEnd?: string,
    parentTaskTitle?: string
  ): TaskDateError {
    const userMessage = parentTaskTitle 
      ? `La période sélectionnée dépasse le créneau de la tâche principale "${parentTaskTitle}".`
      : 'Les dates sélectionnées ne respectent pas les contraintes du projet.';
    
    return {
      type: ErrorType.TASK_DATE_CONFLICT,
      severity: ErrorSeverity.ERROR,
      code: 'TASK_001',
      title: 'Conflit de dates détecté',
      message: userMessage,
      userMessage,
      debugMessage: `Task dates: ${taskStart} - ${taskEnd}, Parent dates: ${parentStart} - ${parentEnd}`,
      details: parentStart && parentEnd 
        ? `Période autorisée : ${new Date(parentStart).toLocaleDateString()} - ${new Date(parentEnd).toLocaleDateString()}`
        : undefined,
      suggestion: 'Veuillez ajuster les dates pour qu\'elles soient comprises dans la période de la tâche principale.',
      timestamp: new Date(),
      recoverable: true,
      retryable: false,
      conflictingDates: {
        taskStart,
        taskEnd,
        parentStart,
        parentEnd
      }
    };
  }

  static createValidationError(
    field: string,
    value: any,
    constraint: string,
    customMessage?: string
  ): ValidationError {
    const userMessage = customMessage || `Le champ "${field}" ne respecte pas les contraintes requises.`;
    return {
      type: ErrorType.VALIDATION_ERROR,
      severity: ErrorSeverity.WARNING,
      code: 'VALIDATION_001',
      title: 'Erreur de validation',
      message: userMessage,
      userMessage,
      debugMessage: `Field: ${field}, Value: ${value}, Constraint: ${constraint}`,
      field,
      value,
      constraint,
      timestamp: new Date(),
      recoverable: true,
      retryable: false
    };
  }

  static createNetworkError(
    operation: string,
    statusCode?: number
  ): AppError {
    const userMessage = `Impossible de ${operation}. Vérifiez votre connexion internet.`;
    return {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.ERROR,
      code: statusCode ? `NETWORK_${statusCode}` : 'NETWORK_001',
      title: 'Erreur de connexion',
      message: userMessage,
      userMessage,
      debugMessage: `Operation: ${operation}, Status: ${statusCode}`,
      details: statusCode ? `Code d'erreur: ${statusCode}` : undefined,
      suggestion: 'Vérifiez votre connexion et réessayez.',
      timestamp: new Date(),
      recoverable: true,
      retryable: true,
      actions: [{
        text: 'Réessayer',
        action: () => window.location.reload(),
        variant: 'outline'
      }]
    };
  }

  static createPermissionError(
    action: string
  ): AppError {
    const userMessage = `Vous n'avez pas les permissions nécessaires pour ${action}.`;
    return {
      type: ErrorType.PERMISSION_ERROR,
      severity: ErrorSeverity.ERROR,
      code: 'PERMISSION_001',
      title: 'Permissions insuffisantes',
      message: userMessage,
      userMessage,
      debugMessage: `Action attempted: ${action}`,
      suggestion: 'Contactez votre administrateur pour obtenir les permissions requises.',
      timestamp: new Date(),
      recoverable: false,
      retryable: false,
      actions: [{
        text: 'Contacter l\'admin',
        action: () => window.open('mailto:admin@wadashaqeen.com'),
        variant: 'outline'
      }]
    };
  }

  static createGenericError(
    title: string,
    message: string,
    suggestion?: string
  ): AppError {
    return {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.ERROR,
      code: 'GENERIC_001',
      title,
      message,
      userMessage: message,
      debugMessage: `Generic error: ${title}`,
      suggestion,
      timestamp: new Date(),
      recoverable: true,
      retryable: true
    };
  }

  // ========== MÉTHODES D'AUTHENTIFICATION (NIVEAU STRIPE/NOTION) ==========
  
  static createAuthInvalidCredentialsError(): AppError {
    return {
      type: ErrorType.AUTH_INVALID_CREDENTIALS,
      severity: ErrorSeverity.ERROR,
      code: 'AUTH_001',
      title: '🔐 Email ou mot de passe incorrect',
      message: 'L\'email et/ou le mot de passe sont erronés. Veuillez vérifier vos informations.',
      userMessage: 'L\'email et/ou le mot de passe sont erronés. Veuillez vérifier vos informations.',
      debugMessage: 'Invalid credentials provided during authentication',
      suggestion: 'Assurez-vous que votre email et mot de passe sont corrects, puis réessayez.',
      timestamp: new Date(),
      recoverable: true,
      retryable: true,
      actions: [{
        text: 'Mot de passe oublié ?',
        action: () => window.location.href = '/forgot-password',
        variant: 'outline'
      }]
    };
  }

  static createAuthEmailExistsError(): AppError {
    return {
      type: ErrorType.AUTH_EMAIL_ALREADY_EXISTS,
      severity: ErrorSeverity.WARNING,
      code: 'AUTH_002',
      title: '📧 Email déjà utilisé',
      message: 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre.',
      userMessage: 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre.',
      debugMessage: 'Email already exists in database',
      suggestion: 'Utilisez une adresse email différente ou connectez-vous si vous avez déjà un compte.',
      timestamp: new Date(),
      recoverable: true,
      retryable: false,
      actions: [{
        text: 'Se connecter',
        action: () => window.location.href = '/login',
        variant: 'default'
      }]
    };
  }

  static createAuthWeakPasswordError(): AppError {
    return {
      type: ErrorType.AUTH_WEAK_PASSWORD,
      severity: ErrorSeverity.WARNING,
      code: 'AUTH_003',
      title: '🔒 Mot de passe trop faible',
      message: 'Votre mot de passe ne respecte pas les critères de sécurité requis.',
      userMessage: 'Votre mot de passe ne respecte pas les critères de sécurité requis.',
      debugMessage: 'Password does not meet security requirements',
      suggestion: 'Utilisez au moins 8 caractères avec des majuscules, minuscules, chiffres et symboles.',
      timestamp: new Date(),
      recoverable: true,
      retryable: true
    };
  }

  static createAuthSessionExpiredError(): AppError {
    return {
      type: ErrorType.AUTH_SESSION_EXPIRED,
      severity: ErrorSeverity.WARNING,
      code: 'AUTH_004',
      title: '⏰ Session expirée',
      message: 'Votre session a expiré. Veuillez vous reconnecter.',
      userMessage: 'Votre session a expiré. Veuillez vous reconnecter.',
      debugMessage: 'User session has expired',
      suggestion: 'Reconnectez-vous pour continuer à utiliser l\'application.',
      timestamp: new Date(),
      recoverable: true,
      retryable: false,
      actions: [{
        text: 'Se reconnecter',
        action: () => window.location.href = '/login',
        variant: 'default'
      }]
    };
  }

  static createAuthEmailNotConfirmedError(): AppError {
    return {
      type: ErrorType.AUTH_EMAIL_NOT_CONFIRMED,
      severity: ErrorSeverity.WARNING,
      code: 'AUTH_005',
      title: '📧 Email non confirmé',
      message: 'Votre adresse email n\'a pas encore été confirmée.',
      userMessage: 'Votre adresse email n\'a pas encore été confirmée.',
      debugMessage: 'Email confirmation pending',
      suggestion: 'Vérifiez votre boîte mail et cliquez sur le lien de confirmation.',
      timestamp: new Date(),
      recoverable: true,
      retryable: false,
      actions: [{
        text: 'Renvoyer l\'email',
        action: () => console.log('Resend confirmation email'),
        variant: 'outline'
      }]
    };
  }

  static createAuthTooManyAttemptsError(): AppError {
    return {
      type: ErrorType.AUTH_TOO_MANY_ATTEMPTS,
      severity: ErrorSeverity.WARNING,
      code: 'AUTH_006',
      title: '⏰ Trop de tentatives',
      message: 'Vous avez effectué trop de tentatives de connexion.',
      userMessage: 'Vous avez effectué trop de tentatives de connexion.',
      debugMessage: 'Rate limit exceeded for authentication attempts',
      suggestion: 'Attendez quelques minutes avant de réessayer.',
      timestamp: new Date(),
      recoverable: true,
      retryable: false
    };
  }

  static createAuthAccountLockedError(): AppError {
    return {
      type: ErrorType.AUTH_ACCOUNT_LOCKED,
      severity: ErrorSeverity.ERROR,
      code: 'AUTH_007',
      title: '🔒 Compte verrouillé',
      message: 'Votre compte a été temporairement verrouillé pour des raisons de sécurité.',
      userMessage: 'Votre compte a été temporairement verrouillé pour des raisons de sécurité.',
      debugMessage: 'Account locked due to security policy',
      suggestion: 'Contactez le support pour débloquer votre compte.',
      timestamp: new Date(),
      recoverable: false,
      retryable: false,
      actions: [{
        text: 'Contacter le support',
        action: () => window.open('mailto:support@wadashaqeen.com'),
        variant: 'default'
      }]
    };
  }
}

/**
 * Messages d'erreur localisés (Niveau Stripe/Notion)
 */
export const ErrorMessages = {
  // Erreurs d'authentification
  [ErrorType.AUTH_INVALID_CREDENTIALS]: {
    title: 'Email ou mot de passe incorrect',
    defaultMessage: 'L\'email et/ou le mot de passe sont erronés.'
  },
  [ErrorType.AUTH_EMAIL_ALREADY_EXISTS]: {
    title: 'Email déjà utilisé',
    defaultMessage: 'Cette adresse email est déjà utilisée.'
  },
  [ErrorType.AUTH_WEAK_PASSWORD]: {
    title: 'Mot de passe trop faible',
    defaultMessage: 'Votre mot de passe ne respecte pas les critères de sécurité.'
  },
  [ErrorType.AUTH_SESSION_EXPIRED]: {
    title: 'Session expirée',
    defaultMessage: 'Votre session a expiré.'
  },
  [ErrorType.AUTH_EMAIL_NOT_CONFIRMED]: {
    title: 'Email non confirmé',
    defaultMessage: 'Votre adresse email n\'a pas encore été confirmée.'
  },
  [ErrorType.AUTH_TOO_MANY_ATTEMPTS]: {
    title: 'Trop de tentatives',
    defaultMessage: 'Vous avez effectué trop de tentatives de connexion.'
  },
  [ErrorType.AUTH_ACCOUNT_LOCKED]: {
    title: 'Compte verrouillé',
    defaultMessage: 'Votre compte a été temporairement verrouillé.'
  },
  
  // Erreurs métier
  [ErrorType.TASK_DATE_CONFLICT]: {
    title: 'Conflit de dates',
    defaultMessage: 'Les dates sélectionnées ne respectent pas les contraintes.'
  },
  [ErrorType.VALIDATION_ERROR]: {
    title: 'Erreur de validation',
    defaultMessage: 'Certains champs ne respectent pas les contraintes requises.'
  },
  [ErrorType.NETWORK_ERROR]: {
    title: 'Erreur de connexion',
    defaultMessage: 'Impossible de se connecter au serveur.'
  },
  [ErrorType.PERMISSION_ERROR]: {
    title: 'Accès refusé',
    defaultMessage: 'Vous n\'avez pas les permissions nécessaires.'
  }
} as const;

/**
 * Codes d'erreur standardisés (Inspiré de Stripe)
 */
export const ErrorCodes = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_EMAIL_EXISTS: 'AUTH_002',
  AUTH_WEAK_PASSWORD: 'AUTH_003',
  AUTH_SESSION_EXPIRED: 'AUTH_004',
  AUTH_EMAIL_NOT_CONFIRMED: 'AUTH_005',
  AUTH_TOO_MANY_ATTEMPTS: 'AUTH_006',
  AUTH_ACCOUNT_LOCKED: 'AUTH_007',
  
  // Validation
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_001',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_002',
  VALIDATION_DATE_RANGE: 'VALIDATION_003',
  
  // Network
  NETWORK_CONNECTION_FAILED: 'NETWORK_001',
  NETWORK_TIMEOUT: 'NETWORK_002',
  NETWORK_SERVER_ERROR: 'NETWORK_003',
  
  // Permissions
  PERMISSION_INSUFFICIENT: 'PERMISSION_001',
  PERMISSION_EXPIRED: 'PERMISSION_002',
  
  // Business Logic
  TASK_DATE_CONFLICT: 'TASK_001',
  TASK_DEPENDENCY_ERROR: 'TASK_002',
  RESOURCE_CONFLICT: 'RESOURCE_001'
} as const;
