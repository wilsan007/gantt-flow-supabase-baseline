import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  taskTitle 
}: ActionSelectionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choisir une action pour la sous-tâche</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Sélectionnez l'action de "{taskTitle}" que cette sous-tâche va réaliser
          </p>
        </DialogHeader>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Cette tâche n'a pas encore d'actions. Ajoutez d'abord des actions à la tâche.
            </p>
          ) : (
            actions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="w-full justify-between h-auto p-3"
                onClick={() => {
                  onSelectAction(action.id);
                  onOpenChange(false);
                }}
              >
                <div className="flex flex-col items-start">
                  <FormattedActionText 
                    text={action.title} 
                    className="font-medium"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {action.weight_percentage}%
                    </Badge>
                    {action.is_done && (
                      <Badge variant="outline" className="text-xs bg-success/10 text-success">
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