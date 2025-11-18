import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from '@/lib/icons';

export const GanttLoadingState = () => (
  <Card className="modern-card glow-primary w-full">
    <CardContent className="flex items-center justify-center p-8">
      <Loader2 className="text-primary h-8 w-8 animate-spin" />
      <span className="text-foreground ml-2">Chargement du diagramme de Gantt...</span>
    </CardContent>
  </Card>
);

export const GanttErrorState = ({ error }: { error: string }) => (
  <Card className="modern-card border-destructive/50 w-full">
    <CardContent className="p-8">
      <div className="text-destructive text-center">
        <p className="font-semibold">Erreur lors du chargement du diagramme</p>
        <p className="text-muted-foreground mt-2 text-sm">{error}</p>
      </div>
    </CardContent>
  </Card>
);
