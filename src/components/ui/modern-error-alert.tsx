import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  X,
  RefreshCw,
  Mail,
  Lock,
  Shield
} from 'lucide-react';

export interface ModernErrorProps {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  suggestion?: string;
  actionButton?: {
    text: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  };
  onDismiss?: () => void;
  className?: string;
}

const getErrorIcon = (type: ModernErrorProps['type']) => {
  switch (type) {
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-500" />;
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
};

const getErrorStyles = (type: ModernErrorProps['type']) => {
  switch (type) {
    case 'error':
      return 'border-red-200 bg-red-50 text-red-900';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 text-yellow-900';
    case 'info':
      return 'border-blue-200 bg-blue-50 text-blue-900';
    case 'success':
      return 'border-green-200 bg-green-50 text-green-900';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-900';
  }
};

/**
 * Composant d'erreur moderne inspiré des leaders SaaS (Stripe, Notion, Linear)
 * Fournit des messages d'erreur clairs avec suggestions d'actions
 */
export const ModernErrorAlert: React.FC<ModernErrorProps> = ({
  type,
  title,
  message,
  suggestion,
  actionButton,
  onDismiss,
  className = ''
}) => {
  return (
    <Alert className={`${getErrorStyles(type)} ${className} relative`}>
      <div className="flex items-start space-x-3">
        {getErrorIcon(type)}
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-sm font-semibold mb-1">
            {title}
          </AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">
            <div className="space-y-2">
              <p>{message}</p>
              {suggestion && (
                <p className="text-xs opacity-80 font-medium">
                  💡 {suggestion}
                </p>
              )}
            </div>
          </AlertDescription>
          
          {actionButton && (
            <div className="mt-3">
              <Button
                size="sm"
                variant={actionButton.variant || 'outline'}
                onClick={actionButton.action}
                className="text-xs"
              >
                {actionButton.text}
              </Button>
            </div>
          )}
        </div>
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
};

/**
 * Composants spécialisés pour différents types d'erreurs
 */

export const AuthErrorAlert: React.FC<{
  title: string;
  message: string;
  onRetry?: () => void;
  onForgotPassword?: () => void;
  onDismiss?: () => void;
}> = ({ title, message, onRetry, onForgotPassword, onDismiss }) => (
  <ModernErrorAlert
    type="error"
    title={title}
    message={message}
    suggestion="Vérifiez vos informations et réessayez"
    actionButton={onForgotPassword ? {
      text: "Mot de passe oublié ?",
      action: onForgotPassword,
      variant: "outline"
    } : onRetry ? {
      text: "Réessayer",
      action: onRetry,
      variant: "outline"
    } : undefined}
    onDismiss={onDismiss}
  />
);

export const EmailExistsAlert: React.FC<{
  onLogin?: () => void;
  onDismiss?: () => void;
}> = ({ onLogin, onDismiss }) => (
  <ModernErrorAlert
    type="warning"
    title="📧 Email déjà utilisé"
    message="Cette adresse email est déjà utilisée. Veuillez en choisir une autre."
    suggestion="Utilisez une adresse email différente ou connectez-vous si vous avez déjà un compte"
    actionButton={onLogin ? {
      text: "Se connecter",
      action: onLogin,
      variant: "default"
    } : undefined}
    onDismiss={onDismiss}
  />
);

export const NetworkErrorAlert: React.FC<{
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ onRetry, onDismiss }) => (
  <ModernErrorAlert
    type="error"
    title="🌐 Problème de connexion"
    message="Impossible de se connecter au serveur."
    suggestion="Vérifiez votre connexion internet et réessayez"
    actionButton={onRetry ? {
      text: "Réessayer",
      action: onRetry,
      variant: "outline"
    } : undefined}
    onDismiss={onDismiss}
  />
);

export const ValidationErrorAlert: React.FC<{
  field: string;
  message: string;
  onDismiss?: () => void;
}> = ({ field, message, onDismiss }) => (
  <ModernErrorAlert
    type="warning"
    title={`⚠️ Erreur de validation - ${field}`}
    message={message}
    suggestion="Corrigez les informations et réessayez"
    onDismiss={onDismiss}
  />
);

/**
 * Hook pour utiliser les erreurs modernes
 */
export const useModernErrors = () => {
  const createAuthError = (error: any) => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('invalid') || message.includes('credentials')) {
      return {
        type: 'error' as const,
        title: '🔐 Email ou mot de passe incorrect',
        message: 'L\'email et/ou le mot de passe sont erronés. Veuillez vérifier vos informations.',
        suggestion: 'Assurez-vous que votre email et mot de passe sont corrects'
      };
    }
    
    if (message.includes('email') && (message.includes('already') || message.includes('exists'))) {
      return {
        type: 'warning' as const,
        title: '📧 Email déjà utilisé',
        message: 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre.',
        suggestion: 'Utilisez une adresse email différente ou connectez-vous'
      };
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: 'error' as const,
        title: '🌐 Problème de connexion',
        message: 'Impossible de se connecter au serveur.',
        suggestion: 'Vérifiez votre connexion internet'
      };
    }
    
    return {
      type: 'error' as const,
      title: '❌ Erreur inattendue',
      message: error?.message || 'Une erreur inattendue s\'est produite.',
      suggestion: 'Veuillez réessayer ou contacter le support'
    };
  };
  
  return { createAuthError };
};
