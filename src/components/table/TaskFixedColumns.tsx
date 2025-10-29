import React, { useEffect, useRef, useState } from 'react';
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { initTableAlignment } from '@/utils/table-alignment';
import '../../styles/sticky-table.css';

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

interface TaskFixedColumnsProps {
  tasks: Task[];
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onCreateSubtask: (parentId: string, linkedActionId?: string, customData?: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
  }) => void;
  onCreateSubtaskWithActions: (
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
  onUpdateAssignee: (taskId: string, assignee: string) => void;
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  scrollRef?: React.RefObject<HTMLDivElement>;
  headerRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (scrollTop: number) => void;
  onTaskHorizontalScroll?: (scrollLeft: number) => void;
  syncScrollEnabled?: boolean;
}

export const TaskFixedColumns = ({ 
  tasks, 
  onDuplicate, 
  onDelete, 
  onEdit,
  onCreateSubtask, 
  onCreateSubtaskWithActions,
  onUpdateAssignee,
  selectedTaskId,
  onSelectTask,
  scrollRef,
  headerRef,
  onScroll,
  onTaskHorizontalScroll,
  syncScrollEnabled
}: TaskFixedColumnsProps) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollElement = e.currentTarget;
    
    // Synchronisation du défilement vertical SEULEMENT (le horizontal est géré par le conteneur parent)
    if (onScroll && syncScrollEnabled) {
      onScroll(scrollElement.scrollTop);
    }
  };

  // Initialiser l'alignement des colonnes
  useEffect(() => {
    initTableAlignment();
  }, [tasks]);

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
          <TableCell className="text-center" style={{ 
            padding: '8px 2px', 
            width: '45px',
            maxWidth: '45px',
            minWidth: '45px',
            fontSize: '11px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            <div className="flex items-center justify-center gap-0" style={{ paddingLeft: `${level * 4}px` }}>
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
          <TableCell style={{ width: '180px', minWidth: '180px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
          <TableCell style={{ width: '140px', minWidth: '140px', maxWidth: '140px' }}>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm truncate">{task.assigned_name || 'Non assigné'}</span>
            </div>
          </TableCell>

          {/* Statut */}
          <TableCell style={{ width: '90px', minWidth: '90px', maxWidth: '90px' }}>
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
          <TableCell style={{ width: '85px', minWidth: '85px', maxWidth: '85px' }}>
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
          <TableCell style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}>
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
          <TableCell className="text-center" style={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>
            <span className="text-sm">{task.effort_estimate_h || 0}h</span>
          </TableCell>

          {/* Progression */}
          <TableCell style={{ width: '110px', minWidth: '110px', maxWidth: '110px' }}>
            <div className="flex items-center gap-2">
              <Progress value={task.progress || 0} className="h-2" />
              <span className="text-xs text-muted-foreground min-w-[35px]">{task.progress || 0}%</span>
            </div>
          </TableCell>

          {/* Actions */}
          <TableCell style={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>
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
    <>
      {/* CONTENEUR HORIZONTAL UNIFIÉ - Gère SEULEMENT le défilement horizontal */}
      <div 
        className="task-horizontal-scroll-wrapper"
        style={{
          overflowX: 'auto',
          overflowY: 'visible', // Pas de défilement vertical ici
          position: 'relative'
        }}
        onScroll={(e) => {
          // Synchronisation horizontale unifiée
          if (onTaskHorizontalScroll) {
            onTaskHorizontalScroll(e.currentTarget.scrollLeft);
          }
        }}
      >
        {/* Corps du tableau avec défilement VERTICAL seulement */}
        <div 
          ref={scrollRef}
          className="table-body-container"
          onScroll={handleScroll}
          style={{
            height: '600px',
            overflowX: 'visible',
            overflowY: 'auto',
            marginTop: '0px',
            minWidth: '890px' // Largeur minimale pour afficher toutes les colonnes
          }}
        >
          <Table style={{ tableLayout: 'fixed', width: '100%', minWidth: '890px' }}>
            <TableHeader 
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backdropFilter: 'blur(8px)',
                borderBottom: '2px solid rgba(102, 126, 234, 0.3)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
              }}
            >
              <TableRow className="h-15 hover:bg-transparent" style={{ height: '60px' }}>
                <TableHead 
                  className="font-bold border-r border-white/20 text-center"
                  style={{ 
                    color: '#ffffff', 
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)', 
                    padding: '8px 2px', 
                    width: '45px',
                    maxWidth: '45px',
                    minWidth: '45px',
                    fontSize: '11px',
                    background: 'transparent'
                  }}
                >
                  #
                </TableHead>
                <TableHead 
                  className="font-bold border-r border-white/20"
                  style={{ 
                    color: '#ffffff', 
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    width: '180px',
                    minWidth: '180px',
                    maxWidth: '180px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    background: 'transparent'
                  }}
                >
                  Tâche
                </TableHead>
                <TableHead 
                  className="font-bold border-r border-white/20"
                  style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)', background: 'transparent', width: '140px', minWidth: '140px', maxWidth: '140px' }}
                >
                  Assigné à
                </TableHead>
                <TableHead 
                  className="font-bold border-r border-white/20"
                  style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)', background: 'transparent', width: '90px', minWidth: '90px', maxWidth: '90px' }}
                >
                  Statut
                </TableHead>
                <TableHead 
                  className="font-bold border-r border-white/20"
                  style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)', background: 'transparent', width: '85px', minWidth: '85px', maxWidth: '85px' }}
                >
                  Priorité
                </TableHead>
                <TableHead 
                  className="font-bold border-r border-white/20"
                  style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)', background: 'transparent', width: '100px', minWidth: '100px', maxWidth: '100px' }}
                >
                  Échéance
                </TableHead>
                <TableHead 
                  className="font-bold border-r border-white/20 text-center"
                  style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)', background: 'transparent', width: '70px', minWidth: '70px', maxWidth: '70px' }}
                >
                  Effort (h)
                </TableHead>
                <TableHead 
                  className="font-bold border-r border-white/20 text-center"
                  style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)', background: 'transparent', width: '110px', minWidth: '110px', maxWidth: '110px' }}
                >
                  Progression
                </TableHead>
                <TableHead 
                  className="font-bold"
                  style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)', background: 'transparent', width: '70px', minWidth: '70px', maxWidth: '70px' }}
                >
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(task => renderTask(task))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};
