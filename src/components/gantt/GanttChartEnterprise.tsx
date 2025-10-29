/**
 * Gantt Chart Enterprise - Pattern SaaS Leaders
 * Inspiré de Monday.com, Asana, Microsoft Project
 * 
 * Fonctionnalités:
 * - Timeline interactive avec zoom
 * - Hiérarchie des tâches parent/enfant
 * - Dépendances visuelles
 * - Drag & Drop pour planification
 * - Métriques de performance
 * - Export et impression
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTasksEnterprise, TaskFilters, type Task } from '@/hooks/useTasksEnterprise';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/ui/badges';
import { 
  Search, 
  RefreshCw, 
  ZoomIn,
  ZoomOut,
  Calendar,
  Download,
  Settings,
  AlertTriangle,
  BarChart3,
  Clock,
  ChevronRight,
  ChevronDown,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GanttChartEnterpriseProps {
  projectId?: string;
  showMetrics?: boolean;
  compactMode?: boolean;
}

interface GanttTask extends Task {
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  startX: number;
  width: number;
  y: number;
}

interface TimelineConfig {
  startDate: Date;
  endDate: Date;
  dayWidth: number;
  zoom: 'day' | 'week' | 'month';
}

export const GanttChartEnterprise: React.FC<GanttChartEnterpriseProps> = ({
  projectId,
  showMetrics = true,
  compactMode = false
}) => {
  // États locaux
  const [filters, setFilters] = useState<TaskFilters>({
    projectId,
    includeSubtasks: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [timelineConfig, setTimelineConfig] = useState<TimelineConfig>({
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 jours
    dayWidth: 30,
    zoom: 'day'
  });

  // Refs pour le canvas et interactions
  const ganttRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hook enterprise optimisé
  const {
    tasks,
    totalCount,
    activeTasks,
    completedTasks,
    overdueTasks,
    hierarchyStats,
    loading,
    error,
    metrics,
    canAccess,
    isSuperAdmin,
    refresh,
    getSubtasks,
    getTaskHierarchy,
    isDataStale
  } = useTasksEnterprise(filters);

  const { toast } = useToast();

  // Filtrer les tâches par recherche
  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasks;
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  // Organiser les tâches en hiérarchie pour le Gantt
  const hierarchicalTasks = useMemo(() => {
    const result: GanttTask[] = [];
    const processedTasks = new Set<string>();

    // Fonction récursive pour construire la hiérarchie
    const addTaskWithChildren = (task: Task, level: number = 0) => {
      if (processedTasks.has(task.id)) return;
      processedTasks.add(task.id);

      const subtasks = getSubtasks(task.id);
      const hasChildren = subtasks.length > 0;
      const isExpanded = expandedTasks.has(task.id);

      // Calculer les positions pour le timeline
      const startDate = task.start_date ? new Date(task.start_date) : new Date();
      const endDate = task.due_date ? new Date(task.due_date) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const startX = Math.max(0, (startDate.getTime() - timelineConfig.startDate.getTime()) / (24 * 60 * 60 * 1000) * timelineConfig.dayWidth);
      const endX = (endDate.getTime() - timelineConfig.startDate.getTime()) / (24 * 60 * 60 * 1000) * timelineConfig.dayWidth;
      const width = Math.max(20, endX - startX);

      const ganttTask: GanttTask = {
        ...task,
        level,
        isExpanded,
        hasChildren,
        startX,
        width,
        y: result.length * 40 // 40px par ligne
      };

      result.push(ganttTask);

      // Ajouter les sous-tâches si la tâche est étendue
      if (isExpanded && hasChildren) {
        subtasks.forEach(subtask => {
          addTaskWithChildren(subtask, level + 1);
        });
      }
    };

    // Commencer par les tâches racines
    const rootTasks = filteredTasks.filter(task => !task.parent_task_id);
    rootTasks.forEach(task => addTaskWithChildren(task));

    return result;
  }, [filteredTasks, expandedTasks, getSubtasks, timelineConfig]);

  // Calculer les dates min/max automatiquement
  useEffect(() => {
    if (tasks.length === 0) return;

    const dates = tasks
      .filter(task => task.start_date || task.due_date)
      .flatMap(task => [
        task.start_date ? new Date(task.start_date) : null,
        task.due_date ? new Date(task.due_date) : null
      ])
      .filter(Boolean) as Date[];

    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      // Ajouter une marge
      minDate.setDate(minDate.getDate() - 7);
      maxDate.setDate(maxDate.getDate() + 14);

      setTimelineConfig(prev => ({
        ...prev,
        startDate: minDate,
        endDate: maxDate
      }));
    }
  }, [tasks]);

  // Gestionnaires d'événements
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const toggleTaskExpansion = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const handleZoomChange = useCallback((newZoom: 'day' | 'week' | 'month') => {
    const dayWidths = { day: 30, week: 20, month: 10 };
    setTimelineConfig(prev => ({
      ...prev,
      zoom: newZoom,
      dayWidth: dayWidths[newZoom]
    }));
  }, []);

  // Générer les en-têtes de timeline
  const timelineHeaders = useMemo(() => {
    const headers: { date: Date; label: string; isWeekend?: boolean }[] = [];
    const current = new Date(timelineConfig.startDate);
    
    while (current <= timelineConfig.endDate) {
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      
      let label = '';
      switch (timelineConfig.zoom) {
        case 'day':
          label = current.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
          break;
        case 'week':
          label = `S${Math.ceil(current.getDate() / 7)}`;
          break;
        case 'month':
          label = current.toLocaleDateString('fr-FR', { month: 'short' });
          break;
      }
      
      headers.push({ date: new Date(current), label, isWeekend });
      
      // Incrémenter selon le zoom
      switch (timelineConfig.zoom) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    
    return headers;
  }, [timelineConfig]);

  // Composant barre de tâche Gantt
  const GanttTaskBar: React.FC<{ task: GanttTask }> = React.memo(({ task }) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
    const progress = task.progress || 0;
    
    const getStatusColor = () => {
      if (isOverdue) return 'bg-status-blocked';
      switch (task.status) {
        case 'completed': return 'bg-status-done';
        case 'in_progress': return 'bg-status-doing';
        case 'review': return 'bg-status-review';
        case 'blocked': return 'bg-status-blocked';
        default: return 'bg-status-todo';
      }
    };

    return (
      <div
        className="absolute flex items-center group cursor-pointer"
        style={{
          left: `${task.startX}px`,
          width: `${task.width}px`,
          top: `${task.y}px`,
          height: '32px'
        }}
      >
        {/* Barre de progression */}
        <div className={`h-6 rounded ${getStatusColor()} relative overflow-hidden shadow-sm`}>
          {/* Progression */}
          {progress > 0 && (
            <div 
              className="absolute top-0 left-0 h-full bg-white/30 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          )}
          
          {/* Contenu de la barre */}
          <div className="absolute inset-0 flex items-center px-2">
            <span className="text-white text-xs font-medium truncate">
              {task.title}
            </span>
          </div>
        </div>

        {/* Tooltip au hover */}
        <div className="absolute bottom-8 left-0 bg-black text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
          <div className="font-medium">{task.title}</div>
          <div>Statut: {task.status}</div>
          <div>Progression: {progress}%</div>
          {task.assignee && <div>Assigné: {task.assignee.full_name}</div>}
          {task.start_date && <div>Début: {new Date(task.start_date).toLocaleDateString('fr-FR')}</div>}
          {task.due_date && <div>Fin: {new Date(task.due_date).toLocaleDateString('fr-FR')}</div>}
        </div>
      </div>
    );
  });

  // Vérification des permissions
  if (!canAccess) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
          <h3 className="text-lg font-semibold mb-2">Accès Restreint</h3>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour voir les tâches.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques de Performance */}
      {showMetrics && !compactMode && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Tâches"
            value={totalCount}
            subtitle="Toutes les tâches"
            icon={<BarChart3 className="w-6 h-6" />}
            color="blue"
          />
          
          <MetricCard
            label="Actives"
            value={activeTasks}
            subtitle="En cours"
            icon={<Clock className="w-6 h-6" />}
            color="blue"
            trend="up"
          />
          
          <MetricCard
            label="En retard"
            value={overdueTasks}
            subtitle="Nécessitent action"
            icon={<AlertTriangle className="w-6 h-6" />}
            color="red"
            trend="down"
          />
          
          <MetricCard
            label="Profondeur"
            value={hierarchyStats.maxDepth}
            subtitle="Hiérarchie max"
            icon={<Calendar className="w-6 h-6" />}
            color="purple"
          />
        </div>
      )}

      {/* Contrôles et filtres */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Diagramme de Gantt
                {isSuperAdmin && (
                  <Badge variant="secondary">Super Admin</Badge>
                )}
              </CardTitle>
              {!compactMode && (
                <p className="text-sm text-muted-foreground mt-1">
                  {totalCount} tâches • {hierarchyStats.parentTasks} projets • 
                  Profondeur max: {hierarchyStats.maxDepth}
                  {isDataStale && <span className="text-orange-600"> • Données obsolètes</span>}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>
              
              {/* Contrôles de zoom */}
              <div className="flex items-center gap-1 border rounded">
                <Button
                  variant={timelineConfig.zoom === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleZoomChange('day')}
                >
                  Jour
                </Button>
                <Button
                  variant={timelineConfig.zoom === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleZoomChange('week')}
                >
                  Semaine
                </Button>
                <Button
                  variant={timelineConfig.zoom === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleZoomChange('month')}
                >
                  Mois
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Diagramme de Gantt */}
      {loading && tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement des tâches...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refresh} variant="outline">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div ref={ganttRef} className="overflow-auto">
              <div className="flex">
                {/* Colonne des tâches (fixe) */}
                <div className="w-80 bg-muted/30 border-r">
                  {/* En-tête */}
                  <div className="h-12 border-b bg-background flex items-center px-4 font-semibold">
                    Tâches
                  </div>
                  
                  {/* Liste des tâches */}
                  <div className="relative">
                    {hierarchicalTasks.map((task) => (
                      <div
                        key={task.id}
                        className="h-10 border-b flex items-center px-4 hover:bg-muted/50"
                        style={{ paddingLeft: `${16 + task.level * 20}px` }}
                      >
                        {/* Bouton d'expansion */}
                        {task.hasChildren && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 mr-2"
                            onClick={() => toggleTaskExpansion(task.id)}
                          >
                            {task.isExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        
                        {/* Nom de la tâche */}
                        <span className="text-sm truncate flex-1">{task.title}</span>
                        
                        {/* Assigné */}
                        {task.assignee && (
                          <div className="ml-2 text-xs text-muted-foreground">
                            {task.assignee.full_name?.charAt(0)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline (scrollable) */}
                <div className="flex-1 relative">
                  {/* En-tête timeline */}
                  <div className="h-12 border-b bg-background flex">
                    {timelineHeaders.map((header, index) => (
                      <div
                        key={index}
                        className={`flex-shrink-0 border-r text-xs flex items-center justify-center font-medium ${
                          header.isWeekend ? 'bg-muted/50' : ''
                        }`}
                        style={{ width: `${timelineConfig.dayWidth}px` }}
                      >
                        {header.label}
                      </div>
                    ))}
                  </div>
                  
                  {/* Grille et barres de tâches */}
                  <div className="relative">
                    {/* Grille de fond */}
                    <div className="absolute inset-0">
                      {timelineHeaders.map((header, index) => (
                        <div
                          key={index}
                          className={`absolute top-0 bottom-0 border-r ${
                            header.isWeekend ? 'bg-muted/30' : ''
                          }`}
                          style={{ 
                            left: `${index * timelineConfig.dayWidth}px`,
                            width: `${timelineConfig.dayWidth}px`
                          }}
                        />
                      ))}
                      
                      {/* Lignes horizontales */}
                      {hierarchicalTasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="absolute left-0 right-0 border-b"
                          style={{ 
                            top: `${index * 40}px`,
                            height: '40px'
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Barres de tâches */}
                    <div 
                      className="relative"
                      style={{ 
                        height: `${hierarchicalTasks.length * 40}px`,
                        width: `${timelineHeaders.length * timelineConfig.dayWidth}px`
                      }}
                    >
                      {hierarchicalTasks.map((task) => (
                        <GanttTaskBar key={task.id} task={task} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
