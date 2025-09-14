import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTasks } from '@/hooks/useTasks';
import { useTaskCRUD } from '@/hooks/useTaskCRUD';
import { TaskCreationDialog } from '@/components/tasks/TaskCreationDialog';
import { TaskAssignmentManager } from '@/components/tasks/TaskAssignmentManager';
import {
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  Download,
  Upload,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import type { Task } from '@/hooks/useTasks';

export default function TaskManagementPage() {
  const { tasks, loading, refetch } = useTasks();
  const { changeTaskStatus } = useTaskCRUD();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState<'table' | 'kanban' | 'gantt'>('table');

  // Filtrage des tâches
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'all' || task.assignee === assigneeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  // Statistiques des tâches
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    doing: tasks.filter(t => t.status === 'doing').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
    ).length,
    highPriority: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length
  };

  const handleTaskUpdate = () => {
    refetch();
  };

  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'doing' | 'blocked' | 'done') => {
    try {
      await changeTaskStatus(taskId, newStatus);
      refetch();
    } catch (error) {
      console.error('Error changing task status:', error);
    }
  };

  const getUniqueAssignees = () => {
    const assignees = new Set(tasks.map(task => task.assignee).filter(Boolean));
    return Array.from(assignees);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Tâches</h1>
            <p className="text-muted-foreground">
              Gérez vos tâches, projets et assignations
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Tâche
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{taskStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">{taskStats.todo}</p>
                  <p className="text-xs text-muted-foreground">À faire</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{taskStats.doing}</p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{taskStats.blocked}</p>
                  <p className="text-xs text-muted-foreground">Bloquées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{taskStats.done}</p>
                  <p className="text-xs text-muted-foreground">Terminées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{taskStats.overdue}</p>
                  <p className="text-xs text-muted-foreground">En retard</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{taskStats.highPriority}</p>
                  <p className="text-xs text-muted-foreground">Priorité haute</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Tâches</TabsTrigger>
            <TabsTrigger value="assignments">Assignations</TabsTrigger>
            <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            {/* Filtres */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-60">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher des tâches..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="todo">À faire</SelectItem>
                      <SelectItem value="doing">En cours</SelectItem>
                      <SelectItem value="blocked">Bloquées</SelectItem>
                      <SelectItem value="done">Terminées</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes priorités</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={activeView === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveView('table')}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={activeView === 'kanban' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveView('kanban')}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={activeView === 'gantt' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveView('gantt')}
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vue des tâches */}
            <Card>
              <CardContent className="p-0">
                {activeView === 'table' && (
                  <div className="p-4">
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="font-medium mb-2">Vue Tableau</h3>
                      <p>Affichage des {filteredTasks.length} tâches filtrées</p>
                      {/* TODO: Implémenter DynamicTable avec les bonnes props */}
                    </div>
                  </div>
                )}
                {activeView === 'kanban' && (
                  <div className="p-4">
                    <div className="text-center text-muted-foreground py-8">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="font-medium mb-2">Vue Kanban</h3>
                      <p>Organisation visuelle des {filteredTasks.length} tâches</p>
                      {/* TODO: Implémenter KanbanBoard avec les bonnes props */}
                    </div>
                  </div>
                )}
                {activeView === 'gantt' && (
                  <div className="p-4">
                    <div className="text-center text-muted-foreground py-8">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="font-medium mb-2">Vue Gantt</h3>
                      <p>Planning temporel des {filteredTasks.length} tâches</p>
                      {/* TODO: Implémenter GanttChart avec les bonnes props */}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <TaskAssignmentManager 
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Statut</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>À faire</span>
                      <Badge>{taskStats.todo}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>En cours</span>
                      <Badge>{taskStats.doing}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Bloquées</span>
                      <Badge variant="destructive">{taskStats.blocked}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Terminées</span>
                      <Badge variant="secondary">{taskStats.done}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Autres cartes d'analytics peuvent être ajoutées ici */}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <TaskCreationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          editTask={editTask}
          onSuccess={handleTaskUpdate}
        />
        
        {editTask && (
          <TaskCreationDialog
            open={!!editTask}
            onOpenChange={(open) => !open && setEditTask(null)}
            editTask={editTask}
            onSuccess={() => {
              handleTaskUpdate();
              setEditTask(null);
            }}
          />
        )}
      </div>
    </div>
  );
}