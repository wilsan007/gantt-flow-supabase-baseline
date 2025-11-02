// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
// Hooks optimisés avec cache intelligent et métriques
import { useTasks, type Task } from '@/hooks/optimized';
import { useProjects } from '@/hooks/optimized';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDynamicTable } from '../responsive/MobileDynamicTable';
import { TaskTableHeader } from './TaskTableHeader';
import { TaskFixedColumns } from './TaskFixedColumns';
import { TaskActionColumns } from './TaskActionColumns';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { TaskEditDialog } from '../dialogs/TaskEditDialog';
import { TaskCreationDialog } from '../dialogs/TaskCreationDialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ProjectTableView } from '../projects/ProjectTableView';

const DynamicTable = () => {
  const { 
    tasks, 
    loading, 
    error, 
    duplicateTask, 
    deleteTask, 
    toggleAction, 
    addActionColumn,
    addDetailedAction,
    createSubTask,
    createSubTaskWithActions,
    updateTaskAssignee,
    refetch,
    createTask,
    updateTask
  } = useTasks();
  const isMobile = useIsMobile();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  
  // Wrapper pour createMainTask avec compatibilité ancienne API
  const createMainTask = async (taskData: {
    title: string;
    assignee: string;
    department: string;
    project: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'doing' | 'blocked' | 'done';
    effort_estimate_h: number;
  }) => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return createTask({
      title: taskData.title,
      description: '',
      status: taskData.status,
      priority: taskData.priority,
      start_date: today.toISOString().split('T')[0],
      due_date: nextWeek.toISOString().split('T')[0]
    });
  };
  const { defaultDisplayMode } = useViewMode();
  
  const [newActionTitle, setNewActionTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'tasks' | 'projects'>(defaultDisplayMode);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);
  
  // Refs pour la synchronisation du scroll
  const fixedColumnsScrollRef = useRef<HTMLDivElement>(null);
  const actionColumnsScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  // Synchroniser les tâches optimistes avec les vraies tâches
  useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

  // Fonction de synchronisation du scroll
  const syncScroll = useCallback((source: 'fixed' | 'action') => {
    if (isSyncingScroll.current) return;
    
    isSyncingScroll.current = true;
    
    if (source === 'fixed' && fixedColumnsScrollRef.current && actionColumnsScrollRef.current) {
      actionColumnsScrollRef.current.scrollTop = fixedColumnsScrollRef.current.scrollTop;
    } else if (source === 'action' && actionColumnsScrollRef.current && fixedColumnsScrollRef.current) {
      fixedColumnsScrollRef.current.scrollTop = actionColumnsScrollRef.current.scrollTop;
    }
    
    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 0);
  }, []);

  const handleAddActionColumn = async () => {
    if (newActionTitle.trim() && selectedTaskId) {
      try {
        await addActionColumn(newActionTitle.trim(), selectedTaskId);
        setNewActionTitle('');
        setSelectedTaskId(undefined);
        await refetch(); // Rafraîchir les données après l'ajout
      } catch (error) {
        console.error('Error adding action column:', error);
      }
    }
  };

  const handleCreateDetailedAction = async (actionData: {
    title: string;
    weight_percentage: number;
    due_date?: string;
    notes?: string;
  }) => {
    if (!selectedTaskId) return;
    
    try {
      await addDetailedAction(selectedTaskId, actionData);
      await refetch(); // Rafraîchir les données après l'ajout
    } catch (error) {
      console.error('Error creating detailed action:', error);
    }
  };

  const handleToggleAction = async (taskId: string, actionId: string) => {
    try {
      console.log('handleToggleAction called:', { taskId, actionId });
      
      // Mise à jour optimiste : on met à jour l'interface immédiatement
      const updatedTasks = optimisticTasks.map(task => {
        if (task.id === taskId && task.task_actions) {
          const updatedActions = task.task_actions.map(action => 
            action.id === actionId 
              ? { ...action, is_done: !action.is_done }
              : action
          );
          
          // Calculer la nouvelle progression
          const totalWeight = updatedActions.reduce((sum, action) => sum + action.weight_percentage, 0);
          const completedWeight = updatedActions
            .filter(action => action.is_done)
            .reduce((sum, action) => sum + action.weight_percentage, 0);
          
          const newProgress = totalWeight === 0 ? 0 : Math.round(completedWeight);
          
          // Calculer le nouveau statut
          let newStatus = task.status;
          if (newProgress === 100) {
            newStatus = 'done';
          } else if (newProgress > 0) {
            newStatus = 'doing';
          } else {
            newStatus = 'todo';
          }
          
          return {
            ...task,
            task_actions: updatedActions,
            progress: newProgress,
            status: newStatus as any
          };
        }
        return task;
      });
      
      setOptimisticTasks(updatedTasks);
      
      // Ensuite on fait la vraie mise à jour
      await toggleAction(taskId, actionId);
      // La subscription temps réel synchronisera automatiquement
    } catch (error) {
      console.error('Error in handleToggleAction:', error);
      // En cas d'erreur, on refetch pour revenir à l'état correct
      await refetch();
    }
  };

  const handleDuplicateTask = (taskId: string) => {
    duplicateTask(taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    await refetch();
  };

  const handleEditTask = (taskId: string) => {
    const task = optimisticTasks.find(t => t.id === taskId);
    if (task) {
      setTaskToEdit(task);
      setEditDialogOpen(true);
    }
  };

  const handleCreateMainTask = async (taskData: {
    title: string;
    assignee: string;
    department: string;
    project: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'doing' | 'blocked' | 'done';
    effort_estimate_h: number;
  }) => {
    try {
      await createMainTask(taskData);
      await refetch(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      throw error;
    }
  };

  const handleCreateSubtask = async (parentId: string, linkedActionId?: string, customData?: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
  }) => {
    try {
      console.log('Creating subtask with data:', { parentId, linkedActionId, customData });
      const newSubtask = await createSubTask(parentId, linkedActionId, customData);
      console.log('Subtask created successfully:', newSubtask);
      
      // Rafraîchir les données immédiatement après la création
      await refetch();
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  const handleCreateSubtaskWithActions = async (
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
  ) => {
    try {
      console.log('Creating subtask with actions:', { parentId, customData, actions });
      const newSubtask = await createSubTaskWithActions(parentId, customData, actions);
      console.log('Subtask with actions created successfully:', newSubtask);
      
      // Rafraîchir les données immédiatement après la création
      await refetch();
    } catch (error) {
      console.error('Error creating subtask with actions:', error);
    }
  };

  const handleUpdateAssignee = async (taskId: string, assignee: string) => {
    try {
      await updateTaskAssignee(taskId, assignee);
      await refetch();
    } catch (error) {
      console.error('Error updating assignee:', error);
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId === selectedTaskId ? undefined : taskId);
  };

  const isActionButtonEnabled = !!(selectedTaskId && newActionTitle.trim());

  if (loading || (viewMode === 'projects' && projectsLoading)) {
    return <LoadingState />;
  }

  if (error || (viewMode === 'projects' && projectsError)) {
    return <ErrorState error={error || projectsError} />;
  }

  // Use mobile version on small screens
  if (isMobile) {
    return (
      <MobileDynamicTable 
        tasks={optimisticTasks}
        loading={loading}
        error={error}
        duplicateTask={duplicateTask}
        deleteTask={handleDeleteTask}
        toggleAction={handleToggleAction}
        addActionColumn={addActionColumn}
        createSubTask={handleCreateSubtask}
        updateTaskAssignee={handleUpdateAssignee}
        refetch={refetch}
      />
    );
  }

  return (
    <Card className="w-full modern-card glow-accent transition-smooth">
        <TaskTableHeader 
          newActionTitle={newActionTitle}
          setNewActionTitle={setNewActionTitle}
          onAddActionColumn={handleAddActionColumn}
          onCreateDetailedAction={handleCreateDetailedAction}
          selectedTaskId={selectedTaskId}
          isActionButtonEnabled={isActionButtonEnabled}
          onCreateTask={() => setCreateTaskDialogOpen(true)}
        />
        
        {/* Boutons de basculement Projet/Tâches */}
        <div className="px-6 pb-4">
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as 'tasks' | 'projects')}
            className="justify-start"
          >
            <ToggleGroupItem value="tasks" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              📝 Tâches
            </ToggleGroupItem>
            <ToggleGroupItem value="projects" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              📁 Projets
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      <CardContent className="bg-gantt-header/20 backdrop-blur-sm">
        {viewMode === 'tasks' ? (
          <ResizablePanelGroup direction="horizontal" className="border rounded-lg border-border/50 overflow-hidden">
            <ResizablePanel defaultSize={60} minSize={40} maxSize={80}>
              <TaskFixedColumns 
                tasks={optimisticTasks}
                onDuplicate={handleDuplicateTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onCreateSubtask={handleCreateSubtask}
                onCreateSubtaskWithActions={handleCreateSubtaskWithActions}
                onUpdateAssignee={handleUpdateAssignee}
                selectedTaskId={selectedTaskId}
                onSelectTask={handleSelectTask}
                scrollRef={fixedColumnsScrollRef}
                onScroll={() => syncScroll('fixed')}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
              <TaskActionColumns 
                tasks={optimisticTasks}
                onToggleAction={handleToggleAction}
                selectedTaskId={selectedTaskId}
                scrollRef={actionColumnsScrollRef}
                onScroll={() => syncScroll('action')}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <ProjectTableView 
            projects={projects.map(p => ({
              id: p.id,
              name: p.name,
              status: p.status,
              progress: p.progress || 0,
              manager: p.manager_name || 'Non assigné',
              skills: [], // À implémenter avec une table séparée
              start_date: p.start_date || '',
              end_date: p.end_date || ''
            }))}
            tasks={optimisticTasks.map(t => ({
              id: t.id,
              title: t.title,
              project_id: t.project_id,
              project_name: t.project_name || '',
              progress: t.progress,
              assignee: t.assignee,
              status: t.status
            }))}
          />
        )}
      </CardContent>
      
      {/* Dialog de modification de tâche */}
      <TaskEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={taskToEdit}
        onSave={() => {
          refetch();
          setTaskToEdit(null);
        }}
      />

      {/* Dialog de création de tâche */}
      <TaskCreationDialog
        open={createTaskDialogOpen}
        onOpenChange={setCreateTaskDialogOpen}
        onCreateTask={handleCreateMainTask}
      />
    </Card>
  );
};

export default DynamicTable;