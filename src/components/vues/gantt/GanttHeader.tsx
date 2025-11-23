import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, Clock } from '@/lib/icons';
import { useIsMobile } from '@/hooks/use-mobile';

type ViewMode = 'day' | 'week' | 'month';

interface GanttHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const GanttHeader = ({ viewMode, onViewModeChange }: GanttHeaderProps) => {
  const isMobile = useIsMobile();

  // Masquer complètement le header sur mobile
  // if (isMobile) {
  //   return null;
  // }

  return (
    <CardHeader className="from-primary/10 to-accent/10 rounded-t-xl bg-gradient-to-r p-6 pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="from-primary to-accent text-foreground bg-gradient-to-r bg-clip-text text-xl">
          Diagramme de Gantt Interactif
        </CardTitle>
        {/* Contrôles de zoom */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('day')}
            className="transition-smooth hover-glow gap-1"
          >
            <Clock className="h-4 w-4" />
            Jour
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('week')}
            className="transition-smooth hover-glow gap-1"
          >
            <CalendarDays className="h-4 w-4" />
            Semaine
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('month')}
            className="transition-smooth hover-glow gap-1"
          >
            <Calendar className="h-4 w-4" />
            Mois
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};
