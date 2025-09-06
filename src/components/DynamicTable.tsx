import React, { useState, useRef } from 'react';
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
  Target
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskAction {
  id: string;
  title: string;
  isDone: boolean;
  owner?: string;
  dueDate?: Date;
  notes?: string;
}

interface DynamicTask {
  id: string;
  title: string;
  assignee: string;
  startDate: Date;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'doing' | 'blocked' | 'done';
  effortHours: number;
  progress: number;
  actions: TaskAction[];
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const statusColors = {
  todo: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  doing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
};

const DynamicTable = () => {
  const [tasks, setTasks] = useState<DynamicTask[]>([
    {
      id: '1',
      title: 'Design UI/UX',
      assignee: 'Marie Dupont',
      startDate: new Date(2024, 0, 1),
      dueDate: new Date(2024, 0, 15),
      priority: 'high',
      status: 'doing',
      effortHours: 40,
      progress: 60,
      actions: [
        { id: 'a1', title: 'Wireframes', isDone: true },
        { id: 'a2', title: 'Maquettes', isDone: true },
        { id: 'a3', title: 'Prototype', isDone: false },
        { id: 'a4', title: 'Tests utilisateurs', isDone: false },
        { id: 'a5', title: 'Validation finale', isDone: false }
      ]
    },
    {
      id: '2',
      title: 'Développement Frontend',
      assignee: 'Jean Martin',
      startDate: new Date(2024, 0, 10),
      dueDate: new Date(2024, 1, 5),
      priority: 'medium',
      status: 'todo',
      effortHours: 80,
      progress: 0,
      actions: [
        { id: 'b1', title: 'Setup projet', isDone: false },
        { id: 'b2', title: 'Composants UI', isDone: false },
        { id: 'b3', title: 'Pages principales', isDone: false },
        { id: 'b4', title: 'Intégration API', isDone: false }
      ]
    }
  ]);

  const [actionColumns, setActionColumns] = useState<string[]>([
    'Wireframes', 'Maquettes', 'Prototype', 'Tests utilisateurs', 'Validation finale', 'Setup projet', 'Composants UI', 'Pages principales', 'Intégration API'
  ]);

  const [newActionTitle, setNewActionTitle] = useState('');

  const calculateProgress = (actions: TaskAction[]) => {
    if (actions.length === 0) return 0;
    const completedActions = actions.filter(action => action.isDone).length;
    return Math.round((completedActions / actions.length) * 100);
  };

  const getTaskStatus = (task: DynamicTask) => {
    const progress = calculateProgress(task.actions);
    if (progress === 100) return 'done';
    if (progress > 0) return 'doing';
    return 'todo';
  };

  const toggleAction = (taskId: string, actionId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          const updatedActions = task.actions.map(action =>
            action.id === actionId ? { ...action, isDone: !action.isDone } : action
          );
          const newProgress = calculateProgress(updatedActions);
          return {
            ...task,
            actions: updatedActions,
            progress: newProgress,
            status: getTaskStatus({ ...task, actions: updatedActions })
          };
        }
        return task;
      })
    );
  };

  const addActionColumn = () => {
    if (newActionTitle.trim()) {
      setActionColumns(prev => [...prev, newActionTitle.trim()]);
      setNewActionTitle('');
    }
  };

  const duplicateTask = (taskId: string) => {
    const taskToDuplicate = tasks.find(task => task.id === taskId);
    if (taskToDuplicate) {
      const newTask: DynamicTask = {
        ...taskToDuplicate,
        id: `${taskToDuplicate.id}_copy_${Date.now()}`,
        title: `${taskToDuplicate.title} (Copie)`,
        actions: taskToDuplicate.actions.map(action => ({
          ...action,
          id: `${action.id}_copy_${Date.now()}`,
          isDone: false
        })),
        progress: 0,
        status: 'todo'
      };
      setTasks(prev => [...prev, newTask]);
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const getUniqueActions = () => {
    const allActions = new Set<string>();
    tasks.forEach(task => {
      task.actions.forEach(action => {
        allActions.add(action.title);
      });
    });
    return Array.from(allActions);
  };

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
              onKeyPress={(e) => e.key === 'Enter' && addActionColumn()}
              className="w-40"
            />
            <Button onClick={addActionColumn} size="sm">
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
                          {formatDate(task.startDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(task.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityColors[task.priority]} variant="secondary">
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[task.status]} variant="secondary">
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {task.effortHours}h
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
                            <DropdownMenuItem onClick={() => duplicateTask(task.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteTask(task.id)}
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
                        const action = task.actions.find(a => a.title === actionTitle);
                        return (
                          <TableCell key={actionTitle} className="text-center">
                            {action ? (
                              <Checkbox
                                checked={action.isDone}
                                onCheckedChange={() => toggleAction(task.id, action.id)}
                              />
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