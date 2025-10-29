/**
 * Composant d'alerte d'erreur d'authentification
 * Design moderne inspiré des leaders SaaS
 */

import React from 'react';
import { AlertTriangle, Wifi, Lock, Mail, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AuthErrorType } from '@/lib/authErrorHandler';

interface AuthErrorAlertProps {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  errorType?: AuthErrorType;
  action?: () => void;
  actionText?: string;
  onDismiss?: () => void;
  className?: string;
}

const getErrorIcon = (errorType?: AuthErrorType) => {
  switch (errorType) {
    case AuthErrorType.NETWORK_ERROR:
      return <Wifi className="h-5 w-5" />;
    case AuthErrorType.EMAIL_NOT_CONFIRMED:
      return <Mail className="h-5 w-5" />;
    case AuthErrorType.ACCOUNT_LOCKED:
    case AuthErrorType.INVALID_CREDENTIALS:
      return <Lock className="h-5 w-5" />;
    case AuthErrorType.EXPIRED_INVITATION:
    case AuthErrorType.TOO_MANY_ATTEMPTS:
      return <Clock className="h-5 w-5" />;
    default:
      return <AlertTriangle className="h-5 w-5" />;
  }
};

const getAlertStyles = (type: 'error' | 'warning' | 'info') => {
  switch (type) {
    case 'error':
      return {
        container: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
        icon: 'text-red-600 dark:text-red-400',
        title: 'text-red-800 dark:text-red-200',
        message: 'text-red-700 dark:text-red-300',
        button: 'bg-red-600 hover:bg-red-700 text-white'
      };
    case 'warning':
      return {
        container: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950',
        icon: 'text-amber-600 dark:text-amber-400',
        title: 'text-amber-800 dark:text-amber-200',
        message: 'text-amber-700 dark:text-amber-300',
        button: 'bg-amber-600 hover:bg-amber-700 text-white'
      };
    case 'info':
      return {
        container: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
        icon: 'text-blue-600 dark:text-blue-400',
        title: 'text-blue-800 dark:text-blue-200',
        message: 'text-blue-700 dark:text-blue-300',
        button: 'bg-blue-600 hover:bg-blue-700 text-white'
      };
  }
};

export const AuthErrorAlert: React.FC<AuthErrorAlertProps> = ({
  title,
  message,
  type,
  errorType,
  action,
  actionText,
  onDismiss,
  className = ''
}) => {
  const styles = getAlertStyles(type);
  const icon = getErrorIcon(errorType);

  return (
    <Alert className={`${styles.container} ${className} relative`}>
      <div className="flex items-start gap-3">
        {/* Icône */}
        <div className={`${styles.icon} mt-0.5 flex-shrink-0`}>
          {icon}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {/* Titre */}
          <h4 className={`${styles.title} font-semibold text-sm mb-1`}>
            {title}
          </h4>

          {/* Message */}
          <AlertDescription className={`${styles.message} text-sm leading-relaxed whitespace-pre-line`}>
            {message}
          </AlertDescription>

          {/* Actions */}
          {(action || onDismiss) && (
            <div className="flex items-center gap-2 mt-3">
              {action && actionText && (
                <Button
                  size="sm"
                  onClick={action}
                  className={`${styles.button} h-8 px-3 text-xs font-medium`}
                >
                  {actionText.includes('Réessayer') && (
                    <RefreshCw className="h-3 w-3 mr-1.5" />
                  )}
                  {actionText.includes('Contacter') && (
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                  )}
                  {actionText}
                </Button>
              )}
              
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className={`h-8 px-3 text-xs ${styles.message} hover:bg-black/5 dark:hover:bg-white/5`}
                >
                  Fermer
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Bouton de fermeture */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${styles.icon} hover:opacity-70 transition-opacity flex-shrink-0 p-1 -m-1`}
            aria-label="Fermer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </Alert>
  );
};

/**
 * Composant pour afficher plusieurs erreurs d'authentification
 */
interface AuthErrorListProps {
  errors: Array<{
    id: string;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    errorType?: AuthErrorType;
    action?: () => void;
    actionText?: string;
  }>;
  onDismiss: (id: string) => void;
  maxVisible?: number;
  className?: string;
}

export const AuthErrorList: React.FC<AuthErrorListProps> = ({
  errors,
  onDismiss,
  maxVisible = 3,
  className = ''
}) => {
  const visibleErrors = errors.slice(0, maxVisible);
  const hiddenCount = errors.length - maxVisible;

  if (errors.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleErrors.map((error) => (
        <AuthErrorAlert
          key={error.id}
          title={error.title}
          message={error.message}
          type={error.type}
          errorType={error.errorType}
          action={error.action}
          actionText={error.actionText}
          onDismiss={() => onDismiss(error.id)}
        />
      ))}
      
      {hiddenCount > 0 && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-xs"
            onClick={() => {
              // Afficher toutes les erreurs ou implémenter une pagination
              console.log(`${hiddenCount} erreurs supplémentaires masquées`);
            }}
          >
            +{hiddenCount} erreur{hiddenCount > 1 ? 's' : ''} supplémentaire{hiddenCount > 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Hook pour gérer l'état des erreurs d'authentification
 */
export const useAuthErrors = () => {
  const [errors, setErrors] = React.useState<Array<{
    id: string;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    errorType?: AuthErrorType;
    action?: () => void;
    actionText?: string;
    timestamp: number;
  }>>([]);

  const addError = React.useCallback((error: {
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    errorType?: AuthErrorType;
    action?: () => void;
    actionText?: string;
  }) => {
    const newError = {
      ...error,
      id: `auth-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setErrors(prev => [newError, ...prev]);

    // Auto-dismiss après 10 secondes pour les erreurs non critiques
    if (error.type !== 'error') {
      setTimeout(() => {
        setErrors(prev => prev.filter(e => e.id !== newError.id));
      }, 10000);
    }
  }, []);

  const removeError = React.useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    addError,
    removeError,
    clearErrors
  };
};
