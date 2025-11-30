/**
 * Page: Operations (Activités Opérationnelles)
 * Pattern: Linear/Monday.com Dashboard
 *
 * Gestion des activités récurrentes et ponctuelles hors projet
 */

import React, { useState } from 'react';
import {
  CalendarClock,
  CalendarDays,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { OperationalTaskTableInline } from './OperationalTaskTableInline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOperationalTasksEnterprise } from '@/hooks/useOperationalTasksEnterprise';
import { ActivityFormWithAssignment } from './ActivityFormWithAssignment';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export const OperationsPage: React.FC = () => {
  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | 'recurring' | 'one_off'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createActivityKind, setCreateActivityKind] = useState<'recurring' | 'one_off'>(
    'recurring'
  );
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const isMobile = useIsMobile();

  // ✅ Hook Enterprise optimisé pour les tâches opérationnelles
  const {
    tasks,
    loading,
    error,
    metrics,
    todoCount,
    inProgressCount,
    completedCount,
    recurringCount,
    refresh,
    updateTask,
  } = useOperationalTasksEnterprise({
    search: searchTerm || undefined,
    isRecurring: filterKind === 'recurring' ? true : filterKind === 'one_off' ? false : undefined,
  });

  // Filtrer les tâches
  const filteredTasks = tasks.filter(task => {
    const matchesKind =
      filterKind === 'all' ||
      (filterKind === 'recurring' && task.is_recurring) ||
      (filterKind === 'one_off' && !task.is_recurring);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && task.status !== 'done') ||
      (filterStatus === 'inactive' && task.status === 'done');
    const matchesSearch =
      !searchTerm ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesKind && matchesStatus && matchesSearch;
  });

  // Handlers
  const handleCreateClick = (kind: 'recurring' | 'one_off') => {
    setCreateActivityKind(kind);
    setIsCreateDialogOpen(true);
  };

  // ⚠️ Handlers de création d'activités désactivés temporairement
  const handleSaveActivity = async (formData: any) => {
    toast.error('Fonctionnalité temporairement désactivée', {
      description: 'Utilisez le mode Table pour gérer vos tâches opérationnelles',
    });
    setIsCreateDialogOpen(false);
  };

  // Render
  return (
    <div className="relative container mx-auto px-3 py-4 md:px-4 md:py-6">
      {/* Gradient Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-purple-50/30 to-blue-50/50 dark:from-cyan-950/20 dark:via-purple-950/10 dark:to-blue-950/20" />

      <div className="relative z-10">
        {/* Header with futuristic gradient */}
        <div className="mb-4 space-y-4 md:mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-purple-600 to-blue-600 p-6 shadow-2xl shadow-cyan-500/20">
            {/* Animated shimmer overlay */}
            <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-cyan-600/0 via-white/10 to-cyan-600/0" />
            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
                  <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                    <CalendarClock className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                  Activités Opérationnelles
                </h1>
                <p className="mt-1 text-sm text-white/90 md:text-base">
                  Gérez vos tâches récurrentes et ponctuelles hors projet
                </p>
              </div>

              {/* View mode toggle - Desktop only */}
              {!isMobile && (
                <div className="flex gap-1 self-start rounded-lg border border-white/30 bg-white/10 p-1 backdrop-blur-sm">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'h-7 px-2 transition-all duration-300',
                      viewMode === 'cards'
                        ? 'bg-white text-purple-600 hover:bg-white/90'
                        : 'text-white hover:bg-white/20'
                    )}
                    onClick={() => setViewMode('cards')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'h-7 px-2 transition-all duration-300',
                      viewMode === 'table'
                        ? 'bg-white text-purple-600 hover:bg-white/90'
                        : 'text-white hover:bg-white/20'
                    )}
                    onClick={() => setViewMode('table')}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons with gradient */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => handleCreateClick('recurring')}
              className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:from-cyan-700 hover:to-purple-700 hover:shadow-xl hover:shadow-cyan-500/40 sm:w-auto"
            >
              <CalendarClock className="h-4 w-4" />
              <span className="sm:inline">{isMobile ? 'Récurrente' : 'Nouvelle Récurrente'}</span>
            </Button>
            <Button
              onClick={() => handleCreateClick('one_off')}
              className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:shadow-purple-500/40 sm:w-auto"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="sm:inline">{isMobile ? 'Ponctuelle' : 'Nouvelle Ponctuelle'}</span>
            </Button>
          </div>
        </div>

        {/* Métriques with glassmorphism */}
        <div className="mb-4 grid grid-cols-2 gap-3 md:mb-6 md:grid-cols-4 md:gap-4">
          <Card className="group border-none bg-white/60 shadow-xl shadow-gray-500/10 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 dark:bg-gray-900/60">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500/0 to-purple-500/0 transition-all duration-500 group-hover:from-purple-500/10 group-hover:to-purple-500/5" />
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-xs font-medium text-transparent md:text-sm dark:from-gray-300 dark:to-white">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-xl font-bold text-transparent md:text-2xl">
                {tasks.length}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {metrics.cacheHit ? '⚡ Cache' : `${metrics.fetchTime.toFixed(0)}ms`}
              </p>
            </CardContent>
          </Card>

          <Card className="group border-none bg-white/60 shadow-xl shadow-gray-500/10 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-gray-500/20 dark:bg-gray-900/60">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gray-500/0 to-gray-500/0 transition-all duration-500 group-hover:from-gray-500/10 group-hover:to-gray-500/5" />
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-xs font-medium text-transparent md:text-sm dark:from-gray-300 dark:to-white">
                À faire
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-xl font-bold text-gray-600 md:text-2xl">{todoCount}</div>
              <p className="text-muted-foreground mt-1 text-xs">Non commencées</p>
            </CardContent>
          </Card>

          <Card className="group border-none bg-white/60 shadow-xl shadow-gray-500/10 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 dark:bg-gray-900/60">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/0 to-blue-500/0 transition-all duration-500 group-hover:from-blue-500/10 group-hover:to-blue-500/5" />
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-xs font-medium text-transparent md:text-sm dark:from-gray-300 dark:to-white">
                En cours
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-xl font-bold text-blue-600 md:text-2xl">{inProgressCount}</div>
              <p className="text-muted-foreground mt-1 text-xs">Actives</p>
            </CardContent>
          </Card>

          <Card className="group border-none bg-white/60 shadow-xl shadow-gray-500/10 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 dark:bg-gray-900/60">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-green-500/0 to-green-500/0 transition-all duration-500 group-hover:from-green-500/10 group-hover:to-green-500/5" />
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-xs font-medium text-transparent md:text-sm dark:from-gray-300 dark:to-white">
                Terminées
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-xl font-bold text-green-600 md:text-2xl">{completedCount}</div>
              <p className="text-muted-foreground mt-1 text-xs">Complétées</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-4 md:mb-6">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:gap-4">
              {/* Recherche */}
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  placeholder="Rechercher une activité..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtres - 2 colonnes sur mobile, inline sur desktop */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:flex md:gap-2">
                {/* Filtre Type */}
                <Select value={filterKind} onValueChange={(value: any) => setFilterKind(value)}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="recurring">Récurrentes</SelectItem>
                    <SelectItem value="one_off">Ponctuelles</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtre Statut */}
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actives</SelectItem>
                    <SelectItem value="inactive">Inactives</SelectItem>
                  </SelectContent>
                </Select>

                {/* Bouton refresh - pleine largeur sur mobile */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refresh()}
                  className="col-span-2 sm:col-span-1 md:w-auto"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des tâches */}
        {loading && tasks.length === 0 ? (
          <div className="py-12 text-center">
            <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
            <p className="text-muted-foreground">Chargement des activités...</p>
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-destructive text-center">
                <p className="font-semibold">Erreur lors du chargement</p>
                <p className="mt-2 text-sm">{error}</p>
                <Button onClick={() => refresh()} className="mt-4">
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="py-8 text-center md:py-12">
                <CalendarClock className="text-muted-foreground mx-auto mb-4 h-10 w-10 md:h-12 md:w-12" />
                <p className="text-base font-semibold md:text-lg">Aucune activité trouvée</p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Créez votre première activité récurrente ou ponctuelle
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button
                    onClick={() => handleCreateClick('recurring')}
                    className="w-full sm:w-auto"
                  >
                    Créer une récurrente
                  </Button>
                  <Button
                    onClick={() => handleCreateClick('one_off')}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Créer une ponctuelle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'table' ? (
          <OperationalTaskTableInline
            tasks={filteredTasks}
            onUpdateTask={async (taskId, updates) => {
              await updateTask(taskId, updates);
              await refresh();
            }}
            onTaskClick={task => setSelectedActivity(task)}
            selectedTaskId={selectedActivity?.id}
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="py-8 text-center md:py-12">
                <CalendarClock className="text-muted-foreground mx-auto mb-4 h-10 w-10 md:h-12 md:w-12" />
                <p className="text-base font-semibold md:text-lg">
                  Mode Cards temporairement désactivé
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Utilisez le mode Tableau pour gérer vos tâches opérationnelles
                </p>
                <Button onClick={() => setViewMode('table')} className="mt-4">
                  Basculer en mode Tableau
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog de création */}
        <ActivityFormWithAssignment
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleSaveActivity}
          initialData={{ kind: createActivityKind }}
          mode="create"
        />
      </div>
    </div>
  );
};
