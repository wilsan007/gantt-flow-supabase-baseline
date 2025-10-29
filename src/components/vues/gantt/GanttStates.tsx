import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const GanttLoadingState = () => (
  <Card className="w-full modern-card glow-primary">
    <CardContent className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-foreground">Chargement du diagramme de Gantt...</span>
    </CardContent>
  </Card>
);

export const GanttErrorState = ({ error }: { error: string }) => (
  <Card className="w-full modern-card border-destructive/50">
    <CardContent className="p-8">
      <div className="text-center text-destructive">
        <p className="font-semibold">Erreur lors du chargement du diagramme</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
      </div>
    </CardContent>
  </Card>
);