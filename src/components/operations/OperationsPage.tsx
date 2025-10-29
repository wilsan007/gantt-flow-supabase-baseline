/**
 * Page: Operations (Activités Opérationnelles)
 * Pattern: Linear/Monday.com Dashboard
 * 
 * Gestion des activités récurrentes et ponctuelles hors projet
 */

import React, { useState } from 'react';
import { CalendarClock, CalendarDays, Plus, Search, Filter } from 'lucide-react';
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
import { useOperationalActivities } from '@/hooks/useOperationalActivities';
import { useOperationalActionTemplates } from '@/hooks/useOperationalActionTemplates';
import { useOperationalSchedules } from '@/hooks/useOperationalSchedules';
import { ActivityCard } from './ActivityCard';
import { ActivityFormWithAssignment } from './ActivityFormWithAssignment';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export const OperationsPage: React.FC = () => {
  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | 'recurring' | 'one_off'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createActivityKind, setCreateActivityKind] = useState<'recurring' | 'one_off'>('recurring');

  // Hook pour charger les activités
  const {
    activities,
    loading,
    error,
    metrics,
    createActivity,
    updateActivity,
    deleteActivity,
    toggleActive,
    refresh,
  } = useOperationalActivities({
    autoFetch: true,
    filters: {
      kind: filterKind === 'all' ? undefined : filterKind,
      isActive: filterStatus === 'all' ? undefined : filterStatus === 'active',
      search: searchTerm || undefined,
    },
  });

  // Filtrer les activités
  const filteredActivities = activities.filter((activity) => {
    const matchesKind = filterKind === 'all' || activity.kind === filterKind;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && activity.is_active) ||
      (filterStatus === 'inactive' && !activity.is_active);
    const matchesSearch =
      !searchTerm ||
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesKind && matchesStatus && matchesSearch;
  });

  // Handlers
  const handleCreateClick = (kind: 'recurring' | 'one_off') => {
    setCreateActivityKind(kind);
    setIsCreateDialogOpen(true);
  };

  const { createTemplate } = useOperationalActionTemplates();
  const { upsertSchedule } = useOperationalSchedules();

  const handleSaveActivity = async (formData: any) => {
    const loadingToast = toast.loading('Création de l\'activité en cours...');
    
    try {
      console.log('📝 Données du formulaire:', formData);
      
      // 1. Extraire les action_templates et schedule
      const { action_templates, schedule, ...activityData } = formData;

      // 2. Valider les données requises
      if (!activityData.name?.trim()) {
        throw new Error('Le nom de l\'activité est requis');
      }

      console.log('📤 Envoi données activité:', activityData);

      // 3. Créer l'activité
      const newActivity = await createActivity(activityData);
      
      console.log('✅ Activité créée:', newActivity);
      
      if (!newActivity) {
        throw new Error('Échec de la création de l\'activité - Aucune donnée retournée');
      }

      // 3. Créer la planification si récurrent
      if (schedule && formData.kind === 'recurring') {
        await upsertSchedule({
          ...schedule,
          activity_id: newActivity.id,
        });
      }

      // 4. Créer les templates d'actions si présents
      if (action_templates && action_templates.length > 0) {
        for (const [index, template] of action_templates.entries()) {
          if (template.title?.trim()) {
            await createTemplate({
              activity_id: newActivity.id,
              title: template.title,
              description: template.description || null,
              position: index,
            });
          }
        }
      }

      // Succès !
      toast.success('Activité créée avec succès ! 🎉', {
        description: `"${newActivity.name}" est maintenant active`,
        duration: 4000,
      });
      
      setIsCreateDialogOpen(false);
      await refresh();
      
    } catch (error: any) {
      console.error('❌ Erreur création activité:', error);
      
      // Messages d'erreur contextuels
      let errorMessage = 'Impossible de créer l\'activité';
      let errorDescription = error?.message || 'Une erreur inattendue s\'est produite';

      if (error?.code === '42501') {
        errorMessage = 'Permission refusée';
        errorDescription = error?.message?.includes('created_by') 
          ? 'Utilisateur non authentifié. Veuillez vous reconnecter.'
          : 'Erreur de sécurité RLS. Vérifiez que vous êtes connecté à un tenant actif.';
      } else if (error?.code === 'PGRST204') {
        errorMessage = 'Erreur de schéma de base de données';
        errorDescription = 'Certains champs ne sont pas reconnus. Contactez le support.';
      } else if (error?.code === '23505') {
        errorMessage = 'Activité déjà existante';
        errorDescription = 'Une activité avec ce nom existe déjà';
      } else if (error?.message?.includes('permission')) {
        errorMessage = 'Permission refusée';
        errorDescription = 'Vous n\'avez pas les droits pour créer cette activité';
      } else if (error?.message?.includes('tenant')) {
        errorMessage = 'Tenant manquant';
        errorDescription = 'Aucun tenant actif détecté. Reconnectez-vous.';
      }

      toast.error(errorMessage, {
        description: errorDescription,
        duration: 6000,
        action: {
          label: 'Réessayer',
          onClick: () => handleSaveActivity(formData),
        },
      });
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Render
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header avec métriques */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activités Opérationnelles</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos tâches récurrentes et ponctuelles hors projet
          </p>
        </div>

        <div className="flex gap-2">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activités</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.cacheHit ? '⚡ Cache' : `${metrics.fetchTime}ms`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">En génération</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Récurrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.recurringCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Automatiques</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ponctuelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.oneOffCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Manuelles</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une activité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Liste des activités */}
      {loading && activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des activités...</p>
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="font-semibold">Erreur lors du chargement</p>
              <p className="text-sm mt-2">{error}</p>
              <Button onClick={() => refresh()} className="mt-4">
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">Aucune activité trouvée</p>
              <p className="text-sm text-muted-foreground mt-2">
                Créez votre première activité récurrente ou ponctuelle
              </p>
              <div className="flex gap-2 justify-center mt-6">
                <Button onClick={() => handleCreateClick('recurring')}>
                  Créer une récurrente
                </Button>
                <Button onClick={() => handleCreateClick('one_off')} variant="outline">
                  Créer une ponctuelle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onUpdate={updateActivity}
              onDelete={deleteActivity}
              onToggleActive={toggleActive}
              onRefresh={refresh}
            />
          ))}
        </div>
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
