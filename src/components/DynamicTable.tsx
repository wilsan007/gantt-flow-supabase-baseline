import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
import { 
  Plus, 
  MoreHorizontal, 
  Copy, 
  Trash2, 
  Calendar,
  User,
  Clock,
  Target,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTasks } from '@/hooks/useTasks';


const priorityColors = {
  low: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-info/10 text-info border-info/20',
  urgent: 'bg-danger/10 text-danger border-danger/20'
};

const statusColors = {
  todo: 'bg-muted text-muted-foreground border-border',
  doing: 'bg-tech-blue/10 text-tech-blue border-tech-blue/20',
  blocked: 'bg-danger/10 text-danger border-danger/20',
  done: 'bg-success/10 text-success border-success/20'
};

const DynamicTable = () => {
  const { 
    tasks, 
    loading, 
    error, 
    duplicateTask, 
    deleteTask, 
    toggleAction, 
    addActionColumn 
  } = useTasks();
  
  const [newActionTitle, setNewActionTitle] = useState('');

  const handleAddActionColumn = async () => {
    if (newActionTitle.trim()) {
      await addActionColumn(newActionTitle.trim());
      setNewActionTitle('');
    }
  };

  const handleToggleAction = async (taskId: string, actionId: string) => {
    await toggleAction(taskId, actionId);
  };

  const handleDuplicateTask = (taskId: string) => {
    duplicateTask(taskId);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const getUniqueActions = () => {
    const allActions = new Set<string>();
    tasks.forEach(task => {
      task.task_actions?.forEach(action => {
        allActions.add(action.title);
      });
    });
    return Array.from(allActions);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Chargement des tâches...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center text-destructive">
            <p>Erreur lors du chargement des tâches</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Tableau Dynamique d'Exécution
          </CardTitle>
          <div className="flex gap-2">
            <Input 
              placeholder="Nouvelle action..." 
              value={newActionTitle}
              onChange={(e) => setNewActionTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddActionColumn()}
              className="w-40"
            />
            <Button onClick={handleAddActionColumn} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResizablePanelGroup direction="horizontal" className="border rounded-lg">
          {/* Colonnes fixes */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="min-w-[200px]">Tâche</TableHead>
                    <TableHead className="min-w-[120px]">Responsable</TableHead>
                    <TableHead className="min-w-[80px]">Début</TableHead>
                    <TableHead className="min-w-[80px]">Échéance</TableHead>
                    <TableHead className="min-w-[80px]">Priorité</TableHead>
                    <TableHead className="min-w-[80px]">Statut</TableHead>
                    <TableHead className="min-w-[80px]">Charge (h)</TableHead>
                    <TableHead className="min-w-[100px]">Progression</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {task.assignee}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(task.start_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(task.due_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityColors[task.priority]} variant="outline">
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[task.status]} variant="outline">
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {task.effort_estimate_h}h
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{task.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDuplicateTask(task.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Colonnes dynamiques (Actions) */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    {getUniqueActions().map((actionTitle) => (
                      <TableHead key={actionTitle} className="min-w-[120px] text-center">
                        {actionTitle}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                       {getUniqueActions().map((actionTitle) => {
                         const action = task.task_actions?.find(a => a.title === actionTitle);
                         const totalActions = task.task_actions?.length || 0;
                         const actionWeight = totalActions > 0 ? Math.round(100 / totalActions) : 0;
                         const actionProgress = action?.is_done ? actionWeight : 0;
                         
                         return (
                           <TableCell key={actionTitle} className="text-center">
                             {action ? (
                               <div className="flex flex-col items-center gap-1">
                                 <Checkbox
                                   checked={action.is_done}
                                   onCheckedChange={() => {
                                     console.log('Checkbox clicked:', { taskId: task.id, actionId: action.id, currentState: action.is_done });
                                     handleToggleAction(task.id, action.id);
                                   }}
                                 />
                                 <span className="text-xs text-muted-foreground">
                                   {actionProgress}%
                                 </span>
                               </div>
                             ) : (
                               <span className="text-muted-foreground">-</span>
                             )}
                           </TableCell>
                         );
                       })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </CardContent>
    </Card>
  );
};

export default DynamicTable;