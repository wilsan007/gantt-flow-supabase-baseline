import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/hooks/useTasks';

const COLUMNS = [
  { id: 'todo', title: 'À faire', status: 'todo' as const },
  { id: 'doing', title: 'En cours', status: 'doing' as const },
  { id: 'blocked', title: 'Bloqué', status: 'blocked' as const },
  { id: 'done', title: 'Terminé', status: 'done' as const },
];

const PRIORITY_COLORS = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/20 text-warning border-warning/30',
  high: 'bg-tech-orange/20 text-tech-orange border-tech-orange/30',
  urgent: 'bg-destructive/20 text-destructive border-destructive/30',
};

interface KanbanCardProps {
  task: Task;
}

function KanbanCard({ task }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

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
      <Card className="mb-3 hover:shadow-md transition-smooth glass hover-glow cursor-grab active:cursor-grabbing">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">{task.title}</CardTitle>
          <div className="flex items-center justify-between">
            <Badge className={`text-xs border ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </Badge>
            <Avatar className="h-6 w-6 ring-2 ring-primary/30">
              <AvatarImage src="" alt={task.assignee} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {task.assignee.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Début: {new Date(task.start_date).toLocaleDateString('fr-FR')}</span>
              <span>Fin: {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progrès</span>
                <span className="text-primary font-medium">{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
            </div>
            {task.effort_estimate_h > 0 && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1 h-1 bg-accent rounded-full"></span>
                Estimé: {task.effort_estimate_h}h
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface KanbanColumnProps {
  column: typeof COLUMNS[0];
  tasks: Task[];
}

function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-0">
      <Card className="h-full glass glow-accent transition-smooth">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="text-lg flex items-center justify-between text-foreground">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {column.title}
            </span>
            <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary border-primary/30">
              {tasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
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
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a column
    const targetColumn = COLUMNS.find(col => col.id === overId);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary glow-primary"></div>
        <span className="ml-3 text-foreground">Chargement...</span>
      </div>
    );
  }

  const tasksByStatus = COLUMNS.map(column => ({
    ...column,
    tasks: tasks.filter(task => task.status === column.status)
  }));

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
          {tasksByStatus.map((column) => (
            <div key={column.id}>
              <KanbanColumn column={column} tasks={column.tasks} />
            </div>
          ))}
        </div>
      </div>
      
      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}