import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  XCircle, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  X,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { AppError, ErrorSeverity, ErrorType } from '@/lib/errorTypes';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  error: AppError;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const severityConfig = {
  [ErrorSeverity.INFO]: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-900',
    iconClassName: 'text-blue-600',
    badgeVariant: 'secondary' as const
  },
  [ErrorSeverity.WARNING]: {
    icon: AlertTriangle,
    className: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    iconClassName: 'text-yellow-600',
    badgeVariant: 'outline' as const
  },
  [ErrorSeverity.ERROR]: {
    icon: XCircle,
    className: 'border-red-200 bg-red-50 text-red-900',
    iconClassName: 'text-red-600',
    badgeVariant: 'destructive' as const
  },
  [ErrorSeverity.CRITICAL]: {
    icon: AlertCircle,
    className: 'border-red-300 bg-red-100 text-red-950',
    iconClassName: 'text-red-700',
    badgeVariant: 'destructive' as const
  }
};

const typeLabels = {
  // Authentification
  [ErrorType.AUTH_INVALID_CREDENTIALS]: 'Authentification',
  [ErrorType.AUTH_EMAIL_ALREADY_EXISTS]: 'Email',
  [ErrorType.AUTH_WEAK_PASSWORD]: 'Mot de passe',
  [ErrorType.AUTH_SESSION_EXPIRED]: 'Session',
  [ErrorType.AUTH_EMAIL_NOT_CONFIRMED]: 'Email',
  [ErrorType.AUTH_TOO_MANY_ATTEMPTS]: 'Sécurité',
  [ErrorType.AUTH_ACCOUNT_LOCKED]: 'Compte',
  
  // Métier
  [ErrorType.TASK_DATE_CONFLICT]: 'Conflit de dates',
  [ErrorType.VALIDATION_ERROR]: 'Validation',
  [ErrorType.NETWORK_ERROR]: 'Réseau',
  [ErrorType.PERMISSION_ERROR]: 'Permissions',
  [ErrorType.DATA_NOT_FOUND]: 'Données',
  [ErrorType.SERVER_ERROR]: 'Serveur',
  [ErrorType.UNKNOWN_ERROR]: 'Erreur'
};

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onDismiss,
  onRetry,
  className,
  showDetails = true,
  compact = false
}) => {
  const config = severityConfig[error.severity];
  const Icon = config.icon;

  return (
    <Alert className={cn(
      config.className,
      'relative border-l-4 shadow-sm',
      compact && 'py-3',
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconClassName)} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AlertTitle className="text-sm font-semibold">
              {error.title}
            </AlertTitle>
            
            <Badge variant={config.badgeVariant} className="text-xs">
              {typeLabels[error.type] || error.type}
            </Badge>
            
            {error.field && (
              <Badge variant="outline" className="text-xs">
                {error.field}
              </Badge>
            )}
          </div>
          
          <AlertDescription className="text-sm leading-relaxed">
            {error.message}
          </AlertDescription>
          
          {showDetails && (error.details || error.suggestion) && (
            <div className="mt-3 space-y-2">
              {error.details && (
                <div className="text-xs text-muted-foreground bg-white/50 rounded p-2 border">
                  <strong>Détails :</strong> {error.details}
                </div>
              )}
              
              {error.suggestion && (
                <div className="text-xs bg-white/70 rounded p-2 border border-dashed">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                    <div>
                      <strong>Solution suggérée :</strong> {error.suggestion}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!compact && (
            <div className="flex items-center gap-2 mt-3">
              {/* Actions contextuelles (Niveau Stripe/Notion) */}
              {error.actions?.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  size="sm"
                  onClick={action.action}
                  className="h-7 text-xs"
                >
                  {action.text}
                </Button>
              ))}
              
              {/* Fallback retry button si pas d'actions spécifiques */}
              {!error.actions && error.retryable && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-7 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Réessayer
                </Button>
              )}
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Clock className="h-3 w-3" />
                {error.timestamp.toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 hover:bg-white/50"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
};

interface ErrorListProps {
  errors: AppError[];
  onDismiss?: (index: number) => void;
  onRetry?: (index: number) => void;
  onClearAll?: () => void;
  className?: string;
  maxVisible?: number;
}

export const ErrorList: React.FC<ErrorListProps> = ({
  errors,
  onDismiss,
  onRetry,
  onClearAll,
  className,
  maxVisible = 3
}) => {
  if (errors.length === 0) return null;

  const visibleErrors = errors.slice(0, maxVisible);
  const hiddenCount = errors.length - maxVisible;

  return (
    <div className={cn('space-y-2', className)}>
      {onClearAll && errors.length > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {errors.length} erreur{errors.length > 1 ? 's' : ''} détectée{errors.length > 1 ? 's' : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-6 text-xs"
          >
            Tout effacer
          </Button>
        </div>
      )}
      
      {visibleErrors.map((error, index) => (
        <ErrorAlert
          key={`${error.type}-${error.timestamp.getTime()}-${index}`}
          error={error}
          onDismiss={onDismiss ? () => onDismiss(index) : undefined}
          onRetry={onRetry ? () => onRetry(index) : undefined}
          compact={errors.length > 2}
        />
      ))}
      
      {hiddenCount > 0 && (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            +{hiddenCount} erreur{hiddenCount > 1 ? 's' : ''} supplémentaire{hiddenCount > 1 ? 's' : ''}
          </Badge>
        </div>
      )}
    </div>
  );
};

interface InlineErrorProps {
  error?: AppError;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ error, className }) => {
  if (!error) return null;

  const config = severityConfig[error.severity];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex items-start gap-2 text-sm p-2 rounded-md border-l-2',
      config.className,
      className
    )}>
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.iconClassName)} />
      <div className="flex-1">
        <p className="font-medium">{error.message}</p>
        {error.suggestion && (
          <p className="text-xs mt-1 opacity-80">{error.suggestion}</p>
        )}
      </div>
    </div>
  );
};
