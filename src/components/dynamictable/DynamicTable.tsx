import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useTasksWithActions, type Task } from '@/hooks/useTasksWithActions';
import { useProjectsEnterprise } from '@/hooks/useProjectsEnterprise';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDynamicTable } from '@/components/responsive/MobileDynamicTable';
import { TaskFixedColumns } from '@/components/table/TaskFixedColumns';
import { TaskActionColumns } from '@/components/table/TaskActionColumns';
import { LoadingState } from '@/components/table/LoadingState';
import { ErrorState } from '@/components/table/ErrorState';
import { SyncIndicator } from '@/components/table/SyncIndicator';
import { TaskEditDialog } from '@/components/dialogs/TaskEditDialog';
import { TaskCreationDialog } from '@/components/tasks/TaskCreationDialog';
import { ProjectTableView } from '@/components/projects/ProjectTableView';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const DynamicTable = React.memo(() => {
  const { 
    tasks, 
    loading, 
    error,
    refetch,
    duplicateTask,
    deleteTask,
    toggleAction,
    addActionColumn,
    addDetailedAction,
    createSubTask,
    createSubTaskWithActions,
    updateTaskAssignee,
    createMainTask,
  } = useTasksWithActions();
  
  const { 
    projects, 
    loading: projectsLoading, 
    error: projectsError 
  } = useProjectsEnterprise();
  
  const isMobile = useIsMobile();
  const { defaultDisplayMode } = useViewMode();
  
  const [newActionTitle, setNewActionTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'tasks' | 'projects'>(defaultDisplayMode);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);
  
  // Refs pour la synchronisation des scrolls
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const leftHeaderRef = useRef<HTMLDivElement>(null);
  const rightHeaderRef = useRef<HTMLDivElement>(null);
  const isScrollingSyncRef = useRef(false);
  const isHorizontalSyncRef = useRef(false);

  // Synchroniser les tâches optimistes avec les vraies tâches (memoized)
  const memoizedTasks = useMemo(() => tasks, [tasks]);
  
  useEffect(() => {
    setOptimisticTasks(memoizedTasks);
  }, [memoizedTasks]);

  // Fonction de synchronisation des scrolls verticaux
  const syncScroll = useCallback((source: 'left' | 'right', scrollTop: number) => {
    if (isScrollingSyncRef.current) return;
    
    isScrollingSyncRef.current = true;
    
    if (source === 'left' && rightScrollRef.current) {
      rightScrollRef.current.scrollTop = scrollTop;
    } else if (source === 'right' && leftScrollRef.current) {
      leftScrollRef.current.scrollTop = scrollTop;
    }
    
    // Reset sync flag after a short delay
    setTimeout(() => {
      isScrollingSyncRef.current = false;
    }, 10);
  }, []);

  // Fonction de synchronisation unifiée du défilement horizontal - Partie Tâche
  const syncTaskHorizontalScroll = useCallback((scrollLeft: number) => {
    if (isHorizontalSyncRef.current) return;
    
    console.log('🔄 Task horizontal sync:', scrollLeft);
    isHorizontalSyncRef.current = true;
    
    // Synchronisation unifiée : en-tête ET corps de la partie tâche
    if (leftHeaderRef.current) {
      leftHeaderRef.current.scrollLeft = scrollLeft;
    }
    if (leftScrollRef.current) {
      leftScrollRef.current.scrollLeft = scrollLeft;
    }
    
    // Reset sync flag after a short delay
    setTimeout(() => {
      isHorizontalSyncRef.current = false;
    }, 10);
  }, []);

  // Fonction de synchronisation unifiée du défilement horizontal - Partie Action
  const syncActionHorizontalScroll = useCallback((scrollLeft: number) => {
    if (isHorizontalSyncRef.current) return;
    
    console.log('🔄 Action horizontal sync:', scrollLeft);
    isHorizontalSyncRef.current = true;
    
    // Synchronisation unifiée : en-tête ET corps de la partie action
    if (rightHeaderRef.current) {
      rightHeaderRef.current.scrollLeft = scrollLeft;
    }
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollLeft = scrollLeft;
    }
    
    // Reset sync flag after a short delay
    setTimeout(() => {
      isHorizontalSyncRef.current = false;
    }, 10);
  }, []);

  // Fonction pour faire défiler vers une tâche sélectionnée
  const scrollToSelectedTask = useCallback((taskId: string) => {
    if (!taskId) return;

    // Trouver l'index de la tâche sélectionnée
    const taskIndex = optimisticTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    // Calculer la position de scroll (hauteur approximative par ligne)
    const rowHeight = 64; // Hauteur standard d'une ligne
    const headerHeight = 48; // Hauteur du header
    const targetScrollTop = taskIndex * rowHeight;

    // Synchroniser le scroll des deux panneaux
    if (leftScrollRef.current) {
      leftScrollRef.current.scrollTop = targetScrollTop;
    }
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollTop = targetScrollTop;
    }
  }, [optimisticTasks]);

  // Auto-scroll quand une tâche est sélectionnée
  useEffect(() => {
    if (selectedTaskId) {
      // Petit délai pour s'assurer que le DOM est mis à jour
      setTimeout(() => {
        scrollToSelectedTask(selectedTaskId);
      }, 100);
    }
  }, [selectedTaskId, scrollToSelectedTask]);

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
      // Adapter au format CreateTaskData
      await createMainTask({
        title: taskData.title,
        assigned_name: taskData.assignee,
        department_name: taskData.department,
        project_name: taskData.project,
        priority: taskData.priority,
        status: taskData.status,
        effort_estimate_h: taskData.effort_estimate_h,
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      await refetch();
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
      const newSubtask = await createSubTask(parentId, {
        title: customData?.title || 'Nouvelle sous-tâche',
        assigned_name: 'Non assigné',
        department_name: 'Sans département',
        project_name: 'Sans projet',
        priority: 'medium',
        start_date: customData?.start_date || new Date().toISOString().split('T')[0],
        due_date: customData?.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        effort_estimate_h: customData?.effort_estimate_h || 1,
      });
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
      const newSubtask = await createSubTaskWithActions(parentId, {
        title: customData.title,
        assigned_name: 'Non assigné',
        department_name: 'Sans département',
        project_name: 'Sans projet',
        priority: 'medium',
        start_date: customData.start_date,
        due_date: customData.due_date,
        effort_estimate_h: customData.effort_estimate_h,
        actions: actions.map(a => ({
          title: a.title,
          weight_percentage: a.weight_percentage,
          due_date: a.due_date,
          description: a.notes,
        })),
      });
      console.log('Subtask with actions created successfully:', newSubtask);
      
      // Rafraîchir les données immédiatement après la création
      await refetch();
    } catch (error) {
      console.error('Error creating subtask with actions:', error);
    }
  };

  const handleUpdateAssignee = async (taskId: string, assignee: string) => {
    try {
      await updateTaskAssignee(taskId, null, assignee);
      await refetch();
    } catch (error) {
      console.error('Error updating assignee:', error);
    }
  };

  const handleSelectTask = (taskId: string) => {
    const newSelectedId = taskId === selectedTaskId ? undefined : taskId;
    setSelectedTaskId(newSelectedId);
    
    // Si on désélectionne, permettre le scroll indépendant
    if (!newSelectedId) {
      // Réinitialiser les positions de scroll si nécessaire
      // Les tableaux pourront maintenant bouger indépendamment
    }
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
        refetch={async () => await refetch()}
      />
    );
  }

  return (
    <Card className="w-full modern-card glow-accent transition-smooth">
      <CardContent className="bg-gantt-header/20 backdrop-blur-sm p-0">
        {viewMode === 'tasks' ? (
          <ResizablePanelGroup direction="horizontal" className="border rounded-lg border-border/50 overflow-hidden">
            <ResizablePanel defaultSize={70} minSize={60}>
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
                scrollRef={leftScrollRef}
                headerRef={leftHeaderRef}
                onScroll={(scrollTop) => syncScroll('left', scrollTop)}
                onTaskHorizontalScroll={syncTaskHorizontalScroll}
                syncScrollEnabled={!!selectedTaskId}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={30} minSize={25}>
              <TaskActionColumns 
                tasks={optimisticTasks}
                onToggleAction={handleToggleAction}
                selectedTaskId={selectedTaskId}
                scrollRef={rightScrollRef}
                headerRef={rightHeaderRef}
                onScroll={(scrollTop) => syncScroll('right', scrollTop)}
                onActionHorizontalScroll={syncActionHorizontalScroll}
                syncScrollEnabled={!!selectedTaskId}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <ProjectTableView 
            projects={projects.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              status: p.status,
              priority: p.priority || 'medium',
              progress: p.progress || 0,
              owner_name: p.owner_name || 'Non assigné',
              start_date: p.start_date || '',
              due_date: p.due_date || '',
              budget: p.budget
            }))}
            loading={projectsLoading}
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
        onSuccess={() => {
          refetch();
          setCreateTaskDialogOpen(false);
        }}
      />
    </Card>
  );
});

DynamicTable.displayName = 'DynamicTable';

export default DynamicTable;
