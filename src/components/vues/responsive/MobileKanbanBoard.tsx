import { useState } from 'react';
// Hooks optimisés avec cache intelligent et métriques
import { useTasks, type Task } from '@/hooks/optimized';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface MobileKanbanCardProps {
  task: Task;
}

function MobileKanbanCard({ task }: MobileKanbanCardProps) {
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
      <Card className="transition-smooth glass hover-glow border-primary/30 bg-card/40 mb-3 cursor-grab backdrop-blur-sm hover:shadow-md active:cursor-grabbing">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground text-sm leading-tight font-medium">
            {task.title}
          </CardTitle>
          <div className="flex items-center justify-between">
            <Badge className={`border text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </Badge>
            <Avatar className="ring-primary/40 h-6 w-6 ring-2">
              <AvatarImage src="" alt={task.assignee || task.assigned_name || 'NA'} />
              <AvatarFallback className="bg-primary/40 text-primary-foreground text-xs font-semibold">
                {(task.assignee || task.assigned_name || 'NA').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-foreground/70 grid grid-cols-1 gap-1 text-xs">
              <span>Début: {new Date(task.start_date).toLocaleDateString('fr-FR')}</span>
              <span>Fin: {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground/80">Progrès</span>
                <span className="text-primary font-medium">{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
            </div>
            {task.effort_estimate_h > 0 && (
              <div className="text-foreground/70 flex items-center gap-1 text-xs">
                <span className="bg-accent h-1 w-1 rounded-full"></span>
                Estimé: {task.effort_estimate_h}h
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MobileKanbanColumnProps {
  column: (typeof COLUMNS)[0];
  tasks: Task[];
}

function MobileKanbanColumn({ column, tasks }: MobileKanbanColumnProps) {
  return (
    <div className="h-full">
      <div className="bg-background/80 sticky top-0 z-10 mb-4 flex items-center justify-between py-2 backdrop-blur-sm">
        <h2 className="from-tech-purple to-tech-cyan bg-gradient-to-r bg-clip-text text-lg font-semibold text-transparent">
          {column.title}
        </h2>
        <Badge
          variant="secondary"
          className="border-primary/50 bg-primary/40 text-primary-foreground font-semibold"
        >
          {tasks.length}
        </Badge>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="pb-4">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <MobileKanbanCard key={task.id} task={task} />
            ))}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}

export function MobileKanbanBoard() {
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
      <div className="glass modern-card flex h-64 items-center justify-center">
        <div className="glow-primary border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        <span className="text-foreground ml-3 font-medium">Chargement...</span>
      </div>
    );
  }

  const tasksByStatus = COLUMNS.map(column => ({
    ...column,
    tasks: tasks.filter(task => task.status === column.status),
  }));

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Card className="modern-card glow-accent transition-smooth w-full">
        <CardContent className="p-0">
          {/* Mobile: Tabs for different columns */}
          <Tabs defaultValue="todo" className="w-full">
            <TabsList className="from-primary/10 via-accent/10 to-tech-purple/10 grid w-full grid-cols-4 rounded-t-xl border-b bg-gradient-to-r">
              {COLUMNS.map(column => (
                <TabsTrigger
                  key={column.id}
                  value={column.id}
                  className="transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs font-semibold"
                >
                  {column.title}
                  <Badge
                    variant="secondary"
                    className="bg-primary/30 text-primary-foreground ml-1 text-xs"
                  >
                    {tasksByStatus.find(c => c.id === column.id)?.tasks.length || 0}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {tasksByStatus.map(column => (
              <TabsContent
                key={column.id}
                value={column.id}
                className="bg-card/30 p-4 backdrop-blur-sm"
              >
                <MobileKanbanColumn column={column} tasks={column.tasks} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <DragOverlay>{activeTask ? <MobileKanbanCard task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
}
