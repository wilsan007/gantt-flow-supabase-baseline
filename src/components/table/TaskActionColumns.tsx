import React, { useMemo } from 'react';
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { type Task } from '@/hooks/useTasksWithActions';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { FormattedActionText } from '@/components/ui/formatted-action-text';
import '../../styles/sticky-table.css';

interface TaskActionColumnsProps {
  tasks: Task[];
  onToggleAction: (taskId: string, actionId: string) => void;
  selectedTaskId?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
  headerRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (scrollTop: number) => void;
  onActionHorizontalScroll?: (scrollLeft: number) => void;
  syncScrollEnabled?: boolean;
}

export const TaskActionColumns = ({ 
  tasks, 
  onToggleAction, 
  selectedTaskId, 
  scrollRef, 
  headerRef,
  onScroll, 
  onActionHorizontalScroll,
  syncScrollEnabled 
}: TaskActionColumnsProps) => {
  // Fonction locale pour obtenir les actions uniques
  const getUniqueActionsLocal = (tasks: Task[]) => {
    const allActions = new Set<string>();
    tasks.forEach(task => {
      task.task_actions?.forEach(action => {
        allActions.add(action.title);
      });
    });
    return Array.from(allActions);
  };

  const uniqueActions = getUniqueActionsLocal(tasks);
  
  // Debug: afficher le nombre d'actions trouvées
  console.log('📊 TaskActionColumns - Nombre d\'actions uniques:', uniqueActions.length);
  console.log('📊 TaskActionColumns - Actions:', uniqueActions);
  
  // Réorganiser les colonnes d'actions selon la tâche sélectionnée
  const reorderActionsForSelectedTask = (actions: string[], selectedTaskId?: string): string[] => {
    if (!selectedTaskId) return actions;
    
    const selectedTask = tasks.find(task => task.id === selectedTaskId);
    if (!selectedTask || !selectedTask.task_actions) return actions;
    
    // Actions de la tâche sélectionnée en premier
    const selectedTaskActions = selectedTask.task_actions.map(action => action.title);
    const otherActions = actions.filter(action => !selectedTaskActions.includes(action));
    
    return [...selectedTaskActions, ...otherActions];
  };
  
  const orderedActions = reorderActionsForSelectedTask(uniqueActions, selectedTaskId);
  
  // Trier les tâches par display_order pour être aligné avec TaskFixedColumns
  const sortedTasks = [...tasks].sort((a, b) => {
    const orderA = a.display_order?.split('.').map(n => parseInt(n)) || [0];
    const orderB = b.display_order?.split('.').map(n => parseInt(n)) || [0];
    
    for (let i = 0; i < Math.max(orderA.length, orderB.length); i++) {
      const numA = orderA[i] || 0;
      const numB = orderB[i] || 0;
      if (numA !== numB) return numA - numB;
    }
    return 0;
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollElement = e.currentTarget;
    
    // Synchronisation du défilement vertical uniquement (pas de horizontal pour les actions)
    if (onScroll && syncScrollEnabled) {
      onScroll(scrollElement.scrollTop);
    }
  };

  // Si aucune action, afficher un message
  if (uniqueActions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-muted/20">
        <div className="text-center p-8">
          <p className="text-muted-foreground text-sm">Aucune action disponible</p>
          <p className="text-xs text-muted-foreground mt-2">Les actions apparaîtront ici une fois ajoutées aux tâches</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* CONTENEUR HORIZONTAL UNIFIÉ - Gère SEULEMENT le défilement horizontal */}
      <div 
        className="action-horizontal-scroll-wrapper"
        style={{
          height: '600px',
          overflowX: 'auto',
          overflowY: 'visible', // Pas de défilement vertical ici
          position: 'relative',
          border: '2px solid red' // DEBUG: bordure rouge pour voir le panneau
        }}
        onScroll={(e) => {
          // Synchronisation horizontale unifiée pour les actions
          if (onActionHorizontalScroll) {
            onActionHorizontalScroll(e.currentTarget.scrollLeft);
          }
        }}
      >
        <div className="action-table-with-fixed-header" style={{ minWidth: '800px', background: 'rgba(255,0,0,0.1)' }}>
          {/* En-tête fixe - Position sticky pour rester en haut */}
          <div 
            ref={headerRef}
            className="action-header-fixed"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 95,
              background: selectedTaskId 
                ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backdropFilter: 'blur(8px)',
              borderBottom: selectedTaskId 
                ? '2px solid rgba(245, 87, 108, 0.4)' 
                : '2px solid rgba(102, 126, 234, 0.3)',
              boxShadow: selectedTaskId 
                ? '0 4px 12px rgba(245, 87, 108, 0.3)' 
                : '0 4px 12px rgba(102, 126, 234, 0.2)',
              transition: 'all 0.3s ease',
              overflowX: 'visible', // Pas de défilement propre
              overflowY: 'visible',
              height: '60px' // ALIGNEMENT avec la partie tâche
            }}
          >
        <Table>
          <TableHeader>
            <TableRow className="h-15 hover:bg-transparent" style={{ height: '60px' }}>
              {orderedActions.map((actionTitle, index) => {
                const isSelectedTaskAction = selectedTaskId && 
                  tasks.find(task => task.id === selectedTaskId)?.task_actions?.some(action => action.title === actionTitle);
                
                return (
                  <TableHead 
                    key={actionTitle} 
                    className={`min-w-[120px] h-12 font-bold border-r border-white/20 ${isSelectedTaskAction ? 'highlighted' : ''}`}
                    style={{
                      backgroundColor: isSelectedTaskAction ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      fontWeight: isSelectedTaskAction ? 800 : 700,
                      textAlign: 'center',
                      padding: '12px 8px',
                      width: '120px',
                      minWidth: '120px',
                      maxWidth: '120px',
                      borderRadius: isSelectedTaskAction ? '6px' : '0px',
                      transition: 'all 0.3s ease',
                      transform: isSelectedTaskAction ? 'scale(1.05)' : 'scale(1)',
                      order: isSelectedTaskAction ? -1 : index, // Repositionnement dynamique
                      color: '#ffffff',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span 
                        className="action-header-title font-bold"
                        style={{ 
                          fontSize: '11px',
                          color: '#ffffff',
                          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {actionTitle}
                      </span>
                      {isSelectedTaskAction && (
                        <div 
                          className="action-header-indicator w-4 h-1 rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
                            animation: 'pulse 2s infinite',
                            boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
                          }}
                        />
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
        </Table>
      </div>

          {/* Corps du tableau avec défilement VERTICAL seulement */}
          <div 
            ref={scrollRef}
            className="action-body-scrollable"
            onScroll={handleScroll}
            style={{
              height: '540px', // 600px - 60px (hauteur header alignée)
              overflowX: 'visible', // Pas de défilement horizontal ici
              overflowY: 'auto',    // Seulement vertical
              marginTop: '0px'
            }}
          >
        <Table>
        <TableBody>
          {sortedTasks.map((task) => {
            const isSubtask = (task.task_level || 0) > 0;
            const isSelectedTask = selectedTaskId === task.id;
            
              return (
                <TableRow 
                  key={task.id}
                  className={`border-b transition-colors ${
                    isSelectedTask ? 'bg-primary/10 border-primary/30' : ''
                  }`}
                  style={{ 
                    height: isSubtask ? '51px' : '64px',
                    minHeight: isSubtask ? '51px' : '64px',
                    maxHeight: isSubtask ? '51px' : '64px'
                  }}
                >
                {orderedActions.map((actionTitle) => {
                  const action = task.task_actions?.find(a => a.title === actionTitle);
                  const isSelectedTaskAction = isSelectedTask && action;
                  return (
                    <TableCell 
                      key={actionTitle} 
                      className={`action-cell text-center transition-colors ${
                        isSubtask ? 'py-0 text-xs' : 'py-0'
                      } ${isSelectedTaskAction ? 'bg-primary/5 border-primary/20' : ''}`}
                      style={{
                        width: '120px',
                        minWidth: '120px',
                        maxWidth: '120px',
                        padding: '12px 8px'
                      }}
                    >
                      {action ? (
                        <div className={`flex flex-col items-center gap-1 ${
                          isSelectedTaskAction ? 'transform scale-110' : ''
                        } transition-transform`}>
                          <Checkbox
                            checked={action.is_done}
                            onCheckedChange={() => {
                              console.log('Checkbox clicked - Task ID:', task.id, 'Action ID:', action.id);
                              onToggleAction(task.id, action.id);
                            }}
                            className={`${isSubtask ? 'scale-75' : ''} ${
                              isSelectedTaskAction ? 'border-primary data-[state=checked]:bg-primary' : ''
                            }`}
                          />
                          <span className={`text-muted-foreground font-medium ${
                            isSubtask ? 'text-xs' : 'text-xs'
                          } ${isSelectedTaskAction ? 'text-primary font-bold' : ''}`}>
                            {action.weight_percentage}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
        </Table>
          </div>
        </div>
      </div>
    </>
  );
};
