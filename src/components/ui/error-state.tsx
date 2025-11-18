/**
 * ErrorState - Composant d'erreur moderne
 * Pattern: Error handling (Stripe/Linear)
 */

import React from 'react';
import { AlertCircle, RefreshCw } from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <Card className="border-destructive w-full">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="text-destructive mb-4 h-12 w-12" />
        <p className="text-destructive mb-2 text-lg font-semibold">Erreur de chargement</p>
        <p className="text-muted-foreground mb-6 max-w-md text-center text-sm">
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
