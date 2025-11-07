import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary global pour capturer toutes les erreurs React
 * Pattern: React Error Boundary best practices
 *
 * Usage:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Mettre à jour l'état pour afficher le fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log l'erreur dans la console (en dev) et dans un service de monitoring (en prod)
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   // Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback UI par défaut
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-2xl space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Une erreur est survenue</AlertTitle>
              <AlertDescription>
                L'application a rencontré une erreur inattendue. Nos équipes en ont été informées.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Détails de l'erreur</h3>
                <div className="rounded border border-red-200 bg-red-50 p-3">
                  <p className="break-all font-mono text-sm text-red-800">
                    {this.state.error?.message || 'Erreur inconnue'}
                  </p>
                </div>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                    Stack Trace (Dev uniquement)
                  </summary>
                  <pre className="mt-2 max-h-60 overflow-auto rounded bg-gray-100 p-3 text-xs">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Que faire ?</h3>
                <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-gray-600">
                  <li>Essayez de recharger la page</li>
                  <li>Vérifiez votre connexion internet</li>
                  <li>Contactez le support si le problème persiste</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="default" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Réessayer
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Retour Accueil
                </Button>
              </div>
            </div>

            <p className="text-center text-xs text-gray-500">
              ID de l'erreur: {Date.now().toString(36)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
