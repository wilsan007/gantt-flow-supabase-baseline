import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Calendar, User, Clock } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { TaskRowActions } from './TaskRowActions';
import { priorityColors, statusColors, formatDate } from '@/lib/taskHelpers';

interface TaskFixedColumnsProps {
  tasks: Task[];
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export const TaskFixedColumns = ({ tasks, onDuplicate, onDelete }: TaskFixedColumnsProps) => (
  <div className="h-[600px] overflow-auto">
    <Table>
      <TableHeader className="sticky top-0 bg-background z-10">
        <TableRow>
          <TableHead className="min-w-[200px]">Tâche</TableHead>
          <TableHead className="min-w-[120px]">Responsable</TableHead>
          <TableHead className="min-w-[80px]">Début</TableHead>
          <TableHead className="min-w-[80px]">Échéance</TableHead>
          <TableHead className="min-w-[80px]">Priorité</TableHead>
          <TableHead className="min-w-[80px]">Statut</TableHead>
          <TableHead className="min-w-[80px]">Charge (h)</TableHead>
          <TableHead className="min-w-[100px]">Progression</TableHead>
          <TableHead className="w-[50px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {task.assignee}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(task.start_date)}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(task.due_date)}
              </div>
            </TableCell>
            <TableCell>
              <Badge className={priorityColors[task.priority]} variant="outline">
                {task.priority}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={statusColors[task.status]} variant="outline">
                {task.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {task.effort_estimate_h}h
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{task.progress}%</span>
              </div>
            </TableCell>
            <TableCell>
              <TaskRowActions 
                taskId={task.id}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);