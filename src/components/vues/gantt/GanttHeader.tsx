import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, Clock } from 'lucide-react';

type ViewMode = 'day' | 'week' | 'month';

interface GanttHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const GanttHeader = ({ viewMode, onViewModeChange }: GanttHeaderProps) => (
  <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-xl">
    <div className="flex items-center justify-between">
      <CardTitle className="text-foreground text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Diagramme de Gantt Interactif
      </CardTitle>
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('day')}
          className="gap-1 transition-smooth hover-glow"
        >
          <Clock className="h-4 w-4" />
          Jour
        </Button>
        <Button
          variant={viewMode === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('week')}
          className="gap-1 transition-smooth hover-glow"
        >
          <CalendarDays className="h-4 w-4" />
          Semaine
        </Button>
        <Button
          variant={viewMode === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('month')}
          className="gap-1 transition-smooth hover-glow"
        >
          <Calendar className="h-4 w-4" />
          Mois
        </Button>
      </div>
    </div>
  </CardHeader>
);