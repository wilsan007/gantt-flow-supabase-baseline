import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, User } from 'lucide-react';
import { EditableOperationalTitleCell } from './cells/EditableOperationalTitleCell';
import { EditableOperationalCategoryCell } from './cells/EditableOperationalCategoryCell';
import { EditableSelectCell } from '../vues/table/cells/EditableSelectCell';
import { EditableDateCell } from '../vues/table/cells/EditableDateCell';
import { useOperationalTaskPermissions } from '@/hooks/useOperationalTaskPermissions';
import { OperationalTask } from '@/hooks/useOperationalTasksEnterprise';
import { cn } from '@/lib/utils';

interface OperationalTaskRowProps {
  task: OperationalTask;
  onUpdateTask?: (taskId: string, updates: Partial<OperationalTask>) => Promise<void> | void;
  onTaskClick?: (task: OperationalTask) => void;
  isSelected: boolean;
  compactMode?: boolean;
  statusOptions: Array<{ value: string; label: string; color: string }>;
  priorityOptions: Array<{ value: string; label: string; color: string }>;
}

export const OperationalTaskRow: React.FC<OperationalTaskRowProps> = ({
  task,
  onUpdateTask,
  onTaskClick,
  isSelected,
  compactMode,
  statusOptions,
  priorityOptions,
}) => {
  // 🔒 Hook de permissions pour cette tâche
  const permissions = useOperationalTaskPermissions({ task });

  const getAssigneeName = (assignee: string | { full_name: string } | null): string => {
    if (!assignee) return 'Non assigné';
    if (typeof assignee === 'string') return assignee;
    return assignee.full_name || 'Non assigné';
  };

  return (
    <TableRow
      className={cn(
        'hover:bg-muted/50 cursor-pointer transition-colors',
        isSelected && 'bg-primary/10'
      )}
      onClick={() => onTaskClick?.(task)}
    >
      {/* Titre - Éditable avec permissions */}
      <EditableOperationalTitleCell
        value={task.title}
        onChange={async value => onUpdateTask?.(task.id, { title: value })}
        readOnly={!permissions.canEditTitle}
        isRecurring={task.is_recurring}
      />

      {/* Statut - Éditable avec permissions */}
      <EditableSelectCell
        value={task.status}
        onChange={async value => onUpdateTask?.(task.id, { status: value })}
        options={statusOptions}
        readOnly={!permissions.canEditStatus}
      />

      {/* Priorité - Éditable avec permissions (seulement TL+) */}
      <EditableSelectCell
        value={task.priority || 'medium'}
        onChange={async value => onUpdateTask?.(task.id, { priority: value })}
        options={priorityOptions}
        readOnly={!permissions.canEditPriority}
      />

      {/* Catégorie - Éditable avec permissions */}
      <EditableOperationalCategoryCell
        value={task.category || 'other'}
        onChange={async value => onUpdateTask?.(task.id, { category: value })}
        readOnly={!permissions.canEditCategory}
      />

      {!compactMode && (
        <>
          {/* Assigné à - Lecture seule pour l'instant */}
          <TableCell className="py-2">
            <div className="flex items-center gap-2">
              <User className="text-muted-foreground h-4 w-4" />
              <span className="truncate text-sm">{getAssigneeName(task.assigned_to)}</span>
            </div>
          </TableCell>

          {/* Échéance - Éditable avec permissions */}
          <EditableDateCell
            value={task.due_date}
            onChange={async value => onUpdateTask?.(task.id, { due_date: value })}
            readOnly={!permissions.canEditDates}
          />

          {/* Département - Lecture seule */}
          <TableCell className="py-2">
            {task.department ? (
              <Badge variant="outline">{task.department}</Badge>
            ) : (
              <span className="text-muted-foreground text-xs">-</span>
            )}
          </TableCell>
        </>
      )}

      {/* Actions */}
      <TableCell className="py-2" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
