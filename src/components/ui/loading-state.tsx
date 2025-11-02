/**
 * LoadingState - Composant de chargement moderne
 * Pattern: Skeleton loading (Linear/Notion)
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const LoadingState: React.FC = () => {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          Chargement des tâches...
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Veuillez patienter
        </p>
      </CardContent>
    </Card>
  );
};
