import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, User, Plus } from '@/lib/icons';
import { type Task } from '@/hooks/optimized';
import { priorityColors, statusColors, formatDate } from '@/lib/taskHelpers';
import { TaskRowActions } from './TaskRowActions';
import { SimpleAssigneeDisplay } from './SimpleAssigneeDisplay';
import { AssigneeSelect } from './AssigneeSelect';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SubTaskRowProps {
  task: Task;
  level: number;
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
  onAddSubTask: (parentId: string) => void;
}

export const SubTaskRow = ({
  task,
  level,
  onDuplicate,
  onDelete,
  onEdit,
  onUpdateAssignee,
  onAddSubTask,
}: SubTaskRowProps) => {
  const paddingLeft = level * 20;

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium" style={{ paddingLeft: `${paddingLeft + 16}px` }}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddSubTask(task.id)}
            className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <span className="text-muted-foreground mr-2 text-xs">{task.display_order}</span>
          {task.title}
        </div>
      </TableCell>

      <TableCell>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="hover:bg-accent w-full justify-start px-2 text-sm">
              <SimpleAssigneeDisplay assignee={task.assignee} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <AssigneeSelect
              assignee={task.assignee}
              onChange={assignee => onUpdateAssignee(task.id, assignee)}
              taskId={task.id}
              taskTenantId={task.tenant_id}
            />
          </PopoverContent>
        </Popover>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="text-muted-foreground h-3 w-3" />
          {formatDate(task.start_date)}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="text-muted-foreground h-3 w-3" />
          {formatDate(task.due_date)}
        </div>
      </TableCell>

      <TableCell>
        <Badge variant="outline" className={priorityColors[task.priority]}>
          {task.priority}
        </Badge>
      </TableCell>

      <TableCell>
        <Badge variant="outline" className={statusColors[task.status]}>
          {task.status}
        </Badge>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="text-muted-foreground h-3 w-3" />
          {task.effort_estimate_h}h
        </div>
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          <Progress value={task.progress} className="h-2" />
          <span className="text-muted-foreground text-xs">{task.progress}%</span>
        </div>
      </TableCell>

      <TableCell>
        <TaskRowActions
          taskId={task.id}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </TableCell>
    </TableRow>
  );
};
