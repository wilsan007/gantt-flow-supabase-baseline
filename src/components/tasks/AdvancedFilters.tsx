/**
 * 🎯 AdvancedFilters - Filtrage Multi-Critères pour Tâches
 * Pattern: Notion, Linear, Monday.com
 *
 * Fonctionnalités:
 * - Filtres par statut, priorité, assigné, projet, dates
 * - Recherche textuelle
 * - Sauvegarde automatique (localStorage)
 * - Reset rapide
 * - Badge compteur résultats
 */

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  Calendar,
  User,
  Flag,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { useIsMobileLayout } from '@/hooks/use-mobile';

export interface TaskFilters {
  search: string;
  status: string[];
  priority: string[];
  assignee: string[];
  project: string[];
  dateFrom: string;
  dateTo: string;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: TaskFilters) => void;
  projects?: Array<{ id: string; name: string }>;
  employees?: Array<{ id: string; full_name: string }>;
  totalTasks: number;
  filteredCount: number;
}

const defaultFilters: TaskFilters = {
  search: '',
  status: [],
  priority: [],
  assignee: [],
  project: [],
  dateFrom: '',
  dateTo: '',
};

const STATUS_OPTIONS = [
  { value: 'todo', label: 'À faire', icon: Clock, color: 'text-gray-500' },
  { value: 'doing', label: 'En cours', icon: AlertCircle, color: 'text-blue-500' },
  { value: 'blocked', label: 'Bloqué', icon: AlertCircle, color: 'text-orange-500' },
  { value: 'done', label: 'Terminé', icon: CheckCircle2, color: 'text-green-500' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse', color: 'bg-gray-200 text-gray-700' },
  { value: 'medium', label: 'Moyenne', color: 'bg-blue-200 text-blue-700' },
  { value: 'high', label: 'Haute', color: 'bg-orange-200 text-orange-700' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-200 text-red-700' },
];

export const AdvancedFilters = ({
  onFiltersChange,
  projects = [],
  employees = [],
  totalTasks,
  filteredCount,
}: AdvancedFiltersProps) => {
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);
  const [isOpen, setIsOpen] = useState(false);

  // Détection du scroll et du layout mobile pour cacher les filtres
  const { isScrollingDown } = useScrollDirection();
  const isMobile = useIsMobileLayout(); // < 1024px pour layout

  // Charger les filtres depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem('taskFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFilters(parsed);
        onFiltersChange(parsed);
      } catch (e) {
        console.error('Erreur chargement filtres:', e);
      }
    }
  }, []);

  // Sauvegarder les filtres dans localStorage
  useEffect(() => {
    localStorage.setItem('taskFilters', JSON.stringify(filters));
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (
    key: 'status' | 'priority' | 'assignee' | 'project',
    value: string
  ) => {
    setFilters(prev => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    localStorage.removeItem('taskFilters');
  };

  const activeFiltersCount =
    filters.status.length +
    filters.priority.length +
    filters.assignee.length +
    filters.project.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0 || filters.search.length > 0;

  return (
    <div
      className={`space-y-3 transition-all duration-300 ease-in-out ${isMobile && isScrollingDown ? 'h-0 overflow-hidden opacity-0' : 'h-auto opacity-100'} `}
    >
      {/* Barre de recherche + Bouton filtres */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Recherche textuelle */}
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Rechercher par titre, description..."
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            className="pr-10 pl-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateFilter('search', '')}
              className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Bouton Filtres Avancés */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 flex h-5 w-5 items-center justify-center p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Filtres avancés</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
                    <X className="mr-1 h-3 w-3" />
                    Réinitialiser
                  </Button>
                )}
              </div>

              <Separator />

              {/* Filtre Statut */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  Statut
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(status => {
                    const Icon = status.icon;
                    const isActive = filters.status.includes(status.value);
                    return (
                      <Button
                        key={status.value}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayFilter('status', status.value)}
                        className="h-8 justify-start text-xs"
                      >
                        <Icon className={`mr-1 h-3 w-3 ${status.color}`} />
                        {status.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Filtre Priorité */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium">
                  <Flag className="h-3 w-3" />
                  Priorité
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITY_OPTIONS.map(priority => {
                    const isActive = filters.priority.includes(priority.value);
                    return (
                      <Button
                        key={priority.value}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayFilter('priority', priority.value)}
                        className="h-8 justify-start text-xs"
                      >
                        <div
                          className={`mr-2 h-2 w-2 rounded-full ${priority.color.split(' ')[0]}`}
                        />
                        {priority.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Filtre Assigné */}
              {employees.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-medium">
                      <User className="h-3 w-3" />
                      Assigné à
                    </Label>
                    <Select value="" onValueChange={value => toggleArrayFilter('assignee', value)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id} className="text-xs">
                            {emp.full_name}
                            {filters.assignee.includes(emp.id) && ' ✓'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {filters.assignee.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {filters.assignee.map(id => {
                          const emp = employees.find(e => e.id === id);
                          return (
                            <Badge key={id} variant="secondary" className="text-xs">
                              {emp?.full_name}
                              <X
                                className="ml-1 h-3 w-3 cursor-pointer"
                                onClick={() => toggleArrayFilter('assignee', id)}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Filtre Projet */}
              {projects.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-medium">
                      <FolderKanban className="h-3 w-3" />
                      Projet
                    </Label>
                    <Select value="" onValueChange={value => toggleArrayFilter('project', value)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(proj => (
                          <SelectItem key={proj.id} value={proj.id} className="text-xs">
                            {proj.name}
                            {filters.project.includes(proj.id) && ' ✓'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {filters.project.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {filters.project.map(id => {
                          const proj = projects.find(p => p.id === id);
                          return (
                            <Badge key={id} variant="secondary" className="text-xs">
                              {proj?.name}
                              <X
                                className="ml-1 h-3 w-3 cursor-pointer"
                                onClick={() => toggleArrayFilter('project', id)}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Filtre Dates */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium">
                  <Calendar className="h-3 w-3" />
                  Période
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-muted-foreground text-xs">Du</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={e => updateFilter('dateFrom', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Au</Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={e => updateFilter('dateTo', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Bouton Reset (visible si filtres actifs) */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="hidden sm:flex">
            <X className="mr-1 h-4 w-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Badge résultats */}
      {hasActiveFilters && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Badge variant="outline">
            {filteredCount} / {totalTasks} tâches
          </Badge>
          {filters.search && (
            <span className="text-xs">
              pour "<strong>{filters.search}</strong>"
            </span>
          )}
        </div>
      )}
    </div>
  );
};
