import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const GanttLoadingState = () => (
  <Card className="modern-card glow-primary w-full">
    <CardContent className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-foreground">Chargement du diagramme de Gantt...</span>
    </CardContent>
  </Card>
);

export const GanttErrorState = ({ error }: { error: string }) => (
  <Card className="modern-card w-full border-destructive/50">
    <CardContent className="p-8">
      <div className="text-center text-destructive">
        <p className="font-semibold">Erreur lors du chargement du diagramme</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </div>
    </CardContent>
  </Card>
);
