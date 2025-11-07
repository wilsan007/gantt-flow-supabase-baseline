import React from 'react';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { AppError, ErrorSeverity } from '@/lib/errorTypes';
import { AlertTriangle, XCircle, AlertCircle, Info, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const severityConfig = {
  [ErrorSeverity.INFO]: {
    icon: Info,
    className: 'border-blue-500 bg-blue-50 text-blue-900',
    iconClassName: 'text-blue-600',
  },
  [ErrorSeverity.WARNING]: {
    icon: AlertTriangle,
    className: 'border-yellow-500 bg-yellow-50 text-yellow-900',
    iconClassName: 'text-yellow-600',
  },
  [ErrorSeverity.ERROR]: {
    icon: XCircle,
    className: 'border-red-500 bg-red-50 text-red-900',
    iconClassName: 'text-red-600',
  },
  [ErrorSeverity.CRITICAL]: {
    icon: AlertCircle,
    className: 'border-red-600 bg-red-100 text-red-950',
    iconClassName: 'text-red-700',
  },
};

interface ErrorToastProps {
  error: AppError;
  onRetry?: () => void;
  onViewDetails?: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ error, onRetry, onViewDetails }) => {
  const config = severityConfig[error.severity];
  const Icon = config.icon;

  return (
    <Toast className={cn('border-l-4', config.className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', config.iconClassName)} />
        <div className="flex-1">
          <ToastTitle className="text-sm font-semibold">{error.title}</ToastTitle>
          <ToastDescription className="text-sm">{error.message}</ToastDescription>
          {error.suggestion && (
            <ToastDescription className="mt-1 text-xs opacity-80">
              💡 {error.suggestion}
            </ToastDescription>
          )}
        </div>
      </div>

      <div className="mt-2 flex gap-1">
        {error.retryable && onRetry && (
          <ToastAction altText="Réessayer" onClick={onRetry} className="h-6 text-xs">
            <RefreshCw className="mr-1 h-3 w-3" />
            Réessayer
          </ToastAction>
        )}

        {onViewDetails && (
          <ToastAction altText="Voir les détails" onClick={onViewDetails} className="h-6 text-xs">
            <ExternalLink className="mr-1 h-3 w-3" />
            Détails
          </ToastAction>
        )}
      </div>

      <ToastClose />
    </Toast>
  );
};

export const Toaster = () => {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
};

// Hook personnalisé pour afficher des erreurs via toast
export const useErrorToast = () => {
  const { toast } = useToast();

  const showErrorToast = (
    error: AppError,
    options?: {
      onRetry?: () => void;
      onViewDetails?: () => void;
    }
  ) => {
    const config = severityConfig[error.severity];

    toast({
      title: error.title,
      description: error.message,
      variant:
        error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.CRITICAL
          ? 'destructive'
          : 'default',
      duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 5000,
      action: (
        <div className="flex gap-1">
          {error.retryable && options?.onRetry && (
            <ToastAction altText="Réessayer" onClick={options.onRetry}>
              <RefreshCw className="mr-1 h-3 w-3" />
              Réessayer
            </ToastAction>
          )}
          {options?.onViewDetails && (
            <ToastAction altText="Détails" onClick={options.onViewDetails}>
              <ExternalLink className="mr-1 h-3 w-3" />
              Détails
            </ToastAction>
          )}
        </div>
      ),
    });
  };

  return { showErrorToast };
};
