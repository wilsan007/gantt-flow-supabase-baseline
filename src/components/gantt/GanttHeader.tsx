import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, Clock } from 'lucide-react';

type ViewMode = 'day' | 'week' | 'month';

interface GanttHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const GanttHeader = ({ viewMode, onViewModeChange }: GanttHeaderProps) => (
  <CardHeader className="pb-4">
    <div className="flex items-center justify-between">
      <CardTitle className="text-foreground">Diagramme de Gantt Interactif</CardTitle>
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('day')}
          className="gap-1"
        >
          <Clock className="h-4 w-4" />
          Jour
        </Button>
        <Button
          variant={viewMode === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('week')}
          className="gap-1"
        >
          <CalendarDays className="h-4 w-4" />
          Semaine
        </Button>
        <Button
          variant={viewMode === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('month')}
          className="gap-1"
        >
          <Calendar className="h-4 w-4" />
          Mois
        </Button>
      </div>
    </div>
  </CardHeader>
);