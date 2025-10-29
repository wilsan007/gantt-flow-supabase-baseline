/**
 * ErrorState - Composant d'erreur moderne
 * Pattern: Error handling (Stripe/Linear)
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <Card className="w-full border-destructive">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-semibold text-destructive mb-2">
          Erreur de chargement
        </p>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
          {error || 'Une erreur est survenue lors du chargement des données'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
