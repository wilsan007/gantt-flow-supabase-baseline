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
}

export const TaskActionColumns = ({ tasks, onToggleAction }: TaskActionColumnsProps) => {
  const uniqueActions = getUniqueActions(tasks);

  return (
    <div className="h-[600px] overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            {uniqueActions.map((actionTitle) => (
              <TableHead key={actionTitle} className="min-w-[120px] text-center">
                {actionTitle}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const isSubtask = (task.task_level || 0) > 0;
            
              return (
                <TableRow 
                  key={task.id}
                  className=""
                  style={{ height: isSubtask ? '51px' : '64px' }}
                >
                {uniqueActions.map((actionTitle) => {
                  const action = task.task_actions?.find(a => a.title === actionTitle);
                  
                  return (
                    <TableCell 
                      key={actionTitle} 
                      className={`text-center ${isSubtask ? 'py-1' : ''}`}
                    >
                      {action ? (
                        <div className="flex flex-col items-center gap-1">
                          <Checkbox
                            checked={action.is_done}
                            onCheckedChange={() => {
                              onToggleAction(task.id, action.id);
                            }}
                            className={isSubtask ? 'scale-75' : ''}
                          />
                          <span className={`text-muted-foreground font-medium ${isSubtask ? 'text-xs' : 'text-xs'}`}>
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