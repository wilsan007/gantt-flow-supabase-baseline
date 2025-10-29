import { useState, useCallback } from 'react';
import { AppError, ErrorFactory, ErrorType, ErrorSeverity } from '@/lib/errorTypes';
import { useToast } from '@/hooks/use-toast';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  persistErrors?: boolean;
  maxErrors?: number;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { showToast = true, persistErrors = true, maxErrors = 5 } = options;
  const { toast } = useToast();
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((error: AppError) => {
    if (persistErrors) {
      setErrors(prev => {
        const newErrors = [error, ...prev];
        return newErrors.slice(0, maxErrors);
      });
    }

    if (showToast) {
      toast({
        title: error.title,
        description: error.message,
        variant: error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.CRITICAL 
          ? 'destructive' 
          : 'default',
        duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 5000
      });
    }
  }, [persistErrors, maxErrors, showToast, toast]);

  const removeError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const handleTaskDateValidation = useCallback((
    taskStart: string,
    taskEnd: string,
    parentStart?: string,
    parentEnd?: string,
    parentTaskTitle?: string
  ): AppError | null => {
    const taskStartDate = new Date(taskStart);
    const taskEndDate = new Date(taskEnd);
    
    // Vérifier que la date de fin est après la date de début
    if (taskEndDate <= taskStartDate) {
      const error = ErrorFactory.createValidationError(
        'due_date',
        taskEnd,
        'must_be_after_start_date',
        'La date d\'échéance doit être postérieure à la date de début.'
      );
      addError(error);
      return error;
    }

    // Vérifier les conflits avec la tâche parent si elle existe
    if (parentStart && parentEnd) {
      const parentStartDate = new Date(parentStart);
      const parentEndDate = new Date(parentEnd);

      if (taskStartDate < parentStartDate || taskEndDate > parentEndDate) {
        const error = ErrorFactory.createTaskDateConflictError(
          taskStart,
          taskEnd,
          parentStart,
          parentEnd,
          parentTaskTitle
        );
        addError(error);
        return error;
      }
    }

    return null;
  }, [addError]);

  const handleNetworkError = useCallback((
    operation: string,
    statusCode?: number,
    originalError?: any
  ) => {
    const error = ErrorFactory.createNetworkError(operation, statusCode);
    if (originalError) {
      error.context = { originalError: originalError.message };
    }
    addError(error);
    return error;
  }, [addError]);

  const handleValidationError = useCallback((
    field: string,
    value: any,
    constraint: string,
    customMessage?: string
  ) => {
    const error = ErrorFactory.createValidationError(field, value, constraint, customMessage);
    addError(error);
    return error;
  }, [addError]);

  const handlePermissionError = useCallback((action: string) => {
    const error = ErrorFactory.createPermissionError(action);
    addError(error);
    return error;
  }, [addError]);

  const handleGenericError = useCallback((
    title: string,
    message: string,
    suggestion?: string
  ) => {
    const error = ErrorFactory.createGenericError(title, message, suggestion);
    addError(error);
    return error;
  }, [addError]);

  // ========== MÉTHODES D'AUTHENTIFICATION (NIVEAU STRIPE/NOTION) ==========
  
  const handleAuthInvalidCredentials = useCallback(() => {
    const error = ErrorFactory.createAuthInvalidCredentialsError();
    addError(error);
    return error;
  }, [addError]);

  const handleAuthEmailExists = useCallback(() => {
    const error = ErrorFactory.createAuthEmailExistsError();
    addError(error);
    return error;
  }, [addError]);

  const handleAuthWeakPassword = useCallback(() => {
    const error = ErrorFactory.createAuthWeakPasswordError();
    addError(error);
    return error;
  }, [addError]);

  const handleAuthSessionExpired = useCallback(() => {
    const error = ErrorFactory.createAuthSessionExpiredError();
    addError(error);
    return error;
  }, [addError]);

  const handleAuthEmailNotConfirmed = useCallback(() => {
    const error = ErrorFactory.createAuthEmailNotConfirmedError();
    addError(error);
    return error;
  }, [addError]);

  const handleAuthTooManyAttempts = useCallback(() => {
    const error = ErrorFactory.createAuthTooManyAttemptsError();
    addError(error);
    return error;
  }, [addError]);

  const handleAuthAccountLocked = useCallback(() => {
    const error = ErrorFactory.createAuthAccountLockedError();
    addError(error);
    return error;
  }, [addError]);

  // Méthode intelligente pour détecter le type d'erreur d'authentification
  const handleAuthError = useCallback((error: any) => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('invalid') || message.includes('credentials')) {
      return handleAuthInvalidCredentials();
    }
    
    if (message.includes('email') && (message.includes('already') || message.includes('exists'))) {
      return handleAuthEmailExists();
    }
    
    if (message.includes('password') && (message.includes('weak') || message.includes('strength'))) {
      return handleAuthWeakPassword();
    }
    
    if (message.includes('session') && message.includes('expired')) {
      return handleAuthSessionExpired();
    }
    
    if (message.includes('email') && message.includes('confirm')) {
      return handleAuthEmailNotConfirmed();
    }
    
    if (message.includes('too many') || message.includes('rate limit')) {
      return handleAuthTooManyAttempts();
    }
    
    if (message.includes('locked') || message.includes('blocked')) {
      return handleAuthAccountLocked();
    }
    
    // Fallback vers erreur générique
    return handleGenericError('Erreur d\'authentification', error?.message || 'Une erreur s\'est produite.');
  }, [handleAuthInvalidCredentials, handleAuthEmailExists, handleAuthWeakPassword, 
      handleAuthSessionExpired, handleAuthEmailNotConfirmed, handleAuthTooManyAttempts, 
      handleAuthAccountLocked, handleGenericError]);

  const retryError = useCallback((index: number, retryFn?: () => Promise<void>) => {
    if (retryFn) {
      retryFn().catch((error) => {
        handleGenericError(
          'Échec de la nouvelle tentative',
          'La nouvelle tentative a échoué.',
          'Vérifiez votre connexion et réessayez.'
        );
      });
    }
    removeError(index);
  }, [removeError, handleGenericError]);

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    retryError,
    // Méthodes spécialisées existantes
    handleTaskDateValidation,
    handleNetworkError,
    handleValidationError,
    handlePermissionError,
    handleGenericError,
    // Nouvelles méthodes d'authentification (Niveau Stripe/Notion)
    handleAuthError,
    handleAuthInvalidCredentials,
    handleAuthEmailExists,
    handleAuthWeakPassword,
    handleAuthSessionExpired,
    handleAuthEmailNotConfirmed,
    handleAuthTooManyAttempts,
    handleAuthAccountLocked,
    // État
    hasErrors: errors.length > 0,
    hasBlockingErrors: errors.some(e => e.severity === ErrorSeverity.CRITICAL || !e.recoverable)
  };
};
