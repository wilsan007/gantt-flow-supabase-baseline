/**
 * Composant: ActivityCard
 * Carte d'une activité opérationnelle (récurrente ou ponctuelle)
 */

import React, { useState } from 'react';
import { CalendarClock, CalendarDays, MoreVertical, Edit, Trash2, Play, Pause, BarChart3, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { OperationalActivity } from '@/hooks/useOperationalActivities';
import { ActivityDetailDialog } from './ActivityDetailDialog';

interface ActivityCardProps {
  activity: OperationalActivity;
  onUpdate: (id: string, updates: Partial<OperationalActivity>) => Promise<any>;
  onDelete: (id: string, keepCompleted: boolean) => Promise<any>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  onRefresh: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onUpdate,
  onDelete,
  onToggleActive,
  onRefresh,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggleActive = async () => {
    try {
      await onToggleActive(activity.id, !activity.is_active);
      onRefresh();
    } catch (error) {
      console.error('Erreur toggle active:', error);
    }
  };

  const handleDelete = async (keepCompleted: boolean) => {
    try {
      setDeleting(true);
      await onDelete(activity.id, keepCompleted);
      setShowDeleteDialog(false);
      onRefresh();
    } catch (error) {
      console.error('Erreur suppression:', error);
    } finally {
      setDeleting(false);
    }
  };

  const kindIcon = activity.kind === 'recurring' ? CalendarClock : CalendarDays;
  const KindIcon = kindIcon;

  const scopeLabels: Record<string, string> = {
    org: 'Organisation',
    department: 'Département',
    team: 'Équipe',
    person: 'Personne',
  };

  return (
    <>
      <Card className={`hover:shadow-lg transition-shadow ${!activity.is_active ? 'opacity-60' : ''}`}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${activity.kind === 'recurring' ? 'bg-blue-100' : 'bg-purple-100'}`}>
              <KindIcon className={`h-5 w-5 ${activity.kind === 'recurring' ? 'text-blue-600' : 'text-purple-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{activity.name}</h3>
              <div className="flex gap-2 mt-1 flex-wrap">
                <Badge variant={activity.is_active ? 'default' : 'secondary'}>
                  {activity.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">
                  {activity.kind === 'recurring' ? 'Récurrente' : 'Ponctuelle'}
                </Badge>
                <Badge variant="secondary">{scopeLabels[activity.scope]}</Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDetailDialog(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir les détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive}>
                {activity.is_active ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activer
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDetailDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart3 className="h-4 w-4 mr-2" />
                Statistiques
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent>
          {activity.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {activity.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Créée le {new Date(activity.created_at).toLocaleDateString('fr-FR')}</span>
            {activity.task_title_template && (
              <span className="truncate ml-2" title={activity.task_title_template}>
                Template: {activity.task_title_template}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de détails */}
      <ActivityDetailDialog
        activityId={activity.id}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'activité ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera l'activité "{activity.name}" et ses occurrences futures.
              <br />
              <br />
              Que souhaitez-vous faire des tâches déjà terminées ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => handleDelete(true)}
              disabled={deleting}
            >
              Conserver les terminées
            </Button>
            <AlertDialogAction
              onClick={() => handleDelete(false)}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Suppression...' : 'Tout supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
