/**
 * TaskTableEnterprise - Vue Tableau des Tâches
 * Pattern Linear/Notion - Pagination + Filtres temps réel
 */

import React, { useState } from 'react';
import { useTasksEnterprise, type Task } from '@/hooks/useTasksEnterprise';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge, StatusBadge, ProgressBar, MetricCard } from '@/components/ui/badges';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Paperclip,
  Plus,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TaskAttachmentUpload } from './TaskAttachmentUpload';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

const STATUS_CONFIG = {
  todo: { label: 'À faire', color: 'status-todo', icon: Clock },
  doing: { label: 'En cours', color: 'status-doing', icon: Loader2 },
  blocked: { label: 'Bloqué', color: 'status-blocked', icon: AlertCircle },
  done: { label: 'Terminé', color: 'status-done', icon: CheckCircle2 },
};

export const TaskTableEnterprise: React.FC = () => {
  const { tasks, loading, error, refresh } = useTasksEnterprise();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});
  const { currentTenant } = useTenant();

  // Filtrage des tâches
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage);

  // Charger les compteurs de fichiers pour chaque tâche
  React.useEffect(() => {
    const loadAttachmentCounts = async () => {
      if (!currentTenant || paginatedTasks.length === 0) return;
      
      const counts: Record<string, number> = {};
      
      for (const task of paginatedTasks) {
        try {
          const { count, error } = await supabase
            .from('task_attachments')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', currentTenant.id)
            .eq('task_id', task.id);
          
          if (!error && count !== null) {
            counts[task.id] = count;
          }
        } catch (err) {
          console.error(`Erreur chargement compteur pour ${task.id}:`, err);
        }
      }
      
      setAttachmentCounts(counts);
    };

    loadAttachmentCounts();
  }, [paginatedTasks, currentTenant]);

  const handleAttachmentClick = (task: Task) => {
    setSelectedTask(task);
    setUploadDialogOpen(true);
  };

  const handleUploadSuccess = () => {
    // Rafraîchir les compteurs
    if (selectedTask) {
      const newCount = (attachmentCounts[selectedTask.id] || 0) + 1;
      setAttachmentCounts(prev => ({
        ...prev,
        [selectedTask.id]: newCount
      }));
    }
  };

  // Statistiques
  const stats = {
    total: tasks.length,
    active: tasks.filter(t => t.status !== 'done').length,
    completed: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      return new Date(t.due_date) < new Date();
    }).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3">Chargement des tâches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Erreur de chargement</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={refresh} className="mt-4">Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total"
          value={stats.total}
          subtitle="Toutes les tâches"
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          label="Actives"
          value={stats.active}
          subtitle="En cours"
          icon={<Loader2 className="w-6 h-6" />}
          color="blue"
          trend="up"
        />
        <MetricCard
          label="Terminées"
          value={stats.completed}
          subtitle="Complétées"
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          label="En retard"
          value={stats.overdue}
          subtitle="Nécessitent action"
          icon={<AlertCircle className="w-6 h-6" />}
          color="red"
          trend="down"
        />
      </div>

      {/* Filtres */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="todo">À faire</SelectItem>
            <SelectItem value="doing">En cours</SelectItem>
            <SelectItem value="blocked">Bloqué</SelectItem>
            <SelectItem value="done">Terminé</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            <SelectItem value="low">Basse</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={refresh} variant="outline">
          Actualiser
        </Button>
      </div>

      {/* Tableau */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Assigné à</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Progression</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucune tâche trouvée
                </TableCell>
              </TableRow>
            ) : (
              paginatedTasks.map((task) => {
                return (
                  <TableRow key={task.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{task.title}</span>
                        {task.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-md">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <StatusBadge status={task.status as any} />
                    </TableCell>
                    
                    <TableCell>
                      <PriorityBadge priority={task.priority as any} />
                    </TableCell>
                    
                    <TableCell>
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={(task.assignee as any).avatar_url} />
                            <AvatarFallback className="text-xs">
                              {typeof task.assignee === 'object' 
                                ? task.assignee.full_name?.charAt(0)
                                : task.assigned_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {typeof task.assignee === 'object' 
                              ? task.assignee.full_name
                              : task.assigned_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Non assigné
                        </span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {task.due_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
                          {new Date(task.due_date).toLocaleDateString('fr-FR')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <ProgressBar 
                            value={task.progress || 0} 
                            color="blue" 
                            showLabel 
                            size="sm"
                          />
                        </div>
                        
                        {/* Bouton + pour fichiers */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => handleAttachmentClick(task)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 relative hover:bg-primary/10"
                              >
                                <Plus className="h-4 w-4 text-green-600" />
                                
                                {/* Compteur de fichiers */}
                                {attachmentCounts[task.id] > 0 && (
                                  <span className="ml-1 text-xs font-semibold text-primary">
                                    {attachmentCounts[task.id]}
                                  </span>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {attachmentCounts[task.id] > 0 
                                  ? `${attachmentCounts[task.id]} fichier(s) • Cliquez pour ajouter`
                                  : 'Ajouter des preuves de réalisation'}
                              </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              ⚠️ Requis pour validation
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages} ({filteredTasks.length} tâches)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Upload Fichiers */}
      {selectedTask && (
        <TaskAttachmentUpload
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};
