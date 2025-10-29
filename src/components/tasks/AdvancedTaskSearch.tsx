/**
 * AdvancedTaskSearch - Recherche avancée avec filtres multiples
 * 
 * Fonctionnalités :
 * - Recherche full-text
 * - Filtres multiples combinables
 * - Recherches sauvegardées
 * - Actions groupées
 * - Export des résultats
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Filter,
  Star,
  Download,
  Trash2,
  UserCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import { useTasks, type Task } from '@/hooks/optimized';
import { useProjects } from '@/hooks/optimized';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
}

interface SearchFilters {
  query: string;
  status: string[];
  priority: string[];
  project: string;
  assignee: string;
  dateRange: string;
  showOverdueOnly: boolean;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  status: [],
  priority: [],
  project: '',
  assignee: '',
  dateRange: 'all',
  showOverdueOnly: false,
};

export const AdvancedTaskSearch: React.FC = () => {
  const { tasks, loading, updateTask, deleteTask } = useTasks();
  const { projects } = useProjects();
  const { employees } = useHRMinimal();

  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: '1',
      name: '⭐ Mes tâches urgentes',
      filters: { ...DEFAULT_FILTERS, priority: ['high'], showOverdueOnly: true },
    },
    {
      id: '2',
      name: '⭐ Tâches marketing cette semaine',
      filters: { ...DEFAULT_FILTERS, dateRange: 'week', query: 'marketing' },
    },
  ]);

  // Filtrer les tâches selon les critères
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Recherche full-text
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Filtres statut
    if (filters.status.length > 0) {
      result = result.filter((task) => filters.status.includes(task.status));
    }

    // Filtres priorité
    if (filters.priority.length > 0) {
      result = result.filter((task) =>
        filters.priority.includes(task.priority?.toLowerCase() || '')
      );
    }

    // Filtre projet
    if (filters.project) {
      result = result.filter((task) => task.project_id === filters.project);
    }

    // Filtre assigné
    if (filters.assignee) {
      result = result.filter(
        (task) =>
          task.assignee_id === filters.assignee ||
          (task as any).assigned_to === filters.assignee
      );
    }

    // Filtre en retard uniquement
    if (filters.showOverdueOnly) {
      const now = new Date();
      result = result.filter((task) => {
        if (!task.due_date) return false;
        return parseISO(task.due_date) < now && task.status !== 'done';
      });
    }

    // Filtre plage de dates
    if (filters.dateRange !== 'all') {
      const now = new Date();
      result = result.filter((task) => {
        if (!task.due_date) return false;
        const dueDate = parseISO(task.due_date);

        switch (filters.dateRange) {
          case 'today':
            return dueDate.toDateString() === now.toDateString();
          case 'week':
            const weekLater = new Date(now);
            weekLater.setDate(now.getDate() + 7);
            return dueDate >= now && dueDate <= weekLater;
          case 'month':
            const monthLater = new Date(now);
            monthLater.setMonth(now.getMonth() + 1);
            return dueDate >= now && dueDate <= monthLater;
          default:
            return true;
        }
      });
    }

    return result;
  }, [tasks, filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleStatus = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  };

  const togglePriority = (priority: string) => {
    setFilters((prev) => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter((p) => p !== priority)
        : [...prev.priority, priority],
    }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedTasks(new Set());
  };

  const applySavedSearch = (search: SavedSearch) => {
    setFilters(search.filters);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedTasks(new Set(filteredTasks.map((t) => t.id)));
  };

  const deselectAll = () => {
    setSelectedTasks(new Set());
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      await Promise.all(
        Array.from(selectedTasks).map((id) => updateTask(id, { status: newStatus as any }))
      );
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Erreur lors du changement de statut groupé:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer ${selectedTasks.size} tâche(s) ?`)) return;

    try {
      await Promise.all(Array.from(selectedTasks).map((id) => deleteTask(id)));
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Erreur lors de la suppression groupée:', error);
    }
  };

  const exportResults = () => {
    const csv = [
      ['Titre', 'Statut', 'Priorité', 'Échéance', 'Projet', 'Assigné'].join(','),
      ...filteredTasks.map((task) =>
        [
          task.title,
          task.status,
          task.priority,
          task.due_date,
          task.project_name || '',
          task.assigned_name || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taches_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recherche Avancée</h2>
          <p className="text-muted-foreground">
            {filteredTasks.length} résultat{filteredTasks.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button variant="outline" size="sm" onClick={exportResults}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Recherches Sauvegardées */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4" />
            Recherches Sauvegardées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((search) => (
              <Button
                key={search.id}
                variant="outline"
                size="sm"
                onClick={() => applySavedSearch(search)}
              >
                {search.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recherche */}
          <div className="space-y-2">
            <Label>Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans titres et descriptions..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Statut */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <div className="space-y-2">
                {['todo', 'doing', 'blocked', 'done'].map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.status.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                    />
                    <span className="text-sm capitalize">{status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priorité */}
            <div className="space-y-2">
              <Label>Priorité</Label>
              <div className="space-y-2">
                {['high', 'medium', 'low'].map((priority) => (
                  <div key={priority} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.priority.includes(priority)}
                      onCheckedChange={() => togglePriority(priority)}
                    />
                    <span className="text-sm capitalize">{priority}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plage de dates */}
            <div className="space-y-2">
              <Label>Échéance</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => handleFilterChange('dateRange', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* En retard uniquement */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={filters.showOverdueOnly}
              onCheckedChange={(checked) =>
                handleFilterChange('showOverdueOnly', checked)
              }
            />
            <Label className="cursor-pointer">Afficher seulement les tâches en retard</Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions Groupées */}
      {selectedTasks.size > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {selectedTasks.size} tâche{selectedTasks.size > 1 ? 's' : ''} sélectionnée
                  {selectedTasks.size > 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Désélectionner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange('done')}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Marquer terminées
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Résultats ({filteredTasks.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Tout sélectionner
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune tâche ne correspond aux critères de recherche
            </p>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg flex items-center gap-4 hover:bg-accent/50 transition-colors ${
                    selectedTasks.has(task.id) ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedTasks.has(task.id)}
                    onCheckedChange={() => toggleTaskSelection(task.id)}
                  />

                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      {task.due_date && (
                        <Badge variant="outline">
                          {format(parseISO(task.due_date), 'dd MMM', { locale: fr })}
                        </Badge>
                      )}
                      <Badge variant="secondary">{task.status}</Badge>
                      <Badge>{task.priority}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
