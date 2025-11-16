// @ts-nocheck
import { useState } from 'react';
// Hooks optimisés avec cache intelligent et métriques
import { useTasks } from '@/hooks/optimized';
import { useProjects } from '@/hooks/optimized';
import { useEmployees } from '@/hooks/useEmployees';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileKanbanBoard } from '../responsive/MobileKanbanBoard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AdvancedFilters, type TaskFilters } from '@/components/tasks/AdvancedFilters';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { ExportButton } from '@/components/tasks/ExportButton';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/hooks/optimized';

const TASK_COLUMNS = [
  { id: 'todo', title: 'À faire', status: 'todo' as const },
  { id: 'doing', title: 'En cours', status: 'doing' as const },
  { id: 'blocked', title: 'Bloqué', status: 'blocked' as const },
  { id: 'done', title: 'Terminé', status: 'done' as const },
];

const PROJECT_COLUMNS = [
  { id: 'planning', title: 'Planification', status: 'planning' as const },
  { id: 'active', title: 'En cours', status: 'active' as const },
  { id: 'on_hold', title: 'En pause', status: 'on_hold' as const },
  { id: 'completed', title: 'Terminé', status: 'completed' as const },
];

const PRIORITY_COLORS = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/20 text-warning border-warning/30',
  high: 'bg-tech-orange/20 text-tech-orange border-tech-orange/30',
  urgent: 'bg-destructive/20 text-destructive border-destructive/30',
};

interface KanbanCardProps {
  task: Task | any; // Peut être une tâche ou un projet
}

