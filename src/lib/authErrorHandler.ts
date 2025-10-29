/**
 * Gestionnaire d'erreurs d'authentification et d'invitation
 * Inspiré des meilleures pratiques UX des leaders SaaS
 */

export enum AuthErrorType {
  // Erreurs de connexion
  INVALID_CREDENTIALS = 'invalid_credentials',
  EMAIL_NOT_CONFIRMED = 'email_not_confirmed', 
  ACCOUNT_LOCKED = 'account_locked',
  TOO_MANY_ATTEMPTS = 'too_many_attempts',
  
  // Erreurs d'invitation
  INVALID_INVITATION_TOKEN = 'invalid_invitation_token',
  EXPIRED_INVITATION = 'expired_invitation',
  INVITATION_ALREADY_USED = 'invitation_already_used',
  INVITATION_NOT_FOUND = 'invitation_not_found',
  
  // Erreurs réseau
  NETWORK_ERROR = 'network_error',
  SERVER_ERROR = 'server_error',
  TIMEOUT_ERROR = 'timeout_error',
  
  // Erreurs de validation
  WEAK_PASSWORD = 'weak_password',
  INVALID_EMAIL_FORMAT = 'invalid_email_format',
  EMAIL_ALREADY_EXISTS = 'email_already_exists',
  MISSING_REQUIRED_FIELDS = 'missing_required_fields'
}

export interface AuthError {
  type: AuthErrorType;
  title: string;
  message: string;
  suggestion: string;
  actionButton?: {
    text: string;
    action: () => void;
  };
  severity: 'error' | 'warning' | 'info';
  code?: string;
  details?: Record<string, any>;
}

export class AuthErrorHandler {
  /**
   * Analyser une erreur Supabase et retourner une erreur utilisateur-friendly
   */
  static handleSupabaseAuthError(error: any, context?: string): AuthError {
    console.error('🔍 Analyse erreur Supabase:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      context
    });

    // Erreur 400 - Bad Request
    if (error?.status === 400) {
      return this.handle400Error(error);
    }

    // Erreur 401 - Unauthorized  
    if (error?.status === 401) {
      return this.handle401Error(error);
    }

    // Erreur 403 - Forbidden
    if (error?.status === 403) {
      return this.handle403Error(error);
    }

    // Erreur 422 - Unprocessable Entity
    if (error?.status === 422) {
      return this.handle422Error(error);
    }

    // Erreur 429 - Too Many Requests
    if (error?.status === 429) {
      return this.handle429Error(error);
    }

    // Erreurs réseau
    if (error?.name === 'NetworkError' || !error?.status) {
      return this.handleNetworkError(error);
    }

