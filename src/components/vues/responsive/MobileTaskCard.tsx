import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2, Circle, AlertCircle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { type Task } from '@/hooks/optimized';

interface MobileTaskCardProps {
  task: Task;
  onToggleAction?: (taskId: string, actionId: string) => void;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
  onClick?: () => void;
}

export const MobileTaskCard: React.FC<MobileTaskCardProps> = ({
  task,
  onToggleAction,
  isSelected,
  onSelect,
  onClick,
}) => {
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    todo: 'bg-slate-100 text-slate-800',
    doing: 'bg-blue-100 text-blue-800',
    blocked: 'bg-red-100 text-red-800',
    done: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    todo: 'À faire',
    doing: 'En cours',
    blocked: 'Bloqué',
    done: 'Terminé',
  };

  return (
    <Card
      className={cn(
        'mb-3 overflow-hidden transition-all duration-200 active:scale-[0.98]',
        isSelected ? 'ring-primary border-primary ring-2' : 'border-border/50',
        'hover:shadow-md'
      )}
      onClick={() => {
        if (onSelect) onSelect(task.id);
        if (onClick) onClick();
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                  priorityColors[task.priority as keyof typeof priorityColors]
                )}
              >
                {task.priority}
              </Badge>
              {task.project_name && (
                <span className="text-muted-foreground max-w-[120px] truncate text-[10px] font-medium">
                  {task.project_name}
                </span>
              )}
            </div>

            <h3 className="text-foreground line-clamp-2 text-sm leading-tight font-semibold">
              {task.title}
            </h3>

            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              {task.due_date && (
                <div
                  className={cn(
                    'flex items-center gap-1',
                    new Date(task.due_date) < new Date() && task.status !== 'done'
                      ? 'font-medium text-red-500'
                      : ''
                  )}
                >
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(task.due_date), 'dd MMM', { locale: fr })}</span>
                </div>
              )}

              {task.assignee && (
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${typeof task.assignee === 'string' ? task.assignee : task.assignee.full_name}`}
                    />
                    <AvatarFallback className="text-[8px]">
                      {(typeof task.assignee === 'string' ? task.assignee : task.assignee.full_name)
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[80px] truncate">
                    {typeof task.assignee === 'string' ? task.assignee : task.assignee.full_name}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className={cn('text-[10px]', statusColors[task.status as keyof typeof statusColors])}
            >
              {statusLabels[task.status as keyof typeof statusLabels] || task.status}
            </Badge>

            {task.progress !== undefined && (
              <div className="w-12">
                <Progress value={task.progress} className="h-1.5" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
