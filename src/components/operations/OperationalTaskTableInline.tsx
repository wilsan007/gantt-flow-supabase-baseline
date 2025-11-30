import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MoreVertical, User, CalendarClock, AlertCircle, Eye, Edit } from 'lucide-react';
import { OperationalTaskRow } from './OperationalTaskRow';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OperationalTask } from '@/hooks/useOperationalTasksEnterprise';

interface OperationalTaskTableInlineProps {
  tasks: OperationalTask[];
  onUpdateTask?: (taskId: string, updates: Partial<OperationalTask>) => Promise<void> | void;
  onTaskClick?: (task: OperationalTask) => void;
  selectedTaskId?: string;
  compactMode?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'À faire', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'En cours', color: 'bg-blue-500' },
  { value: 'blocked', label: 'Bloqué', color: 'bg-red-500' },
  { value: 'done', label: 'Terminé', color: 'bg-green-500' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse', color: 'bg-gray-400' },
  { value: 'medium', label: 'Moyenne', color: 'bg-yellow-500' },
  { value: 'high', label: 'Haute', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-500' },
];

// Mobile Card Component
const TaskCard = ({
  task,
  isSelected,
  onTaskClick,
}: {
  task: OperationalTask;
  isSelected: boolean;
  onTaskClick?: (task: OperationalTask) => void;
}) => {
  const getStatusLabel = (status?: string) => {
    return STATUS_OPTIONS.find(opt => opt.value === status)?.label || status || 'Non défini';
  };

  const getStatusColor = (status?: string) => {
    return STATUS_OPTIONS.find(opt => opt.value === status)?.color || 'bg-gray-500';
  };

  const getPriorityLabel = (priority?: string) => {
    return PRIORITY_OPTIONS.find(opt => opt.value === priority)?.label || priority || 'Moyenne';
  };

  const getPriorityColor = (priority?: string) => {
    return PRIORITY_OPTIONS.find(opt => opt.value === priority)?.color || 'bg-gray-400';
  };

  const getAssigneeName = (assignee: string | { full_name: string } | null): string => {
    if (!assignee) return 'Non assigné';
    if (typeof assignee === 'string') return assignee;
    return assignee.full_name || 'Non assigné';
  };

  return (
    <Card
      className={cn(
        'mb-3 cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-primary ring-2'
      )}
      onClick={() => onTaskClick?.(task)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              {task.is_recurring && (
                <CalendarClock className="h-4 w-4 flex-shrink-0 text-blue-500" />
              )}
              <h3 className="truncate text-base font-semibold">{task.title}</h3>
            </div>
            {task.category && (
              <p className="text-muted-foreground text-xs capitalize">{task.category}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 flex-shrink-0 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Badges */}
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge className={cn('text-white', getStatusColor(task.status))}>
            {getStatusLabel(task.status)}
          </Badge>
          {task.priority && (
            <Badge
              variant="outline"
              className={cn('border-2', getPriorityColor(task.priority).replace('bg-', 'border-'))}
            >
              {getPriorityLabel(task.priority)}
            </Badge>
          )}
          {task.department && <Badge variant="secondary">{task.department}</Badge>}
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="text-muted-foreground h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-muted-foreground truncate">
              {getAssigneeName(task.assigned_to)}
            </span>
          </div>
          {task.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-muted-foreground">
                Échéance: {format(new Date(task.due_date), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const OperationalTaskTableInline: React.FC<OperationalTaskTableInlineProps> = ({
  tasks,
  onUpdateTask,
  onTaskClick,
  selectedTaskId,
  compactMode = false,
}) => {
  const isMobile = useIsMobile();

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-muted-foreground flex flex-col items-center gap-2">
            <Calendar className="h-10 w-10 md:h-12 md:w-12" />
            <p className="text-sm md:text-base">Aucune tâche opérationnelle trouvée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mobile: Card Layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={selectedTaskId === task.id}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    );
  }

  // Desktop: Table Layout
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Titre</TableHead>
            <TableHead className="w-[120px]">Statut</TableHead>
            <TableHead className="w-[120px]">Priorité</TableHead>
            <TableHead className="w-[150px]">Catégorie</TableHead>
            {!compactMode && (
              <>
                <TableHead className="w-[150px]">Assigné à</TableHead>
                <TableHead className="w-[120px]">Échéance</TableHead>
                <TableHead className="w-[120px]">Département</TableHead>
              </>
            )}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => (
            <OperationalTaskRow
              key={task.id}
              task={task}
              onUpdateTask={onUpdateTask}
              onTaskClick={onTaskClick}
              isSelected={selectedTaskId === task.id}
              compactMode={compactMode}
              statusOptions={STATUS_OPTIONS}
              priorityOptions={PRIORITY_OPTIONS}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