    // Erreur générique
    return this.handleGenericError(error);
  }

  private static handle400Error(error: any): AuthError {
    const message = error?.message?.toLowerCase() || '';

    // Identifiants invalides - Message moderne inspiré des leaders SaaS
    if (message.includes('invalid') && (message.includes('email') || message.includes('password') || message.includes('credentials'))) {
      return {
        type: AuthErrorType.INVALID_CREDENTIALS,
        title: '🔐 Email ou mot de passe incorrect',
        message: 'L\'email et/ou le mot de passe sont erronés. Veuillez vérifier vos informations.',
        suggestion: 'Assurez-vous que votre email et mot de passe sont corrects, puis réessayez.',
        actionButton: {
          text: 'Mot de passe oublié ?',
          action: () => window.location.href = '/forgot-password'
        },
        severity: 'error',
        code: 'AUTH_400_INVALID_CREDENTIALS'
      };
    }

    // Email déjà utilisé - Nouveau cas d'erreur
    if (message.includes('email') && (message.includes('already') || message.includes('exists') || message.includes('taken'))) {
      return {
        type: AuthErrorType.EMAIL_ALREADY_EXISTS,
        title: '📧 Email déjà utilisé',
        message: 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre.',
        suggestion: 'Utilisez une adresse email différente ou connectez-vous si vous avez déjà un compte.',
        actionButton: {
          text: 'Se connecter',
          action: () => window.location.href = '/login'
        },
        severity: 'warning',
        code: 'AUTH_400_EMAIL_EXISTS'
      };
    }

    // Email non confirmé
    if (message.includes('email') && message.includes('confirm')) {
      return {
        type: AuthErrorType.EMAIL_NOT_CONFIRMED,
        title: '📧 Email non confirmé',
        message: 'Votre adresse email n\'a pas encore été confirmée.',
        suggestion: 'Vérifiez votre boîte mail et cliquez sur le lien de confirmation.',
        actionButton: {
          text: 'Renvoyer l\'email',
          action: () => console.log('Resend confirmation email')
        },
        severity: 'warning',
        code: 'AUTH_400_EMAIL_NOT_CONFIRMED'
      };
    }

    // Token d'invitation invalide
    if (message.includes('token') || message.includes('invitation')) {
      return {
        type: AuthErrorType.INVALID_INVITATION_TOKEN,
        title: '🎫 Lien d\'invitation invalide',
        message: 'Le lien d\'invitation que vous avez utilisé n\'est pas valide ou a expiré.',
        suggestion: 'Demandez un nouveau lien d\'invitation à votre administrateur.',
        severity: 'error',
        code: 'AUTH_400_INVALID_TOKEN'
      };
    }

    // Mot de passe faible
    if (message.includes('password') && (message.includes('weak') || message.includes('strength'))) {
      return {
        type: AuthErrorType.WEAK_PASSWORD,
        title: '🔒 Mot de passe trop faible',
        message: 'Votre mot de passe ne respecte pas les critères de sécurité requis.',
        suggestion: 'Utilisez au moins 8 caractères avec des majuscules, minuscules, chiffres et symboles.',
        severity: 'warning',
        code: 'AUTH_400_WEAK_PASSWORD'
      };
    }

    // Erreur générique 400
    return {
      type: AuthErrorType.MISSING_REQUIRED_FIELDS,
      title: '⚠️ Données manquantes',
      message: 'Certaines informations requises sont manquantes ou incorrectes.',
      suggestion: 'Vérifiez que tous les champs obligatoires sont correctement remplis.',
      severity: 'warning',
      code: 'AUTH_400_BAD_REQUEST'
    };
  }

  private static handle401Error(error: any): AuthError {
    return {
      type: AuthErrorType.INVALID_CREDENTIALS,
      title: '🚫 Accès non autorisé',
      message: 'Vos identifiants sont incorrects ou votre session a expiré.',
      suggestion: 'Reconnectez-vous avec vos identifiants corrects.',
      actionButton: {
        text: 'Se reconnecter',
        action: () => window.location.href = '/login'
      },
      severity: 'error',
      code: 'AUTH_401_UNAUTHORIZED'
    };
  }

  private static handle403Error(error: any): AuthError {
    return {
      type: AuthErrorType.ACCOUNT_LOCKED,
      title: '🔒 Accès interdit',
      message: 'Votre compte n\'a pas les permissions nécessaires pour cette action.',
      suggestion: 'Contactez votre administrateur pour obtenir les droits d\'accès appropriés.',
      severity: 'error',
      code: 'AUTH_403_FORBIDDEN'
    };
  }

  private static handle422Error(error: any): AuthError {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('email') && message.includes('format')) {
      return {
        type: AuthErrorType.INVALID_EMAIL_FORMAT,
        title: '📧 Format d\'email invalide',
        message: 'L\'adresse email que vous avez saisie n\'est pas dans un format valide.',
        suggestion: 'Vérifiez le format de votre email (exemple: nom@domaine.com).',
        severity: 'warning',
        code: 'AUTH_422_INVALID_EMAIL'
      };
    }

    return {
      type: AuthErrorType.MISSING_REQUIRED_FIELDS,
      title: '📝 Données invalides',
      message: 'Les données fournies ne sont pas dans le format attendu.',
      suggestion: 'Vérifiez le format de vos données et réessayez.',
      severity: 'warning',
      code: 'AUTH_422_UNPROCESSABLE'
    };
  }

  private static handle429Error(error: any): AuthError {
    return {
      type: AuthErrorType.TOO_MANY_ATTEMPTS,
      title: '⏰ Trop de tentatives',
      message: 'Vous avez effectué trop de tentatives de connexion.',
      suggestion: 'Attendez quelques minutes avant de réessayer.',
      severity: 'warning',
      code: 'AUTH_429_RATE_LIMIT',
      details: {
        retryAfter: '5 minutes'
      }
    };
  }

  private static handleNetworkError(error: any): AuthError {
    return {
      type: AuthErrorType.NETWORK_ERROR,
      title: '🌐 Problème de connexion',
      message: 'Impossible de se connecter au serveur.',
      suggestion: 'Vérifiez votre connexion internet et réessayez.',
      actionButton: {
        text: 'Réessayer',
        action: () => window.location.reload()
      },
      severity: 'error',
      code: 'AUTH_NETWORK_ERROR'
    };
  }

  private static handleGenericError(error: any): AuthError {
    return {
      type: AuthErrorType.SERVER_ERROR,
      title: '⚠️ Erreur inattendue',
      message: 'Une erreur inattendue s\'est produite.',
      suggestion: 'Veuillez réessayer dans quelques instants ou contacter le support.',
      actionButton: {
        text: 'Contacter le support',
        action: () => window.open('mailto:support@wadashaqeen.com')
      },
      severity: 'error',
      code: 'AUTH_GENERIC_ERROR',
      details: {
        originalError: error?.message
      }
    };
  }

  /**
   * Analyser une erreur d'invitation spécifique
   */
  static handleInvitationError(error: any, invitationData?: any): AuthError {
    const message = error?.message?.toLowerCase() || '';

    // Invitation expirée
    if (message.includes('expired') || message.includes('expir')) {
      return {
        type: AuthErrorType.EXPIRED_INVITATION,
        title: '⏰ Invitation expirée',
        message: 'Cette invitation a expiré et ne peut plus être utilisée.',
        suggestion: 'Demandez une nouvelle invitation à votre administrateur.',
        severity: 'warning',
        code: 'INVITATION_EXPIRED'
      };
    }

    // Invitation déjà utilisée
    if (message.includes('used') || message.includes('accepted')) {
      return {
        type: AuthErrorType.INVITATION_ALREADY_USED,
        title: '✅ Invitation déjà utilisée',
        message: 'Cette invitation a déjà été acceptée.',
        suggestion: 'Si vous avez un compte, connectez-vous directement.',
        actionButton: {
          text: 'Se connecter',
          action: () => window.location.href = '/login'
        },
        severity: 'info',
        code: 'INVITATION_ALREADY_USED'
      };
    }

    // Invitation non trouvée
    if (message.includes('not found') || message.includes('invalid')) {
      return {
        type: AuthErrorType.INVITATION_NOT_FOUND,
        title: '🔍 Invitation introuvable',
        message: 'Aucune invitation correspondante n\'a été trouvée.',
        suggestion: 'Vérifiez le lien ou demandez une nouvelle invitation.',
        severity: 'error',
        code: 'INVITATION_NOT_FOUND'
      };
    }

    return this.handleSupabaseAuthError(error, 'invitation');
  }

  /**
   * Formater une erreur pour l'affichage utilisateur
   */
  static formatErrorForDisplay(authError: AuthError): {
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    action?: () => void;
    actionText?: string;
  } {
    return {
      title: authError.title,
      message: `${authError.message}\n\n💡 ${authError.suggestion}`,
      type: authError.severity,
      action: authError.actionButton?.action,
      actionText: authError.actionButton?.text
    };
  }
}

/**
 * Hook pour utiliser la gestion d'erreurs d'authentification
 */
export const useAuthErrorHandler = () => {
  const handleAuthError = (error: any, context?: string) => {
    const authError = AuthErrorHandler.handleSupabaseAuthError(error, context);
    const displayError = AuthErrorHandler.formatErrorForDisplay(authError);
    
    // Log pour debugging
    console.error('🔍 Erreur d\'authentification:', {
      type: authError.type,
      code: authError.code,
      originalError: error,
      context
    });
    
    return displayError;
  };

  const handleInvitationError = (error: any, invitationData?: any) => {
    const authError = AuthErrorHandler.handleInvitationError(error, invitationData);
    return AuthErrorHandler.formatErrorForDisplay(authError);
  };

  return {
    handleAuthError,
    handleInvitationError
  };
};
