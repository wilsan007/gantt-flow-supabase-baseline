import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Plus, Trash2, Settings } from '@/lib/icons';
import { type Task } from '@/hooks/optimized';
import { TaskRowActions } from './TaskRowActions';
import { SimpleAssigneeDisplay } from './SimpleAssigneeDisplay';
import { AssigneeSelect } from './AssigneeSelect';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { priorityColors, statusColors, formatDate } from '@/lib/taskHelpers';
import { DocumentCellColumn } from './DocumentCellColumn';
import { CommentCellColumn } from './CommentCellColumn';
import { SubtaskCreationDialog } from './SubtaskCreationDialog';
import { EditableCell } from './cells/EditableCell';
import { EditableCellWithDebounce } from './cells/EditableCellWithDebounce';
import { EditableTitleCell } from './cells/EditableTitleCell';
import { EditableDateCell } from './cells/EditableDateCell';
import { EditableSelectCell } from './cells/EditableSelectCell';
import { useTaskEditPermissions } from '@/hooks/useTaskEditPermissions';
import { EditableWithPermission } from '@/components/permissions/PermissionGate';

interface TaskRowProps {
  task: Task;
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  onRowDoubleClick: (task: Task) => void;
  onCreateSubtask: (
    parentId: string,
    linkedActionId?: string,
    customData?: {
      title: string;
      start_date: string;
      due_date: string;
      effort_estimate_h: number;
    }
  ) => void;
  onCreateSubtaskWithActions?: (
    parentId: string,
    customData: {
      title: string;
      start_date: string;
      due_date: string;
      effort_estimate_h: number;
    },
    actions: Array<{
      id: string;
      title: string;
      weight_percentage: number;
      due_date?: string;
      notes?: string;
    }>
  ) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
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
  onUpdateAssignee,
  onUpdateTask,
}: TaskRowProps) => {
  const isSubtask = (task.task_level || 0) > 0;
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);

  // 🔒 Permissions pour cette tâche
  const permissions = useTaskEditPermissions({ task });

  return (
    <>
      <TableRow
        className={`border-gantt-grid/30 cursor-pointer border-b transition-colors ${
          selectedTaskId === task.id
            ? 'border-primary/40 bg-primary/15'
            : 'hover:bg-gantt-task-bg/50'
        }`}
        style={{
          height: isSubtask ? '51px' : '64px',
          minHeight: isSubtask ? '51px' : '64px',
          maxHeight: isSubtask ? '51px' : '64px',
        }}
        onClick={e => {
          e.stopPropagation();
          onSelectTask(task.id);
        }}
        onDoubleClick={e => {
          e.stopPropagation();
          onRowDoubleClick(task);
        }}
      >
        {/* Titre de la tâche avec actions */}
        <EditableTitleCell
          value={task.title}
          onChange={async value => onUpdateTask?.(task.id, { title: value })}
          displayOrder={task.display_order || '1'}
          taskLevel={task.task_level || 0}
          isSubtask={isSubtask}
          onActionClick={() => {
            if (isSubtask) {
              onDelete(task.id);
            } else {
              setSubtaskDialogOpen(true);
            }
          }}
          actionTitle={isSubtask ? 'Supprimer la sous-tâche' : 'Créer une sous-tâche'}
          debounceMs={800}
          readOnly={!permissions.canEditTitle}
        />

        {/* Projet - Affichage du nom du projet lié avec design futuriste */}
        <TableCell
          className={isSubtask ? 'py-0 text-xs' : 'py-0'}
          style={{ height: isSubtask ? '51px' : '64px' }}
        >
          <div className="flex h-full items-center px-2">
            {task.project_name ? (
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-30 blur transition duration-300 group-hover:opacity-60"></div>
                <Badge
                  variant="outline"
                  className="relative border-cyan-300 bg-gradient-to-r from-cyan-50 to-blue-50 text-xs font-medium text-cyan-700 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md dark:border-cyan-700 dark:from-cyan-950 dark:to-blue-950 dark:text-cyan-300"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"></span>
                    {task.project_name}
                  </span>
                </Badge>
              </div>
            ) : (
              <Badge
                variant="outline"
                className="border-dashed border-slate-300 text-xs font-normal text-slate-400 opacity-60 dark:border-slate-700 dark:text-slate-500"
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  Aucun projet
                </span>
              </Badge>
            )}
          </div>
        </TableCell>

        {/* Responsable - Affichage simple + Popover pour modification */}
        <TableCell
          className={isSubtask ? 'py-0 text-xs' : 'py-0'}
          style={{ height: isSubtask ? '51px' : '64px' }}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-full w-full justify-start px-2 hover:bg-accent">
                <SimpleAssigneeDisplay assignee={task.assignee} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <AssigneeSelect
                assignee={task.assignee}
                taskId={task.id}
                taskTenantId={task.tenant_id}
                onChange={assignee => onUpdateAssignee(task.id, assignee)}
              />
            </PopoverContent>
          </Popover>
        </TableCell>

        {/* Date de début */}
        <EditableDateCell
          value={task.start_date}
          onChange={value => onUpdateTask?.(task.id, { start_date: value })}
          isSubtask={isSubtask}
        />

        {/* Échéance */}
        <EditableDateCell
          value={task.due_date}
          onChange={value => onUpdateTask?.(task.id, { due_date: value })}
          isSubtask={isSubtask}
        />

        {/* Priorité */}
        <EditableSelectCell
          value={task.priority}
          options={[
            { value: 'low', label: 'Basse', variant: 'outline' },
            { value: 'medium', label: 'Moyenne', variant: 'outline' },
            { value: 'high', label: 'Haute', variant: 'outline' },
            { value: 'urgent', label: 'Urgente', variant: 'destructive' },
          ]}
          onChange={value => onUpdateTask?.(task.id, { priority: value as any })}
          getColorClass={value => priorityColors[value]}
          isSubtask={isSubtask}
        />

        {/* Statut */}
        <EditableSelectCell
          value={task.status}
          options={[
            { value: 'todo', label: 'À faire', variant: 'outline' },
            { value: 'doing', label: 'En cours', variant: 'outline' },
            { value: 'blocked', label: 'Bloquée', variant: 'destructive' },
            { value: 'done', label: 'Terminée', variant: 'outline' },
          ]}
          onChange={value => onUpdateTask?.(task.id, { status: value as any })}
          getColorClass={value => statusColors[value]}
          isSubtask={isSubtask}
        />

        {/* Charge */}
        <EditableCellWithDebounce
          value={task.effort_estimate_h || 0}
          onChange={async value =>
            onUpdateTask?.(task.id, { effort_estimate_h: parseFloat(value) || 0 })
          }
          type="number"
          placeholder="0h"
          isSubtask={isSubtask}
          debounceMs={800}
        />

        {/* Progression */}
        <TableCell
          className={isSubtask ? 'py-0 text-xs' : 'py-0'}
          style={{ height: isSubtask ? '51px' : '64px' }}
        >
          <div className="flex items-center gap-2">
            <Progress value={task.progress} className={isSubtask ? 'h-1 w-12' : 'w-16'} />
            <span className={`font-medium ${isSubtask ? 'text-xs' : 'text-sm'} text-foreground`}>
              {task.progress}%
            </span>
          </div>
        </TableCell>

        {/* Documents */}
        <TableCell
          className={isSubtask ? 'py-0 text-xs' : 'py-0'}
          style={{ height: isSubtask ? '51px' : '64px' }}
        >
          <DocumentCellColumn task={task} isSubtask={isSubtask} />
        </TableCell>

        {/* Commentaires */}
        <TableCell
          className={isSubtask ? 'py-0 text-xs' : 'py-0'}
          style={{ height: isSubtask ? '51px' : '64px' }}
        >
          <CommentCellColumn task={task} isSubtask={isSubtask} />
        </TableCell>

        {/* Actions */}
        <TableCell
          className={isSubtask ? 'py-0 text-xs' : 'py-0'}
          style={{ height: isSubtask ? '51px' : '64px' }}
        >
          <TaskRowActions
            taskId={task.id}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </TableCell>
      </TableRow>

      {/* Dialog de création de sous-tâche personnalisée - rendu via Portal */}
      {!isSubtask &&
        subtaskDialogOpen &&
        createPortal(
          <SubtaskCreationDialog
            open={subtaskDialogOpen}
            onOpenChange={setSubtaskDialogOpen}
            parentTask={task}
            onCreateSubtask={onCreateSubtask}
            onCreateSubtaskWithActions={onCreateSubtaskWithActions}
          />,
          document.body
        )}
    </>
  );
};
