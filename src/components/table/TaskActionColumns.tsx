import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Task } from '@/hooks/useTasks';
import { getUniqueActions } from '@/lib/taskHelpers';

interface TaskActionColumnsProps {
  tasks: Task[];
  onToggleAction: (taskId: string, actionId: string) => void;
  selectedTaskId?: string;
}

export const TaskActionColumns = ({ tasks, onToggleAction, selectedTaskId }: TaskActionColumnsProps) => {
  const uniqueActions = getUniqueActions(tasks);
  
  // Réorganiser les colonnes d'actions selon la tâche sélectionnée
  const reorderActionsForSelectedTask = (actions: string[], selectedTaskId?: string): string[] => {
    if (!selectedTaskId) return actions;
    
    const selectedTask = tasks.find(task => task.id === selectedTaskId);
    if (!selectedTask || !selectedTask.task_actions) return actions;
    
    // Actions de la tâche sélectionnée en premier
    const selectedTaskActions = selectedTask.task_actions.map(action => action.title);
    const otherActions = actions.filter(action => !selectedTaskActions.includes(action));
    
    return [...selectedTaskActions, ...otherActions];
  };
  
  const orderedActions = reorderActionsForSelectedTask(uniqueActions, selectedTaskId);
  
  // Trier les tâches par display_order pour être aligné avec TaskFixedColumns
  const sortedTasks = [...tasks].sort((a, b) => {
    const orderA = a.display_order?.split('.').map(n => parseInt(n)) || [0];
    const orderB = b.display_order?.split('.').map(n => parseInt(n)) || [0];
    
    for (let i = 0; i < Math.max(orderA.length, orderB.length); i++) {
      const numA = orderA[i] || 0;
      const numB = orderB[i] || 0;
      if (numA !== numB) return numA - numB;
    }
    return 0;
  });

  return (
    <div className="h-[600px] overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow className="h-12">
            {orderedActions.map((actionTitle) => {
              const isSelectedTaskAction = selectedTaskId && 
                tasks.find(task => task.id === selectedTaskId)?.task_actions?.some(action => action.title === actionTitle);
              
              return (
                <TableHead 
                  key={actionTitle} 
                  className={`min-w-[120px] text-center h-12 transition-colors ${
                    isSelectedTaskAction 
                      ? 'bg-primary/20 text-primary border-2 border-primary/40 font-bold' 
                      : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{actionTitle}</span>
                    {isSelectedTaskAction && (
                      <div className="w-6 h-0.5 bg-primary rounded-full animate-pulse" />
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => {
            const isSubtask = (task.task_level || 0) > 0;
            const isSelectedTask = selectedTaskId === task.id;
            
              return (
                <TableRow 
                  key={task.id}
                  className={`border-b transition-colors ${
                    isSelectedTask ? 'bg-primary/10 border-primary/30' : ''
                  }`}
                  style={{ 
                    height: isSubtask ? '51px' : '64px',
                    minHeight: isSubtask ? '51px' : '64px',
                    maxHeight: isSubtask ? '51px' : '64px'
                  }}
                >
                {orderedActions.map((actionTitle) => {
                  const action = task.task_actions?.find(a => a.title === actionTitle);
                  const isSelectedTaskAction = isSelectedTask && action;
                  
                  return (
                    <TableCell 
                      key={actionTitle} 
                      className={`text-center transition-colors ${
                        isSubtask ? 'py-0 text-xs' : 'py-0'
                      } ${isSelectedTaskAction ? 'bg-primary/5' : ''}`}
                      style={{ height: isSubtask ? '51px' : '64px' }}
                    >
                      {action ? (
                        <div className={`flex flex-col items-center gap-1 ${
                          isSelectedTaskAction ? 'transform scale-110' : ''
                        } transition-transform`}>
                          <Checkbox
                            checked={action.is_done}
                            onCheckedChange={() => {
                              console.log('Checkbox clicked - Task ID:', task.id, 'Action ID:', action.id);
                              onToggleAction(task.id, action.id);
                            }}
                            className={`${isSubtask ? 'scale-75' : ''} ${
                              isSelectedTaskAction ? 'border-primary data-[state=checked]:bg-primary' : ''
                            }`}
                          />
                          <span className={`text-muted-foreground font-medium ${
                            isSubtask ? 'text-xs' : 'text-xs'
                          } ${isSelectedTaskAction ? 'text-primary font-bold' : ''}`}>
                            {action.weight_percentage}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};