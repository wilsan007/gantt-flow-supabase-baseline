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

import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
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
    <div className="h-[600px] overflow-auto">
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
          {sortedTasks.map((task) => {
            const isSubtask = (task.task_level || 0) > 0;
            
            return (
              <TableRow 
                key={task.id} 
                className={`border-b`}
                style={{ height: isSubtask ? '48px' : '64px' }}
              >
                <TableCell className="font-medium">
                  <div 
                    className="flex items-center gap-2"
                    style={{ paddingLeft: `${(task.task_level || 0) * 20}px` }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => isSubtask ? onDelete(task.id) : handleCreateSubtask(task.id)}
                      className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                    >
                      {isSubtask ? (
                        <Trash2 className="h-3 w-3 text-destructive" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                    </Button>
                    <span 
                      className={`${isSubtask ? 'text-muted-foreground italic text-sm' : ''}`}
                    >
                      <span className="text-xs text-muted-foreground mr-2">
                        {task.display_order || '1'}
                      </span>
                      {task.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1' : ''}>
                  <AssigneeSelect
                    assignee={task.assignee}
                    taskId={task.id}
                    onChange={(assignee) => onUpdateAssignee(task.id, assignee)}
                  />
                </TableCell>
                <TableCell className={isSubtask ? 'py-1' : ''}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`${isSubtask ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
                    <span className={isSubtask ? 'text-sm' : ''}>
                      {formatDate(task.start_date)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1' : ''}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`${isSubtask ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
                    <span className={isSubtask ? 'text-sm' : ''}>
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1' : ''}>
                  <Badge 
                    className={`${priorityColors[task.priority]} ${isSubtask ? 'text-xs px-1 py-0' : ''}`} 
                    variant="outline"
                  >
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1' : ''}>
                  <Badge 
                    className={`${statusColors[task.status]} ${isSubtask ? 'text-xs px-1 py-0' : ''}`} 
                    variant="outline"
                  >
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1' : ''}>
                  <div className="flex items-center gap-2">
                    <Clock className={`${isSubtask ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
                    <span className={isSubtask ? 'text-sm' : ''}>
                      {task.effort_estimate_h}h
                    </span>
                  </div>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1' : ''}>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={task.progress} 
                      className={isSubtask ? 'w-12 h-1' : 'w-16'} 
                    />
                    <span className={`font-medium ${isSubtask ? 'text-xs' : 'text-sm'}`}>
                      {task.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1' : ''}>
                  {!isSubtask && (
                    <TaskRowActions 
                      taskId={task.id}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};