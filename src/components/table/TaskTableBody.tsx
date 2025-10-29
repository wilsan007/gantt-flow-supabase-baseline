/**
 * TaskTableBody - Corps du tableau de tâches (colonnes fixes)
 * Pattern: Sticky columns + Hierarchical rows (Notion/Airtable)
 */

import React from 'react';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  User, 
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Copy,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { type Task } from '@/hooks/useTasksWithActions';
import { cn } from '@/lib/utils';

interface TaskTableBodyProps {
  tasks: Task[];
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onCreateSubtask: (parentId: string) => void;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
}

const STATUS_CONFIG = {
  todo: { label: 'À faire', color: 'bg-slate-500' },
  doing: { label: 'En cours', color: 'bg-blue-500' },
  blocked: { label: 'Bloqué', color: 'bg-red-500' },
  done: { label: 'Terminé', color: 'bg-green-500' },
  in_progress: { label: 'En cours', color: 'bg-blue-500' },
  completed: { label: 'Terminé', color: 'bg-green-500' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Basse', color: 'bg-slate-400' },
  medium: { label: 'Moyenne', color: 'bg-yellow-500' },
  high: { label: 'Haute', color: 'bg-orange-500' },
  urgent: { label: 'Urgente', color: 'bg-red-600' },
};

export const TaskTableBody: React.FC<TaskTableBodyProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onDuplicate,
  onDelete,
  onEdit,
  onCreateSubtask,
  onUpdateAssignee,
}) => {
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(new Set());

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const renderTask = (task: Task, level: number = 0) => {
    const isSelected = selectedTaskId === task.id;
    const isExpanded = expandedTasks.has(task.id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;

    return (
      <React.Fragment key={task.id}>
        <TableRow
          className={cn(
            'cursor-pointer transition-colors hover:bg-muted/50',
            isSelected && 'bg-primary/10 border-l-4 border-l-primary'
          )}
          onClick={() => onSelectTask(task.id)}
        >
          {/* Numéro avec hiérarchie */}
          <TableCell className="w-[60px] min-w-[60px] max-w-[60px] text-center" style={{ padding: '12px 4px' }}>
            <div className="flex items-center justify-center gap-1" style={{ paddingLeft: `${level * 8}px` }}>
              {hasSubtasks && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(task.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
              <span className="text-xs text-muted-foreground">{task.display_order}</span>
            </div>
          </TableCell>

          {/* Titre */}
          <TableCell className="min-w-[200px] max-w-[300px]">
            <div className="flex flex-col">
              <span className="font-medium">{task.title}</span>
              {task.description && (
                <span className="text-xs text-muted-foreground truncate">
                  {task.description}
                </span>
              )}
            </div>
          </TableCell>

          {/* Assigné à */}
          <TableCell className="min-w-[150px]">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm truncate">{task.assigned_name || 'Non assigné'}</span>
            </div>
          </TableCell>

          {/* Statut */}
          <TableCell className="min-w-[100px]">
            <Badge
              variant="secondary"
              className={cn(
                'text-white',
                STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-500'
              )}
            >
              {STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]?.label || task.status}
            </Badge>
          </TableCell>

          {/* Priorité */}
          <TableCell className="min-w-[100px]">
            <Badge
              className={cn(
                'text-white',
                PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.color || 'bg-gray-500'
              )}
            >
              {PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.label || task.priority}
            </Badge>
          </TableCell>

          {/* Échéance */}
          <TableCell className="min-w-[120px]">
            {task.due_date ? (
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4" />
                {new Date(task.due_date).toLocaleDateString('fr-FR')}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </TableCell>

          {/* Effort (h) */}
          <TableCell className="min-w-[80px] text-center">
            <span className="text-sm">{task.effort_estimate_h || 0}h</span>
          </TableCell>

          {/* Actions */}
          <TableCell className="w-[80px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task.id); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(task.id); }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateSubtask(task.id); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter sous-tâche
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>

        {/* Sous-tâches */}
        {isExpanded && hasSubtasks && task.subtasks!.map(subtask => renderTask(subtask, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <TableBody>
      {tasks.map(task => renderTask(task))}
    </TableBody>
  );
};
