/**
 * AdvancedTaskSearch - Recherche Futuriste 🔍
 *
 * Design : Interface épurée, Filtres "Pill", Effets Glow
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
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
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
  const { employees } = useHRMinimal({
    enabled: {
      employees: true,
      leaveRequests: false,
      attendances: false,
      leaveBalances: false,
      departments: false,
      absenceTypes: false,
    },
    limits: {
      employees: 20,
    },
  });

  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: '1',
      name: '⭐ Urgences',
      filters: { ...DEFAULT_FILTERS, priority: ['high'], showOverdueOnly: true },
    },
    {
      id: '2',
      name: '📅 Cette semaine',
      filters: { ...DEFAULT_FILTERS, dateRange: 'week' },
    },
  ]);

  // Filtrer les tâches selon les critères
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Recherche full-text
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      result = result.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Filtres statut
    if (filters.status.length > 0) {
      result = result.filter(task => filters.status.includes(task.status));
    }

    // Filtres priorité
    if (filters.priority.length > 0) {
      result = result.filter(task => filters.priority.includes(task.priority?.toLowerCase() || ''));
    }

    // Filtre projet
    if (filters.project) {
      result = result.filter(task => task.project_id === filters.project);
    }

    // Filtre assigné
    if (filters.assignee) {
      result = result.filter(
        task =>
          task.assignee_id === filters.assignee || (task as any).assigned_to === filters.assignee
      );
    }

    // Filtre en retard uniquement
    if (filters.showOverdueOnly) {
      const now = new Date();
      result = result.filter(task => {
        if (!task.due_date) return false;
        return parseISO(task.due_date) < now && task.status !== 'done';
      });
    }

    // Filtre plage de dates
    if (filters.dateRange !== 'all') {
      const now = new Date();
      result = result.filter(task => {
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
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
  };

  const togglePriority = (priority: string) => {
    setFilters(prev => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter(p => p !== priority)
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
    setSelectedTasks(prev => {
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
    setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
  };

  const deselectAll = () => {
    setSelectedTasks(new Set());
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      await Promise.all(
        Array.from(selectedTasks).map(id => updateTask(id, { status: newStatus as any }))
      );
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Erreur lors du changement de statut groupé:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer ${selectedTasks.size} tâche(s) ?`)) return;

    try {
      await Promise.all(Array.from(selectedTasks).map(id => deleteTask(id)));
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Erreur lors de la suppression groupée:', error);
    }
  };

  const exportResults = () => {
    const csv = [
      ['Titre', 'Statut', 'Priorité', 'Échéance', 'Projet', 'Assigné'].join(','),
      ...filteredTasks.map(task =>
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
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-50 space-y-6 duration-700">
      {/* Header & Recherche */}
      <div className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 blur-3xl" />

        <div className="mb-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-3xl font-bold text-transparent dark:from-violet-400 dark:to-fuchsia-400">
              Explorateur
            </h2>
            <p className="text-muted-foreground">Recherche avancée et filtres intelligents</p>
          </div>

          <div className="flex gap-2">
            {savedSearches.map(search => (
              <Button
                key={search.id}
                variant="outline"
                size="sm"
                onClick={() => applySavedSearch(search)}
                className="border-primary/50 hover:border-primary hover:bg-primary/5 rounded-full border-dashed transition-all"
              >
                {search.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Barre de Recherche Glow */}
        <div className="group relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-30 blur transition duration-500 group-hover:opacity-60" />
          <div className="bg-background relative flex items-center rounded-xl border shadow-sm">
            <Search className="text-muted-foreground ml-4 h-5 w-5" />
            <Input
              placeholder="Rechercher une tâche, un bug, une feature..."
              value={filters.query}
              onChange={e => handleFilterChange('query', e.target.value)}
              className="placeholder:text-muted-foreground/50 h-14 border-none bg-transparent text-lg focus-visible:ring-0"
            />
            {filters.query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFilterChange('query', '')}
                className="mr-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Filtres */}
        <Card className="sticky top-4 h-fit border-none bg-white/50 shadow-lg backdrop-blur-xl lg:col-span-1 dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtres Actifs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statut Pill Selectors */}
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Statut
              </Label>
              <div className="flex flex-wrap gap-2">
                {['todo', 'doing', 'done'].map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      filters.status.includes(status)
                        ? 'bg-primary text-primary-foreground scale-105 shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {status === 'todo' ? 'À faire' : status === 'doing' ? 'En cours' : 'Terminé'}
                  </button>
                ))}
              </div>
            </div>

            {/* Priorité Pill Selectors */}
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Priorité
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'high', label: 'Haute', color: 'bg-red-500' },
                  { id: 'medium', label: 'Moyenne', color: 'bg-amber-500' },
                  { id: 'low', label: 'Basse', color: 'bg-emerald-500' },
                ].map(priority => (
                  <button
                    key={priority.id}
                    onClick={() => togglePriority(priority.id)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      filters.priority.includes(priority.id)
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 border-transparent'
                    }`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${priority.color}`} />
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Autres Filtres */}
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Projet</Label>
                <Select
                  value={filters.project}
                  onValueChange={value => handleFilterChange('project', value)}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Tous les projets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_projects">Tous les projets</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="overdue"
                  checked={filters.showOverdueOnly}
                  onCheckedChange={checked => handleFilterChange('showOverdueOnly', checked)}
                  className="data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500"
                />
                <Label htmlFor="overdue" className="cursor-pointer text-sm">
                  En retard uniquement
                </Label>
              </div>
            </div>

            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground w-full"
              onClick={clearFilters}
            >
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>

        {/* Résultats */}
        <div className="space-y-4 lg:col-span-3">
          <div className="bg-card/50 flex items-center justify-between rounded-lg border p-2 backdrop-blur-sm">
            <span className="px-2 text-sm font-medium">
              {filteredTasks.length} résultat{filteredTasks.length > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              {selectedTasks.size > 0 && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="h-8"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Supprimer ({selectedTasks.size})
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleBulkStatusChange('done')}
                    className="h-8"
                  >
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                    Terminer ({selectedTasks.size})
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={exportResults} className="h-8">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="border-muted flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 text-center">
              <div className="bg-muted/50 mb-4 rounded-full p-4">
                <Search className="text-muted-foreground h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold">Aucun résultat</h3>
              <p className="text-muted-foreground">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`group bg-card hover:border-primary/30 relative flex items-center gap-4 rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    selectedTasks.has(task.id) ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedTasks.has(task.id)}
                    onCheckedChange={() => toggleTaskSelection(task.id)}
                    className="rounded-full"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="group-hover:text-primary truncate pr-4 font-semibold transition-colors">
                          {task.title}
                        </h4>
                        <div className="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
                          {task.project_name && (
                            <span className="bg-muted/50 flex items-center gap-1 rounded-md px-2 py-0.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                              {task.project_name}
                            </span>
                          )}
                          {task.due_date && (
                            <span
                              className={`flex items-center gap-1 ${
                                parseISO(task.due_date) < new Date() && task.status !== 'done'
                                  ? 'font-medium text-red-500'
                                  : ''
                              }`}
                            >
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(task.due_date), 'dd MMM', { locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`capitalize ${
                            task.priority === 'high'
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : task.priority === 'medium'
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-green-200 bg-green-50 text-green-700'
                          }`}
                        >
                          {task.priority}
                        </Badge>
                        <Badge variant="secondary" className="bg-muted/50 capitalize">
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
