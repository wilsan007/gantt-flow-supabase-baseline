import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Target } from '@/lib/icons';
import { ActionCreationDialog } from './ActionCreationDialog';
import { ExportButton } from '@/components/tasks/ExportButton';
import { Task } from '@/hooks/optimized';
import { TaskFilters } from '@/components/tasks/AdvancedFilters';
import { useIsMobile } from '@/hooks/use-mobile';

interface TaskTableHeaderProps {
  newActionTitle: string;
  setNewActionTitle: (value: string) => void;
  onAddActionColumn: () => void;
  onCreateDetailedAction: (actionData: {
    title: string;
    weight_percentage: number;
    due_date?: string;
    notes?: string;
  }) => void;
  selectedTaskId?: string;
  isActionButtonEnabled: boolean;
  onCreateTask?: () => void;
  tasks?: Task[];
  filters?: TaskFilters;
}

export const TaskTableHeader = ({
  newActionTitle,
  setNewActionTitle,
  onAddActionColumn,
  onCreateDetailedAction,
  selectedTaskId,
  isActionButtonEnabled,
  onCreateTask,
  tasks = [],
  filters,
}: TaskTableHeaderProps) => {
  const isMobile = useIsMobile();

  // Masquer complètement le header sur mobile
  if (isMobile) {
    return null;
  }

  return (
    <CardHeader className="p-6">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5" />
          <span>Tableau Dynamique d'Exécution</span>
        </CardTitle>
        <div className="flex gap-2">
          {onCreateTask && (
            <Button
              onClick={onCreateTask}
              size="sm"
              variant="default"
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Tâche
            </Button>
          )}
          {tasks.length > 0 && (
            <ExportButton tasks={tasks} filters={filters} variant="outline" size="sm" />
          )}
          {selectedTaskId && (
            <div className="text-muted-foreground self-center text-sm">Tâche sélectionnée</div>
          )}
          <Input
            placeholder="Action rapide..."
            value={newActionTitle}
            onChange={e => setNewActionTitle(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && isActionButtonEnabled && onAddActionColumn()}
            className="w-40"
          />
          <Button
            onClick={onAddActionColumn}
            size="sm"
            disabled={!isActionButtonEnabled}
            title={
              !selectedTaskId
                ? "Sélectionnez d'abord une tâche"
                : !newActionTitle.trim()
                  ? "Entrez un nom pour l'action"
                  : ''
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
          <ActionCreationDialog
            onCreateAction={onCreateDetailedAction}
            selectedTaskId={selectedTaskId}
          />
        </div>
      </div>
    </CardHeader>
  );
};
