import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, Clock } from '@/lib/icons';

type ViewMode = 'day' | 'week' | 'month';

interface GanttHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const GanttHeader = ({ viewMode, onViewModeChange }: GanttHeaderProps) => (
  <CardHeader className="rounded-t-xl bg-gradient-to-r from-primary/10 to-accent/10 pb-4">
    <div className="flex items-center justify-between">
      <CardTitle className="bg-gradient-to-r from-primary to-accent bg-clip-text text-xl text-foreground text-transparent">
        Diagramme de Gantt Interactif
      </CardTitle>
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
