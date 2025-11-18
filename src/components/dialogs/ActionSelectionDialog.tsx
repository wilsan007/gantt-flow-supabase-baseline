import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormattedActionText } from '@/components/ui/formatted-action-text';
import { type Task, type TaskAction } from '@/hooks/useTasksEnterprise';

interface ActionSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: TaskAction[];
  task: Task;
  onSelectAction: (actionId: string) => void;
  taskTitle: string;
}

export const ActionSelectionDialog = ({
  open,
  onOpenChange,
  actions,
  onSelectAction,
  taskTitle,
}: ActionSelectionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choisir une action pour la sous-tâche</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Sélectionnez l'action de "{taskTitle}" que cette sous-tâche va réaliser
          </p>
        </DialogHeader>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {actions.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Cette tâche n'a pas encore d'actions. Ajoutez d'abord des actions à la tâche.
            </p>
          ) : (
            actions.map(action => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto w-full justify-between p-3"
                onClick={() => {
                  onSelectAction(action.id);
                  onOpenChange(false);
                }}
              >
                <div className="flex flex-col items-start">
                  <FormattedActionText text={action.title} className="font-medium" />
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {action.weight_percentage}%
                    </Badge>
                    {action.is_done && (
                      <Badge variant="outline" className="bg-success/10 text-success text-xs">
                        Terminé
                      </Badge>
                    )}
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
