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
import { ActionSelectionDialog } from '../dialogs/ActionSelectionDialog';
import { priorityColors, statusColors, formatDate } from '@/lib/taskHelpers';
import { useState } from 'react';

interface TaskFixedColumnsProps {
  tasks: Task[];
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onCreateSubtask: (parentId: string, linkedActionId?: string) => void;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
}

export const TaskFixedColumns = ({ 
  tasks, 
  onDuplicate, 
  onDelete, 
  onCreateSubtask, 
  onUpdateAssignee,
  selectedTaskId,
  onSelectTask
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

  const [actionSelectionOpen, setActionSelectionOpen] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);

  const handleCreateSubtask = (parentId: string) => {
    const parentTask = tasks.find(task => task.id === parentId);
    if (parentTask && parentTask.task_actions && parentTask.task_actions.length > 0) {
      setSelectedParentTask(parentTask);
      setActionSelectionOpen(true);
    } else {
      // Si pas d'actions, créer la sous-tâche sans liaison
      onCreateSubtask(parentId);
    }
  };

  const handleActionSelection = (actionId: string) => {
    if (selectedParentTask) {
      onCreateSubtask(selectedParentTask.id, actionId);
      setSelectedParentTask(null);
    }
  };

  return (
    <>
      <div className="h-[600px] overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow className="h-12">
            <TableHead className="min-w-[200px] h-12">Tâche</TableHead>
            <TableHead className="min-w-[150px] h-12">Responsable</TableHead>
            <TableHead className="min-w-[80px] h-12">Début</TableHead>
            <TableHead className="min-w-[80px] h-12">Échéance</TableHead>
            <TableHead className="min-w-[80px] h-12">Priorité</TableHead>
            <TableHead className="min-w-[80px] h-12">Statut</TableHead>
            <TableHead className="min-w-[80px] h-12">Charge (h)</TableHead>
            <TableHead className="min-w-[100px] h-12">Progression</TableHead>
            <TableHead className="w-[50px] h-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => {
            const isSubtask = (task.task_level || 0) > 0;
            
            return (
              <TableRow 
                key={task.id} 
                className={`border-b cursor-pointer transition-colors ${
                  selectedTaskId === task.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'
                }`}
                style={{ height: isSubtask ? '51px' : '64px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTask(task.id);
                }}
              >
                <TableCell className={`font-medium ${isSubtask ? 'py-1 text-sm' : ''}`}>
                  <div 
                    className="flex items-center gap-2"
                    style={{ paddingLeft: `${(task.task_level || 0) * 20}px` }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        isSubtask ? onDelete(task.id) : handleCreateSubtask(task.id);
                      }}
                      className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                    >
                      {isSubtask ? (
                        <Trash2 className="h-3 w-3 text-destructive" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                    </Button>
                    <span 
                      className={`${isSubtask ? 'text-muted-foreground italic text-xs' : ''}`}
                    >
                      <span className={`text-muted-foreground mr-2 ${isSubtask ? 'text-xs' : 'text-xs'}`}>
                        {task.display_order || '1'}
                      </span>
                      {task.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1 text-xs' : ''}>
                  <AssigneeSelect
                    assignee={task.assignee}
                    taskId={task.id}
                    onChange={(assignee) => onUpdateAssignee(task.id, assignee)}
                  />
                </TableCell>
                <TableCell className={isSubtask ? 'py-1 text-xs' : ''}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`${isSubtask ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
                    <span className={isSubtask ? 'text-xs' : ''}>
                      {formatDate(task.start_date)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1 text-xs' : ''}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`${isSubtask ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
                    <span className={isSubtask ? 'text-xs' : ''}>
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1 text-xs' : ''}>
                  <Badge 
                    className={`${priorityColors[task.priority]} ${isSubtask ? 'text-xs px-1 py-0' : ''}`} 
                    variant="outline"
                  >
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1 text-xs' : ''}>
                  <Badge 
                    className={`${statusColors[task.status]} ${isSubtask ? 'text-xs px-1 py-0' : ''}`} 
                    variant="outline"
                  >
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1 text-xs' : ''}>
                  <div className="flex items-center gap-2">
                    <Clock className={`${isSubtask ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
                    <span className={isSubtask ? 'text-xs' : ''}>
                      {task.effort_estimate_h}h
                    </span>
                  </div>
                </TableCell>
                <TableCell className={isSubtask ? 'py-1 text-xs' : ''}>
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
                <TableCell className={isSubtask ? 'py-1 text-xs' : ''}>
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
    
    <ActionSelectionDialog
      open={actionSelectionOpen}
      onOpenChange={setActionSelectionOpen}
      actions={selectedParentTask?.task_actions || []}
      onSelectAction={handleActionSelection}
      taskTitle={selectedParentTask?.title || ''}
    />
  </>);
};