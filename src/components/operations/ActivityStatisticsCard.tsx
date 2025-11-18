/**
 * Composant: ActivityStatisticsCard
 * Affiche les statistiques d'une activité opérationnelle
 * Utilise la RPC function get_activity_statistics
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOperationalActivities } from '@/hooks/useOperationalActivities';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityStatistics {
  total_occurrences: number;
  completed_count: number;
  in_progress_count: number;
  blocked_count: number;
  completion_rate: number;
  avg_completion_time_days: number | null;
  next_occurrence: string | null;
  last_occurrence: string | null;
}

interface ActivityStatisticsCardProps {
  activityId: string;
}

export const ActivityStatisticsCard: React.FC<ActivityStatisticsCardProps> = ({ activityId }) => {
  const { getStatistics } = useOperationalActivities({ autoFetch: false });
  const [stats, setStats] = useState<ActivityStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, [activityId]);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getStatistics(activityId);
      setStats(data);
    } catch (err: any) {
      console.error('❌ Erreur loadStatistics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-8 text-center">
            <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
            <p className="text-muted-foreground text-sm">Chargement des statistiques...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="py-8 text-center">
            <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
            <p className="text-destructive font-semibold">Erreur lors du chargement</p>
            <p className="text-muted-foreground mt-2 text-sm">
              {error || 'Données non disponibles'}
            </p>
            <Button onClick={loadStatistics} variant="outline" className="mt-4">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistiques de l'activité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Taux de complétion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taux de complétion</span>
              <span className="text-primary text-2xl font-bold">{stats.completion_rate}%</span>
            </div>
            <Progress value={stats.completion_rate} className="h-3" />
            <p className="text-muted-foreground text-xs">
              {stats.completed_count} sur {stats.total_occurrences} occurrence(s) terminée(s)
            </p>
          </div>

          {/* Répartition des statuts */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-950">
              <CheckCircle2 className="mx-auto mb-1 h-6 w-6 text-green-600" />
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {stats.completed_count}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">Terminées</div>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-950">
              <Clock className="mx-auto mb-1 h-6 w-6 text-blue-600" />
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats.in_progress_count}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">En cours</div>
            </div>

            <div className="rounded-lg bg-red-50 p-3 text-center dark:bg-red-950">
              <AlertCircle className="mx-auto mb-1 h-6 w-6 text-red-600" />
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {stats.blocked_count}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">Bloquées</div>
            </div>
          </div>

          {/* Temps moyen de complétion */}
          {stats.avg_completion_time_days !== null && (
            <div className="bg-muted flex items-center justify-between rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-muted-foreground h-5 w-5" />
                <span className="text-sm font-medium">Temps moyen de complétion</span>
              </div>
              <span className="text-lg font-bold">
                {Math.round(stats.avg_completion_time_days)} jour(s)
              </span>
            </div>
          )}

          {/* Prochaine et dernière occurrence */}
          <div className="grid grid-cols-2 gap-4">
            {stats.next_occurrence && (
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                <div className="mb-1 text-xs text-blue-600 dark:text-blue-400">
                  Prochaine occurrence
                </div>
                <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {format(new Date(stats.next_occurrence), 'dd MMMM yyyy', { locale: fr })}
                </div>
              </div>
            )}

            {stats.last_occurrence && (
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                <div className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                  Dernière occurrence
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {format(new Date(stats.last_occurrence), 'dd MMMM yyyy', { locale: fr })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* État vide si aucune occurrence */}
      {stats.total_occurrences === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 pt-6 text-center">
            <BarChart3 className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-muted-foreground text-sm">
              Aucune occurrence générée pour le moment
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Les statistiques apparaîtront une fois que des tâches auront été générées
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
