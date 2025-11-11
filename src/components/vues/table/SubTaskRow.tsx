import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, User, Plus } from '@/lib/icons';
import { type Task } from '@/hooks/optimized';
import { priorityColors, statusColors, formatDate } from '@/lib/taskHelpers';
import { TaskRowActions } from './TaskRowActions';
import { AssigneeSelect } from './AssigneeSelect';

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
          <span className="mr-2 text-xs text-muted-foreground">{task.display_order}</span>
          {task.title}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3 w-3 text-muted-foreground" />
          <AssigneeSelect
            assignee={task.assignee}
            onChange={assignee => onUpdateAssignee(task.id, assignee)}
            taskId={task.id}
          />
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-3 w-3 text-muted-foreground" />
          {formatDate(task.start_date)}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-3 w-3 text-muted-foreground" />
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
          <Clock className="h-3 w-3 text-muted-foreground" />
          {task.effort_estimate_h}h
        </div>
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          <Progress value={task.progress} className="h-2" />
          <span className="text-xs text-muted-foreground">{task.progress}%</span>
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
