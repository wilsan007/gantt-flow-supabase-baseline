import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { TaskRowActions } from './TaskRowActions';
import { AssigneeSelect } from './AssigneeSelect';
import { priorityColors, statusColors, formatDate } from '@/lib/taskHelpers';

interface TaskFixedColumnsProps {
  tasks: Task[];
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onCreateSubtask: (parentId: string, title: string) => void;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
}

export const TaskFixedColumns = ({ 
  tasks, 
  onDuplicate, 
  onDelete, 
  onCreateSubtask, 
  onUpdateAssignee 
}: TaskFixedColumnsProps) => {
  // Trier les tâches par display_order pour afficher les sous-tâches correctement
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

  const handleCreateSubtask = (parentId: string) => {
    const parent = tasks.find(t => t.id === parentId);
    const subtaskTitle = `Sous-tâche de ${parent?.title}`;
    onCreateSubtask(parentId, subtaskTitle);
  };

  return (
    <ScrollArea className="h-[600px]">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="min-w-[200px]">Tâche</TableHead>
            <TableHead className="min-w-[150px]">Responsable</TableHead>
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
          {sortedTasks.map((task) => (
            <TableRow key={task.id} className="border-b">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCreateSubtask(task.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span 
                    className={`${task.task_level > 0 ? 'text-muted-foreground' : ''}`}
                    style={{ marginLeft: `${(task.task_level || 0) * 16}px` }}
                  >
                    {task.display_order || '1'}. {task.title}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                  <AssigneeSelect
                    assignee={task.assignee}
                    taskId={task.id}
                    onChange={(assignee) => onUpdateAssignee(task.id, assignee)}
                  />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(task.start_date)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
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
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {task.effort_estimate_h}h
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={task.progress} className="w-16" />
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
    </ScrollArea>
  );
};