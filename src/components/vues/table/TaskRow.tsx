import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Plus, Trash2, Settings } from 'lucide-react';
import { type Task } from '@/hooks/optimized';
import { TaskRowActions } from './TaskRowActions';
import { AssigneeSelect } from './AssigneeSelect';
import { priorityColors, statusColors, formatDate } from '@/lib/taskHelpers';
import { DocumentCellColumn } from './DocumentCellColumn';
import { CommentCellColumn } from './CommentCellColumn';
import { SubtaskCreationDialog } from './SubtaskCreationDialog';

interface TaskRowProps {
  task: Task;
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  onRowDoubleClick: (task: Task) => void;
  onCreateSubtask: (parentId: string, linkedActionId?: string, customData?: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
  }) => void;
  onCreateSubtaskWithActions?: (parentId: string, customData: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
  }, actions: Array<{
    id: string;
    title: string;
    weight_percentage: number;
    due_date?: string;
    notes?: string;
  }>) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
}

export const TaskRow = ({
  task,
  selectedTaskId,
  onSelectTask,
  onRowDoubleClick,
  onCreateSubtask,
  onCreateSubtaskWithActions,
  onDelete,
  onDuplicate,
  onEdit,
  onUpdateAssignee
}: TaskRowProps) => {
  const isSubtask = (task.task_level || 0) > 0;
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  
  return (
    <>
      <TableRow 
        className={`border-b border-gantt-grid/30 cursor-pointer transition-colors ${
          selectedTaskId === task.id ? 'bg-primary/15 border-primary/40' : 'hover:bg-gantt-task-bg/50'
        }`}
        style={{ 
          height: isSubtask ? '51px' : '64px',
          minHeight: isSubtask ? '51px' : '64px',
          maxHeight: isSubtask ? '51px' : '64px'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectTask(task.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onRowDoubleClick(task);
        }}
      >
      {/* Titre de la tâche avec actions */}
      <TableCell 
        className={`font-medium ${isSubtask ? 'py-0 text-sm' : 'py-0'}`} 
        style={{ height: isSubtask ? '51px' : '64px' }}
      >
        <div 
          className="flex items-center gap-1"
          style={{ paddingLeft: `${(task.task_level || 0) * 20}px` }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (isSubtask) {
                onDelete(task.id);
              } else {
                setSubtaskDialogOpen(true); // Ouvrir le dialog complet
              }
            }}
            className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
            title={isSubtask ? "Supprimer la sous-tâche" : "Créer une sous-tâche"}
          >
            {isSubtask ? (
              <Trash2 className="h-3 w-3 text-destructive" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
          </Button>
          <span 
            className={`${isSubtask ? 'text-foreground/70 italic text-xs' : 'text-foreground'}`}
          >
            <span className={`text-foreground/60 mr-2 ${isSubtask ? 'text-xs' : 'text-xs'}`}>
              {task.display_order || '1'}
            </span>
            {task.title}
          </span>
        </div>
      </TableCell>
      
      {/* Responsable */}
      <TableCell className={isSubtask ? 'py-0 text-xs' : 'py-0'} style={{ height: isSubtask ? '51px' : '64px' }}>
        <AssigneeSelect
          assignee={task.assignee}
          taskId={task.id}
          onChange={(assignee) => onUpdateAssignee(task.id, assignee)}
        />
      </TableCell>
      
      {/* Date de début */}
      <TableCell className={isSubtask ? 'py-0 text-xs' : 'py-0'} style={{ height: isSubtask ? '51px' : '64px' }}>
        <div className="flex items-center gap-2">
          <Calendar className={`${isSubtask ? 'h-3 w-3' : 'h-4 w-4'} text-foreground/60`} />
          <span className={`${isSubtask ? 'text-xs' : ''} text-foreground`}>
            {formatDate(task.start_date)}
          </span>
        </div>
      </TableCell>
      
      {/* Échéance */}
      <TableCell className={isSubtask ? 'py-0 text-xs' : 'py-0'} style={{ height: isSubtask ? '51px' : '64px' }}>
        <div className="flex items-center gap-2">
          <Calendar className={`${isSubtask ? 'h-3 w-3' : 'h-4 w-4'} text-foreground/60`} />
          <span className={`${isSubtask ? 'text-xs' : ''} text-foreground`}>
            {formatDate(task.due_date)}
          </span>
        </div>
      </TableCell>
      
      {/* Priorité */}
      <TableCell className={isSubtask ? 'py-0 text-xs' : 'py-0'} style={{ height: isSubtask ? '51px' : '64px' }}>
        <Badge 
          className={`${priorityColors[task.priority]} ${isSubtask ? 'text-xs px-1 py-0' : ''}`} 
          variant="outline"
        >
          {task.priority}
        </Badge>
      </TableCell>
      
      {/* Statut */}
      <TableCell className={isSubtask ? 'py-0 text-xs' : 'py-0'} style={{ height: isSubtask ? '51px' : '64px' }}>
        <Badge 
          className={`${statusColors[task.status]} ${isSubtask ? 'text-xs px-1 py-0' : ''}`} 
          variant="outline"
        >
          {task.status}
        </Badge>
      </TableCell>
      
      {/* Charge */}
      <TableCell className={isSubtask ? 'py-0 text-xs' : 'py-0'} style={{ height: isSubtask ? '51px' : '64px' }}>
        <div className="flex items-center gap-2">
          <Clock className={`${isSubtask ? 'h-3 w-3' : 'h-4 w-4'} text-foreground/60`} />
          <span className={`${isSubtask ? 'text-xs' : ''} text-foreground`}>
            {task.effort_estimate_h}h
          </span>
        </div>
      </TableCell>
      
      {/* Progression */}
      <TableCell className={isSubtask ? 'py-0 text-xs' : 'py-0'} style={{ height: isSubtask ? '51px' : '64px' }}>
        <div className="flex items-center gap-2">
          <Progress 
            value={task.progress} 
            className={isSubtask ? 'w-12 h-1' : 'w-16'} 
          />
          <span className={`font-medium ${isSubtask ? 'text-xs' : 'text-sm'} text-foreground`}>
            {task.progress}%
          </span>
        </div>
      </TableCell>
      
      {/* Documents */}
      <TableCell className={isSubtask ? 'py-0 text-xs' : 'py-0'} style={{ height: isSubtask ? '51px' : '64px' }}>
        <DocumentCellColumn task={task} isSubtask={isSubtask} />
      </TableCell>
      
      {/* Commentaires */}
      <TableCell className={isSubtask ? 'py-0 text-xs' : 'py-0'} style={{ height: isSubtask ? '51px' : '64px' }}>
        <CommentCellColumn task={task} isSubtask={isSubtask} />
      </TableCell>
      
      {/* Actions */}
      <TableCell className={isSubtask ? 'py-0 text-xs' : 'py-0'} style={{ height: isSubtask ? '51px' : '64px' }}>
        <TaskRowActions 
          taskId={task.id}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </TableCell>
    </TableRow>
      
      {/* Dialog de création de sous-tâche personnalisée */}
      {!isSubtask && (
        <SubtaskCreationDialog
          open={subtaskDialogOpen}
          onOpenChange={setSubtaskDialogOpen}
          parentTask={task}
          onCreateSubtask={onCreateSubtask}
          onCreateSubtaskWithActions={onCreateSubtaskWithActions}
        />
      )}
    </>
  );
};