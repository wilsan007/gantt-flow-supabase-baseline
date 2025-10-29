import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type Task } from '@/hooks/optimized';
import { priorityColors, statusColors } from '@/lib/taskHelpers';

interface TaskSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
}

export const TaskSelectionDialog = ({ 
  open, 
  onOpenChange, 
  tasks, 
  onSelectTask 
}: TaskSelectionDialogProps) => {
  // Filtrer pour ne montrer que les tâches principales (niveau 0)
  const mainTasks = tasks.filter(task => (task.task_level || 0) === 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choisir une tâche</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Sélectionnez la tâche à laquelle ajouter cette action
          </p>
        </DialogHeader>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {mainTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune tâche disponible
            </p>
          ) : (
            mainTasks.map((task) => (
              <Button
                key={task.id}
                variant="outline"
                className="w-full justify-between h-auto p-3"
                onClick={() => {
                  onSelectTask(task.id);
                  onOpenChange(false);
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{task.title}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={priorityColors[task.priority]}>
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className={statusColors[task.status]}>
                      {task.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {task.assignee}
                    </span>
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