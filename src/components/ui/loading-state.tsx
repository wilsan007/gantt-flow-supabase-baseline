/**
 * LoadingState - Composant de chargement moderne
 * Pattern: Skeleton loading (Linear/Notion)
 */

import React from 'react';
import { Loader2 } from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Chargement des tâches...',
}) => {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="text-primary mb-4 h-12 w-12 animate-spin" />
        <p className="text-muted-foreground text-lg font-medium">{message}</p>
        <p className="text-muted-foreground mt-2 text-sm">Veuillez patienter</p>
      </CardContent>
    </Card>
  );
};
