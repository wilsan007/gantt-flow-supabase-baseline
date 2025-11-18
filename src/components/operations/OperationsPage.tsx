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

export const OperationsPage: React.FC = () => {
  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | 'recurring' | 'one_off'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createActivityKind, setCreateActivityKind] = useState<'recurring' | 'one_off'>(
    'recurring'
  );
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

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
    <div className="container mx-auto px-4 py-6">
      {/* Header avec métriques */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activités Opérationnelles</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos tâches récurrentes et ponctuelles hors projet
          </p>
        </div>

        <div className="flex gap-2">
          {/* Toggle vue cards/tableau */}
          <div className="flex gap-1 rounded-md border p-1">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('table')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => handleCreateClick('recurring')} className="gap-2">
            <CalendarClock className="h-4 w-4" />
            Nouvelle Récurrente
          </Button>
          <Button onClick={() => handleCreateClick('one_off')} variant="outline" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Nouvelle Ponctuelle
          </Button>
        </div>
      </div>

      {/* Métriques */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activités</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {metrics.cacheHit ? '⚡ Cache' : `${metrics.fetchTime.toFixed(0)}ms`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À faire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{todoCount}</div>
            <p className="text-muted-foreground mt-1 text-xs">Non commencées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <p className="text-muted-foreground mt-1 text-xs">Actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <p className="text-muted-foreground mt-1 text-xs">Complétées</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
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

            <Button variant="outline" size="icon" onClick={() => refresh()}>
              <Filter className="h-4 w-4" />
            </Button>
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
            <div className="py-12 text-center">
              <CalendarClock className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-lg font-semibold">Aucune activité trouvée</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Créez votre première activité récurrente ou ponctuelle
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <Button onClick={() => handleCreateClick('recurring')}>Créer une récurrente</Button>
                <Button onClick={() => handleCreateClick('one_off')} variant="outline">
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
            <div className="py-12 text-center">
              <CalendarClock className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-lg font-semibold">Mode Cards temporairement désactivé</p>
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
  );
};