function KanbanCard({ task }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card className="transition-smooth glass hover-glow mb-3 cursor-grab border-primary/30 bg-card/40 backdrop-blur-sm hover:shadow-md active:cursor-grabbing">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            {task.title || task.name}
          </CardTitle>

          {/* Badges priorité et projet */}
          <div className="flex flex-wrap items-center gap-1 py-1">
            <Badge
              className={`border text-xs font-medium ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}
            >
              {task.priority}
            </Badge>
            {(task.projects?.name || task.project_name) && (
              <Badge variant="secondary" className="text-xs">
                📁 {task.projects?.name || task.project_name}
              </Badge>
            )}
          </div>

          {/* Assigné avec nom complet */}
          <div className="flex items-center gap-2 pt-1">
            <Avatar className="h-6 w-6 ring-2 ring-primary/40">
              {(() => {
                // Normaliser assignee qui peut être string ou objet
                const assigneeStr =
                  typeof task.assignee === 'string'
                    ? task.assignee
                    : (task.assignee as any)?.full_name || task.manager_name || 'NA';
                return (
                  <>
                    <AvatarImage src="" alt={assigneeStr} />
                    <AvatarFallback className="bg-primary/40 text-xs font-semibold text-primary-foreground">
                      {assigneeStr.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </>
                );
              })()}
            </Avatar>
            <span className="flex-1 truncate text-xs text-muted-foreground">
              {(() => {
                const assigneeStr =
                  typeof task.assignee === 'string'
                    ? task.assignee
                    : (task.assignee as any)?.full_name || task.manager_name || 'Non assigné';
                return assigneeStr;
              })()}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Progress value={task.progress || 0} className="h-2 bg-muted/50" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{task.progress || 0}% terminé</span>
              <span className="rounded bg-accent/30 px-2 py-1 font-medium text-accent-foreground">
                {task.status}
              </span>
            </div>
            {/* Affichage spécifique aux projets */}
            {task.task_count !== undefined && (
              <div className="text-xs text-muted-foreground">
                📝 {task.task_count} tâche{task.task_count > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface KanbanColumnProps {
  column: (typeof TASK_COLUMNS)[0] | (typeof PROJECT_COLUMNS)[0];
  tasks: Task[] | any[];
}

function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  return (
    <div className="min-w-0 flex-1">
      <Card className="glass glow-accent transition-smooth h-full border-primary/30">
        <CardHeader className="border-b border-primary/30 bg-gradient-to-r from-primary/15 to-accent/15 pb-3 backdrop-blur-sm">
          <CardTitle className="flex items-center justify-between text-lg text-foreground">
            <span className="bg-gradient-to-r from-tech-purple to-tech-cyan bg-clip-text font-bold text-transparent">
              {column.title}
            </span>
            <Badge
              variant="secondary"
              className="ml-2 border-primary/50 bg-primary/40 font-semibold text-primary-foreground shadow-lg"
            >
              {tasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto bg-card/30 backdrop-blur-sm">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <KanbanCard key={task.id} task={task} />
            ))}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

export default function KanbanBoard() {
  const { tasks, updateTaskStatus, loading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { employees } = useEmployees();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [displayMode, setDisplayMode] = useState<'tasks' | 'projects'>('tasks');
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: [],
    priority: [],
    assignee: [],
    project: [],
    dateFrom: '',
    dateTo: '',
  });

  // Appliquer les filtres uniquement en mode tâches
  const { filteredTasks } = useTaskFilters(tasks, filters);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !active) {
      setActiveTask(null);
      return;
    }

    // Pour l'instant, le drag & drop n'est actif que pour les tâches
    if (displayMode === 'projects') {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a column (seulement pour les tâches)
    const targetColumn = TASK_COLUMNS.find(col => col.id === overId);
    if (targetColumn) {
      updateTaskStatus(taskId, targetColumn.status);
    } else {
      // Check if dropped over another task
      const targetTask = tasks.find(t => t.id === overId);
      if (targetTask && targetTask.status !== tasks.find(t => t.id === taskId)?.status) {
        updateTaskStatus(taskId, targetTask.status);
      }
    }

    setActiveTask(null);
  };

  if (loading || (displayMode === 'projects' && projectsLoading)) {
    return (
      <div className="glass modern-card flex h-64 items-center justify-center">
        <div className="glow-primary h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <span className="ml-3 font-medium text-foreground">Chargement...</span>
      </div>
    );
  }

  // Use mobile version on small screens
  if (isMobile) {
    return <MobileKanbanBoard />;
  }

  const columns = displayMode === 'tasks' ? TASK_COLUMNS : PROJECT_COLUMNS;
  // Utiliser filteredTasks au lieu de tasks en mode tâches
  const items = displayMode === 'tasks' ? filteredTasks : projects;

  const itemsByStatus = columns.map(column => ({
    ...column,
    tasks: items.filter((item: any) => item.status === column.status),
  }));

  return (
    <div className="space-y-4">
      {/* Boutons de basculement Projet/Tâches */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={displayMode}
            onValueChange={value => value && setDisplayMode(value as 'tasks' | 'projects')}
            className="justify-start"
          >
            <ToggleGroupItem
              value="tasks"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              📝 Tâches
            </ToggleGroupItem>
            <ToggleGroupItem
              value="projects"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              📁 Projets
            </ToggleGroupItem>
          </ToggleGroup>
          {displayMode === 'tasks' && filteredTasks.length > 0 && (
            <ExportButton tasks={filteredTasks} filters={filters} variant="outline" size="sm" />
          )}
        </div>
        {displayMode === 'projects' && (
          <p className="text-sm text-muted-foreground">Vue Kanban des projets par statut</p>
        )}
      </div>

      {/* Filtres avancés - uniquement en mode Tâches */}
      {displayMode === 'tasks' && (
        <AdvancedFilters
          onFiltersChange={setFilters}
          projects={projects}
          employees={employees}
          totalTasks={tasks.length}
          filteredCount={filteredTasks.length}
        />
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="h-full">
          <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {itemsByStatus.map(column => (
              <div key={column.id}>
                <KanbanColumn column={column} tasks={column.tasks} />
              </div>
            ))}
          </div>
        </div>

        <DragOverlay>{activeTask ? <KanbanCard task={activeTask} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
