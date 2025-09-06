import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const GanttLoadingState = () => (
  <Card className="w-full bg-card border-border">
    <CardContent className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Chargement du diagramme de Gantt...</span>
    </CardContent>
  </Card>
);

export const GanttErrorState = ({ error }: { error: string }) => (
  <Card className="w-full bg-card border-border">
    <CardContent className="p-8">
      <div className="text-center text-destructive">
        <p>Erreur lors du chargement du diagramme</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
      </div>
    </CardContent>
  </Card>
);